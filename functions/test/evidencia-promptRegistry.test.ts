import { describe, expect, it } from 'vitest';
import { hashPrompt, PROMPT_VERSIONS, currentPromptVersions } from '../src/evidencia/promptRegistry';

describe('promptRegistry', () => {
  it('hashPrompt devuelve sha256 truncado a 12 hex chars', () => {
    const h = hashPrompt('Hola mundo');
    expect(h).toHaveLength(12);
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });

  it('mismo prompt → mismo hash', () => {
    expect(hashPrompt('foo')).toBe(hashPrompt('foo'));
  });

  it('un solo carácter de diferencia → hash distinto', () => {
    expect(hashPrompt('foo')).not.toBe(hashPrompt('Foo'));
    expect(hashPrompt('foo')).not.toBe(hashPrompt('foo '));
  });

  it('PROMPT_VERSIONS tiene pico y synth con shape correcto', () => {
    expect(PROMPT_VERSIONS.pico).toMatch(/^[0-9a-f]{12}$/);
    expect(PROMPT_VERSIONS.synth).toMatch(/^[0-9a-f]{12}$/);
    // Necesariamente distintos: prompts distintos.
    expect(PROMPT_VERSIONS.pico).not.toBe(PROMPT_VERSIONS.synth);
  });

  it('currentPromptVersions devuelve un snapshot estable en runtime', () => {
    const a = currentPromptVersions();
    const b = currentPromptVersions();
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // objetos distintos (snapshot fresco)
  });
});
