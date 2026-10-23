import { describe, it, expect } from 'vitest';
import { asciiToPng } from '../../tools/art/ascii2png.mjs';
import { createSolidTile, generateTransitionTile, generateAutotileSet, TRANSITIONS } from '../../tools/art/autotile.mjs';
import {
  rgbToLab,
  deltaE,
  removeMagentaBackground,
  binarizeAlpha,
  downscaleNearestMode,
  quantizeToPalette,
  removeOrphanPixels,
  transposeSheet,
} from '../../tools/art/process.mjs';
import { decodePng } from '../../tools/qa/validate-assets.mjs';

describe('tools/art/ascii2png.mjs', () => {
  it('converte string ASCII simples em PNG com dimensões corretas', () => {
    const ascii = [
      '....',
      '.##.',
      '.##.',
      '....',
    ];
    const res = asciiToPng(ascii);
    expect(res.width).toBe(4);
    expect(res.height).toBe(4);
    expect(res.data.length).toBe(4 * 4 * 4);
    expect(res.png).toBeInstanceOf(Uint8Array);

    const decoded = decodePng(res.png);
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(4);
  });

  it('mapeia pontos para transparente e caracteres para cores hexadecimais', () => {
    const ascii = '.A';
    const res = asciiToPng(ascii);
    // pixel 0: transparente
    expect(res.data[3]).toBe(0);
    // pixel 1: A = #E8C876 (r=232, g=200, b=118, a=255)
    expect(res.data[4]).toBe(232);
    expect(res.data[5]).toBe(200);
    expect(res.data[6]).toBe(118);
    expect(res.data[7]).toBe(255);
  });

  it('suporta mapa customizado de caracteres', () => {
    const ascii = 'X';
    const res = asciiToPng(ascii, { 'X': '#C04040' });
    expect(res.data[0]).toBe(192);
    expect(res.data[1]).toBe(64);
    expect(res.data[2]).toBe(64);
    expect(res.data[3]).toBe(255);
  });
});

describe('tools/art/autotile.mjs', () => {
  it('cria tile sólido com dimensões esperadas', () => {
    const tile = createSolidTile('#4A8B5C', 16);
    expect(tile.width).toBe(16);
    expect(tile.height).toBe(16);
    expect(tile.data.length).toBe(16 * 16 * 4);
    expect(tile.data[0]).toBe(0x4A);
    expect(tile.data[1]).toBe(0x8B);
    expect(tile.data[2]).toBe(0x5C);
    expect(tile.data[3]).toBe(255);
  });

  it('gera transição entre Tile A e Tile B com linha de sombra', () => {
    const tileA = createSolidTile('#4A8B5C', 16);
    const tileB = createSolidTile('#5C4433', 16);
    const edgeN = generateTransitionTile(tileA.data, tileB.data, 'EDGE_N', {
      shadowColorHex: '#3A2B1F',
    });
    expect(edgeN.length).toBe(16 * 16 * 4);
    // Top pixel deve ter cor do Tile B ou sombra
    expect(edgeN[3]).toBe(255);
  });

  it('gera conjunto de autotile completo com todas as transições canônicas', () => {
    const tileA = createSolidTile('#4A8B5C', 16);
    const tileB = createSolidTile('#5C4433', 16);
    const set = generateAutotileSet(tileA.data, tileB.data);
    expect(set.width).toBe(4 * 16); // 4 colunas
    expect(set.height).toBe(Math.ceil(TRANSITIONS.length / 4) * 16);
    expect(set.png).toBeInstanceOf(Uint8Array);
    const decoded = decodePng(set.png);
    expect(decoded.width).toBe(set.width);
    expect(decoded.height).toBe(set.height);
  });
});

describe('tools/art/process.mjs', () => {
  it('converte sRGB para CIELAB e calcula deltaE corretamente', () => {
    const labBlack = rgbToLab(0, 0, 0);
    const labWhite = rgbToLab(255, 255, 255);
    expect(labBlack[0]).toBeCloseTo(0, 1);
    expect(labWhite[0]).toBeCloseTo(100, 1);
    const dist = deltaE(labBlack, labWhite);
    expect(dist).toBeGreaterThan(90);
  });

  it('remove fundo magenta e binariza alpha', () => {
    // 2x1 imagem: pixel 0 magenta (#FF00FF), pixel 1 verde (#4A8B5C)
    const buf = new Uint8Array([
      255, 0, 255, 255,
      0x4A, 0x8B, 0x5C, 255,
    ]);
    const keyed = removeMagentaBackground(buf, 2, 1);
    expect(keyed[3]).toBe(0); // Magenta transparente
    expect(keyed[7]).toBe(255); // Verde intacto

    // Binarização
    const semi = new Uint8Array([10, 20, 30, 120, 10, 20, 30, 200]);
    const bin = binarizeAlpha(semi);
    expect(bin[3]).toBe(0);
    expect(bin[7]).toBe(255);
  });

  it('reduz escala por moda da cor do bloco', () => {
    // Bloco 2x2: 3 pixels vermelhos e 1 azul -> moda deve ser vermelho
    const src = new Uint8Array([
      255, 0, 0, 255,   255, 0, 0, 255,
      255, 0, 0, 255,   0, 0, 255, 255,
    ]);
    const down = downscaleNearestMode(src, 2, 2, 1, 1);
    expect(down[0]).toBe(255);
    expect(down[1]).toBe(0);
    expect(down[2]).toBe(0);
    expect(down[3]).toBe(255);
  });

  it('quantiza para paleta oficial via CIELAB', () => {
    const palette = ['#E8C876', '#4A2875', '#0A0612'];
    // Amarelo próximo de amber_light (#E8C876)
    const src = new Uint8Array([230, 200, 120, 255]);
    const quant = quantizeToPalette(src, palette);
    expect(quant[0]).toBe(0xE8);
    expect(quant[1]).toBe(0xC8);
    expect(quant[2]).toBe(0x76);
  });

  it('remove pixels órfãos cercados por transparência', () => {
    // 3x3 com 1 pixel no centro e vizinhos transparentes
    const src = new Uint8Array(3 * 3 * 4);
    const centerIdx = (1 * 3 + 1) * 4;
    src[centerIdx + 0] = 255;
    src[centerIdx + 1] = 255;
    src[centerIdx + 2] = 255;
    src[centerIdx + 3] = 255;

    const cleaned = removeOrphanPixels(src, 3, 3);
    expect(cleaned[centerIdx + 3]).toBe(0); // Órfão apagado
  });

  it('transpõe linhas e colunas de spritesheet', () => {
    // 2 colunas x 1 linha de células 2x2 (largura 4, altura 2)
    // Célula 0 (esquerda): vermelha; Célula 1 (direita): azul
    const src = new Uint8Array(4 * 2 * 4);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const idx = (y * 4 + x) * 4;
        src[idx] = 255; src[idx + 3] = 255; // Vermelho
      }
      for (let x = 2; x < 4; x++) {
        const idx = (y * 4 + x) * 4;
        src[idx + 2] = 255; src[idx + 3] = 255; // Azul
      }
    }
    const transposed = transposeSheet(src, 4, 2, 2, 2);
    // Após transposição: 1 coluna x 2 linhas (largura 2, altura 4)
    expect(transposed.width).toBe(2);
    expect(transposed.height).toBe(4);
    // Célula 0 no topo (vermelha)
    expect(transposed.data[0]).toBe(255);
    // Célula 1 abaixo (azul)
    const cell1Idx = (2 * 2 + 0) * 4;
    expect(transposed.data[cell1Idx + 2]).toBe(255);
  });
});
