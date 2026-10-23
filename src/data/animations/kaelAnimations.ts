/**
 * src/data/animations/kaelAnimations.ts
 * Definições canônicas de animações de Kaël orientadas a dados (Rubrica 3.5).
 * 
 * Vincula chaves de animação aos frames dos spritesheets registrados no manifesto:
 * - char_kael_field (grid 4x8, 32x48)
 * - char_kael_battle (grid 6x11, 48x48)
 */

import type { AnimationDefinition } from './types.ts';

/**
 * Animações de Campo (Exploração / Overworld)
 * Grid: 4 colunas x 8 linhas (32 quadros totais)
 * Linhas 0-3: walk (down, left, right, up) - 4f a 8 fps
 * Linhas 4-7: idle (down, left, right, up) - 4f a 4 fps
 */
export const KAEL_FIELD_ANIMATIONS: Record<string, AnimationDefinition> = {
  walk_down: {
    key: 'kael_walk_down',
    assetId: 'char_kael_field',
    frames: [0, 1, 2, 3],
    frameRate: 8,
    repeat: -1,
    description: 'Caminhada para baixo (passo L, neutro, passo R, neutro)',
  },
  walk_left: {
    key: 'kael_walk_left',
    assetId: 'char_kael_field',
    frames: [4, 5, 6, 7],
    frameRate: 8,
    repeat: -1,
    description: 'Caminhada para esquerda (perfil 3/4)',
  },
  walk_right: {
    key: 'kael_walk_right',
    assetId: 'char_kael_field',
    frames: [8, 9, 10, 11],
    frameRate: 8,
    repeat: -1,
    description: 'Caminhada para direita (perfil 3/4)',
  },
  walk_up: {
    key: 'kael_walk_up',
    assetId: 'char_kael_field',
    frames: [12, 13, 14, 15],
    frameRate: 8,
    repeat: -1,
    description: 'Caminhada para cima (costas com manto)',
  },
  idle_down: {
    key: 'kael_idle_down',
    assetId: 'char_kael_field',
    frames: [16, 17, 18, 19],
    frameRate: 4,
    repeat: -1,
    description: 'Idle para baixo (respiração e brilho do pingente)',
  },
  idle_left: {
    key: 'kael_idle_left',
    assetId: 'char_kael_field',
    frames: [20, 21, 22, 23],
    frameRate: 4,
    repeat: -1,
    description: 'Idle para esquerda com bastão',
  },
  idle_right: {
    key: 'kael_idle_right',
    assetId: 'char_kael_field',
    frames: [24, 25, 26, 27],
    frameRate: 4,
    repeat: -1,
    description: 'Idle para direita com bastão',
  },
  idle_up: {
    key: 'kael_idle_up',
    assetId: 'char_kael_field',
    frames: [28, 29, 30, 31],
    frameRate: 4,
    repeat: -1,
    description: 'Idle de costas com manto',
  },
};

/**
 * Animações de Batalha (11 clipes canônicos do STYLE_GUIDE)
 * Grid: 6 colunas x 11 linhas (66 quadros totais)
 */
export const KAEL_BATTLE_ANIMATIONS: Record<string, AnimationDefinition> = {
  idle: {
    key: 'kael_battle_idle',
    assetId: 'char_kael_battle',
    frames: [0, 1, 2, 3],
    frameRate: 4,
    repeat: -1,
    description: 'Idle de combate com bastão sintonizado',
  },
  advance: {
    key: 'kael_battle_advance',
    assetId: 'char_kael_battle',
    frames: [6, 7, 8, 9],
    frameRate: 8,
    repeat: 0,
    description: 'Avanço dinâmico para golpear',
  },
  attack: {
    key: 'kael_battle_attack',
    assetId: 'char_kael_battle',
    frames: [12, 13, 14, 15, 16, 17],
    frameRate: 12,
    repeat: 0,
    description: 'Ataque corpo-a-corpo (antecipação-golpe-rastro-impacto-recuperação)',
  },
  resonance: {
    key: 'kael_battle_resonance',
    assetId: 'char_kael_battle',
    frames: [18, 19, 20, 21, 22],
    frameRate: 10,
    repeat: 0,
    description: 'Canalização de Ressonância com brilho no cristal',
  },
  item: {
    key: 'kael_battle_item',
    assetId: 'char_kael_battle',
    frames: [24, 25, 26],
    frameRate: 8,
    repeat: 0,
    description: 'Uso de item consumível',
  },
  defend: {
    key: 'kael_battle_defend',
    assetId: 'char_kael_battle',
    frames: [30, 31],
    frameRate: 6,
    repeat: 0,
    description: 'Postura defensiva com bastão em guarda',
  },
  damage: {
    key: 'kael_battle_damage',
    assetId: 'char_kael_battle',
    frames: [36, 37],
    frameRate: 10,
    repeat: 0,
    description: 'Recuo ao sofrer impacto',
  },
  wounded: {
    key: 'kael_battle_wounded',
    assetId: 'char_kael_battle',
    frames: [42, 43],
    frameRate: 4,
    repeat: -1,
    description: 'Ofegante / HP crítico (< 25%)',
  },
  victory: {
    key: 'kael_battle_victory',
    assetId: 'char_kael_battle',
    frames: [48, 49, 50, 51],
    frameRate: 6,
    repeat: -1,
    description: 'Comemoração de vitória com bastão erguido',
  },
  defeat: {
    key: 'kael_battle_defeat',
    assetId: 'char_kael_battle',
    frames: [54, 55, 56],
    frameRate: 4,
    repeat: 0,
    description: 'Queda / derrota',
  },
  flee: {
    key: 'kael_battle_flee',
    assetId: 'char_kael_battle',
    frames: [60, 61, 62],
    frameRate: 8,
    repeat: -1,
    description: 'Fuga da batalha',
  },
};

export const ALL_KAEL_ANIMATIONS: AnimationDefinition[] = [
  ...Object.values(KAEL_FIELD_ANIMATIONS),
  ...Object.values(KAEL_BATTLE_ANIMATIONS),
];

/**
 * Registra animações no AnimationManager do Phaser
 */
export function registerKaelAnimations(
  anims: any,
  definitions: AnimationDefinition[] = ALL_KAEL_ANIMATIONS
): number {
  if (!anims || typeof anims.create !== 'function') return 0;

  let createdCount = 0;
  for (const def of definitions) {
    if (anims.exists(def.key)) continue;

    // Se o asset/textura existir no gerenciador de texturas, monta os frames
    anims.create({
      key: def.key,
      frames: def.frames.map((frameIdx) => ({
        key: def.assetId,
        frame: frameIdx,
      })),
      frameRate: def.frameRate,
      repeat: def.repeat,
    });
    createdCount++;
  }
  return createdCount;
}
