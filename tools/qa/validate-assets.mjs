#!/usr/bin/env node
/**
 * validate-assets.mjs — Validador automático de arte (QA v2, camada F)
 * Cinzas do Éter
 *
 * Zero dependências. Node >= 18 (funciona também com Bun).
 * Transforma o "Checklist de Validação de Assets" do STYLE_GUIDE/ART_PIPELINE
 * (antes 100% manual) em verificações objetivas, repetíveis e impossíveis de
 * "auto-aprovar": um agente não consegue declarar PASS sem que o script concorde.
 *
 * USO
 *   node tools/qa/validate-assets.mjs                 valida o projeto (modo vem do manifesto)
 *   node tools/qa/validate-assets.mjs --strict        força o modo ESTRITO
 *   node tools/qa/validate-assets.mjs --dist          também varre dist/ por formatos proibidos
 *   node tools/qa/validate-assets.mjs --json          saída JSON
 *   node tools/qa/validate-assets.mjs --report        grava qa/reports/art-validation-latest.{json,md}
 *   node tools/qa/validate-assets.mjs --self-test     "QA do QA": prova que os defeitos são detectados
 *   node tools/qa/validate-assets.mjs --list          lista os códigos de verificação
 *   node tools/qa/validate-assets.mjs --root <pasta>  raiz do projeto (padrão: cwd)
 *
 * Saída: código 0 = sem erros | 1 = erros de validação | 2 = falha interna/configuração
 *
 * QA_LOCK: este arquivo e art/art-rules.json só podem ser alterados pelo usuário.
 */
import {
  readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync,
} from 'node:fs';
import { join, relative, extname, basename, resolve, dirname, sep } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

// ════════════════════════════════════════════════════════════════════
// Catálogo de verificações
// ════════════════════════════════════════════════════════════════════
export const CHECKS = {
  A00_CONFIG: 'arquivos de configuração (art-rules, palette, manifesto) presentes e válidos',
  A01_FORMAT: 'somente PNG sem perda (JPEG/WebP/GIF/BMP proibidos)',
  A02_DECODE: 'PNG legível e não entrelaçado',
  A03_NAME: 'nome [tipo]_[nome]_[LxA].png em minúsculas; sufixo = tamanho do quadro',
  A04_DIMENSIONS: 'dimensões múltiplas do quadro / grid declarado / tamanho exato (bg) / máx. 2048',
  A05_ALPHA: 'alpha binário (sem anti-aliasing) salvo softAlpha declarado',
  A06_PALETTE: '100% dos pixels opacos na paleta; preto/branco puro proibidos',
  A07_COLOR_BUDGET: 'cores únicas ≤ orçamento do tipo',
  A08_OUTLINE: '≥ 80% dos pixels de borda na cor de contorno (personagens, inimigos, retratos)',
  A09_FRAMES: 'quadros declarados não vazios; fora de "frames" vazios; "rows" obrigatório',
  A10_CLIP: 'pixels encostando na borda do quadro (risco de corte)',
  A11_BASELINE: 'pés estáveis (±1 px) em linhas walk/run/idle',
  A12_DRIFT: 'centro de massa horizontal estável entre quadros',
  A13_DUP: 'quadros adjacentes idênticos',
  A14_JUMP: 'mudança brusca entre quadros adjacentes (possível redesenho incoerente)',
  A15_TRACE: 'origin/source/promptRef/generator/evidence coerentes; APPROVED exige evidência',
  A16_ORPHAN: 'PNG em public/assets fora do manifesto',
  A17_MISSING: 'entrada do manifesto sem arquivo',
  A18_SIZE: 'orçamento de tamanho (arquivo e pasta)',
  A19_LEGACY: 'imagem não-PNG (JPG/WebP/...) em public/ ou dist/',
  A20_MANIFEST: 'esquema do manifesto (campos obrigatórios, ids únicos, tipos válidos)',
};

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif', '.tif', '.tiff']);
const ORIGINS = new Set(['ai-processed', 'procedural', 'hand']);
const STATUSES = new Set(['DRAFT', 'IN_REVIEW', 'APPROVED']);

