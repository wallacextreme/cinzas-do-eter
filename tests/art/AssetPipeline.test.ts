/**
 * Art Pipeline — Validação automática de assets (QA v2, camada F)
 *
 * Roda o validador de arte (tools/qa/validate-assets.mjs) dentro do `bun run test`:
 *  1. self-test  → prova que o validador DETECTA defeitos reais ("QA do QA");
 *  2. projeto    → 0 erros nos assets de produção (órfãos/legados são AVISO no modo
 *                  transição e ERRO no modo estrito — manifest.strict = true no fim do L1);
 *  3. paleta     → toda cor de src/config/constants.ts PALETTE existe em art/palette.json.
 *
 * QA_LOCK: este arquivo só pode ser alterado pelo usuário.
 */
import { describe, it, expect } from 'vitest';
import { validateProject, selfTest } from '../../tools/qa/validate-assets.mjs';
import paletteRaw from '../../art/palette.json?raw';
import { PALETTE } from '@config/constants.ts';

describe('Validador de arte — self-test (QA do QA)', () => {
  it('detecta todos os defeitos injetados e aceita o sprite limpo', () => {
    const r = selfTest();
    const failed = r.results.filter((x) => !x.ok).map((x) => `${x.name} → ${x.detail}`);
    expect(failed).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe('Validador de arte — assets do projeto', () => {
  it('não tem NENHUM erro de validação (A00–A20)', () => {
    const r = validateProject();
    const errors = [
      ...r.global.filter((f) => f.level === 'error').map((f) => `${f.code} ${f.message}`),
      ...r.assets.flatMap((a) => a.findings.filter((f) => f.level === 'error').map((f) => `${a.id}: ${f.code} ${f.message}`)),
    ];
    expect(errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe('Paleta — sincronia entre código e art/palette.json', () => {
  it('toda cor de PALETTE (constants.ts) existe na paleta validada', () => {
    const palette = JSON.parse(paletteRaw) as { colors: Record<string, string> };
    const allowed = new Set(Object.values(palette.colors).map((h) => h.toUpperCase()));
    const missing = Object.entries(PALETTE)
      .filter(([, value]) => !allowed.has(`#${value.toString(16).padStart(6, '0').toUpperCase()}`))
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });
});
