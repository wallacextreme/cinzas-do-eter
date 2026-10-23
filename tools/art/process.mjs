/**
 * tools/art/process.mjs
 * Pipeline determinístico de pós-processamento de arte gerada por IA / conceito.
 * 
 * Etapas:
 * (a) Recorta células do grid
 * (b) Remove fundo magenta (chroma key + despill de borda)
 * (c) Reduz escala por razão inteira usando a cor mais frequente (moda) do bloco
 * (d) Quantiza para art/palette.json via distância mínima em CIELAB
 * (e) Binariza o canal alpha
 * (f) Remove pixels órfãos
 * (g) Alinha a base dos pés (baseline) e centraliza horizontalmente
 * (h) Exporta PNG limpo e gera entrada correspondente no manifesto
 */

import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../qa/validate-assets.mjs';

/**
 * Converte sRGB (0-255) para CIELAB [L*, a*, b*]
 */
export function rgbToLab(r, g, b) {
  // 1. sRGB para RGB linear
  let rL = r / 255;
  let gL = g / 255;
  let bL = b / 255;
  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

  // 2. Linear RGB para XYZ (D65)
  let x = (rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375) / 0.95047;
  let y = (rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750) / 1.00000;
  let z = (rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041) / 1.08883;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return [L, a, bb];
}

/**
 * Distância Euclidiana em CIELAB (Delta E)
 */
export function deltaE(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Remove fundo magenta (#FF00FF) com chroma-key e despill nas bordas
 */
export function removeMagentaBackground(rgba, width, height, tolerance = 60) {
  const out = new Uint8Array(rgba);
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    const r = out[px + 0];
    const g = out[px + 1];
    const b = out[px + 2];
    const a = out[px + 3];

    if (a === 0) continue;

    // Detecta magenta (#FF00FF): alto R, baixo G, alto B
    const isMagenta = r > 180 && b > 180 && g < tolerance && Math.abs(r - b) < 60;
    if (isMagenta) {
      out[px + 3] = 0;
    } else if (r > b && g < 40 && b > 100) {
      // Despill de borda avermelhada/azulada residual
      out[px + 1] = Math.min(g + 20, 255);
    }
  }
  return out;
}

/**
 * Binariza o canal alpha para evitar pixels semitransparentes (A05)
 */
export function binarizeAlpha(rgba, threshold = 128) {
  const out = new Uint8Array(rgba);
  for (let i = 0; i < out.length; i += 4) {
    out[i + 3] = out[i + 3] >= threshold ? 255 : 0;
  }
  return out;
}

/**
 * Reduz imagem por razão inteira usando a cor mais frequente (MODA) de cada bloco
 */
export function downscaleNearestMode(rgba, srcW, srcH, targetW, targetH) {
  const blockW = Math.round(srcW / targetW);
  const blockH = Math.round(srcH / targetH);
  const out = new Uint8Array(targetW * targetH * 4);

  for (let ty = 0; ty < targetH; ty++) {
    for (let tx = 0; tx < targetW; tx++) {
      const colorCounts = new Map();
      const startX = tx * blockW;
      const startY = ty * blockH;
      const endX = Math.min(startX + blockW, srcW);
      const endY = Math.min(startY + blockH, srcH);

      let maxCount = 0;
      let dominantColor = [0, 0, 0, 0];

      for (let sy = startY; sy < endY; sy++) {
        for (let sx = startX; sx < endX; sx++) {
          const idx = (sy * srcW + sx) * 4;
          const a = rgba[idx + 3];
          if (a === 0) {
            const key = 'transparent';
            const count = (colorCounts.get(key) || 0) + 1;
            colorCounts.set(key, count);
            if (count > maxCount) {
              maxCount = count;
              dominantColor = [0, 0, 0, 0];
            }
            continue;
          }
          const r = rgba[idx + 0];
          const g = rgba[idx + 1];
          const b = rgba[idx + 2];
          const key = `${r},${g},${b},255`;
          const count = (colorCounts.get(key) || 0) + 1;
          colorCounts.set(key, count);
          if (count > maxCount) {
            maxCount = count;
            dominantColor = [r, g, b, 255];
          }
        }
      }

      const dstIdx = (ty * targetW + tx) * 4;
      out[dstIdx + 0] = dominantColor[0];
      out[dstIdx + 1] = dominantColor[1];
      out[dstIdx + 2] = dominantColor[2];
      out[dstIdx + 3] = dominantColor[3];
    }
  }

  return out;
}

/**
 * Quantiza as cores para uma paleta oficial usando CIELAB Delta E
 */
export function quantizeToPalette(rgba, paletteHexList) {
  const out = new Uint8Array(rgba);
  const labPalette = paletteHexList.map(hex => {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { hex, r, g, b, lab: rgbToLab(r, g, b) };
  });

  const cache = new Map();

  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue; // Transparente
    const r = out[i + 0];
    const g = out[i + 1];
    const b = out[i + 2];
    const key = `${r},${g},${b}`;

    let match = cache.get(key);
    if (!match) {
      const srcLab = rgbToLab(r, g, b);
      let minDistance = Infinity;
      for (const p of labPalette) {
        const dist = deltaE(srcLab, p.lab);
        if (dist < minDistance) {
          minDistance = dist;
          match = p;
        }
      }
      cache.set(key, match);
    }

    out[i + 0] = match.r;
    out[i + 1] = match.g;
    out[i + 2] = match.b;
    out[i + 3] = 255;
  }

  return out;
}