// ════════════════════════════════════════════════════════════════════
// Formato de arquivo + codec PNG (sem dependências)
// ════════════════════════════════════════════════════════════════════
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function detectFormat(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIG)) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.toString('latin1', 0, 6))) return 'gif';
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp';
  return 'unknown';
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Decodifica PNG (não entrelaçado, qualquer tipo de cor/profundidade) para RGBA 8 bits. */
export function decodePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('assinatura PNG inválida');
  let pos = 8;
  let ihdr = null;
  let plte = null;
  let trns = null;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const start = pos + 8;
    if (start + len > buf.length) throw new Error('chunk PNG truncado');
    const data = buf.subarray(start, start + len);
    pos = start + len + 4; // + CRC
    if (type === 'IHDR') {
      ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], ctype: data[9], interlace: data[12] };
    } else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (!ihdr) throw new Error('PNG sem IHDR');
  if (ihdr.interlace !== 0) throw new Error('PNG entrelaçado (Adam7) não suportado — reexporte sem entrelaçamento');
  const { w, h, depth, ctype } = ihdr;
  const channels = CHANNELS[ctype];
  if (!channels) throw new Error(`tipo de cor PNG inválido (${ctype})`);
  if (![1, 2, 4, 8, 16].includes(depth)) throw new Error(`profundidade PNG inválida (${depth})`);
  if (w === 0 || h === 0) throw new Error('PNG com dimensão zero');
  if (idat.length === 0) throw new Error('PNG sem dados de imagem (IDAT)');

  const bpp = channels * depth;
  const stride = Math.ceil((w * bpp) / 8);
  const bytesPP = Math.max(1, bpp >> 3);
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length < (stride + 1) * h) throw new Error('dados PNG truncados');

  // 1) desfiltrar
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[rowIn + i];
      const a = i >= bytesPP ? px[rowOut + i - bytesPP] : 0;
      const b = y > 0 ? px[rowOut - stride + i] : 0;
      const c = y > 0 && i >= bytesPP ? px[rowOut - stride + i - bytesPP] : 0;
      let v;
      switch (ft) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: v = x + paeth(a, b, c); break;
        default: throw new Error(`filtro PNG inválido (${ft})`);
      }
      px[rowOut + i] = v & 0xff;
    }
  }

  // 2) converter para RGBA 8 bits
  const maxv = (1 << depth) - 1;
  const get = depth === 8
    ? (ro, i) => px[ro + i]
    : depth === 16
      ? (ro, i) => (px[ro + i * 2] << 8) | px[ro + i * 2 + 1]
      : (ro, i) => { const bit = i * depth; return (px[ro + (bit >> 3)] >> (8 - depth - (bit & 7))) & maxv; };
  const to8 = (v) => (depth === 8 ? v : depth === 16 ? v >> 8 : Math.round((v * 255) / maxv));
  const keyGray = ctype === 0 && trns && trns.length >= 2 ? trns.readUInt16BE(0) : -1;
  const keyRgb = ctype === 2 && trns && trns.length >= 6
    ? [trns.readUInt16BE(0), trns.readUInt16BE(2), trns.readUInt16BE(4)] : null;

  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const ro = y * stride;
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      let r; let g; let b; let a = 255;
      if (ctype === 6) {
        r = to8(get(ro, x * 4)); g = to8(get(ro, x * 4 + 1)); b = to8(get(ro, x * 4 + 2)); a = to8(get(ro, x * 4 + 3));
      } else if (ctype === 2) {
        const rr = get(ro, x * 3); const gg = get(ro, x * 3 + 1); const bb = get(ro, x * 3 + 2);
        r = to8(rr); g = to8(gg); b = to8(bb);
        if (keyRgb && rr === keyRgb[0] && gg === keyRgb[1] && bb === keyRgb[2]) a = 0;
      } else if (ctype === 0) {
        const v = get(ro, x);
        r = g = b = to8(v);
        if (v === keyGray) a = 0;
      } else if (ctype === 4) {
        r = g = b = to8(get(ro, x * 2)); a = to8(get(ro, x * 2 + 1));
      } else {
        const idx = get(ro, x);
        if (!plte || idx * 3 + 2 >= plte.length) throw new Error('índice de paleta PNG inválido');
        r = plte[idx * 3]; g = plte[idx * 3 + 1]; b = plte[idx * 3 + 2];
        if (trns && idx < trns.length) a = trns[idx];
      }
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
    }
  }
  return { width: w, height: h, data: out };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Codifica RGBA 8 bits em PNG (tipo 6, sem entrelaçamento). */
export function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIG, pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}

// ════════════════════════════════════════════════════════════════════
// Utilitários
// ════════════════════════════════════════════════════════════════════
const hexToInt = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`cor inválida: ${hex}`);
  return parseInt(m[1], 16);
};
const intToHex = (n) => `#${n.toString(16).padStart(6, '0').toUpperCase()}`;
const norm = (p) => p.split(sep).join('/');

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function readJson(path, label) {
  if (!existsSync(path)) throw new Error(`${label} não encontrado: ${path} (instale o kit de QA 10/10)`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`${label} com JSON inválido: ${e.message}`);
  }
}

function cellStats(img, fw, fh, cx, cy) {
  const W = img.width;
  const d = img.data;
  let opaque = 0; let minX = fw; let maxX = -1; let minY = fh; let maxY = -1; let sumX = 0; let edge = false;
  for (let y = 0; y < fh; y++) {
    const rowBase = ((cy * fh + y) * W + cx * fw) * 4;
    for (let x = 0; x < fw; x++) {
      if (d[rowBase + x * 4 + 3] === 0) continue;
      opaque++;
      sumX += x;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === fw - 1 || y === fh - 1) edge = true;
    }
  }
  return { opaque, minX, maxX, minY, maxY, cx: opaque ? sumX / opaque : 0, edge };
}

/** Fração de pixels (sobre a união de opacos) que diferem entre dois quadros. */
function frameDiff(img, fw, fh, a, b) {
  const W = img.width;
  const d = img.data;
  let union = 0; let diff = 0;
  for (let y = 0; y < fh; y++) {
    const ia0 = ((a[1] * fh + y) * W + a[0] * fw) * 4;
    const ib0 = ((b[1] * fh + y) * W + b[0] * fw) * 4;
    for (let x = 0; x < fw; x++) {
      const ia = ia0 + x * 4; const ib = ib0 + x * 4;
      const oa = d[ia + 3] > 0; const ob = d[ib + 3] > 0;
      if (!oa && !ob) continue;
      union++;
      if (oa !== ob || d[ia] !== d[ib] || d[ia + 1] !== d[ib + 1] || d[ia + 2] !== d[ib + 2]) diff++;
    }
  }
  return union ? diff / union : 0;
}

