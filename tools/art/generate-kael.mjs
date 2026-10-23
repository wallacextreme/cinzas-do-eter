/**
 * tools/art/generate-kael.mjs
 * Gerador procedural de pixel art oficial de Kaël (Lote L3 — Padrão de Qualidade).
 * 
 * Gera com precisão matemática em Paleta v2 oficial:
 * 1. public/assets/characters/char_kael_field_32x48.png (4x8 grid, 4 walk + 4 idle em 4 dirs)
 * 2. public/assets/characters/char_kael_battle_48x48.png (6x11 grid, 11 clipes canônicos)
 * 3. public/assets/portraits/portrait_kael_neutral_48x48.png
 * 4. public/assets/portraits/portrait_kael_serious_48x48.png
 * 5. public/assets/icons/icon_kael_16x16.png
 */

import fs from 'node:fs';
import path from 'node:path';
import { encodePng } from '../qa/validate-assets.mjs';

// Cores Oficiais da Paleta v2 (art/palette.json)
const C = {
  OUTLINE: '#1D1528',      // outline_dark
  HOOD_HI: '#B8936E',      // earth_pale
  HOOD_BASE: '#8B6B4A',    // earth_light
  HOOD_MID: '#5C4433',     // earth_mid
  HOOD_SHADOW: '#3A2B1F',  // earth_dark
  HOOD_DEEP: '#261B13',    // earth_deep
  WOOD_DARK: '#19110B',    // wood_darkest
  SKIN_HI: '#FFE8D1',      // skin_fair_hi
  SKIN_BASE: '#EBCBB0',    // skin_fair_base
  SKIN_SHADOW: '#C49E82',  // skin_fair_shadow
  HAIR: '#61391D',         // hair_dark_brown
  EYE: '#4A2875',          // violet_dark
  AMBER_HI: '#FFF1C5',     // gold_pale
  AMBER_LIGHT: '#FFE4A0',  // gold_highlight
  AMBER_BASE: '#E8C876',   // amber_light
  AMBER_MID: '#D4A24E',    // amber_mid
  STAFF_BONE: '#9B9286',   // gray_bone
  STAFF_HI: '#C4BEB3',     // gray_pale
  STAFF_CRYSTAL: '#4EC8D4',// crystal_mid
  WHITE: '#F5F0E1',        // white_highlight
  VIOLET_GLOW: '#9B6DD7',  // violet_light
  CRYSTAL_HI: '#7DE8F0',   // crystal_light
  FIRE_RED: '#FF7A59',     // fire_hi
  HP_RED: '#C04040',       // hp_red
};

export class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4); // RGBA
  }

  setPixel(x, y, hex) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const idx = (y * this.width + x) * 4;
    this.data[idx + 0] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = 255;
  }

  fillRect(x, y, w, h, hex) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setPixel(x + dx, y + dy, hex);
      }
    }
  }

  strokeRect(x, y, w, h, hex) {
    for (let dx = 0; dx < w; dx++) {
      this.setPixel(x + dx, y, hex);
      this.setPixel(x + dx, y + h - 1, hex);
    }
    for (let dy = 1; dy < h - 1; dy++) {
      this.setPixel(x, y + dy, hex);
      this.setPixel(x + w - 1, y + dy, hex);
    }
  }

  toBuffer() {
    return encodePng(this.width, this.height, this.data);
  }
}

/**
 * Garante que 100% dos pixels na fronteira entre opaco e transparente
 * usem estritamente a cor de contorno oficial C.OUTLINE (#1D1528).
 * Isso garante que A08_OUTLINE atinja >= 95% sem falhas.
 */
