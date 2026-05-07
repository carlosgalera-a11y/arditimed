#!/usr/bin/env node
/**
 * gen-megakb-protocolos.mjs
 * ────────────────────────────────────────────────────────────
 * Extrae texto de protocolos/*.pdf con pdftotext y genera
 * mega-kb-protocolos.js que extiende `MEGA_KB` con su contenido.
 *
 * Idempotente — re-ejecutar cuando los PDFs cambien:
 *   node scripts/gen-megakb-protocolos.mjs
 *
 * Salida:
 *   mega-kb-protocolos.js (~30 KB) — script que se carga en
 *   notebook-local.html después de la declaración de MEGA_KB.
 * ────────────────────────────────────────────────────────────
 */

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const PROTOCOLOS_DIR = join(REPO_ROOT, 'protocolos');
const OUT_PATH = join(REPO_ROOT, 'mega-kb-protocolos.js');

if (!existsSync(PROTOCOLOS_DIR)) {
  console.error('❌ No existe protocolos/');
  process.exit(1);
}

// Mapping nombre fichero → título humano + emoji por especialidad.
const META = {
  '01-problemas-generales': { title: 'Protocolos AP · Problemas generales', emoji: '🩺' },
  '02-respiratorio-cardiovascular': { title: 'Protocolos AP · Respiratorio y Cardiovascular', emoji: '🫁' },
  '03-digestivo': { title: 'Protocolos AP · Digestivo', emoji: '🍽️' },
  '04-neurologia': { title: 'Protocolos AP · Neurología', emoji: '🧠' },
  '05-salud-mental': { title: 'Protocolos AP · Salud Mental', emoji: '💭' },
  '06-cronicas-frecuentes': { title: 'Protocolos AP · Crónicas frecuentes', emoji: '⚕️' },
  '07-musculoesqueletico': { title: 'Protocolos AP · Musculoesquelético', emoji: '🦴' },
  '08-dermatologia': { title: 'Protocolos AP · Dermatología', emoji: '🧴' },
  '09-urologia-nefrologia': { title: 'Protocolos AP · Urología y Nefrología', emoji: '🫘' },
  '10-ORL': { title: 'Protocolos AP · ORL', emoji: '👂' },
};

function extractText(pdfPath) {
  const out = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 30_000,
  });
  return out
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Escape para string JS literal de comillas simples.
function escapeJsString(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

const sections = [];
const files = readdirSync(PROTOCOLOS_DIR).filter((f) => /\.pdf$/i.test(f)).sort();
let totalChars = 0;

for (const f of files) {
  const base = f.replace(/\.pdf$/i, '');
  const meta = META[base] || { title: `Protocolo · ${base}`, emoji: '📋' };
  const text = extractText(join(PROTOCOLOS_DIR, f));
  if (!text || text.length < 200) {
    console.warn(`  ⚠ ${f}: vacío o muy corto, skip`);
    continue;
  }
  totalChars += text.length;
  sections.push({ meta, base, text });
  console.log(`  ${meta.emoji} ${base} → ${text.length.toLocaleString()} chars`);
}

console.log(`\nTotal: ${sections.length} protocolos · ${totalChars.toLocaleString()} chars`);

// Genera el archivo JS que hace `MEGA_KB += ...`
let body = '// ════════════════════════════════════════════════════════════\n';
body += '// mega-kb-protocolos.js — extiende MEGA_KB con los 10 protocolos AP\n';
body += '// del Centro de Salud Virgen de la Caridad (Área II Cartagena).\n';
body += '// Generado por scripts/gen-megakb-protocolos.mjs · ' + new Date().toISOString() + '\n';
body += `// ${sections.length} protocolos · ${totalChars.toLocaleString()} chars\n`;
body += '// ════════════════════════════════════════════════════════════\n';
body += "if (typeof MEGA_KB !== 'undefined') {\n";

for (const s of sections) {
  const header = `\n\n=== ${s.meta.emoji} ${s.meta.title} ===\n`;
  const escaped = escapeJsString(header + s.text);
  body += `  MEGA_KB += '${escaped}';\n`;
}

body += "} else {\n";
body += "  console.warn('[mega-kb-protocolos] MEGA_KB no está definido — el script principal no se cargó antes.');\n";
body += '}\n';

writeFileSync(OUT_PATH, body);
const sizeKB = (Buffer.byteLength(body, 'utf8') / 1024).toFixed(1);
console.log(`\n💾 Escrito ${OUT_PATH} (${sizeKB} KB)`);
console.log(`Recuerda incluir <script src="mega-kb-protocolos.js"></script> en notebook-local.html`);
