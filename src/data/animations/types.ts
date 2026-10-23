/**
 * src/data/animations/types.ts
 * Tipos para o sistema de animações orientadas a dados (Rubrica 3.5).
 */

export interface AnimationDefinition {
  key: string;
  assetId: string;
  frames: number[];
  frameRate: number;
  repeat: number; // -1 para loop infinito, 0 para executar uma vez, >0 repetições
  description?: string;
}

export type AnimationSet = Record<string, AnimationDefinition>;
