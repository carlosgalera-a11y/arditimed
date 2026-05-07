#!/usr/bin/env node
/**
 * build-rag-index.mjs · pre-indexa MEGA_KB → embeddings Gemini
 * ════════════════════════════════════════════════════════════
 * © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
 * ════════════════════════════════════════════════════════════
 *
 * Lee `notebook-local.html`, extrae las constantes `MEGA_KB` (definición
 * inicial + appended via `MEGA_KB +=`), trocea en chunks con overlap,
 * llama a Gemini text-embedding-004 en batch y escribe `rag-index.json`
 * en la raíz del repo.
 *
 * Uso:
 *   GEMINI_API_KEY=... node scripts/build-rag-index.mjs
 *
 * Salida:
 *   rag-index.json (~600KB) con shape:
 *     {
 *       version: 1,
 *       model: 'text-embedding-004',
 *       dims: 768,
 *       generatedAt: ISO,
 *       chunks: [{ id, source, section, text, embedding: number[768] }, ...]
 *     }
 *
 * Re-ejecutar cada vez que MEGA_KB cambie (cada 1-2 sprints típicamente).
 * Idempotente — sobrescribe el archivo.
 * ════════════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const NOTEBOOK_PATH = join(REPO_ROOT, 'notebook-local.html');
const OUTPUT_PATH = join(REPO_ROOT, 'rag-index.json');

// ── Config ──────────────────────────────────────────────────
// gemini-embedding-001 es el modelo estable actual. Soporta MRL
// (Matryoshka Representation Learning) — pedimos 768 dims explícitas
// para que el JSON salga compacto sin perder calidad apreciable.
const MODEL = 'gemini-embedding-001';
const DIMS = 768;
const CHUNK_SIZE = 600;       // chars por chunk — equilibrio retrieval/contexto
const CHUNK_OVERLAP = 100;    // chars de solape entre chunks consecutivos
const RPM_DELAY_MS = 100;     // 10 req/sec → 600/min, lejos del límite free tier

// ── Util: unescape JS string literal ──────────────────────────
function unescapeJsString(s) {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// ── Util: extraer MEGA_KB del HTML ──────────────────────────
// El HTML tiene:
//   1. Asignación inicial: `var MEGA_KB = "..."` (single-line, \n escapados).
//   2. Extensión opcional:
//        MEGA_KB += '\n\n=== ... ===' +
//        'línea 2\n' +
//        'línea 3\n' +
//        ... (cientos de líneas) +
//        'última';
//      Es UN solo statement con `+` concatenando literales en cada línea.
//
// Estrategia: state machine line-by-line.
//   - Detecta inicio: línea que matchea /MEGA_KB\s*\+=/.
//   - Mientras no encuentre `;` al final, extrae el primer literal `'...'` o `"..."`
//     de cada línea y lo concatena.
//   - Termina cuando la línea acaba con `;`.
function extractMegaKB(html) {
  // 1) Asignación inicial.
  const initMatch = html.match(/var\s+MEGA_KB\s*=\s*"((?:\\.|[^"\\])*)"/);
  if (!initMatch) throw new Error('No se encontró `var MEGA_KB = "..."` en notebook-local.html');
  let kb = unescapeJsString(initMatch[1]);

  // 2) Extensiones via `+=` (multi-línea).
  const lines = html.split('\n');
  const stringLitRe = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/;
  let i = 0;
  while (i < lines.length) {
    if (/MEGA_KB\s*\+=/.test(lines[i])) {
      let appendBlock = '';
      let inBlock = true;
      let firstLine = true;
      while (inBlock && i < lines.length) {
        const line = lines[i];
        const m = line.match(stringLitRe);
        if (m) {
          const literal = m[1] !== undefined ? m[1] : m[2];
          appendBlock += unescapeJsString(literal);
        }
        // Termina el statement cuando la línea acaba con `;` (ignorando whitespace y comments).
        const trimmed = line.replace(/\/\/.*$/, '').trimEnd();
        if (trimmed.endsWith(';')) {
          inBlock = false;
        }
        if (firstLine) firstLine = false;
        i++;
      }
      if (appendBlock) kb += '\n\n' + appendBlock;
    } else {
      i++;
    }
  }
  return kb;
}

// ── Util: trocea texto respetando bloques delimitados por "===" ──
function chunkText(text, source) {
  const chunks = [];
  // Si hay marcas "=== TITULO ===", troceamos por sección + sub-trocea si
  // la sección es larga. Si no, trocea por longitud con overlap.
  const sectionRe = /===\s*([^=]+?)\s*===/g;
  const sections = [];
  let lastIdx = 0;
  let lastTitle = 'General';
  let m;
  while ((m = sectionRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      sections.push({ title: lastTitle, body: text.slice(lastIdx, m.index).trim() });
    }
    lastTitle = m[1].trim();
    lastIdx = sectionRe.lastIndex;
  }
  if (lastIdx < text.length) sections.push({ title: lastTitle, body: text.slice(lastIdx).trim() });
  if (sections.length === 0) sections.push({ title: 'General', body: text });

  let id = 0;
  for (const sec of sections) {
    if (!sec.body) continue;
    if (sec.body.length <= CHUNK_SIZE) {
      chunks.push({
        id: `${source}#${id++}`,
        source,
        section: sec.title,
        text: sec.body,
      });
      continue;
    }
    // Sub-trocea con overlap.
    let start = 0;
    while (start < sec.body.length) {
      const end = Math.min(start + CHUNK_SIZE, sec.body.length);
      chunks.push({
        id: `${source}#${id++}`,
        source,
        section: sec.title,
        text: sec.body.slice(start, end),
      });
      if (end === sec.body.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }
  return chunks;
}

// ── Llamada a Gemini embedContent (single) ──────────────────
// gemini-embedding-001 NO soporta `batchEmbedContents` síncrono — solo
// `embedContent` o `asyncBatchEmbedContent` (con polling). Para 200-300
// chunks, single-call con throttle 10/sec es lo más simple y rápido.
async function embedOne(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${apiKey}`;
  const body = {
    model: `models/${MODEL}`,
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: DIMS, // MRL — pide 768 explícitas
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini embedContent ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.embedding?.values;
}

// ── Util: progreso ──────────────────────────────────────────
function progress(done, total) {
  const pct = ((done / total) * 100).toFixed(1);
  process.stdout.write(`\r  → embedding chunks: ${done}/${total} (${pct}%)`);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Falta GEMINI_API_KEY en el entorno.');
    console.error('   Uso: GEMINI_API_KEY=... node scripts/build-rag-index.mjs');
    process.exit(1);
  }

  console.log('📖 Leyendo notebook-local.html...');
  const html = readFileSync(NOTEBOOK_PATH, 'utf8');

  console.log('🔍 Extrayendo MEGA_KB...');
  const kb = extractMegaKB(html);
  console.log(`   MEGA_KB extraído: ${kb.length.toLocaleString()} caracteres`);

  console.log('✂️  Troceando en chunks...');
  const chunks = chunkText(kb, 'MEGA_KB');
  console.log(`   ${chunks.length} chunks generados (avg ${Math.round(kb.length / chunks.length)} chars/chunk)`);

  console.log(`🧠 Pidiendo embeddings a Gemini ${MODEL} (${DIMS} dims)...`);
  const texts = chunks.map((c) => c.text);
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i++) {
    let attempt = 0;
    let emb;
    while (attempt < 3) {
      try {
        emb = await embedOne(texts[i], apiKey);
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 3) throw e;
        console.warn(`\n  ⚠ chunk ${i} falló (intento ${attempt}): ${e.message.slice(0, 80)}`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    if (!Array.isArray(emb) || emb.length !== DIMS) {
      throw new Error(`Chunk ${i}: dims ${emb?.length} != ${DIMS}`);
    }
    allEmbeddings.push(emb);
    progress(allEmbeddings.length, texts.length);
    if (i < texts.length - 1) await new Promise((r) => setTimeout(r, RPM_DELAY_MS));
  }
  console.log('\n✅ Embeddings completos.');

  // Sanity check
  if (allEmbeddings.length !== chunks.length) {
    throw new Error(`Mismatch: ${chunks.length} chunks vs ${allEmbeddings.length} embeddings.`);
  }
  for (const e of allEmbeddings) {
    if (!Array.isArray(e) || e.length !== DIMS) {
      throw new Error(`Embedding malformado (${e?.length} dims, esperado ${DIMS}).`);
    }
  }

  const indexed = chunks.map((c, i) => ({ ...c, embedding: allEmbeddings[i] }));

  const out = {
    version: 1,
    model: MODEL,
    dims: DIMS,
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    generatedAt: new Date().toISOString(),
    sourceLength: kb.length,
    chunks: indexed,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(out));
  const sizeKB = (Buffer.byteLength(JSON.stringify(out), 'utf8') / 1024).toFixed(1);
  console.log(`💾 Escrito ${OUTPUT_PATH}`);
  console.log(`   ${chunks.length} chunks · ${sizeKB} KB · ${DIMS} dims · ${MODEL}`);
  console.log('🎉 Listo.');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
