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

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const NOTEBOOK_PATH = join(REPO_ROOT, 'notebook-local.html');
const OUTPUT_PATH = join(REPO_ROOT, 'rag-index.json');
const PROTOCOLOS_DIR = join(REPO_ROOT, 'protocolos'); // 10 PDFs curados AP
const DOCS_DIR = join(REPO_ROOT, 'docs');             // 600+ PDFs - filtraremos

// Filtros para docs/ — solo PDFs cuyo nombre sugiera contenido clínico estructurado.
const DOCS_NAME_FILTER = /protocolo|guia|algoritmo|manejo|recomenda|consenso|gpc|via-clinica|criterio|cefale|colangit|exantem|hematuria|nefrologia|urolo|asma|epoc|diabetes|insulin|hta|hipertensi|sepsi|ictus|tromb|anticoag|antibio|covid/i;
const DOCS_MAX_FILES = 0; // 0 = solo protocolos/ (free tier no aguanta más). Súbelo a 30+ si tienes billing activo.
const CHECKPOINT_PATH = join(REPO_ROOT, 'rag-index.partial.json'); // resumable

// Quita duplicados estilo "X-1.pdf", "X-2.pdf" cuando existe "X.pdf".
// Estos archivos son copias literales del mismo contenido (legacy del
// uploader). Indexar 4× el mismo doc desperdicia quota y genera ruido.
function dedupeSuffixed(files) {
  const set = new Set(files.map((f) => f.toLowerCase()));
  return files.filter((f) => {
    const m = f.match(/^(.+)-(\d+)\.pdf$/i);
    if (!m) return true;
    const base = m[1] + '.pdf';
    return !set.has(base.toLowerCase());
  });
}

// ── Config ──────────────────────────────────────────────────
// gemini-embedding-001 es el modelo estable actual. Soporta MRL
// (Matryoshka Representation Learning) — pedimos 768 dims explícitas
// para que el JSON salga compacto sin perder calidad apreciable.
const MODEL = 'gemini-embedding-001';
const DIMS = 768;
const CHUNK_SIZE = 600;       // chars por chunk — equilibrio retrieval/contexto
const CHUNK_OVERLAP = 100;    // chars de solape entre chunks consecutivos
// gemini-embedding-001 free tier: 100 RPM. Throttle a ~80 RPM (750ms)
// para tener margen de retry y evitar 429 en bursts.
const RPM_DELAY_MS = 750;
const MAX_CHUNKS_PER_PDF = 80; // evita que un manual masivo (1700 chunks) monopolice quota

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

// ── Extracción de texto de un PDF con pdftotext (poppler) ─
// Mucho más rápido y robusto que pdf-parse en Node. Si falla,
// se omite ese PDF (continuamos).
function extractPdfText(pdfPath) {
  try {
    const out = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-'], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30_000,
    });
    return out
      .replace(/\f/g, '\n\n--- página ---\n\n')   // form feed → marca de página
      .replace(/[ \t]+/g, ' ')                     // colapsa whitespace horizontal
      .replace(/\n{3,}/g, '\n\n')                  // colapsa newlines
      .trim();
  } catch (e) {
    console.warn(`  ⚠ pdftotext falló para ${pdfPath}: ${e.message.slice(0, 80)}`);
    return '';
  }
}

// ── Trocea texto plano de un PDF (sin secciones === ===) ──
// Chunk con overlap por longitud, anota la última página vista.
function chunkPdfPlain(text, sourceName) {
  const chunks = [];
  let lastPage = 1;
  const pageRe = /--- página ---/g;
  let id = 0;
  let i = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + CHUNK_SIZE);
    let m;
    pageRe.lastIndex = 0;
    while ((m = pageRe.exec(text.slice(0, i + slice.length))) !== null) lastPage++;
    chunks.push({
      id: `${sourceName}#${id++}`,
      source: sourceName,
      section: `p.${lastPage}`,
      text: slice.replace(/--- página ---/g, '').trim(),
    });
    if (i + CHUNK_SIZE >= text.length) break;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.text.length > 80); // descarta chunks casi vacíos
}