function boundaryStats(img, fw, fh, cols, rowsN, outlineSet) {
  const W = img.width;
  const d = img.data;
  let boundary = 0; let outlined = 0;
  const alphaAt = (cx, cy, x, y) => (x < 0 || y < 0 || x >= fw || y >= fh ? 0 : d[(((cy * fh + y) * W) + cx * fw + x) * 4 + 3]);
  for (let cy = 0; cy < rowsN; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          if (alphaAt(cx, cy, x, y) === 0) continue;
          if (alphaAt(cx, cy, x - 1, y) === 0 || alphaAt(cx, cy, x + 1, y) === 0
            || alphaAt(cx, cy, x, y - 1) === 0 || alphaAt(cx, cy, x, y + 1) === 0) {
            boundary++;
            const i = (((cy * fh + y) * W) + cx * fw + x) * 4;
            if (outlineSet.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) outlined++;
          }
        }
      }
    }
  }
  return { boundary, outlined };
}

// ════════════════════════════════════════════════════════════════════
// Validação de UM asset (em memória — usada pelo projeto e pelo self-test)
// ════════════════════════════════════════════════════════════════════
export function validateAssetBuffer({ entry, buffer, fileName, rules, palette }) {
  const findings = [];
  const add = (code, level, message) => findings.push({ code, level, message });
  const addList = (code, level, headline, list) => {
    if (!list.length) return;
    const shown = list.slice(0, 6).join('; ');
    add(code, level, `${headline}: ${shown}${list.length > 6 ? ` … (+${list.length - 6})` : ''}`);
  };
  const meta = {};
  const typeRules = rules.types[entry.type];
  if (!typeRules) {
    add('A20_MANIFEST', 'error', `tipo desconhecido "${entry.type}" (válidos: ${Object.keys(rules.types).join(', ')})`);
    return { findings, meta };
  }
  const th = rules.thresholds;

  // A01 — formato
  const fmt = detectFormat(buffer);
  if (fmt !== 'png') {
    add('A01_FORMAT', 'error', `formato proibido: ${fmt.toUpperCase()} — use PNG sem perda (JPEG gera ruído de compressão e quebra a paleta)`);
    return { findings, meta };
  }
  const ext = extname(fileName).toLowerCase();
  if (ext !== '.png') add('A01_FORMAT', 'error', `extensão "${ext}" — arquivos PNG devem terminar em .png`);

  // A02 — decodificação
  let img;
  try {
    img = decodePng(buffer);
  } catch (e) {
    add('A02_DECODE', 'error', `PNG ilegível: ${e.message}`);
    return { findings, meta };
  }
  const W = img.width;
  const H = img.height;
  meta.width = W; meta.height = H;

  const frame = entry.frame ?? typeRules.frame ?? null;
  const fw = frame ? frame[0] : W;
  const fh = frame ? frame[1] : H;
  meta.frame = [fw, fh];

  // A03 — nome
  const base = basename(fileName);
  const m = /^([a-z]+)_([a-z0-9]+(?:_[a-z0-9]+)*)_(\d+)x(\d+)\.png$/.exec(base);
  if (!m) {
    add('A03_NAME', 'error', `nome "${base}" fora do padrão [tipo]_[nome]_[variante]_[LxA].png (minúsculas, snake_case)`);
  } else {
    if (m[1] !== entry.type) add('A03_NAME', 'error', `prefixo "${m[1]}" ≠ tipo do manifesto "${entry.type}"`);
    const sx = Number(m[3]); const sy = Number(m[4]);
    const ex = frame ? fw : W; const ey = frame ? fh : H;
    if (sx !== ex || sy !== ey) {
      add('A03_NAME', 'error', `sufixo ${sx}x${sy} ≠ ${frame ? 'tamanho do quadro' : 'tamanho da imagem'} ${ex}x${ey}`);
    }
  }

  // A04 — dimensões
  let dimsOk = true;
  const maxDim = th.maxImageDimension;
  if (W > maxDim || H > maxDim) {
    add('A04_DIMENSIONS', 'error', `imagem ${W}x${H} excede ${maxDim}px por lado (limite de GPU/atlas)`);
    dimsOk = false;
  }
  const size = entry.size ?? typeRules.size ?? null;
  if (size && (W !== size[0] || H !== size[1])) {
    add('A04_DIMENSIONS', 'error', `tamanho ${W}x${H} ≠ esperado ${size[0]}x${size[1]} para tipo "${entry.type}"`);
    dimsOk = false;
  }
  if (frame && (W % fw !== 0 || H % fh !== 0)) {
    add('A04_DIMENSIONS', 'error', `${W}x${H} não é múltiplo do quadro ${fw}x${fh}`);
    dimsOk = false;
  }
  const cols = Math.floor(W / fw);
  const nrows = Math.floor(H / fh);
  meta.cols = cols; meta.rows = nrows;
  if (frame && entry.grid && dimsOk && (entry.grid[0] !== cols || entry.grid[1] !== nrows)) {
    add('A04_DIMENSIONS', 'error', `grid declarado ${entry.grid[0]}x${entry.grid[1]} ≠ real ${cols}x${nrows}`);
    dimsOk = false;
  }
  if (!dimsOk) return { findings, meta };

  // A18 — tamanho do arquivo
  if (buffer.length / 1024 > th.maxFileKB) {
    add('A18_SIZE', 'warn', `arquivo com ${(buffer.length / 1024).toFixed(0)} KB > ${th.maxFileKB} KB`);
  }

  // Coleta de cores / alpha
  const d = img.data;
  const counts = new Map();
  let semi = 0; let firstSemi = null;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const a = d[i + 3];
    if (a === 0) continue;
    if (a < 255) { semi++; if (!firstSemi) firstSemi = [p % W, Math.floor(p / W)]; }
    const c = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  meta.uniqueColors = counts.size;

  // A05 — alpha binário
  const softAlpha = entry.softAlpha ?? false;
  if (semi > 0 && !softAlpha) {
    add('A05_ALPHA', 'error', `${semi} pixel(s) semitransparente(s) (ex.: x=${firstSemi[0]}, y=${firstSemi[1]}) — alpha deve ser 0 ou 255 (sem anti-aliasing)`);
  }

  // A06 — paleta
  const palSet = new Set(Object.values(palette.colors).map(hexToInt));
  const off = [...counts].filter(([c]) => !palSet.has(c));
  if (off.length) {
    const total = off.reduce((s, [, n]) => s + n, 0);
    const top = off.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => `${intToHex(c)}×${n}`).join(', ');
    let hint = '';
    for (const [hex, msg] of Object.entries(palette.forbidden ?? {})) {
      if (counts.has(hexToInt(hex))) hint += ` | ${hex}: ${msg}`;
    }
    add('A06_PALETTE', 'error', `${off.length} cor(es) fora da paleta (${total} px). Top: ${top}${hint}`);
  }

  // A07 — orçamento de cores
  const maxColors = entry.maxColors ?? typeRules.maxColors;
  if (maxColors && counts.size > maxColors) {
    add('A07_COLOR_BUDGET', 'error', `${counts.size} cores únicas > orçamento ${maxColors} para "${entry.type}"`);
  }

  // A08 — contorno
  if (typeRules.outline) {
    const outlineList = entry.outline ?? palette.outline ?? [];
    const outlineSet = new Set(outlineList.map(hexToInt));
    const { boundary, outlined } = boundaryStats(img, fw, fh, cols, nrows, outlineSet);
    const ratio = boundary ? outlined / boundary : 1;
    meta.outlineRatio = Number(ratio.toFixed(3));
    if (boundary && ratio < th.outlineBoundaryRatio) {
      add('A08_OUTLINE', 'error', `só ${(ratio * 100).toFixed(1)}% dos pixels de borda usam o contorno [${outlineList.join(', ')}] (mínimo ${(th.outlineBoundaryRatio * 100).toFixed(0)}%)`);
    }
  }

  // A09..A14 — quadros / animação
  const rowsDecl = Array.isArray(entry.rows) ? entry.rows : null;
  if (typeRules.requireRows && !rowsDecl) {
    add('A09_FRAMES', 'error', 'manifesto sem "rows" (nome/quadros/fps por linha) — obrigatório para este tipo');
  }
  if (rowsDecl && frame) {
    const stats = [];
    for (let r = 0; r < nrows; r++) {
      stats[r] = [];
      for (let c = 0; c < cols; c++) stats[r][c] = cellStats(img, fw, fh, c, r);
    }
    if (rowsDecl.length > nrows) add('A20_MANIFEST', 'error', `"rows" declara ${rowsDecl.length} linhas, mas a imagem tem ${nrows}`);

    const empty = []; const stray = []; const undeclared = [];
    for (let r = 0; r < nrows; r++) {
      const dcl = rowsDecl[r];
      for (let c = 0; c < cols; c++) {
        const s = stats[r][c];
        if (!dcl) { if (s.opaque > 0) undeclared.push(`linha ${r}`); continue; }
        if (dcl.frames > cols) { add('A20_MANIFEST', 'error', `rows[${r}].frames=${dcl.frames} > colunas ${cols}`); break; }
        if (c < dcl.frames) {
          if (s.opaque < th.minOpaquePerFrame) empty.push(`${r}:${c} (${dcl.name}, ${s.opaque}px)`);
        } else if (s.opaque > 0) {
          stray.push(`${r}:${c} (${dcl.name}, ${s.opaque}px)`);
        }
      }
    }
    addList('A09_FRAMES', 'error', 'quadros declarados vazios', empty);
    addList('A09_FRAMES', 'error', 'conteúdo fora de "frames" (deveria estar vazio)', stray);
    addList('A09_FRAMES', 'error', 'linhas com pixels mas sem declaração em "rows"', [...new Set(undeclared)]);

    // A10 — encostando na borda
    if (typeRules.checkClip) {
      const clip = [];
      rowsDecl.forEach((dcl, r) => {
        for (let c = 0; c < Math.min(dcl.frames, cols); c++) if (r < nrows && stats[r][c].edge) clip.push(`${r}:${c}`);
      });
      addList('A10_CLIP', 'warn', 'pixels encostando na borda do quadro (possível corte)', clip);
    }

    // A11..A14 — consistência entre quadros
    const baselineTol = typeRules.baselineTolerance;
    const driftTol = typeRules.centerDriftTolerance;
    const baselineBad = []; const driftBad = []; const dupBad = []; const jumpBad = [];
    rowsDecl.forEach((dcl, r) => {
      if (r >= nrows) return;
      const n = Math.min(dcl.frames, cols);
      const used = [];
      for (let c = 0; c < n; c++) if (stats[r][c].opaque > 0) used.push(c);
      if (used.length < 2) return;
      const loco = dcl.baseline ?? /^(walk|run|idle)/i.test(dcl.name ?? '');
      if (loco && baselineTol !== undefined) {
        const ys = used.map((c) => stats[r][c].maxY);
        const spread = Math.max(...ys) - Math.min(...ys);
        if (spread > baselineTol) baselineBad.push(`linha ${r} "${dcl.name}": pés variam ${spread}px (tol. ${baselineTol})`);
      }
      if (loco && driftTol !== undefined) {
        const xs = used.map((c) => stats[r][c].cx);
        const spread = Math.max(...xs) - Math.min(...xs);
        if (spread > driftTol) driftBad.push(`linha ${r} "${dcl.name}": centro desliza ${spread.toFixed(1)}px (tol. ${driftTol})`);
      }
      for (let k = 0; k < used.length - 1; k++) {
        const a = [used[k], r]; const b = [used[k + 1], r];
        const diff = frameDiff(img, fw, fh, a, b);
        if (diff === 0 && !dcl.hold) dupBad.push(`linha ${r} quadros ${used[k]}→${used[k + 1]}`);
        if (loco && typeRules.requireRows && diff > th.frameJumpRatio) {
          jumpBad.push(`linha ${r} quadros ${used[k]}→${used[k + 1]} (${(diff * 100).toFixed(0)}% dos pixels mudam)`);
        }
      }
    });
    addList('A11_BASELINE', 'error', 'base dos pés instável', baselineBad);
    addList('A12_DRIFT', 'warn', 'deslocamento horizontal do personagem entre quadros', driftBad);
    addList('A13_DUP', 'warn', 'quadros adjacentes idênticos (declare "hold": true se intencional)', dupBad);
    addList('A14_JUMP', 'warn', 'mudança brusca entre quadros (verifique consistência do design)', jumpBad);
  }
  return { findings, meta };
}

