// ══════════════════════════════════════════════════════════════════════
// EvidenciaIA · verificador post-hoc de citas [n]
// ══════════════════════════════════════════════════════════════════════
// Recorre el texto sintetizado, comprueba que cada [n] referencia un
// abstract válido en la lista provista, y elimina/marca las citas
// inventadas. Devuelve métricas para auditoría.
// ══════════════════════════════════════════════════════════════════════

export interface VerificationResult {
  text: string;            // texto saneado
  citationsEmitted: number;
  citationsVerified: number;
  citationsInvalid: number[]; // [n] que no existen en la lista
  ratio: number;           // verified / emitted (0..1)
  warning: string | null;  // mensaje a mostrar en UI si ratio < umbral
}

export function verifyCitations(text: string, sourcesCount: number): VerificationResult {
  const RX = /\[(\d+)\]/g;
  const emitted = new Set<number>();
  const invalid = new Set<number>();
  let m: RegExpExecArray | null;
  while ((m = RX.exec(text))) {
    const n = parseInt(m[1] ?? '0', 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    emitted.add(n);
    if (n > sourcesCount) invalid.add(n);
  }
  // Reemplaza las citas inválidas por marcador visible.
  let saneText = text;
  for (const n of invalid) {
    const rx = new RegExp(`\\[${n}\\]`, 'g');
    saneText = saneText.replace(rx, '[cita no verificable]');
  }
  const verified = emitted.size - invalid.size;
  const ratio = emitted.size === 0 ? 0 : verified / emitted.size;
  const warning =
    emitted.size === 0
      ? 'La síntesis no incluye citas. Revisa los abstracts manualmente.'
      : invalid.size > 0
        ? `${invalid.size} cita(s) no se corresponden con la lista de fuentes y se han marcado como no verificables.`
        : null;
  return {
    text: saneText,
    citationsEmitted: emitted.size,
    citationsVerified: Math.max(0, verified),
    citationsInvalid: Array.from(invalid),
    ratio,
    warning,
  };
}