function enforceBoundaryOutline(cv, ox, oy, fw, fh) {
  const d = cv.data;
  const W = cv.width;
  const boundaryCoords = [];

  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const idx = ((oy + y) * W + (ox + x)) * 4;
      if (d[idx + 3] === 0) continue;

      const isBoundary =
        x === 0 || d[((oy + y) * W + (ox + x - 1)) * 4 + 3] === 0 ||
        x === fw - 1 || d[((oy + y) * W + (ox + x + 1)) * 4 + 3] === 0 ||
        y === 0 || d[((oy + y - 1) * W + (ox + x)) * 4 + 3] === 0 ||
        y === fh - 1 || d[((oy + y + 1) * W + (ox + x)) * 4 + 3] === 0;

      if (isBoundary) {
        boundaryCoords.push([x, y]);
      }
    }
  }

  for (const [x, y] of boundaryCoords) {
    cv.setPixel(ox + x, oy + y, C.OUTLINE);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GERAÇÃO DO SPRITESHEET DE CAMPO (32x48 por quadro, 4 cols x 8 rows)
// ─────────────────────────────────────────────────────────────────────────────
export function generateFieldSheet() {
  const fw = 32;
  const fh = 48;
  const cols = 4;
  const rows = 8;
  const canvas = new PixelCanvas(fw * cols, fh * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * fw;
      const oy = r * fh;
      drawFieldFrame(canvas, ox, oy, r, c);
      enforceBoundaryOutline(canvas, ox, oy, fw, fh);
    }
  }

  return canvas.toBuffer();
}

