/**
 * Math Utilities — Unit Tests
 *
 * Tests all safe math operations from CONTRACTS.md:
 * - NaN prevention
 * - No negative quantities without explicit rule
 * - Safe division by zero
 * - Clamping
 */

import { describe, it, expect } from 'vitest';
import {
  clamp,
  safeAdd,
  safeSub,
  safeMul,
  safeDiv,
  lerp,
  randomInt,
  randomFloat,
  isValidNumber,
} from '@utils/math.ts';

describe('clamp', () => {
  it('should clamp value between min and max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return min when value is NaN', () => {
    expect(clamp(NaN, 0, 10)).toBe(0);
  });
});

describe('safeAdd', () => {
  it('should add normally', () => {
    expect(safeAdd(3, 4)).toBe(7);
  });

  it('should return fallback when a is NaN', () => {
    expect(safeAdd(NaN, 4)).toBe(0);
  });

  it('should return fallback when b is NaN', () => {
    expect(safeAdd(3, NaN)).toBe(0);
  });

  it('should use custom fallback', () => {
    expect(safeAdd(NaN, 4, 99)).toBe(99);
  });
});

describe('safeSub', () => {
  it('should subtract normally', () => {
    expect(safeSub(10, 3)).toBe(7);
  });

  it('should return fallback when NaN', () => {
    expect(safeSub(NaN, 3)).toBe(0);
  });

  it('should prevent negative when flag is set', () => {
    expect(safeSub(3, 10, true)).toBe(0);
  });

  it('should allow negative when flag is not set', () => {
    expect(safeSub(3, 10, false)).toBe(-7);
  });
});

describe('safeMul', () => {
  it('should multiply normally', () => {
    expect(safeMul(3, 4)).toBe(12);
  });

  it('should return fallback on NaN', () => {
    expect(safeMul(NaN, 4)).toBe(0);
  });
});

describe('safeDiv', () => {
  it('should divide normally', () => {
    expect(safeDiv(10, 2)).toBe(5);
  });

  it('should return fallback on division by zero', () => {
    expect(safeDiv(10, 0)).toBe(0);
  });

  it('should return fallback on NaN', () => {
    expect(safeDiv(NaN, 2)).toBe(0);
  });
});

describe('lerp', () => {
  it('should interpolate correctly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('should clamp t to 0-1 range', () => {
    expect(lerp(0, 10, -1)).toBe(0);
    expect(lerp(0, 10, 2)).toBe(10);
  });
});

describe('randomInt', () => {
  it('should return values within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomInt(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('randomFloat', () => {
  it('should return values within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomFloat(0, 1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('isValidNumber', () => {
  it('should return true for valid numbers', () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(42)).toBe(true);
    expect(isValidNumber(-1)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
  });

  it('should return false for invalid numbers', () => {
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(-Infinity)).toBe(false);
    expect(isValidNumber('42')).toBe(false);
    expect(isValidNumber(null)).toBe(false);
    expect(isValidNumber(undefined)).toBe(false);
  });
});
