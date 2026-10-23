/** Tipos do validador de arte (QA v2). Mantém o tsc do projeto feliz ao importar o .mjs. */
export type Level = 'error' | 'warn' | 'info';

export interface Finding {
  code: string;
  level: Level;
  message: string;
}

export interface AssetResult {
  id: string;
  path: string;
  findings: Finding[];
}

export interface ProjectResult {
  ok: boolean;
  mode: 'strict' | 'transition';
  paletteStatus: string;
  paletteColors: number;
  manifestAssets: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  global: Finding[];
  assets: AssetResult[];
}

export interface ValidateOptions {
  root?: string;
  strict?: boolean;
  dist?: boolean;
}

export interface SelfTestResult {
  ok: boolean;
  results: { name: string; ok: boolean; detail: string }[];
}

export const CHECKS: Record<string, string>;
export function validateProject(opts?: ValidateOptions): ProjectResult;
export function formatReport(res: ProjectResult): string;
export function selfTest(): SelfTestResult;
export function detectFormat(buf: Uint8Array): 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'unknown';
export function decodePng(buf: Uint8Array): { width: number; height: number; data: Uint8Array };
export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array;
