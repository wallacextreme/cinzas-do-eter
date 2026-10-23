/**
 * tools/art/ascii2png.mjs
 * Converte mapas de pixel em texto ASCII para PNG indexado/paletizado.
 * Útil para ícones 16x16, cursores, bordas de UI e pequenos retoques.
 */

import fs from 'node:fs';
import path from 'node:path';
import { encodePng } from '../qa/validate-assets.mjs';

/**
 * Mapeia caracteres para cores hexadecimais padrão da paleta
 */
export const DEFAULT_CHAR_MAP = {
  '.': null, // Transparente
  ' ': null, // Transparente
  '#': '#0A0612', // Preto do projeto (shadow_darkest)
  'O': '#4A2875', // Violeta escuro (contorno canônico)
  'o': '#6B3FA0', // Violeta médio
  'v': '#9B6DD7', // Violeta claro
  '*': '#FFE4A0', // Ouro highlight
  'A': '#E8C876', // Âmbar claro
  'a': '#D4A24E', // Âmbar médio
  '=': '#A67B2E', // Âmbar escuro
  'C': '#7DE8F0', // Cristal claro
  'c': '#4EC8D4', // Cristal médio
  '-': '#2E9AA5', // Cristal escuro
  'E': '#8B6B4A', // Terra claro
  'e': '#5C4433', // Terra médio
  'x': '#3A2B1F', // Terra escuro
  'W': '#F5F0E1', // Branco highlight
  'G': '#4A8B5C', // Verde vivo
  'g': '#2E5A3A', // Verde escuro
  'D': '#7A7A7A', // Cinza morto
  'd': '#4A4A4A', // Cinza cinzas
  'B': '#9B9286', // Cinza osso
  'R': '#C04040', // Vermelho HP
  'U': '#1A0F2E', // Fundo UI
  'P': '#2A1F3D', // Sombra roxa
};

/**
 * Converte string hex (#RRGGBB) para RGBA [r, g, b, a]
 */
export function hexToRgba(hex, alpha = 255) {
  if (!hex || hex === 'none' || hex === 'transparent') {
    return [0, 0, 0, 0];
  }
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b, alpha];
}

/**
 * Converte linhas de texto ASCII em buffer RGBA e PNG
 * @param {string[]|string} lines - Array de strings ou string multilinha
 * @param {Record<string, string>} [customCharMap] - Mapeamento char -> hex
 * @returns {{ width: number, height: number, data: Uint8Array, png: Uint8Array }}
 */
export function asciiToPng(lines, customCharMap = {}) {
  const charMap = { ...DEFAULT_CHAR_MAP, ...customCharMap };
  const rawLines = typeof lines === 'string'
    ? lines.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.length > 0)
    : lines;

  if (rawLines.length === 0) {
    throw new Error('Nenhuma linha fornecida para asciiToPng');
  }

  const height = rawLines.length;
  let width = 0;
  for (const row of rawLines) {
    if (row.length > width) width = row.length;
  }

  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const line = rawLines[y];
    for (let x = 0; x < width; x++) {
      const char = x < line.length ? line[x] : '.';
      const hex = charMap[char] ?? null;
      const [r, g, b, a] = hex ? hexToRgba(hex) : [0, 0, 0, 0];
      const idx = (y * width + x) * 4;
      data[idx + 0] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  const png = encodePng(width, height, data);
  return { width, height, data, png };
}

/**
 * Execução via CLI: node ascii2png.mjs <input.txt/json> <output.png>
 */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Uso: node tools/art/ascii2png.mjs <input.txt|json> <output.png>');
    process.exit(1);
  }
  const [inputFile, outputFile] = args;
  const content = fs.readFileSync(inputFile, 'utf8');
  let result;
  if (inputFile.endsWith('.json')) {
    const parsed = JSON.parse(content);
    result = asciiToPng(parsed.lines, parsed.charMap);
  } else {
    result = asciiToPng(content);
  }
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, Buffer.from(result.png));
  console.log(`[OK] PNG gerado: ${outputFile} (${result.width}x${result.height})`);
}
