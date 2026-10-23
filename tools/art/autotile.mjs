/**
 * tools/art/autotile.mjs
 * Gerador determinístico de transições de terreno (autotile) 16x16.
 * Cria variações suaves (bordas, quinas internas e externas) entre 2 tiles
 * com máscara orgânica de transição e linha de sombra de borda na paleta.
 */

import fs from 'node:fs';
import path from 'node:path';
import { encodePng } from '../qa/validate-assets.mjs';

export const TILE_SIZE = 16;

/**
 * Cria um tile 16x16 sólido a partir de uma cor hex
 */
export function createSolidTile(hex, size = TILE_SIZE) {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const buf = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4 + 0] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = 255;
  }
  return { width: size, height: size, data: buf };
}

/**
 * Tipos canônicos de transição (bitmask 4-bits ou nomes amigáveis)
 */
export const TRANSITIONS = [
  'CENTER',    // 100% Tile A
  'EDGE_N',    // Tile B ao Norte
  'EDGE_S',    // Tile B ao Sul
  'EDGE_W',    // Tile B a Oeste
  'EDGE_E',    // Tile B a Leste
  'CORNER_NW', // Canto externo Noroeste
  'CORNER_NE', // Canto externo Nordeste
  'CORNER_SW', // Canto externo Sudoeste
  'CORNER_SE', // Canto externo Sudeste
  'INNER_NW',  // Canto interno Noroeste
  'INNER_NE',  // Canto interno Nordeste
  'INNER_SW',  // Canto interno Sudoeste
  'INNER_SE',  // Canto interno Sudeste
  'FULL_B',    // 100% Tile B
];

/**
 * Determina se o pixel (x, y) deve pertencer ao Tile B para o tipo de transição
 * com leve dithering orgânico pseudo-aleatório determinístico
 */
function isTileB(type, x, y, size) {
  const dither = ((x * 7 + y * 13) % 5 === 0) ? 1 : 0;
  const mid = Math.floor(size / 2);

  switch (type) {
    case 'CENTER':
      return false;
    case 'FULL_B':
      return true;
    case 'EDGE_N':
      return y < 5 + dither;
    case 'EDGE_S':
      return y >= size - 5 - dither;
    case 'EDGE_W':
      return x < 5 + dither;
    case 'EDGE_E':
      return x >= size - 5 - dither;
    case 'CORNER_NW':
      return (x < 6 && y < 6) || (x + y < 8 + dither);
    case 'CORNER_NE':
      return (x >= size - 6 && y < 6) || ((size - 1 - x) + y < 8 + dither);
    case 'CORNER_SW':
      return (x < 6 && y >= size - 6) || (x + (size - 1 - y) < 8 + dither);
    case 'CORNER_SE':
      return (x >= size - 6 && y >= size - 6) || ((size - 1 - x) + (size - 1 - y) < 8 + dither);
    case 'INNER_NW':
      return x < 5 || y < 5;
    case 'INNER_NE':
      return x >= size - 5 || y < 5;
    case 'INNER_SW':
      return x < 5 || y >= size - 5;
    case 'INNER_SE':
      return x >= size - 5 || y >= size - 5;
    default:
      return false;
  }
}

/**
 * Gera um tile 16x16 misturando Tile A e Tile B com linha de sombra na transição
 * @param {Uint8Array} dataA - RGBA do Tile A (16x16)
 * @param {Uint8Array} dataB - RGBA do Tile B (16x16)
 * @param {string} transitionType - Tipo de transição
 * @param {Object} [options]
 * @param {string} [options.shadowColorHex='#3A2B1F'] - Cor da sombra de transição
 * @param {number} [options.size=16]
 * @returns {Uint8Array} Buffer RGBA resultante
 */
export function generateTransitionTile(dataA, dataB, transitionType, options = {}) {
  const size = options.size || TILE_SIZE;
  const shadowHex = options.shadowColorHex || '#3A2B1F';
  const clean = shadowHex.startsWith('#') ? shadowHex.slice(1) : shadowHex;
  const sr = parseInt(clean.slice(0, 2), 16);
  const sg = parseInt(clean.slice(2, 4), 16);
  const sb = parseInt(clean.slice(4, 6), 16);

  const out = new Uint8Array(size * size * 4);
  const mask = new Uint8Array(size * size);

  // 1. Gera máscara binária de terreno
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      mask[y * size + x] = isTileB(transitionType, x, y, size) ? 1 : 0;
    }
  }

  // 2. Aplica composição com linha de sombra na borda entre A e B
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const px = idx * 4;
      const current = mask[idx];

      // Checa se é pixel de borda (vizinho adjacente tem valor diferente)
      let isEdge = false;
      if (current === 1 && transitionType !== 'FULL_B' && transitionType !== 'CENTER') {
        const neighbors = [
          y > 0 ? mask[(y - 1) * size + x] : 1,
          y < size - 1 ? mask[(y + 1) * size + x] : 1,
          x > 0 ? mask[y * size + (x - 1)] : 1,
          x < size - 1 ? mask[y * size + (x + 1)] : 1,
        ];
        if (neighbors.some(n => n === 0)) {
          isEdge = true;
        }
      }

      if (isEdge) {
        // Linha de sombra / contorno na junção
        out[px + 0] = sr;
        out[px + 1] = sg;
        out[px + 2] = sb;
        out[px + 3] = 255;
      } else if (current === 1) {
        // Pixel do Tile B
        out[px + 0] = dataB[px + 0];
        out[px + 1] = dataB[px + 1];
        out[px + 2] = dataB[px + 2];
        out[px + 3] = dataB[px + 3];
      } else {
        // Pixel do Tile A
        out[px + 0] = dataA[px + 0];
        out[px + 1] = dataA[px + 1];
        out[px + 2] = dataA[px + 2];
        out[px + 3] = dataA[px + 3];
      }
    }
  }

  return out;
}

/**
 * Gera um spritesheet completo com todas as transições de terreno organizadas em grid
 * @param {Uint8Array} dataA - Tile A (16x16)
 * @param {Uint8Array} dataB - Tile B (16x16)
 * @param {Object} [options]
 * @returns {{ width: number, height: number, data: Uint8Array, png: Uint8Array, transitions: string[] }}
 */
export function generateAutotileSet(dataA, dataB, options = {}) {
  const size = options.size || TILE_SIZE;
  const cols = 4;
  const rows = Math.ceil(TRANSITIONS.length / cols);
  const sheetWidth = cols * size;
  const sheetHeight = rows * size;
  const sheetData = new Uint8Array(sheetWidth * sheetHeight * 4);

  for (let i = 0; i < TRANSITIONS.length; i++) {
    const type = TRANSITIONS[i];
    const tileRgba = generateTransitionTile(dataA, dataB, type, options);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const startX = col * size;
    const startY = row * size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const srcPx = (y * size + x) * 4;
        const dstPx = ((startY + y) * sheetWidth + (startX + x)) * 4;
        sheetData[dstPx + 0] = tileRgba[srcPx + 0];
        sheetData[dstPx + 1] = tileRgba[srcPx + 1];
        sheetData[dstPx + 2] = tileRgba[srcPx + 2];
        sheetData[dstPx + 3] = tileRgba[srcPx + 3];
      }
    }
  }

  const png = encodePng(sheetWidth, sheetHeight, sheetData);
  return { width: sheetWidth, height: sheetHeight, data: sheetData, png, transitions: [...TRANSITIONS] };
}