// ════════════════════════════════════════════════════════════════════
// Validação do PROJETO
// ════════════════════════════════════════════════════════════════════
export function validateProject(opts = {}) {
  const root = resolve(opts.root ?? process.cwd());
  const rules = readJson(join(root, 'art/art-rules.json'), 'art/art-rules.json');
  const palette = readJson(join(root, 'art/palette.json'), 'art/palette.json');
  const manifest = readJson(join(root, 'art/assets.manifest.json'), 'art/assets.manifest.json');
  if (!palette.colors || typeof palette.colors !== 'object') throw new Error('art/palette.json sem "colors"');
  if (!Array.isArray(manifest.assets)) throw new Error('art/assets.manifest.json sem array "assets"');

  const strict = opts.strict ?? manifest.strict === true;
  const mode = strict ? 'strict' : 'transition';
  const looseLevel = strict ? 'error' : 'warn';
  const global = [];
  const gAdd = (code, level, message) => global.push({ code, level, message });
  const assets = [];
  const ids = new Set();
  const listed = new Set();

  for (const entry of manifest.assets) {
    const res = { id: entry.id ?? '(sem id)', path: entry.path ?? '(sem path)', findings: [] };
    const add = (code, level, message) => res.findings.push({ code, level, message });
    assets.push(res);

    // A20 — esquema
    const missingFields = ['id', 'path', 'type', 'origin', 'status'].filter((k) => !entry[k]);
    if (missingFields.length) { add('A20_MANIFEST', 'error', `campos obrigatórios ausentes: ${missingFields.join(', ')}`); continue; }
    if (ids.has(entry.id)) add('A20_MANIFEST', 'error', `id duplicado "${entry.id}"`);
    ids.add(entry.id);
    if (!ORIGINS.has(entry.origin)) add('A20_MANIFEST', 'error', `origin "${entry.origin}" inválido (${[...ORIGINS].join('|')})`);
    if (!STATUSES.has(entry.status)) add('A20_MANIFEST', 'error', `status "${entry.status}" inválido (${[...STATUSES].join('|')})`);
    listed.add(norm(entry.path));

    // A17 — arquivo existe
    const abs = join(root, entry.path);
    if (!existsSync(abs)) { add('A17_MISSING', 'error', `arquivo não existe: ${entry.path}`); continue; }

    // A01..A14
    const { findings } = validateAssetBuffer({ entry, buffer: readFileSync(abs), fileName: abs, rules, palette });
    res.findings.push(...findings);

    // A15 — rastreabilidade
    const need = (key, label) => {
      if (!entry[key]) { add('A15_TRACE', 'error', `"${key}" ausente (${label})`); return false; }
      if (!existsSync(join(root, entry[key]))) { add('A15_TRACE', 'error', `"${key}" aponta para arquivo inexistente: ${entry[key]}`); return false; }
      return true;
    };
    if (entry.origin === 'ai-processed') { need('source', 'arquivo bruto/conceito de origem'); need('promptRef', 'arquivo com o prompt usado'); }
    if (entry.origin === 'procedural') need('generator', 'script/módulo que gera o asset');
    if (entry.status === 'APPROVED') {
      const ev = [].concat(entry.evidence ?? []);
      if (!ev.length) add('A15_TRACE', 'error', 'status APPROVED sem "evidence" (screenshot em qa/evidence/)');
      else for (const e of ev) if (!existsSync(join(root, e))) add('A15_TRACE', 'error', `evidence inexistente: ${e}`);
    }
  }

  // A16 / A19 — varredura de public/assets
  const assetsDir = join(root, rules.assetsDir ?? 'public/assets');
  const files = walk(assetsDir);
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += statSync(f).size;
    const ext = extname(f).toLowerCase();
    const rel = norm(relative(root, f));
    if (!IMAGE_EXTS.has(ext)) continue;
    if (ext !== '.png') gAdd('A19_LEGACY', looseLevel, `${rel} — formato ${ext.slice(1).toUpperCase()} não é permitido em public/ (mover para art-source/concepts/ ou converter)`);
    else if (!listed.has(rel)) gAdd('A16_ORPHAN', looseLevel, `${rel} — PNG não registrado em art/assets.manifest.json`);
  }
  const mb = totalBytes / (1024 * 1024);
  if (rules.budgets?.publicAssetsMB && mb > rules.budgets.publicAssetsMB) {
    gAdd('A18_SIZE', looseLevel, `public/assets pesa ${mb.toFixed(1)} MB > orçamento ${rules.budgets.publicAssetsMB} MB`);
  }

  // dist (opcional)
  if (opts.dist) {
    const distDir = join(root, rules.distDir ?? 'dist');
    if (!existsSync(distDir)) {
      gAdd('A00_CONFIG', 'warn', `--dist solicitado, mas ${rules.distDir ?? 'dist'}/ não existe (rode o build antes)`);
    } else {
      let distBytes = 0;
      for (const f of walk(distDir)) {
        const ext = extname(f).toLowerCase();
        if (IMAGE_EXTS.has(ext)) {
          distBytes += statSync(f).size;
          if (ext !== '.png') gAdd('A19_LEGACY', looseLevel, `${norm(relative(root, f))} — imagem ${ext.slice(1).toUpperCase()} enviada no build`);
        }
      }
      const dmb = distBytes / (1024 * 1024);
      if (rules.budgets?.distAssetsMB && dmb > rules.budgets.distAssetsMB) {
        gAdd('A18_SIZE', looseLevel, `imagens em dist/ somam ${dmb.toFixed(1)} MB > orçamento ${rules.budgets.distAssetsMB} MB`);
      }
    }
  }

  const all = [...global, ...assets.flatMap((a) => a.findings)];
  const count = (lvl) => all.filter((f) => f.level === lvl).length;
  return {
    ok: count('error') === 0,
    mode,
    paletteStatus: palette.status ?? 'desconhecido',
    paletteColors: new Set(Object.values(palette.colors).map(hexToInt)).size,
    manifestAssets: manifest.assets.length,
    errorCount: count('error'),
    warnCount: count('warn'),
    infoCount: count('info'),
    global,
    assets,
  };
}

