export const DEFAULT_CHAR_MAP: Record<string, string | null>;
export function hexToRgba(hex: string | null, alpha?: number): [number, number, number, number];
export function asciiToPng(
  lines: string[] | string,
  customCharMap?: Record<string, string>
): { width: number; height: number; data: Uint8Array; png: Uint8Array };
