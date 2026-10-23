/**
 * Game Configuration — Cinzas do Éter
 *
 * Central Phaser configuration.
 * Defines rendering mode and pixel-perfect settings.
 *
 * STYLE_GUIDE.md reference:
 * - Logical resolution: 384×216 (16:9 widescreen, 16px tile-aligned)
 * - Scaling: nearest-neighbor (no anti-aliasing, no blur)
 * - Pixel art: crisp rendering at all scales
 *
 * All dimension constants imported from constants.ts (single source of truth).
 */

import type { Types } from 'phaser';
import { DISPLAY } from '@config/constants.ts';
import { BootScene } from '@scenes/BootScene.ts';
import { PreloadScene } from '@scenes/PreloadScene.ts';
import { GameScene } from '@scenes/GameScene.ts';

export const GAME_CONFIG: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: DISPLAY.WIDTH,
  height: DISPLAY.HEIGHT,
  pixelArt: true,            // Nearest-neighbor scaling, no anti-aliasing
  roundPixels: true,         // Snap to pixel grid
  antialias: false,          // No anti-aliasing
  autoRound: true,           // Round all positions

  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DISPLAY.WIDTH,
    height: DISPLAY.HEIGHT,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scene: [BootScene, PreloadScene, GameScene],

  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },

  fps: {
    target: DISPLAY.FPS,
    forceSetTimeOut: false,
  },

  backgroundColor: '#0a0612',
};