// ── Recoge PDFs a indexar (con dedup) ──────────────────────
function collectPdfs() {
  const list = [];
  // 1) Todos los PDFs de protocolos/ (gold standard, AP).
  if (existsSync(PROTOCOLOS_DIR)) {
    const files = dedupeSuffixed(readdirSync(PROTOCOLOS_DIR).filter((f) => /\.pdf$/i.test(f)));
    for (const f of files) list.push({ path: join(PROTOCOLOS_DIR, f), name: `protocolos/${f}` });
  }
  // 2) Subconjunto de docs/ filtrado por nombre + dedup.
  if (existsSync(DOCS_DIR)) {
    const all = readdirSync(DOCS_DIR).filter((f) => /\.pdf$/i.test(f) && DOCS_NAME_FILTER.test(f));
    const deduped = dedupeSuffixed(all).sort();
    for (const f of deduped.slice(0, DOCS_MAX_FILES)) {
      list.push({ path: join(DOCS_DIR, f), name: `docs/${f}` });
    }
  }
  return list;
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
    outputDimensionality: DIMS,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`Gemini embedContent ${res.status}: ${txt.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json.embedding?.values;
}

// ── Util: progreso ──────────────────────────────────────────
function progress(done, total) {
  const pct = ((done / total) * 100).toFixed(1);
  process.stdout.write(`\r  → embedding chunks: ${done}/${total} (${pct}%)`);
}

// ── Util: checkpoint para reanudar tras 429 ─────────────────
function saveCheckpoint(embeddings, totalChunks) {
  try {
    writeFileSync(
      CHECKPOINT_PATH,
      JSON.stringify({
        totalChunks,
        model: MODEL,
        dims: DIMS,
        embeddings,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('  ⚠ no pude guardar checkpoint:', e.message);
  }
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

  console.log('✂️  Troceando MEGA_KB...');
  const chunks = chunkText(kb, 'MEGA_KB');
  console.log(`   MEGA_KB: ${chunks.length} chunks (avg ${Math.round(kb.length / chunks.length)} chars/chunk)`);

  console.log('📚 Recogiendo PDFs...');
  const pdfFiles = collectPdfs();
  console.log(`   ${pdfFiles.length} PDFs encontrados (protocolos/ + docs/ filtrado)`);

  console.log('📄 Extrayendo texto e indexando PDFs...');
  for (let i = 0; i < pdfFiles.length; i++) {
    const { path, name } = pdfFiles[i];
    const text = extractPdfText(path);
    if (!text || text.length < 200) {
      console.warn(`   ⚠ ${name}: muy corto (${text.length} chars), skip`);
      continue;
    }
    let pdfChunks = chunkPdfPlain(text, name);
    if (pdfChunks.length > MAX_CHUNKS_PER_PDF) {
      // Para PDFs masivos, samplea uniformemente para mantener cobertura
      // sin disparar quota de embeddings.
      const step = pdfChunks.length / MAX_CHUNKS_PER_PDF;
      const sampled = [];
      for (let j = 0; j < MAX_CHUNKS_PER_PDF; j++) sampled.push(pdfChunks[Math.floor(j * step)]);
      pdfChunks = sampled;
    }
    chunks.push(...pdfChunks);
    process.stdout.write(`\r   [${i + 1}/${pdfFiles.length}] ${name.slice(0, 60).padEnd(60)} → ${pdfChunks.length} chunks`);
  }
  console.log(`\n   Total chunks (KB + PDFs): ${chunks.length}`);

  // ── Checkpoint reanudable: si quota se agota a mitad de ejecución,
  //    guardamos los embeddings hechos en rag-index.partial.json y al
  //    relanzar mañana retomamos desde donde lo dejamos. Imprescindible
  //    en free tier (RPD limitado).
  let allEmbeddings = [];
  let resumeFrom = 0;
  if (existsSync(CHECKPOINT_PATH)) {
    try {
      const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8'));
      // Solo reanudamos si el chunkSet es idéntico (misma fuente, misma config).
      if (cp.totalChunks === chunks.length && cp.model === MODEL && cp.dims === DIMS) {
        allEmbeddings = cp.embeddings || [];
        resumeFrom = allEmbeddings.length;
        console.log(`♻️  Reanudando desde checkpoint: ${resumeFrom}/${chunks.length} ya hechos`);
      } else {
        console.log('⚠ Checkpoint desactualizado (chunks o modelo distinto), descartando.');
      }
    } catch (e) {
      console.warn('⚠ Checkpoint corrupto, ignorando:', e.message);
    }
  }

  console.log(`🧠 Pidiendo embeddings a Gemini ${MODEL} (${DIMS} dims)...`);
  const texts = chunks.map((c) => c.text);
  for (let i = resumeFrom; i < texts.length; i++) {
    let attempt = 0;
    let emb;
    while (attempt < 5) {
      try {
        emb = await embedOne(texts[i], apiKey);
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 5) {
          // Antes de propagar, guarda checkpoint para poder reanudar mañana.
          saveCheckpoint(allEmbeddings, chunks.length);
          console.error(`\n💾 Checkpoint guardado en ${CHECKPOINT_PATH} con ${allEmbeddings.length}/${chunks.length} chunks. Re-ejecuta cuando se resetee la quota.`);
          throw e;
        }
        const wait = e.status === 429 ? 30_000 + attempt * 15_000 : 2000 * attempt;
        console.warn(`\n  ⚠ chunk ${i} falló (intento ${attempt}, espera ${wait}ms): ${e.message.slice(0, 80)}`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    if (!Array.isArray(emb) || emb.length !== DIMS) {
      saveCheckpoint(allEmbeddings, chunks.length);
      throw new Error(`Chunk ${i}: dims ${emb?.length} != ${DIMS}`);
    }
    allEmbeddings.push(emb);
    progress(allEmbeddings.length, texts.length);
    // Checkpoint cada 20 chunks (no inunda I/O pero limita pérdida).
    if (allEmbeddings.length % 20 === 0) saveCheckpoint(allEmbeddings, chunks.length);
    if (i < texts.length - 1) await new Promise((r) => setTimeout(r, RPM_DELAY_MS));
  }
  console.log('\n✅ Embeddings completos.');
  // Borra checkpoint al terminar OK.
  try { if (existsSync(CHECKPOINT_PATH)) require('node:fs').unlinkSync(CHECKPOINT_PATH); } catch (e) {}

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