/**
 * Remove pixels isolados (órfãos sem vizinhos de mesma cor em 4-conectividade)
 */
export function removeOrphanPixels(rgba, width, height) {
  const out = new Uint8Array(rgba);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (out[idx + 3] === 0) continue;

      const r = out[idx + 0];
      const g = out[idx + 1];
      const b = out[idx + 2];

      const neighbors = [
        ((y - 1) * width + x) * 4,
        ((y + 1) * width + x) * 4,
        (y * width + (x - 1)) * 4,
        (y * width + (x + 1)) * 4,
      ];

      const matches = neighbors.filter(nIdx =>
        out[nIdx + 3] > 0 &&
        out[nIdx + 0] === r &&
        out[nIdx + 1] === g &&
        out[nIdx + 2] === b
      );

      if (matches.length === 0) {
        // Pixel órfão: se todos os vizinhos forem transparentes, apaga
        const opaqueNeighbors = neighbors.filter(nIdx => out[nIdx + 3] > 0);
        if (opaqueNeighbors.length === 0) {
          out[idx + 3] = 0;
        }
      }
    }
  }
  return out;
}

/**
 * Alinha o quadro em relação à base dos pés e centro horizontal
 */
export function alignFrame(frameRgba, frameW, frameH, targetBaselineY = null) {
  const out = new Uint8Array(frameW * frameH * 4);
  let minX = frameW, maxX = 0;
  let minY = frameH, maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const idx = (y * frameW + x) * 4;
      if (frameRgba[idx + 3] > 0) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) return new Uint8Array(frameRgba);

  const desiredBase = targetBaselineY ?? (frameH - 2);
  const dy = desiredBase - maxY;
  const currentCenterX = Math.round((minX + maxX) / 2);
  const targetCenterX = Math.floor(frameW / 2);
  const dx = targetCenterX - currentCenterX;

  for (let y = 0; y < frameH; y++) {
    const ny = y + dy;
    if (ny < 0 || ny >= frameH) continue;
    for (let x = 0; x < frameW; x++) {
      const nx = x + dx;
      if (nx < 0 || nx >= frameW) continue;
      const srcIdx = (y * frameW + x) * 4;
      const dstIdx = (ny * frameW + nx) * 4;
      out[dstIdx + 0] = frameRgba[srcIdx + 0];
      out[dstIdx + 1] = frameRgba[srcIdx + 1];
      out[dstIdx + 2] = frameRgba[srcIdx + 2];
      out[dstIdx + 3] = frameRgba[srcIdx + 3];
    }
  }

  return out;
}

/**
 * Transpõe as linhas e colunas de uma planilha
 */
export function transposeSheet(rgba, width, height, cellW, cellH) {
  const cols = Math.floor(width / cellW);
  const rows = Math.floor(height / cellH);
  const outW = rows * cellW;
  const outH = cols * cellH;
  const out = new Uint8Array(outW * outH * 4);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // célula na origem: (c, r) -> no destino: (r, c)
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const srcIdx = ((r * cellH + y) * width + (c * cellW + x)) * 4;
          const dstIdx = ((c * cellH + y) * outW + (r * cellW + x)) * 4;
          out[dstIdx + 0] = rgba[srcIdx + 0];
          out[dstIdx + 1] = rgba[srcIdx + 1];
          out[dstIdx + 2] = rgba[srcIdx + 2];
          out[dstIdx + 3] = rgba[srcIdx + 3];
        }
      }
    }
  }
  return { width: outW, height: outH, data: out };
}

/**
 * Pipeline completo de processamento de asset
 */
export function processAsset(inputBuf, options = {}) {
  const decoded = decodePng(inputBuf);
  let currentData = removeMagentaBackground(decoded.data, decoded.width, decoded.height, options.chromaTolerance);

  let targetW = options.targetWidth || decoded.width;
  let targetH = options.targetHeight || decoded.height;

  if (targetW !== decoded.width || targetH !== decoded.height) {
    currentData = downscaleNearestMode(currentData, decoded.width, decoded.height, targetW, targetH);
  }

  if (options.palette) {
    currentData = quantizeToPalette(currentData, options.palette);
  }

  currentData = binarizeAlpha(currentData);
  currentData = removeOrphanPixels(currentData, targetW, targetH);

  let finalWidth = targetW;
  let finalHeight = targetH;

  if (options.transpose && options.cellWidth && options.cellHeight) {
    const t = transposeSheet(currentData, targetW, targetH, options.cellWidth, options.cellHeight);
    currentData = t.data;
    finalWidth = t.width;
    finalHeight = t.height;
  }

  const encodedPng = encodePng(finalWidth, finalHeight, currentData);
  return { width: finalWidth, height: finalHeight, data: currentData, png: encodedPng };
}
