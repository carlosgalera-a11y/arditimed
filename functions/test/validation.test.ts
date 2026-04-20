import { describe, expect, it } from 'vitest';
import {
  validatePrompt,
  validateSystemPrompt,
  validateImageBase64,
  sanitizeForLog,
} from '../src/validation';

describe('validatePrompt', () => {
  it('acepta prompt razonable', () => {
    expect(validatePrompt('Paciente con dolor torácico tipo opresivo').ok).toBe(true);
  });

  it('rechaza non-string', () => {
    expect(validatePrompt(42).ok).toBe(false);
    expect(validatePrompt(null).ok).toBe(false);
    expect(validatePrompt(undefined).ok).toBe(false);
  });

  it('rechaza vacío o solo espacios', () => {
    expect(validatePrompt('').ok).toBe(false);
    expect(validatePrompt('   ').ok).toBe(false);
  });

  it('rechaza prompts que exceden 8000 chars', () => {
    expect(validatePrompt('a'.repeat(8001)).ok).toBe(false);
    expect(validatePrompt('a'.repeat(8000)).ok).toBe(true);
  });

  it('rechaza DNI español en el prompt', () => {
    const r = validatePrompt('Paciente 12345678Z con HTA');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/DNI/);
  });

  it('no confunde 9 dígitos con DNI', () => {
    // DNI es exactamente 8 dígitos + letra. 9 dígitos (teléfono) no.
    expect(validatePrompt('Teléfono 123456789 del familiar').ok).toBe(true);
  });

  it('rechaza NIE (X/Y/Z + 7 dígitos + letra)', () => {
    const r = validatePrompt('Paciente extranjero X1234567L con diabetes');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/NIE/);
  });

  it('rechaza NHC con contexto', () => {
    expect(validatePrompt('NHC: 1234567 derivado a cardiología').ok).toBe(false);
    expect(validatePrompt('Historia clínica 9876543 pendiente').ok).toBe(false);
  });

  it('no confunde números sueltos con NHC', () => {
    expect(validatePrompt('TA 145/90 FC 80 saturación 97').ok).toBe(true);
  });
});

describe('validateSystemPrompt', () => {
  it('acepta undefined / null / vacío', () => {
    expect(validateSystemPrompt(undefined).ok).toBe(true);
    expect(validateSystemPrompt(null).ok).toBe(true);
    expect(validateSystemPrompt('').ok).toBe(true);
  });

  it('rechaza non-string cuando se provee', () => {
    expect(validateSystemPrompt(42).ok).toBe(false);
    expect(validateSystemPrompt({}).ok).toBe(false);
  });

  it('aplica límite de 4000 chars', () => {
    expect(validateSystemPrompt('a'.repeat(4000)).ok).toBe(true);
    expect(validateSystemPrompt('a'.repeat(4001)).ok).toBe(false);
  });
});

describe('validateImageBase64', () => {
  it('acepta vacío u omitido', () => {
    expect(validateImageBase64(undefined).ok).toBe(true);
    expect(validateImageBase64('').ok).toBe(true);
  });

  it('rechaza non-string', () => {
    expect(validateImageBase64(42).ok).toBe(false);
  });

  it('rechaza imágenes >5MB raw (~7MB base64)', () => {
    expect(validateImageBase64('a'.repeat(7 * 1024 * 1024 + 1)).ok).toBe(false);
    expect(validateImageBase64('a'.repeat(100)).ok).toBe(true);
  });
});

describe('sanitizeForLog', () => {
  it('colapsa espacios y trunca a 40 chars', () => {
    const input = 'Linea 1\n\n  Linea 2    con tabs\t y spaces    extra extra';
    const out = sanitizeForLog(input);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out).not.toContain('\n');
    expect(out).not.toContain('\t');
  });
});
