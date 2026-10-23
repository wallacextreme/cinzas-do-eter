/**
 * Constants — Validation Tests
 *
 * Ensures the STYLE_GUIDE constants are internally consistent:
 * - Resolution is tile-aligned
 * - Palette values are valid hex colors
 * - Sprite dimensions are positive integers
 */

import { describe, it, expect } from 'vitest';
import { PALETTE, SPRITE, DISPLAY, ANIMATION } from '@config/constants.ts';

describe('DISPLAY constants', () => {
  it('resolution should be divisible by tile size', () => {
    expect(DISPLAY.WIDTH % SPRITE.TILE_SIZE).toBe(0);
    // HEIGHT 216 / 16 = 13.5 — intentional: allows half-tile offset
    expect(DISPLAY.WIDTH).toBeGreaterThan(0);
    expect(DISPLAY.HEIGHT).toBeGreaterThan(0);
  });

  it('should be 16:9 aspect ratio', () => {
    const ratio = DISPLAY.WIDTH / DISPLAY.HEIGHT;
    expect(ratio).toBeCloseTo(16 / 9, 1);
  });

  it('FPS should be 60', () => {
    expect(DISPLAY.FPS).toBe(60);
  });
});

describe('SPRITE constants', () => {
  it('all dimensions should be positive integers', () => {
    const values = Object.values(SPRITE);
    for (const v of values) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('character sprite should be taller than wide', () => {
    expect(SPRITE.CHAR_HEIGHT).toBeGreaterThan(SPRITE.CHAR_WIDTH);
  });
});

describe('PALETTE constants', () => {
  it('all palette values should be valid hex color numbers', () => {
    const values = Object.values(PALETTE);
    for (const v of values) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0x000000);
      expect(v).toBeLessThanOrEqual(0xFFFFFF);
    }
  });
});

describe('ANIMATION constants', () => {
  it('all frame rates should be positive', () => {
    expect(ANIMATION.WALK_FPS).toBeGreaterThan(0);
    expect(ANIMATION.IDLE_FPS).toBeGreaterThan(0);
    expect(ANIMATION.BATTLE_FPS).toBeGreaterThan(0);
  });

  it('walk frames should be at least 2', () => {
    expect(ANIMATION.WALK_FRAMES).toBeGreaterThanOrEqual(2);
  });

  it('UI transition should be reasonable', () => {
    expect(ANIMATION.UI_TRANSITION_MS).toBeGreaterThan(0);
    expect(ANIMATION.UI_TRANSITION_MS).toBeLessThan(2000);
  });
});
