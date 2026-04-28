// ══════════════════════════════════════════════════════════════════════
// MegaCuaderno · cron diario que resume las nuevas aportaciones
// ══════════════════════════════════════════════════════════════════════
// Cada día a las 06:45 Madrid (después del healthcheck IA y healthcheck
// EvidenciaIA), recopila las aportaciones aprobadas de las últimas 24h
// con `inMegaCuaderno:true`, las agrupa por categoría y genera un resumen
// con DeepSeek (educational chain). El resultado se guarda en
// /megacuaderno_digests/{YYYY-MM-DD} para que el frontend lo muestre
// como "Novedades del día" sin tener que llamar a la IA en cada visita.
//
// Si no hay aportaciones en 24h, no se llama al modelo (ahorra coste).
// ══════════════════════════════════════════════════════════════════════

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';

import { buildProviderChain, tryProviderChain } from './routing';

const REGION = 'europe-west1';
const TZ = 'Europe/Madrid';

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

interface Aportacion {
  titulo: string;
  categoria: string;
  descripcion?: string;
  autorNombre?: string;
  url?: string;
}

const SYSTEM_PROMPT =
  'Eres un editor médico que prepara un boletín diario para los profesionales sanitarios del Área II Cartagena.\n' +
  'Te dan los títulos y descripciones de las aportaciones aprobadas en las últimas 24 horas, agrupadas por categoría.\n' +
  'Genera un resumen breve (200-350 palabras) que:\n' +
  '1. Abre con una frase de contexto: "Resumen de novedades de las últimas 24h en Cartagenaeste."\n' +
  '2. Por cada categoría con aportaciones, una frase corta agrupando lo más relevante.\n' +
  '3. Cierra con: "Estos materiales son consultables desde la pestaña Documentos de cada especialidad."\n' +
  'NO inventes contenido que no esté en los títulos/descripciones. Estructura con encabezados ### por categoría.\n' +
  'Responde SOLO el cuerpo del resumen, sin preámbulos.';

export const megaCuadernoDailyDigest = onSchedule(
  {
    schedule: '45 6 * * *',
    timeZone: TZ,
    region: REGION,
    secrets: [DEEPSEEK_API_KEY, OPENROUTER_API_KEY],
    timeoutSeconds: 120,
    memory: '256MiB',
    retryCount: 0,
  },
  async () => {
    const db = getFirestore(getApp());
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Recoger aportaciones de las últimas 24h con inMegaCuaderno:true.
    const snap = await db
      .collection('documentos_aprobados')
      .where('visible', '==', true)
      .where('inMegaCuaderno', '==', true)
      .where('fechaAprobacion', '>=', desde)
      .orderBy('fechaAprobacion', 'desc')
      .limit(100)
      .get();

    const day = new Date().toISOString().slice(0, 10);
    const digestRef = db.collection('megacuaderno_digests').doc(day);

    if (snap.empty) {
      await digestRef.set({
        day,
        empty: true,
        count: 0,
        text: 'Sin aportaciones nuevas en las últimas 24 horas.',
        timestamp: FieldValue.serverTimestamp(),
      });
      logger.info('megaCuadernoDigest.empty', { day });
      return;
    }

    // Agrupar por categoría.
    const grupos: Record<string, Aportacion[]> = {};
    snap.forEach((doc) => {
      const d = doc.data() as Aportacion & { fileName?: string };
      const cat = d.categoria || 'Otro';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push({
        titulo: d.titulo || d.fileName || '(sin título)',
        categoria: cat,
        descripcion: (d.descripcion ?? '').slice(0, 300),
        autorNombre: d.autorNombre,
      });
    });

    const lista = Object.keys(grupos)
      .sort()
      .map((cat) => {
        const items = grupos[cat]!
          .map((a, i) => `  ${i + 1}. ${a.titulo}${a.descripcion ? ' — ' + a.descripcion : ''}`)
          .join('\n');
        return `## ${cat}\n${items}`;
      })
      .join('\n\n');

    const userPrompt =
      `Aportaciones (${snap.size} en total) agrupadas por categoría:\n\n${lista}\n\n` +
      'Genera el boletín siguiendo las reglas del system prompt.';

    let texto = '';
    let provider = 'none';
    let model = 'none';
    try {
      const chain = buildProviderChain({
        type: 'educational',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        secrets: {
          deepseekKey: DEEPSEEK_API_KEY.value(),
          openrouterKey: OPENROUTER_API_KEY.value(),
        },
      });
      const r = await tryProviderChain(chain);
      texto = r.result.text || '';
      provider = r.provider;
      model = r.result.model || '';
    } catch (e) {
      logger.warn('megaCuadernoDigest.aiFailed', { err: (e as Error).message });
      texto =
        'Resumen automático no disponible hoy. Aportaciones recibidas:\n\n' +
        lista.replace(/^## /gm, '### ');
    }

    await digestRef.set({
      day,
      empty: false,
      count: snap.size,
      categorias: Object.keys(grupos),
      por_categoria: Object.fromEntries(
        Object.entries(grupos).map(([k, v]) => [k, v.length]),
      ),
      text: texto,
      provider,
      model,
      timestamp: FieldValue.serverTimestamp(),
    });

    logger.info('megaCuadernoDigest.ok', {
      day,
      count: snap.size,
      provider,
      model,
      categorias: Object.keys(grupos),
    });
  },
);
