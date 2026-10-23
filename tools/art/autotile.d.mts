export const TILE_SIZE: number;
export const TRANSITIONS: string[];
export function createSolidTile(hex: string, size?: number): { width: number; height: number; data: Uint8Array };
export function generateTransitionTile(
  dataA: Uint8Array,
  dataB: Uint8Array,
  transitionType: string,
  options?: { shadowColorHex?: string; size?: number }
): Uint8Array;
export function generateAutotileSet(
  dataA: Uint8Array,
  dataB: Uint8Array,
  options?: { shadowColorHex?: string; size?: number }
): { width: number; height: number; data: Uint8Array; png: Uint8Array; transitions: string[] };
