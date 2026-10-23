/**
 * Math Utilities — Cinzas do Éter
 *
 * Safe math operations that prevent NaN, negative values,
 * and other invalid states as required by CONTRACTS.md.
 */

/**
 * Clamp a value between min and max.
 * Returns min if value is NaN.
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe addition that prevents NaN propagation.
 * If either operand is NaN, returns fallback (default 0).
 */
export function safeAdd(a: number, b: number, fallback = 0): number {
  if (Number.isNaN(a) || Number.isNaN(b)) return fallback;
  return a + b;
}

/**
 * Safe subtraction that prevents NaN and optionally prevents negative results.
 */
export function safeSub(
  a: number,
  b: number,
  preventNegative = false,
  fallback = 0,
): number {
  if (Number.isNaN(a) || Number.isNaN(b)) return fallback;
  const result = a - b;
  return preventNegative ? Math.max(0, result) : result;
}

/**
 * Safe multiplication.
 */
export function safeMul(a: number, b: number, fallback = 0): number {
  if (Number.isNaN(a) || Number.isNaN(b)) return fallback;
  return a * b;
}

/**
 * Safe division that prevents division by zero and NaN.
 */
export function safeDiv(a: number, b: number, fallback = 0): number {
  if (Number.isNaN(a) || Number.isNaN(b) || b === 0) return fallback;
  return a / b;
}

/**
 * Linear interpolation between a and b.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Random integer between min (inclusive) and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min (inclusive) and max (exclusive).
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Check if a number is a valid, finite number (not NaN, not Infinity).
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