function drawFieldFrame(cv, ox, oy, row, col) {
  const isWalk = row < 4;
  const dir = row % 4; // 0: down, 1: left, 2: right, 3: up
  const frame = col;

  let legL_offset = 0;
  let legR_offset = 0;
  let cape_tilt = 0;
  let head_bob = 0;
  let eye_blink = false;

  if (isWalk) {
    if (frame === 0) { legL_offset = -2; legR_offset = 2; cape_tilt = -1; head_bob = 1; }
    else if (frame === 1) { legL_offset = 0; legR_offset = 0; cape_tilt = 0; head_bob = 0; }
    else if (frame === 2) { legL_offset = 2; legR_offset = -2; cape_tilt = 1; head_bob = 1; }
    else if (frame === 3) { legL_offset = 0; legR_offset = 0; cape_tilt = 0; head_bob = 0; }
  } else {
    // Idle diferenciado para cada um dos 4 quadros (evita A13_DUP)
    if (frame === 0) { head_bob = 0; cape_tilt = 0; }
    else if (frame === 1) { head_bob = -1; cape_tilt = 0; }
    else if (frame === 2) { head_bob = -1; cape_tilt = 1; }
    else if (frame === 3) { head_bob = 0; eye_blink = true; }
  }

  // 1. Capuz e Cabeça
  const hy = 6 + head_bob;
  cv.fillRect(ox + 10, oy + hy, 12, 14, C.HOOD_BASE);
  cv.fillRect(ox + 11, oy + hy, 5, 3, C.HOOD_HI);
  cv.fillRect(ox + 16, oy + hy + 4, 6, 9, C.HOOD_SHADOW);

  // 2. Túnica / Manto
  cv.fillRect(ox + 8 + cape_tilt, oy + 20, 16, 16, C.HOOD_BASE);
  cv.fillRect(ox + 8 + cape_tilt, oy + 28, 16, 2, C.HOOD_DEEP); // Cinto
  cv.setPixel(ox + 15 + cape_tilt, oy + 28, C.AMBER_LIGHT); // Fivela

  // 3. Rosto e Direção
  if (dir === 0) {
    // DOWN
    cv.fillRect(ox + 12, oy + hy + 5, 8, 7, C.SKIN_BASE);
    cv.fillRect(ox + 12, oy + hy + 5, 3, 3, C.SKIN_HI);
    cv.fillRect(ox + 16, oy + hy + 7, 4, 4, C.SKIN_SHADOW);
    if (!eye_blink) {
      cv.setPixel(ox + 13, oy + hy + 7, C.EYE);
      cv.setPixel(ox + 17, oy + hy + 7, C.EYE);
    } else {
      cv.setPixel(ox + 13, oy + hy + 8, C.SKIN_SHADOW);
      cv.setPixel(ox + 17, oy + hy + 8, C.SKIN_SHADOW);
    }
    // Pingente
    cv.fillRect(ox + 15, oy + 21 + head_bob, 2, 4, C.AMBER_BASE);
    cv.setPixel(ox + 15, oy + 21 + head_bob, C.AMBER_HI);
  } else if (dir === 1) {
    // LEFT
    cv.fillRect(ox + 11, oy + hy + 5, 5, 6, C.SKIN_BASE);
    if (!eye_blink) cv.setPixel(ox + 12, oy + hy + 7, C.EYE);
    // Bastão
    cv.fillRect(ox + 5, oy + 16, 2, 26, C.STAFF_BONE);
    cv.fillRect(ox + 4, oy + 14, 4, 3, C.AMBER_BASE);
    cv.setPixel(ox + 5, oy + 13, C.STAFF_CRYSTAL);
  } else if (dir === 2) {
    // RIGHT
    cv.fillRect(ox + 16, oy + hy + 5, 5, 6, C.SKIN_BASE);
    if (!eye_blink) cv.setPixel(ox + 19, oy + hy + 7, C.EYE);
    // Bastão
    cv.fillRect(ox + 25, oy + 16, 2, 26, C.STAFF_BONE);
    cv.fillRect(ox + 24, oy + 14, 4, 3, C.AMBER_BASE);
    cv.setPixel(ox + 25, oy + 13, C.STAFF_CRYSTAL);
  } else if (dir === 3) {
    // UP
    cv.fillRect(ox + 11, oy + hy + 2, 10, 11, C.HOOD_SHADOW);
    cv.fillRect(ox + 14, oy + hy + 2, 3, 11, C.HOOD_BASE);
  }

  // 4. Pernas e Botas (maxY estritamente fixado em y = 43)
  cv.fillRect(ox + 11, oy + 36, 4, 7, C.HOOD_SHADOW);
  cv.fillRect(ox + 17, oy + 36, 4, 7, C.HOOD_SHADOW);
  cv.fillRect(ox + 11, oy + 40 + Math.min(0, legL_offset), 4, 3, C.WOOD_DARK);
  cv.fillRect(ox + 17, oy + 40 + Math.min(0, legR_offset), 4, 3, C.WOOD_DARK);

  // Sola inferior fixa em y = 43 para manter spread = 0 no A11_BASELINE
  cv.fillRect(ox + 11, oy + 43, 4, 1, C.OUTLINE);
  cv.fillRect(ox + 17, oy + 43, 4, 1, C.OUTLINE);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GERAÇÃO DO SPRITESHEET DE BATALHA (48x48 por quadro, 6 cols x 11 rows)
// ─────────────────────────────────────────────────────────────────────────────
export const BATTLE_ROWS = [
  { name: 'idle', frames: 4, fps: 4 },
  { name: 'advance', frames: 4, fps: 8 },
  { name: 'attack', frames: 6, fps: 12 },
  { name: 'resonance', frames: 5, fps: 10 },
  { name: 'item', frames: 3, fps: 8 },
  { name: 'defend', frames: 2, fps: 6 },
  { name: 'damage', frames: 2, fps: 10 },
  { name: 'wounded', frames: 2, fps: 4 },
  { name: 'victory', frames: 4, fps: 6 },
  { name: 'defeat', frames: 3, fps: 4 },
  { name: 'flee', frames: 3, fps: 8 },
];

export function generateBattleSheet() {
  const fw = 48;
  const fh = 48;
  const cols = 6;
  const rows = 11;
  const canvas = new PixelCanvas(fw * cols, fh * rows);

  BATTLE_ROWS.forEach((clip, r) => {
    for (let c = 0; c < clip.frames; c++) {
      const ox = c * fw;
      const oy = r * fh;
      drawBattleFrame(canvas, ox, oy, clip.name, c);
      enforceBoundaryOutline(canvas, ox, oy, fw, fh);
    }
  });

  return canvas.toBuffer();
}

function drawBattleFrame(cv, ox, oy, clipName, frame) {
  let bx = 12;
  let by = 6;
  let staffAngle = 0;
  let glowSize = 0;
  let slashStage = 0;
  let itemStage = 0;
  let capeFlap = 0;
  let pendantGleam = 0;
  let eyeBlink = false;
  let isProne = false;

  switch (clipName) {
    case 'idle':
      // Respiração suave com centro de massa horizontal fixo (A12_DRIFT < 0.5px)
      if (frame === 0) { by = 6; pendantGleam = 0; capeFlap = 0; }
      else if (frame === 1) { by = 5; pendantGleam = 1; capeFlap = 0; }
      else if (frame === 2) { by = 5; pendantGleam = 2; capeFlap = 1; }
      else if (frame === 3) { by = 6; pendantGleam = 0; eyeBlink = true; capeFlap = 0; }
      break;
    case 'advance':
      bx += frame * 2;
      by += (frame % 2 === 1 ? -1 : 0);
      capeFlap = frame % 2;
      break;
    case 'attack':
      if (frame === 0) { bx -= 1; staffAngle = -1; }
      else if (frame === 1) { bx += 1; staffAngle = 0; }
      else if (frame === 2) { bx += 3; staffAngle = 1; slashStage = 1; }
      else if (frame === 3) { bx += 4; staffAngle = 2; slashStage = 2; }
      else if (frame === 4) { bx += 2; staffAngle = 1; }
      else if (frame === 5) { bx += 0; staffAngle = 0; }
      break;
    case 'resonance':
      if (frame === 0) { by = 6; glowSize = 0; }
      else if (frame === 1) { by = 5; glowSize = 1; staffAngle = 1; }
      else if (frame === 2) { by = 5; glowSize = 2; staffAngle = 1; }
      else if (frame === 3) { by = 5; glowSize = 3; staffAngle = 2; }
      else if (frame === 4) { by = 6; glowSize = 2; staffAngle = 1; pendantGleam = 2; }
      break;
    case 'item':
      if (frame === 0) { by = 6; itemStage = 1; }
      else if (frame === 1) { by = 5; itemStage = 2; }
      else if (frame === 2) { by = 6; itemStage = 3; }
      break;
    case 'defend':
      bx -= (frame === 0 ? 1 : 2);
      by += (frame === 0 ? 0 : 1);
      staffAngle = (frame === 0 ? -1 : -2);
      break;
    case 'damage':
      bx -= (frame === 0 ? 3 : 1);
      by += (frame === 0 ? -1 : 0);
      staffAngle = -1;
      break;
    case 'wounded':
      by += (frame === 0 ? 2 : 3);
      staffAngle = -1;
      capeFlap = frame;
      break;
    case 'victory':
      if (frame === 0) { by = 6; staffAngle = 0; }
      else if (frame === 1) { by = 5; staffAngle = 1; glowSize = 1; }
      else if (frame === 2) { by = 4; staffAngle = 2; glowSize = 2; }
      else if (frame === 3) { by = 5; staffAngle = 2; glowSize = 1; }
      break;
    case 'defeat':
      if (frame === 0) { bx -= 1; by += 1; staffAngle = -1; }
      else if (frame === 1) { bx -= 2; by += 2; staffAngle = -2; }
      else if (frame === 2) { bx -= 3; by += 2; isProne = true; }
      break;
    case 'flee':
      bx -= frame * 2;
      by += (frame % 2 === 1 ? -1 : 0);
      capeFlap = frame;
      break;
  }

  if (isProne) {
    // Postura caída (defeat quadro 2) - contida em y <= 44
    cv.fillRect(ox + bx + 4, oy + by + 26, 22, 10, C.HOOD_BASE);
    cv.fillRect(ox + bx + 6, oy + by + 27, 8, 4, C.HOOD_HI);
    cv.fillRect(ox + bx + 18, oy + by + 28, 7, 7, C.HOOD_SHADOW);
    cv.fillRect(ox + bx + 2, oy + by + 30, 6, 6, C.SKIN_BASE);
    cv.fillRect(ox + bx + 22, oy + by + 33, 6, 4, C.WOOD_DARK);
    // Bastão caído ao chão
    cv.fillRect(ox + bx + 10, oy + by + 34, 18, 2, C.STAFF_BONE);
    cv.setPixel(ox + bx + 9, oy + by + 34, C.AMBER_BASE);
    cv.setPixel(ox + bx + 8, oy + by + 34, C.STAFF_CRYSTAL);
    return;
  }

  // 1. Capuz / Cabeça (garantindo x >= 3 e x <= 44, y >= 2 e y <= 45)
  cv.fillRect(ox + bx + 3, oy + by, 14, 15, C.HOOD_BASE);
  cv.fillRect(ox + bx + 4, oy + by + 1, 5, 3, C.HOOD_HI);
  cv.fillRect(ox + bx + 10, oy + by + 4, 7, 10, C.HOOD_SHADOW);

  // Rosto 3/4
  cv.fillRect(ox + bx + 6, oy + by + 5, 8, 7, C.SKIN_BASE);
  cv.setPixel(ox + bx + 6, oy + by + 5, C.SKIN_HI);
  if (!eyeBlink) {
    cv.setPixel(ox + bx + 8, oy + by + 7, C.EYE);
  } else {
    cv.setPixel(ox + bx + 8, oy + by + 8, C.SKIN_SHADOW);
  }

  // Pingente
  cv.fillRect(ox + bx + 7, oy + by + 15, 3, 4, C.AMBER_BASE);
  cv.setPixel(ox + bx + 7, oy + by + 15, C.AMBER_HI);
  if (pendantGleam === 1) {
    cv.setPixel(ox + bx + 8, oy + by + 15, C.WHITE);
  } else if (pendantGleam === 2) {
    cv.setPixel(ox + bx + 8, oy + by + 16, C.AMBER_LIGHT);
  }

  // Manto / Tronco (com capa flutuante sutil)
  cv.fillRect(ox + bx + 1 - capeFlap, oy + by + 15, 17 + capeFlap, 16, C.HOOD_BASE);
  cv.fillRect(ox + bx + 1 - capeFlap, oy + by + 23, 17 + capeFlap, 2, C.HOOD_DEEP);
  cv.setPixel(ox + bx + 7, oy + by + 23, C.AMBER_LIGHT);

  // Botas (altura 6px, sempre com y_max <= 44)
  cv.fillRect(ox + bx + 3, oy + by + 31, 4, 6, C.WOOD_DARK);
  cv.fillRect(ox + bx + 11, oy + by + 31, 4, 6, C.WOOD_DARK);

  // 2. Bastão Sintonizado de Kaël (coordenadas locais dentro do quadro [0..47])
  const staffLocalX = Math.min(38, Math.max(16, bx + 18 + (staffAngle * 2)));
  const sx = ox + staffLocalX;
  const sy = oy + by + 6;
  cv.fillRect(sx, sy, 2, 28, C.STAFF_BONE);
  cv.fillRect(sx - 1, sy - 3, 4, 4, C.AMBER_BASE);
  cv.setPixel(sx, sy - 4, C.STAFF_CRYSTAL);

  // Efeito de Ressonância (âmbar e cristal centralizados no bastão)
  if (glowSize > 0) {
    const rW = Math.min(5, glowSize * 2);
    cv.fillRect(sx - rW, sy - 5, rW * 2 + 2, 2, C.AMBER_LIGHT);
    cv.fillRect(sx - glowSize, sy - 7, glowSize * 2 + 1, 2, C.CRYSTAL_HI);
  }

  // Efeito de Ataque (Corte semicircular)
  if (slashStage === 1) {
    cv.fillRect(Math.min(ox + 43, sx + 2), sy + 4, 3, 2, C.AMBER_LIGHT);
  } else if (slashStage === 2) {
    cv.fillRect(Math.min(ox + 42, sx + 2), sy + 4, 4, 2, C.WHITE);
    cv.fillRect(Math.min(ox + 42, sx + 3), sy + 7, 3, 2, C.AMBER_HI);
  }

  // Efeito de Item
  if (itemStage === 2) {
    cv.fillRect(ox + bx + 16, oy + by + 12, 3, 4, C.CRYSTAL_HI);
  } else if (itemStage === 3) {
    cv.fillRect(ox + bx + 15, oy + by + 10, 5, 2, C.AMBER_LIGHT);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GERAÇÃO DOS RETRATOS DE KAËL (48x48)
// ─────────────────────────────────────────────────────────────────────────────
export function generatePortrait(variant = 'neutral') {
  const size = 48;
  const cv = new PixelCanvas(size, size);

  // Capuz / Manto
  cv.fillRect(11, 5, 26, 38, C.HOOD_BASE);
  cv.fillRect(12, 6, 10, 6, C.HOOD_HI);
  cv.fillRect(24, 8, 12, 34, C.HOOD_SHADOW);

  // Rosto em destaque (busto 3/4)
  cv.fillRect(16, 12, 16, 18, C.SKIN_BASE);
  cv.fillRect(16, 12, 8, 8, C.SKIN_HI);
  cv.fillRect(24, 16, 8, 14, C.SKIN_SHADOW);

  // Cabelo castanho sob o capuz
  cv.fillRect(15, 10, 18, 4, C.HAIR);
  cv.fillRect(15, 13, 3, 6, C.HAIR);

  // Olhos violeta e sobrancelha determinada
  cv.fillRect(18, 18, 3, 2, C.EYE);
  cv.fillRect(26, 18, 3, 2, C.EYE);
  cv.fillRect(17, 16, 5, 1, C.WOOD_DARK);
  cv.fillRect(25, 16, 5, 1, C.WOOD_DARK);

  // Nariz e boca
  cv.setPixel(22, 22, C.SKIN_SHADOW);
  cv.fillRect(20, 26, 5, 1, variant === 'serious' ? C.WOOD_DARK : C.SKIN_SHADOW);

  // Pingente de Âmbar no peito
  cv.fillRect(21, 34, 6, 8, C.AMBER_BASE);
  cv.fillRect(22, 35, 4, 6, C.AMBER_LIGHT);
  cv.setPixel(23, 36, C.AMBER_HI);

  if (variant === 'serious') {
    cv.setPixel(20, 14, C.HAIR);
    cv.setPixel(21, 15, C.HAIR);
    cv.fillRect(22, 36, 2, 4, C.AMBER_HI);
  }

  enforceBoundaryOutline(cv, 0, 0, size, size);
  return cv.toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GERAÇÃO DO ÍCONE DE KAËL (16x16)
// ─────────────────────────────────────────────────────────────────────────────
export function generateIcon() {
  const size = 16;
  const cv = new PixelCanvas(size, size);

  // Capuz
  cv.fillRect(3, 2, 10, 12, C.HOOD_BASE);
  cv.fillRect(4, 2, 4, 3, C.HOOD_HI);
  cv.fillRect(9, 3, 4, 11, C.HOOD_SHADOW);

  // Rosto
  cv.fillRect(5, 5, 6, 6, C.SKIN_BASE);
  cv.setPixel(5, 5, C.SKIN_HI);
  cv.setPixel(6, 7, C.EYE);
  cv.setPixel(9, 7, C.EYE);

  // Pingente
  cv.fillRect(7, 12, 2, 2, C.AMBER_BASE);
  cv.setPixel(7, 12, C.AMBER_HI);

  enforceBoundaryOutline(cv, 0, 0, size, size);
  return cv.toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT EXECUTÁVEL
// ─────────────────────────────────────────────────────────────────────────────
export async function buildAllKaelAssets() {
  const publicDir = 'public/assets';
  const charDir = path.join(publicDir, 'characters');
  const portDir = path.join(publicDir, 'portraits');
  const iconDir = path.join(publicDir, 'icons');

  fs.mkdirSync(charDir, { recursive: true });
  fs.mkdirSync(portDir, { recursive: true });
  fs.mkdirSync(iconDir, { recursive: true });

  console.log('[GenerateKael] Gerando char_kael_field_32x48.png...');
  fs.writeFileSync(path.join(charDir, 'char_kael_field_32x48.png'), generateFieldSheet());

  console.log('[GenerateKael] Gerando char_kael_battle_48x48.png...');
  fs.writeFileSync(path.join(charDir, 'char_kael_battle_48x48.png'), generateBattleSheet());

  console.log('[GenerateKael] Gerando portrait_kael_neutral_48x48.png...');
  fs.writeFileSync(path.join(portDir, 'portrait_kael_neutral_48x48.png'), generatePortrait('neutral'));

  console.log('[GenerateKael] Gerando portrait_kael_serious_48x48.png...');
  fs.writeFileSync(path.join(portDir, 'portrait_kael_serious_48x48.png'), generatePortrait('serious'));

  console.log('[GenerateKael] Gerando icon_kael_16x16.png...');
  fs.writeFileSync(path.join(iconDir, 'icon_kael_16x16.png'), generateIcon());

  console.log('[GenerateKael] Todos os 5 assets de Kaël gerados com sucesso!');
}

if (process.argv[1] && process.argv[1].endsWith('generate-kael.mjs')) {
  buildAllKaelAssets().catch(err => {
    console.error('[GenerateKael] Erro fatal:', err);
    process.exit(1);
  });
}
