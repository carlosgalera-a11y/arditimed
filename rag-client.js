// ════════════════════════════════════════════════════════════════════
// rag-client.js — RAG real para notebook-local.html y cuadernos-ia.html
// ════════════════════════════════════════════════════════════════════
// © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
// Ver LICENSE y NOTICE.md · Reutilización requiere autorización escrita.
// ════════════════════════════════════════════════════════════════════
//
// Sustituye el "stuffing" actual de los 60K chars de MEGA_KB por
// retrieval real:
//   1. Carga rag-index.json (chunks + embeddings 768-dim) cacheado en
//      IndexedDB tras la primera descarga.
//   2. Para cada pregunta del usuario: pide embedding al Cloud Function
//      `embedQuery`, calcula coseno contra todos los chunks (en JS, ~10ms
//      para 500 chunks) y devuelve los top-K.
//   3. Construye un contexto compacto (solo top chunks, no los 60K) para
//      pasar a DeepSeek/Gemini como grounding.
//
// API pública (window.RAG):
//   await RAG.init()                              // carga índice
//   await RAG.retrieve(question, { k = 5 })       // → top chunks
//   await RAG.indexUserDocs(notebookId, docs)     // chunks de PDFs del user
//   await RAG.retrieveCombined(question, notebookId, { k = 5 })
//                                                 // → mezcla MEGA_KB + user
//   RAG.buildContext(chunks, { maxChars = 6000 }) // → string para prompt
//
// Ningún render UI — los notebooks pintan como quieran.
// ════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (window.RAG) return; // idempotente

  // ── Config ──────────────────────────────────────────────────
  const INDEX_URL = '/rag-index.json';
  const IDB_NAME = 'cartagenaeste-rag';
  const IDB_VERSION = 1;
  const IDB_STORE_GLOBAL = 'global-index';
  const IDB_STORE_USER = 'user-notebooks';
  const CACHE_KEY = 'mega_kb_v1';
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días — re-fetch si index actualizó

  // ── IndexedDB helpers (mínimos, sin dependencias) ──────────
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_GLOBAL)) db.createObjectStore(IDB_STORE_GLOBAL);
        if (!db.objectStoreNames.contains(IDB_STORE_USER)) db.createObjectStore(IDB_STORE_USER);
      };
    });
  }
  async function idbGet(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbPut(store, key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Cosine similarity (vectores normalizados ⇒ dot product) ─
  // Gemini text-embedding-004 NO devuelve normalizado, así que normalizamos
  // al cargar y al pedir el embed de la query, así el dot product == coseno.
  function dot(a, b) {
    let s = 0;
    const len = a.length;
    for (let i = 0; i < len; i++) s += a[i] * b[i];
    return s;
  }
  function norm(v) {
    let s = 0;
    for (let i = 0; i < v.length; i++) s += v[i] * v[i];
    return Math.sqrt(s) || 1;
  }
  function normalize(v) {
    const n = norm(v);
    if (n === 1) return v;
    const out = new Array(v.length);
    for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
    return out;
  }

  // ── Estado ────────────────────────────────────────────────
  let globalIndex = null;       // { chunks: [{id, source, section, text, embedding(normalized)}] }
  let initPromise = null;
  const userIndices = new Map(); // notebookId → { chunks: [...] }

  // ── Carga del índice global ───────────────────────────────
  async function loadGlobalIndex() {
    // 1. Intenta caché IndexedDB.
    try {
      const cached = await idbGet(IDB_STORE_GLOBAL, CACHE_KEY);
      if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.index;
      }
    } catch (e) { /* sin caché — descargar */ }

    // 2. Descarga JSON.
    const res = await fetch(INDEX_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar ${INDEX_URL} (HTTP ${res.status})`);
    const raw = await res.json();
    if (!raw || !Array.isArray(raw.chunks)) throw new Error('rag-index.json malformado');

    // 3. Normaliza embeddings una sola vez (acelera la query).
    const chunks = raw.chunks.map((c) => ({
      id: c.id,
      source: c.source || 'MEGA_KB',
      section: c.section || 'General',
      text: c.text,
      embedding: normalize(c.embedding),
    }));
    const index = { ...raw, chunks };

    // 4. Cachea en IDB.
    try { await idbPut(IDB_STORE_GLOBAL, CACHE_KEY, { index, fetchedAt: Date.now() }); } catch (e) {}
    return index;
  }

  // ── Init pública (idempotente) ────────────────────────────
  async function init() {
    if (globalIndex) return globalIndex;
    if (initPromise) return initPromise;
    initPromise = loadGlobalIndex().then((idx) => {
      globalIndex = idx;
      return idx;
    });
    return initPromise;
  }

  // ── Embed de una query vía Cloud Function ─────────────────
  async function embedQueryRemote(text, taskType = 'RETRIEVAL_QUERY') {
    if (typeof firebase === 'undefined' || !firebase.app || !firebase.app().functions) {
      throw new Error('Firebase Functions SDK no disponible');
    }
    const fn = firebase.app().functions('europe-west1').httpsCallable('embedQuery');
    const res = await fn({ text, taskType });
    const emb = res && res.data && res.data.embedding;
    if (!Array.isArray(emb) || emb.length !== 768) {
      throw new Error('embedQuery devolvió un embedding inválido');
    }
    return normalize(emb);
  }

  // ── Top-K por cosine ──────────────────────────────────────
  function topK(chunks, queryEmb, k) {
    const scored = chunks.map((c) => ({ chunk: c, score: dot(c.embedding, queryEmb) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  // ── Retrieve sobre el índice global (MEGA_KB) ─────────────
  async function retrieve(question, opts) {
    opts = opts || {};
    const k = opts.k || 5;
    await init();
    const qEmb = await embedQueryRemote(question);
    return topK(globalIndex.chunks, qEmb, k);
  }

  // ── Indexar PDFs/textos del usuario en su notebook ────────
  // Llamar tras subir un PDF y extraer su texto (por ej. con pdf.js).
  // chunks: [{ text, source }]
  // Embebemos en lotes vía la Cloud Function (1 chunk = 1 round-trip,
  // no hay batch endpoint público para usuarios). 5 chunks/notebook
  // típico = 5 segundos.
  async function indexUserDocs(notebookId, chunks) {
    if (!notebookId || !Array.isArray(chunks)) throw new Error('notebookId y chunks requeridos');
    // Comprueba caché por notebookId.
    let stored = null;
    try { stored = await idbGet(IDB_STORE_USER, notebookId); } catch (e) {}
    const existing = (stored && stored.chunks) || [];
    const existingIds = new Set(existing.map((c) => c.id));

    const toEmbed = chunks.filter((c) => !existingIds.has(c.id || `${notebookId}#${c.idx}`));
    const result = [...existing];

    for (let i = 0; i < toEmbed.length; i++) {
      const c = toEmbed[i];
      const text = String(c.text || '').slice(0, 8000);
      if (!text.trim()) continue;
      try {
        const emb = await embedQueryRemote(text, 'RETRIEVAL_DOCUMENT');
        result.push({
          id: c.id || `${notebookId}#user-${result.length}`,
          source: c.source || 'user-doc',
          section: c.section || '',
          text,
          embedding: emb, // ya normalizado
        });
      } catch (e) {
        console.warn('[rag] fallo al embebr chunk', i, e.message || e);
      }
      // Throttle suave para no saturar el rate limit (60 req/min).
      if (i < toEmbed.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }

    try { await idbPut(IDB_STORE_USER, notebookId, { chunks: result, updatedAt: Date.now() }); } catch (e) {}
    userIndices.set(notebookId, { chunks: result });
    return result.length;
  }

  // ── Cargar índice de notebook (lazy) ──────────────────────
  async function loadUserIndex(notebookId) {
    if (userIndices.has(notebookId)) return userIndices.get(notebookId);
    let stored = null;
    try { stored = await idbGet(IDB_STORE_USER, notebookId); } catch (e) {}
    const idx = stored && stored.chunks ? { chunks: stored.chunks } : { chunks: [] };
    userIndices.set(notebookId, idx);
    return idx;
  }

  // ── Retrieve combinado: MEGA_KB + chunks del notebook personal ──
  async function retrieveCombined(question, notebookId, opts) {
    opts = opts || {};
    const k = opts.k || 5;
    const kGlobal = opts.kGlobal || Math.ceil(k * 0.6);
    const kUser = opts.kUser || Math.ceil(k * 0.6);
    await init();
    const qEmb = await embedQueryRemote(question);
    const globalTop = topK(globalIndex.chunks, qEmb, kGlobal);
    let userTop = [];
    if (notebookId) {
      const user = await loadUserIndex(notebookId);
      if (user.chunks.length) userTop = topK(user.chunks, qEmb, kUser);
    }
    // Mezcla y desempata por score.
    const merged = [...globalTop, ...userTop].sort((a, b) => b.score - a.score).slice(0, k);
    return merged;
  }

  // ── Construye string de contexto a partir de chunks ──────
  // Formato pensado para que el LLM cite la fuente:
  //   [#1 · MEGA_KB · ANTIBIOTICOS]
  //   ...texto...
  function buildContext(scoredChunks, opts) {
    opts = opts || {};
    const maxChars = opts.maxChars || 6000;
    let total = 0;
    const parts = [];
    let n = 1;
    for (const { chunk } of scoredChunks) {
      const header = `[#${n} · ${chunk.source} · ${chunk.section}]`;
      const piece = `${header}\n${chunk.text}\n`;
      if (total + piece.length > maxChars) break;
      parts.push(piece);
      total += piece.length;
      n++;
    }
    return parts.join('\n');
  }

  // ── Borrar índice de un notebook (cuando el user lo elimina) ──
  async function clearUserIndex(notebookId) {
    userIndices.delete(notebookId);
    try {
      const db = await openDB();
      const tx = db.transaction(IDB_STORE_USER, 'readwrite');
      tx.objectStore(IDB_STORE_USER).delete(notebookId);
      await new Promise((r) => { tx.oncomplete = r; });
    } catch (e) {}
  }

  // ── API pública ─────────────────────────────────────────
  window.RAG = {
    init,
    retrieve,
    retrieveCombined,
    indexUserDocs,
    clearUserIndex,
    buildContext,
    // Helpers de bajo nivel para casos avanzados:
    _embedQuery: embedQueryRemote,
    _normalize: normalize,
    _topK: topK,
    _state: () => ({
      globalLoaded: !!globalIndex,
      globalChunks: globalIndex ? globalIndex.chunks.length : 0,
      userNotebooks: userIndices.size,
    }),
  };
})();