// ════════════════════════════════════════════════════════════════════
// Relatórios
// ════════════════════════════════════════════════════════════════════
const TAG = { error: '[ERRO ]', warn: '[AVISO]', info: '[INFO ]' };

export function formatReport(res) {
  const L = [];
  L.push('CINZAS DO ÉTER — Validador de Arte (QA v2)');
  L.push(`Modo: ${res.mode === 'strict' ? 'ESTRITO' : 'TRANSIÇÃO'} | Paleta: ${res.paletteStatus} (${res.paletteColors} cores) | Assets no manifesto: ${res.manifestAssets}`);
  if (res.mode !== 'strict') {
    L.push('ATENÇÃO: modo TRANSIÇÃO — órfãos e formatos legados aparecem como AVISO. O lote L1 só termina com "strict": true no manifesto.');
  }
  L.push('─'.repeat(78));
  for (const f of res.global) L.push(`${TAG[f.level]} ${f.code}  ${f.message}`);
  for (const a of res.assets) {
    const shown = a.findings.filter((f) => f.level !== 'info');
    if (!shown.length) continue;
    L.push(`${a.id}  (${a.path})`);
    for (const f of shown) L.push(`  ${TAG[f.level]} ${f.code}  ${f.message}`);
  }
  if (!res.global.length && res.assets.every((a) => a.findings.every((f) => f.level === 'info'))) L.push('(nenhum achado)');
  L.push('─'.repeat(78));
  L.push(`RESUMO: ${res.errorCount} erro(s) | ${res.warnCount} aviso(s) | ${res.manifestAssets} asset(s) no manifesto`);
  L.push(`RESULTADO: ${res.ok ? 'APROVADO ✔ (0 erros)' : 'REPROVADO ✘'}`);
  return L.join('\n');
}

