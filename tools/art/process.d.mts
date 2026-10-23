export function rgbToLab(r: number, g: number, b: number): [number, number, number];
export function deltaE(lab1: [number, number, number], lab2: [number, number, number]): number;
export function removeMagentaBackground(
  rgba: Uint8Array,
  width: number,
  height: number,
  tolerance?: number
): Uint8Array;
export function binarizeAlpha(rgba: Uint8Array, threshold?: number): Uint8Array;
export function downscaleNearestMode(
  rgba: Uint8Array,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
): Uint8Array;
export function quantizeToPalette(rgba: Uint8Array, paletteHexList: string[]): Uint8Array;
export function removeOrphanPixels(rgba: Uint8Array, width: number, height: number): Uint8Array;
export function alignFrame(
  frameRgba: Uint8Array,
  frameW: number,
  frameH: number,
  targetBaselineY?: number | null
): Uint8Array;
export function transposeSheet(
  rgba: Uint8Array,
  width: number,
  height: number,
  cellW: number,
  cellH: number
): { width: number; height: number; data: Uint8Array };
export function processAsset(
  inputBuf: Uint8Array,
  options?: {
    chromaTolerance?: number;
    targetWidth?: number;
    targetHeight?: number;
    palette?: string[];
    transpose?: boolean;
    cellWidth?: number;
    cellHeight?: number;
  }
): { width: number; height: number; data: Uint8Array; png: Uint8Array };
