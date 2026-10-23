/**
 * tests/data/AnimationData.test.ts
 * Validação rigorosa de Animações Orientadas a Dados (Rubrica 3.5).
 * 
 * Garante que:
 * 1. Todo clipe referencia um assetId existente no manifesto (art/assets.manifest.json).
 * 2. O spritesheet tem dimensões/grid válidos e todos os quadros referenciados
 *    estão estritamente dentro do intervalo [0, totalFrames - 1].
 * 3. Os 11 clipes canônicos de batalha e os 8 clipes de campo estão presentes.
 * 4. Frequências (fps) e repetições são válidas.
 */

import { describe, it, expect } from 'vitest';
import manifest from '../../art/assets.manifest.json';
import {
  KAEL_FIELD_ANIMATIONS,
  KAEL_BATTLE_ANIMATIONS,
  ALL_KAEL_ANIMATIONS,
  registerKaelAnimations,
} from '../../src/data/animations/kaelAnimations.ts';

describe('AnimationData — Rubrica 3.5 (Animações orientadas a dados)', () => {
  const assetMap = new Map<string, any>();
  manifest.assets.forEach((a: any) => assetMap.set(a.id, a));

  it('todos os clipes de animação referenciam assets existentes no manifesto', () => {
    expect(ALL_KAEL_ANIMATIONS.length).toBeGreaterThan(0);

    for (const anim of ALL_KAEL_ANIMATIONS) {
      expect(assetMap.has(anim.assetId), `Asset "${anim.assetId}" não encontrado no manifesto`).toBe(true);
    }
  });

  it('todos os frames referenciados estão dentro dos limites do spritesheet', () => {
    for (const anim of ALL_KAEL_ANIMATIONS) {
      const asset = assetMap.get(anim.assetId);
      expect(asset.grid, `Asset "${anim.assetId}" deve declarar "grid" [colunas, linhas]`).toBeDefined();
      const [cols, rows] = asset.grid;
      const totalFrames = cols * rows;

      expect(anim.frames.length, `Animação "${anim.key}" não tem frames`).toBeGreaterThan(0);
      for (const f of anim.frames) {
        expect(f, `Frame ${f} da animação "${anim.key}" fora dos limites [0, ${totalFrames - 1}]`).toBeGreaterThanOrEqual(0);
        expect(f, `Frame ${f} da animação "${anim.key}" excede limite ${totalFrames - 1}`).toBeLessThan(totalFrames);
      }
    }
  });

  it('contém exatamente as 8 animações canônicas de campo (4 walk + 4 idle)', () => {
    const expectedFieldKeys = [
      'kael_walk_down',
      'kael_walk_left',
      'kael_walk_right',
      'kael_walk_up',
      'kael_idle_down',
      'kael_idle_left',
      'kael_idle_right',
      'kael_idle_up',
    ];

    const actualKeys = Object.values(KAEL_FIELD_ANIMATIONS).map((a) => a.key);
    for (const key of expectedFieldKeys) {
      expect(actualKeys).toContain(key);
    }

    // Rubrica 3.1: ciclos de caminhada com 4 quadros a 8 fps
    for (const dir of ['down', 'left', 'right', 'up']) {
      const walk = KAEL_FIELD_ANIMATIONS[`walk_${dir}`];
      expect(walk.frames.length).toBe(4);
      expect(walk.frameRate).toBe(8);
      expect(walk.repeat).toBe(-1);
    }
  });

  it('contém os 11 clipes canônicos de batalha com contagem exata de quadros', () => {
    const expectedBattleSpecs: Record<string, { frames: number; fps: number }> = {
      idle: { frames: 4, fps: 4 },
      advance: { frames: 4, fps: 8 },
      attack: { frames: 6, fps: 12 },
      resonance: { frames: 5, fps: 10 },
      item: { frames: 3, fps: 8 },
      defend: { frames: 2, fps: 6 },
      damage: { frames: 2, fps: 10 },
      wounded: { frames: 2, fps: 4 },
      victory: { frames: 4, fps: 6 },
      defeat: { frames: 3, fps: 4 },
      flee: { frames: 3, fps: 8 },
    };

    for (const [name, spec] of Object.entries(expectedBattleSpecs)) {
      const clip = KAEL_BATTLE_ANIMATIONS[name];
      expect(clip, `Clipe de batalha "${name}" ausente`).toBeDefined();
      expect(clip.frames.length, `Clipe "${name}" deve ter ${spec.frames} frames`).toBe(spec.frames);
      expect(clip.frameRate, `Clipe "${name}" deve ter fps ${spec.fps}`).toBe(spec.fps);
    }
  });

  it('função registerKaelAnimations registra corretamente no AnimationManager', () => {
    const created: any[] = [];
    const existing = new Set<string>();

    const mockAnims = {
      exists: (key: string) => existing.has(key),
      create: (config: any) => {
        created.push(config);
        existing.add(config.key);
        return config;
      },
    };

    const count = registerKaelAnimations(mockAnims);
    expect(count).toBe(ALL_KAEL_ANIMATIONS.length);
    expect(created.length).toBe(ALL_KAEL_ANIMATIONS.length);

    // Segunda chamada não duplica animações existentes
    const count2 = registerKaelAnimations(mockAnims);
    expect(count2).toBe(0);
  });
});