function writeReports(res, root) {
  const dir = join(resolve(root ?? process.cwd()), 'qa/reports');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'art-validation-latest.json'), JSON.stringify(res, null, 2));
  writeFileSync(join(dir, 'art-validation-latest.md'), `# Relatório do validador de arte\n\n\`\`\`\n${formatReport(res)}\n\`\`\`\n`);
}

// ════════════════════════════════════════════════════════════════════
// SELF-TEST — "QA do QA": prova que o validador detecta defeitos reais
// ════════════════════════════════════════════════════════════════════
export function selfTest() {
  const rules = {
    types: { char: { maxColors: 48, outline: true, requireRows: true, checkClip: true, baselineTolerance: 1, centerDriftTolerance: 2 } },
    thresholds: { outlineBoundaryRatio: 0.8, minOpaquePerFrame: 8, frameJumpRatio: 0.6, maxFileKB: 512, maxImageDimension: 2048 },
  };
  const palette = {
    colors: { out: '#4A2875', body: '#8B6B4A', shade: '#5C4433', skin: '#F5F0E1', boot: '#3A2B1F', glow: '#E8C876' },
    outline: ['#4A2875'],
    forbidden: { '#000000': 'preto puro proibido' },
  };
  const C = { OUT: 0x4a2875, BODY: 0x8b6b4a, SHADE: 0x5c4433, SKIN: 0xf5f0e1, BOOT: 0x3a2b1f };
  const FW = 32; const FH = 48; const COLS = 4; const ROWS = 4;
  const W = COLS * FW; const H = ROWS * FH;

  const buildSheet = () => {
    const data = new Uint8Array(W * H * 4);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const bob = c % 2;
        const sil = new Set();
        const rect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) sil.add(y * FW + x); };
        rect(9, 8 + bob, 22, 36);
        rect(10, 37 + (c % 2 ? 1 : 0), 14, 45);
        rect(17, 37 + (c % 2 ? 0 : 1), 21, 45);
        const inSil = (x, y) => sil.has(y * FW + x);
        for (const k of sil) {
          const y = Math.floor(k / FW); const x = k % FW;
          let interior = true;
          for (let dy = -2; dy <= 2 && interior; dy++) for (let dx = -2; dx <= 2; dx++) if (!inSil(x + dx, y + dy)) { interior = false; break; }
          let rgb = C.OUT;
          if (interior) rgb = y < 16 + bob ? C.SKIN : y < 36 ? (x < 14 ? C.SHADE : C.BODY) : C.BOOT;
          const i = (((r * FH + y) * W) + c * FW + x) * 4;
          data[i] = (rgb >> 16) & 255; data[i + 1] = (rgb >> 8) & 255; data[i + 2] = rgb & 255; data[i + 3] = 255;
        }
      }
    }
    return data;
  };
  const idx = (r, c, x, y) => (((r * FH + y) * W) + c * FW + x) * 4;
  const setPx = (d, r, c, x, y, rgb, a = 255) => {
    const i = idx(r, c, x, y);
    d[i] = (rgb >> 16) & 255; d[i + 1] = (rgb >> 8) & 255; d[i + 2] = rgb & 255; d[i + 3] = a;
  };
  const clearFrame = (d, r, c) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) d[idx(r, c, x, y) + 3] = 0; };
  const copyFrame = (d, fromR, fromC, toR, toC) => {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const a = idx(fromR, fromC, x, y); const b = idx(toR, toC, x, y);
      d[b] = d[a]; d[b + 1] = d[a + 1]; d[b + 2] = d[a + 2]; d[b + 3] = d[a + 3];
    }
  };
  const shiftFrameUp = (d, r, c, n) => {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const dst = idx(r, c, x, y); const sy = y + n;
      if (sy < FH) { const src = idx(r, c, x, sy); d[dst] = d[src]; d[dst + 1] = d[src + 1]; d[dst + 2] = d[src + 2]; d[dst + 3] = d[src + 3]; } else d[dst + 3] = 0;
    }
  };

  const entryBase = () => ({
    id: 'selftest', path: 'x', type: 'char', origin: 'procedural', status: 'DRAFT', frame: [FW, FH], grid: [COLS, ROWS],
    rows: ['walk_down', 'walk_left', 'walk_right', 'walk_up'].map((name) => ({ name, frames: 4, fps: 8 })),
  });
  const GOOD = 'char_selftest_walk_32x48.png';

  // cada caso: mutate(data, entry) → altera; expect: [[código, nível]]; forbid: [códigos]
  const cases = [
    { name: 'sprite limpo → nenhum erro, nenhum aviso', none: true },
    { name: 'JPEG com extensão PNG → A01', raw: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]), expect: [['A01_FORMAT', 'error']] },
    { name: 'PNG corrompido/truncado → A02', raw: 'truncate', expect: [['A02_DECODE', 'error']] },
    { name: 'nome fora do padrão → A03', file: 'Kael_Walk.png', expect: [['A03_NAME', 'error']] },
    { name: 'sufixo de tamanho errado → A03', file: 'char_selftest_walk_16x16.png', expect: [['A03_NAME', 'error']] },
    { name: 'dimensão não múltipla do quadro → A04', dims: [130, 192], expect: [['A04_DIMENSIONS', 'error']] },
    { name: 'grid declarado diferente do real → A04', mutate: (d, e) => { e.grid = [4, 3]; }, expect: [['A04_DIMENSIONS', 'error']] },
    { name: 'pixel semitransparente → A05', mutate: (d) => setPx(d, 0, 0, 15, 20, C.BODY, 128), expect: [['A05_ALPHA', 'error']] },
    { name: 'softAlpha declarado → sem A05', mutate: (d, e) => { setPx(d, 0, 0, 15, 20, C.BODY, 128); e.softAlpha = true; }, forbid: ['A05_ALPHA'] },
    { name: 'cor fora da paleta → A06', mutate: (d) => setPx(d, 0, 0, 15, 20, 0x3c5a2b), expect: [['A06_PALETTE', 'error']] },
    { name: 'preto puro → A06 com dica de cor', mutate: (d) => setPx(d, 0, 0, 15, 20, 0x000000), expect: [['A06_PALETTE', 'error']], text: '#000000' },
    { name: 'estouro do orçamento de cores → A07', mutate: (d, e) => { e.maxColors = 3; }, expect: [['A07_COLOR_BUDGET', 'error']] },
    {
      name: 'contorno em cor de paleta errada → A08 (e não A06)',
      mutate: (d) => { for (let i = 0; i < d.length; i += 4) if (d[i + 3] && ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) === C.OUT) { d[i] = 0x5c; d[i + 1] = 0x44; d[i + 2] = 0x33; } },
      expect: [['A08_OUTLINE', 'error']], forbid: ['A06_PALETTE'],
    },
    { name: 'manifesto sem "rows" → A09', mutate: (d, e) => { delete e.rows; }, expect: [['A09_FRAMES', 'error']] },
    { name: 'quadro declarado vazio → A09', mutate: (d) => clearFrame(d, 2, 1), expect: [['A09_FRAMES', 'error']] },
    { name: 'conteúdo fora de "frames" → A09', mutate: (d, e) => { e.rows[0].frames = 3; }, expect: [['A09_FRAMES', 'error']] },
    { name: 'pixel encostando na borda do quadro → A10 (aviso)', mutate: (d) => setPx(d, 0, 0, 0, 20, C.OUT), expect: [['A10_CLIP', 'warn']] },
    { name: 'pés levantados em quadro de caminhada → A11', mutate: (d) => shiftFrameUp(d, 0, 2, 5), expect: [['A11_BASELINE', 'error']] },
    { name: 'quadros adjacentes idênticos → A13 (aviso)', mutate: (d) => copyFrame(d, 3, 1, 3, 2), expect: [['A13_DUP', 'warn']] },
    {
      name: 'redesenho brusco entre quadros → A14 (aviso)',
      mutate: (d) => { clearFrame(d, 1, 2); for (let y = 2; y < 14; y++) for (let x = 2; x < 10; x++) setPx(d, 1, 2, x, y, C.BODY); for (let y = 40; y < 46; y++) for (let x = 20; x < 28; x++) setPx(d, 1, 2, x, y, C.BODY); },
      expect: [['A14_JUMP', 'warn']],
    },
  ];

  const results = [];
  for (const tc of cases) {
    const entry = entryBase();
    let buffer;
    let detail = '';
    try {
      if (tc.raw === 'truncate') {
        const good = encodePng(W, H, buildSheet());
        buffer = good.subarray(0, Math.floor(good.length / 2));
      } else if (tc.raw) {
        buffer = tc.raw;
      } else if (tc.dims) {
        buffer = encodePng(tc.dims[0], tc.dims[1], new Uint8Array(tc.dims[0] * tc.dims[1] * 4));
      } else {
        const data = buildSheet();
        if (tc.mutate) tc.mutate(data, entry);
        buffer = encodePng(W, H, data);
      }
      const { findings } = validateAssetBuffer({ entry, buffer, fileName: tc.file ?? GOOD, rules, palette });
      const has = (code, level) => findings.some((f) => f.code === code && (!level || f.level === level));
      let ok = true;
      if (tc.none) {
        ok = findings.length === 0;
        detail = ok ? 'sem achados' : `achados inesperados: ${findings.map((f) => f.code).join(', ')}`;
      } else {
        const missing = (tc.expect ?? []).filter(([code, level]) => !has(code, level));
        const forbidden = (tc.forbid ?? []).filter((code) => has(code));
        if (tc.text && !findings.some((f) => f.message.includes(tc.text))) missing.push(['texto', tc.text]);
        ok = missing.length === 0 && forbidden.length === 0;
        detail = ok
          ? `detectou ${(tc.expect ?? []).map(([c]) => c).join(', ') || 'ok'}`
          : `faltou: ${missing.map((m) => m.join(':')).join(', ') || '-'} | indevido: ${forbidden.join(', ') || '-'} | achados: ${findings.map((f) => `${f.code}/${f.level}`).join(', ') || 'nenhum'}`;
      }
      results.push({ name: tc.name, ok, detail });
    } catch (e) {
      results.push({ name: tc.name, ok: false, detail: `exceção: ${e.message}` });
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

// ════════════════════════════════════════════════════════════════════
// CLI
// ════════════════════════════════════════════════════════════════════
function parseArgs(argv) {
  const o = { root: undefined, json: false, report: false, strict: undefined, dist: false, selfTest: false, list: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') o.root = argv[++i];
    else if (a === '--json') o.json = true;
    else if (a === '--report') o.report = true;
    else if (a === '--strict') o.strict = true;
    else if (a === '--dist') o.dist = true;
    else if (a === '--self-test') o.selfTest = true;
    else if (a === '--list') o.list = true;
    else if (a === '--help' || a === '-h') o.help = true;
    else { console.error(`argumento desconhecido: ${a}`); process.exitCode = 2; return null; }
  }
  return o;
}

function main(argv) {
  const o = parseArgs(argv);
  if (!o) return;
  if (o.help) {
    console.log('Uso: node tools/qa/validate-assets.mjs [--strict] [--dist] [--json] [--report] [--self-test] [--list] [--root <pasta>]');
    return;
  }
  if (o.list) {
    for (const [k, v] of Object.entries(CHECKS)) console.log(`${k.padEnd(18)} ${v}`);
    return;
  }
  if (o.selfTest) {
    const r = selfTest();
    console.log('SELF-TEST do validador de arte (QA do QA)');
    for (const t of r.results) console.log(`  ${t.ok ? '[OK]  ' : '[FALHA]'} ${t.name} — ${t.detail}`);
    console.log(r.ok ? `RESULTADO: ${r.results.length}/${r.results.length} casos OK ✔` : 'RESULTADO: FALHOU ✘');
    process.exitCode = r.ok ? 0 : 1;
    return;
  }
  let res;
  try {
    res = validateProject({ root: o.root, strict: o.strict, dist: o.dist });
  } catch (e) {
    console.error(`FALHA INTERNA/CONFIG: ${e.message}`);
    process.exitCode = 2;
    return;
  }
  if (o.report) writeReports(res, o.root);
  console.log(o.json ? JSON.stringify(res, null, 2) : formatReport(res));
  process.exitCode = res.ok ? 0 : 1;
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) main(process.argv.slice(2));
