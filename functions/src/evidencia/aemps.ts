// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · cliente CIMA (AEMPS)
// ══════════════════════════════════════════════════════════════════════
// Centro de Información de Medicamentos Autorizados de la AEMPS.
// API pública sin auth. Solo se invoca cuando la pregunta menciona un
// principio activo o medicamento concreto detectado por el extractor PICO.
// ══════════════════════════════════════════════════════════════════════

const BASE = 'https://cima.aemps.es/cima/rest';

export interface AempsMedicamento {
  nregistro: string;
  nombre: string;
  labtitular: string | null;
  principios_activos: string[];
  url_ficha_tecnica: string | null;
  url_prospecto: string | null;
  source: 'aemps';
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function searchAemps(
  termino: string,
  opts: { timeoutMs?: number; pageSize?: number } = {},
): Promise<AempsMedicamento[]> {
  const params = new URLSearchParams({
    nombre: termino,
    pagesize: String(opts.pageSize ?? 5),
  });
  const r = await fetchWithTimeout(`${BASE}/medicamentos?${params}`, opts.timeoutMs ?? 5000);
  if (!r.ok) throw new Error(`aemps HTTP ${r.status}`);
  const j = (await r.json()) as { resultados?: Array<Record<string, unknown>> };
  const list = j.resultados ?? [];
  return list.map((d) => map(d));
}

function map(d: Record<string, unknown>): AempsMedicamento {
  const docs = (d['docs'] as Array<{ tipo: number; url: string }> | undefined) ?? [];
  const fichaTec = docs.find((x) => x.tipo === 1)?.url ?? null;
  const prospecto = docs.find((x) => x.tipo === 2)?.url ?? null;
  const pa = (d['principiosActivos'] as Array<{ nombre: string }> | undefined) ?? [];

  return {
    nregistro: String(d['nregistro'] ?? ''),
    nombre: String(d['nombre'] ?? ''),
    labtitular: (d['labtitular'] as string | undefined) ?? null,
    principios_activos: pa.map((x) => x.nombre).filter(Boolean),
    url_ficha_tecnica: fichaTec,
    url_prospecto: prospecto,
    source: 'aemps',
  };
}
