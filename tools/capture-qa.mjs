/**
 * tools/capture-qa.mjs
 * Automação de captura via Chrome DevTools Protocol (CDP) nativo.
 * Conecta via WebSocket ao Edge/Chrome headless, executa o contrato window.__QA__ (?qa=1),
 * valida as 5 resoluções do HG8 (V31) e captura as evidências do lote L1 e baseline.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { decodePng, encodePng } from './qa/validate-assets.mjs';

const RESOLUTIONS = [
  { width: 1280, height: 720, name: '720p' },
  { width: 1366, height: 768, name: '768p' },
  { width: 1920, height: 1080, name: '1080p' },
  { width: 2560, height: 1440, name: '1440p' },
  { width: 3840, height: 2160, name: '4K' },
];

function findBrowserPath() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  throw new Error('Nenhum navegador (Edge ou Chrome) encontrado nos caminhos padrão.');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scaleNearest4x(pngBuffer) {
  const decoded = decodePng(pngBuffer);
  const srcW = decoded.width;
  const srcH = decoded.height;

  // Recorte central de tamanho máximo 96x54
  const cropW = Math.min(srcW, 96);
  const cropH = Math.min(srcH, 54);
  const startX = Math.floor((srcW - cropW) / 2);
  const startY = Math.floor((srcH - cropH) / 2);

  const dstW = cropW * 4;
  const dstH = cropH * 4;
  const out = new Uint8Array(dstW * dstH * 4);

  for (let cy = 0; cy < cropH; cy++) {
    for (let cx = 0; cx < cropW; cx++) {
      const srcIdx = ((startY + cy) * srcW + (startX + cx)) * 4;
      const r = decoded.data[srcIdx + 0];
      const g = decoded.data[srcIdx + 1];
      const b = decoded.data[srcIdx + 2];
      const a = decoded.data[srcIdx + 3];

      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const dstIdx = (((cy * 4) + dy) * dstW + ((cx * 4) + dx)) * 4;
          out[dstIdx + 0] = r;
          out[dstIdx + 1] = g;
          out[dstIdx + 2] = b;
          out[dstIdx + 3] = a;
        }
      }
    }
  }

  return encodePng(dstW, dstH, out);
}

export function scaleFull4x(pngBuffer) {
  const decoded = decodePng(pngBuffer);
  const srcW = decoded.width;
  const srcH = decoded.height;
  const dstW = srcW * 4;
  const dstH = srcH * 4;
  const out = new Uint8Array(dstW * dstH * 4);

  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const srcIdx = (y * srcW + x) * 4;
      const r = decoded.data[srcIdx + 0];
      const g = decoded.data[srcIdx + 1];
      const b = decoded.data[srcIdx + 2];
      const a = decoded.data[srcIdx + 3];

      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const dstIdx = (((y * 4) + dy) * dstW + ((x * 4) + dx)) * 4;
          out[dstIdx + 0] = r;
          out[dstIdx + 1] = g;
          out[dstIdx + 2] = b;
          out[dstIdx + 3] = a;
        }
      }
    }
  }

  return encodePng(dstW, dstH, out);
}

function composeBeforeAfterSideBySide(leftPngBuffer, rightPngBuffer) {
  const left = decodePng(leftPngBuffer);
  const right = decodePng(rightPngBuffer);

  const dstW = 1280;
  const dstH = 360;
  const out = new Uint8Array(dstW * dstH * 4);

  // Redução 2x de 1280x720 para 640x360 para caber perfeitamente lado a lado
  for (let y = 0; y < dstH; y++) {
    const srcY = y * 2;
    for (let x = 0; x < 640; x++) {
      const srcX = x * 2;
      const srcIdx = (srcY * left.width + srcX) * 4;
      const dstIdx = (y * dstW + x) * 4;
      out[dstIdx + 0] = left.data[srcIdx + 0];
      out[dstIdx + 1] = left.data[srcIdx + 1];
      out[dstIdx + 2] = left.data[srcIdx + 2];
      out[dstIdx + 3] = left.data[srcIdx + 3];
    }

    for (let x = 0; x < 640; x++) {
      const srcX = x * 2;
      const srcIdx = (srcY * right.width + srcX) * 4;
      const dstIdx = (y * dstW + (640 + x)) * 4;
      out[dstIdx + 0] = right.data[srcIdx + 0];
      out[dstIdx + 1] = right.data[srcIdx + 1];
      out[dstIdx + 2] = right.data[srcIdx + 2];
      out[dstIdx + 3] = right.data[srcIdx + 3];
    }

    // Linha divisória vertical dourada no centro (#FFE4A0)
    for (let lx = 639; lx <= 640; lx++) {
      const lineIdx = (y * dstW + lx) * 4;
      out[lineIdx + 0] = 0xff;
      out[lineIdx + 1] = 0xe4;
      out[lineIdx + 2] = 0xa0;
      out[lineIdx + 3] = 0xff;
    }
  }

  return encodePng(dstW, dstH, out);
}

async function generateL3Evidence({ sendPage, captureScreen }) {
  console.log('\n[CaptureQA] Gerando Evidências Visuais do Lote L3 (Kaël)...');
  const l3Dir = 'qa/evidence/L3';
  fs.mkdirSync(l3Dir, { recursive: true });

  // 1. V11: Prancha de contato de campo (4 dirs x 8 linhas + silhueta 1x e 4x)
  const fieldBuf = fs.readFileSync('public/assets/characters/char_kael_field_32x48.png');
  const fieldImg = decodePng(fieldBuf);
  // Grid 5 colunas x 8 linhas (4 frames + 1 silhueta)
  const fw = 32, fh = 48, rows = 8;
  const v11W = fw * 5;
  const v11H = fh * rows;
  const v11Data = new Uint8Array(v11W * v11H * 4);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 4; c++) {
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const srcIdx = ((r * fh + y) * fieldImg.width + (c * fw + x)) * 4;
          const dstIdx = ((r * fh + y) * v11W + (c * fw + x)) * 4;
          v11Data[dstIdx + 0] = fieldImg.data[srcIdx + 0];
          v11Data[dstIdx + 1] = fieldImg.data[srcIdx + 1];
          v11Data[dstIdx + 2] = fieldImg.data[srcIdx + 2];
          v11Data[dstIdx + 3] = fieldImg.data[srcIdx + 3];
        }
      }
    }
    // Coluna 4: Silhueta preta do frame 0 (para demonstrar legibilidade da silhueta Rubrica 2.1)
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const srcIdx = ((r * fh + y) * fieldImg.width + x) * 4;
        const dstIdx = ((r * fh + y) * v11W + (4 * fw + x)) * 4;
        if (fieldImg.data[srcIdx + 3] > 0) {
          // Silhueta preta pura (#1D1528)
          v11Data[dstIdx + 0] = 0x1d;
          v11Data[dstIdx + 1] = 0x15;
          v11Data[dstIdx + 2] = 0x28;
          v11Data[dstIdx + 3] = 255;
        } else {
          // Fundo de destaque para silhueta (#3A2B1F sutil)
          v11Data[dstIdx + 0] = 0x3a;
          v11Data[dstIdx + 1] = 0x2b;
          v11Data[dstIdx + 2] = 0x1f;
          v11Data[dstIdx + 3] = 255;
        }
      }
    }
  }
  const v11Buf = encodePng(v11W, v11H, v11Data);
  fs.writeFileSync(path.join(l3Dir, 'V11_kael_field_contact_1x.png'), v11Buf);
  fs.writeFileSync(path.join(l3Dir, 'V11_kael_field_contact_4x.png'), scaleFull4x(v11Buf));
  console.log('  [OK] V11 gravado: V11_kael_field_contact_1x.png e 4x.png (com teste de silhueta)');

  // 2. V12: Caminhada de Kaël na Vila de Lumen (in-game via CDP)
  console.log('  [CaptureQA] Executando cenário V12 (Caminhada em Lumen)...');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sendPage('Runtime.evaluate', {
    expression: 'window.__QA__ && window.__QA__.load("V12")',
    awaitPromise: true,
  });
  await sleep(600);
  const v12Buf = await captureScreen(path.join(l3Dir, 'V12_kael_field_walk_1x.png'));
  const v12_4x = scaleNearest4x(v12Buf);
  fs.writeFileSync(path.join(l3Dir, 'V12_kael_field_walk_4x.png'), Buffer.from(v12_4x));
  console.log('  [OK] V12 gravado: V12_kael_field_walk_1x.png e 4x.png');

  // 3. V13: Prancha de Batalha (11 clipes canônicos)
  const battleBuf = fs.readFileSync('public/assets/characters/char_kael_battle_48x48.png');
  fs.writeFileSync(path.join(l3Dir, 'V13_kael_battle_contact_1x.png'), battleBuf);
  fs.writeFileSync(path.join(l3Dir, 'V13_kael_battle_contact_4x.png'), scaleFull4x(battleBuf));
  console.log('  [OK] V13 Batalha gravado: V13_kael_battle_contact_1x.png e 4x.png');

  // 4. Retratos e Ícone (composição V13)
  const pNeutralBuf = fs.readFileSync('public/assets/portraits/portrait_kael_neutral_48x48.png');
  const pSeriousBuf = fs.readFileSync('public/assets/portraits/portrait_kael_serious_48x48.png');
  const iconBuf = fs.readFileSync('public/assets/icons/icon_kael_16x16.png');

  fs.writeFileSync(path.join(l3Dir, 'portrait_kael_neutral_1x.png'), pNeutralBuf);
  fs.writeFileSync(path.join(l3Dir, 'portrait_kael_serious_1x.png'), pSeriousBuf);
  fs.writeFileSync(path.join(l3Dir, 'icon_kael_1x.png'), iconBuf);

  const imgNeut = decodePng(pNeutralBuf);
  const imgSer = decodePng(pSeriousBuf);
  const imgIcon = decodePng(iconBuf);

  const piW = 48 + 8 + 48 + 8 + 16 + 8; // 136 px
  const piH = 48;
  const piData = new Uint8Array(piW * piH * 4);

  // Fundo limpo
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const srcIdx = (y * 48 + x) * 4;
      const dstIdx = (y * piW + x) * 4;
      piData[dstIdx + 0] = imgNeut.data[srcIdx + 0];
      piData[dstIdx + 1] = imgNeut.data[srcIdx + 1];
      piData[dstIdx + 2] = imgNeut.data[srcIdx + 2];
      piData[dstIdx + 3] = imgNeut.data[srcIdx + 3];
    }
  }
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const srcIdx = (y * 48 + x) * 4;
      const dstIdx = (y * piW + (56 + x)) * 4;
      piData[dstIdx + 0] = imgSer.data[srcIdx + 0];
      piData[dstIdx + 1] = imgSer.data[srcIdx + 1];
      piData[dstIdx + 2] = imgSer.data[srcIdx + 2];
      piData[dstIdx + 3] = imgSer.data[srcIdx + 3];
    }
  }
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const srcIdx = (y * 16 + x) * 4;
      const dstIdx = ((16 + y) * piW + (112 + x)) * 4;
      piData[dstIdx + 0] = imgIcon.data[srcIdx + 0];
      piData[dstIdx + 1] = imgIcon.data[srcIdx + 1];
      piData[dstIdx + 2] = imgIcon.data[srcIdx + 2];
      piData[dstIdx + 3] = imgIcon.data[srcIdx + 3];
    }
  }
  const piBuf = encodePng(piW, piH, piData);
  fs.writeFileSync(path.join(l3Dir, 'V13_kael_portraits_icons_1x.png'), piBuf);
  fs.writeFileSync(path.join(l3Dir, 'V13_kael_portraits_icons_4x.png'), scaleFull4x(piBuf));
  console.log('  [OK] V13 Retratos & Ícone gravado: V13_kael_portraits_icons_1x.png e 4x.png');
}

async function main() {
  const browserPath = findBrowserPath();
  const cdpPort = 9222;
  const tempProfile = path.join(os.tmpdir(), `edge_cdp_${Date.now()}`);

  console.log(`[CaptureQA] Iniciando navegador: ${browserPath}`);
  const browserProc = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1280,720',
    '--hide-scrollbars',
    '--mute-audio',
    'about:blank',
  ]);

  browserProc.on('error', err => {
    console.error('[CaptureQA] Erro no processo do navegador:', err);
  });

  // Aguarda endpoint do CDP responder
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (res.ok) {
        const json = await res.json();
        wsUrl = json.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    browserProc.kill();
    throw new Error('Falha ao conectar na porta CDP do navegador.');
  }

  console.log(`[CaptureQA] Conectado ao CDP: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  await new Promise(resolve => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  try {
    // 1. Cria nova página e conecta nela
    const target = await send('Target.createTarget', { url: 'http://localhost:3000/?qa=1' });
    const targetWsUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${target.targetId}`;

    const pageWs = new WebSocket(targetWsUrl);
    await new Promise(resolve => {
      pageWs.onopen = resolve;
    });

    let pageMsgId = 1;
    const pagePending = new Map();
    pageWs.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.id && pagePending.has(data.id)) {
        const { resolve, reject } = pagePending.get(data.id);
        pagePending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };

    function sendPage(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = pageMsgId++;
        pagePending.set(id, { resolve, reject });
        pageWs.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendPage('Page.enable');
    await sendPage('Runtime.enable');

    console.log('[CaptureQA] Aguardando inicialização do jogo e window.__QA__...');
    let isReady = false;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try {
        const evalRes = await sendPage('Runtime.evaluate', {
          expression: 'typeof window.__QA__ !== "undefined" && window.__QA__.ready()',
          returnByValue: true,
        });
        if (evalRes?.result?.value === true) {
          isReady = true;
          break;
        }
      } catch {}
    }

    if (!isReady) {
      console.warn('[CaptureQA] Jogo demorou para responder ready(), prosseguindo com captura...');
    } else {
      console.log('[CaptureQA] window.__QA__ está pronto.');
    }

    async function captureScreen(destFile) {
      const snap = await sendPage('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(snap.data, 'base64');
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.writeFileSync(destFile, buf);
      return buf;
    }

    const isL2Only = process.argv.includes('--l2-only');
    const isL3Only = process.argv.includes('--l3-only');

    if (!isL2Only && !isL3Only) {
      // 2. Cenário V01: Boot
      console.log('[CaptureQA] Executando cenário V01 (Boot)...');
      await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ && window.__QA__.load("V01")',
        awaitPromise: true,
      });
      await sleep(400);

      const v01_1x_path = 'qa/evidence/L1/V01_boot_1x.png';
      const v01_buf = await captureScreen(v01_1x_path);
      const v01_4x_buf = scaleNearest4x(v01_buf);
      fs.writeFileSync('qa/evidence/L1/V01_boot_4x.png', Buffer.from(v01_4x_buf));
      console.log(`[OK] V01 capturado: ${v01_1x_path} e V01_boot_4x.png`);

      // 3. Cenário V31: Escala inteira nas 5 resoluções (HG8)
      console.log('[CaptureQA] Executando cenário V31 nas 5 resoluções do HG8...');
      const scaleResults = [];

      for (const res of RESOLUTIONS) {
        await sendPage('Emulation.setDeviceMetricsOverride', {
          width: res.width,
          height: res.height,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(250);

        const evalScale = await sendPage('Runtime.evaluate', {
          expression: 'window.__QA__.scale()',
          returnByValue: true,
        });

        const scaleInfo = evalScale?.result?.value;
        scaleResults.push({ ...res, ...scaleInfo });

        const shotPath = `qa/evidence/L1/V31_scale_${res.name}_${res.width}x${res.height}_1x.png`;
        const shotBuf = await captureScreen(shotPath);
        const shot4xBuf = scaleNearest4x(shotBuf);
        fs.writeFileSync(`qa/evidence/L1/V31_scale_${res.name}_${res.width}x${res.height}_4x.png`, Buffer.from(shot4xBuf));
        console.log(`  [OK] HG8 Resolução ${res.name} (${res.width}x${res.height}) -> Zoom ${scaleInfo?.zoom}x | integer: ${scaleInfo?.integer}`);
      }

      // 4. Completar screenshots pendentes do baseline em qa/baseline/
      console.log('[CaptureQA] Completando capturas de baseline pendentes...');
      const baselineScenarios = [
        { id: 'V02', file: 'qa/baseline/lumen_core.png' },
        { id: 'V07', file: 'qa/baseline/ash_plains.png' },
        { id: 'V09', file: 'qa/baseline/echo_cave.png' },
        { id: 'V15', file: 'qa/baseline/dialogue.png' },
        { id: 'V16', file: 'qa/baseline/shop.png' },
        { id: 'V17', file: 'qa/baseline/status.png' },
        { id: 'V18', file: 'qa/baseline/inventory.png' },
      ];

      // Restaura resolução padrão 1280x720
      await sendPage('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      });

      for (const item of baselineScenarios) {
        await sendPage('Runtime.evaluate', {
          expression: `window.__QA__ && window.__QA__.load("${item.id}")`,
          awaitPromise: true,
        });
        await sleep(350);
        await captureScreen(item.file);
        console.log(`  [OK] Baseline gravado: ${item.file}`);
      }
    }

    if (!isL3Only) {
      // 5. Lote L2 — Protótipo Comparativo e Benchmarks (Decisão D1)
      console.log('\n[CaptureQA] Executando Protótipo HD-2D-lite e Benchmarks (Lote L2)...');
      fs.mkdirSync('qa/evidence/L2', { recursive: true });

      // Restaura resolução padrão 1280x720 para captura do protótipo
      await sendPage('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      });

      // Modo A: Nativo 384x216
      console.log('[CaptureQA] Configurando Modo A: Nativo 384x216...');
      await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ && window.__QA__.load("proto_384")',
        awaitPromise: true,
      });
      await sleep(600);
      const proto384Buf = await captureScreen('qa/evidence/L2/proto_384x216.png');
      const fps384 = await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ ? window.__QA__.fps(2) : null',
        returnByValue: true,
      });
      const mem384 = await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ ? window.__QA__.memory() : null',
        returnByValue: true,
      });

      console.log('  [L2 Modo A - 384x216] FPS:', JSON.stringify(fps384?.result?.value), '| Memória:', JSON.stringify(mem384?.result?.value));

      // Modo B: Render interno 3x 1152x648
      console.log('[CaptureQA] Configurando Modo B: Render interno 3x 1152x648...');
      await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ && window.__QA__.load("proto_1152")',
        awaitPromise: true,
      });
      await sleep(600);
      const proto1152Buf = await captureScreen('qa/evidence/L2/proto_1152x648.png');
      const fps1152 = await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ ? window.__QA__.fps(2) : null',
        returnByValue: true,
      });
      const mem1152 = await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ ? window.__QA__.memory() : null',
        returnByValue: true,
      });

      console.log('  [L2 Modo B - 1152x648] FPS:', JSON.stringify(fps1152?.result?.value), '| Memória:', JSON.stringify(mem1152?.result?.value));

      // Restaura resolução nativa
      await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ && window.__QA__.load("proto_384")',
        awaitPromise: true,
      });

      // 6. Composição do Comparativo Antes/Depois (qa/evidence/L2/comparativo_antes_depois.png)
      console.log('[CaptureQA] Gerando montagem lado a lado: comparativo_antes_depois.png...');
      const baselinePath = 'qa/baseline/lumen_core.png';
      if (fs.existsSync(baselinePath)) {
        const baselineBuf = fs.readFileSync(baselinePath);
        const compBuf = composeBeforeAfterSideBySide(baselineBuf, proto384Buf);
        fs.writeFileSync('qa/evidence/L2/comparativo_antes_depois.png', compBuf);
        console.log('  [OK] qa/evidence/L2/comparativo_antes_depois.png gerado com sucesso.');
      }

      // 7. Coleta métricas de console
      const issuesRes = await sendPage('Runtime.evaluate', {
        expression: 'window.__QA__ ? window.__QA__.consoleIssues() : null',
        returnByValue: true,
      });

      console.log('\n=== RELATÓRIO DO CAPTURE-QA (L2) ===');
      console.log('Modo A (384x216):', JSON.stringify({ fps: fps384?.result?.value, memory: mem384?.result?.value }));
      console.log('Modo B (1152x648):', JSON.stringify({ fps: fps1152?.result?.value, memory: mem1152?.result?.value }));
      console.log('Console Issues:', JSON.stringify(issuesRes?.result?.value));
    }

    // 8. Lote L3 — Kaël Padrão de Qualidade
    await generateL3Evidence({ sendPage, captureScreen });

    pageWs.close();
  } finally {
    ws.close();
    browserProc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

main().catch(err => {
  console.error('[CaptureQA] Erro fatal:', err);
  process.exit(1);
});
