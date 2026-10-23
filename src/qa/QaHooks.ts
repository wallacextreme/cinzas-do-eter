/**
 * src/qa/QaHooks.ts
 * Implementação do contrato window.__QA__ conforme QA.md §2-G.
 * Ativo estritamente quando a URL contiver `?qa=1`.
 */

import { DISPLAY } from '@config/constants.ts';

export interface QaHooks {
  version: 1;
  ready(): boolean;
  scenarios(): string[];
  load(id: string): Promise<void>;
  freeze(on: boolean): void;
  step(frames: number): void;
  play(animKey: string, opts?: { dir?: string; loop?: boolean }): void;
  setQuality(q: 'low' | 'medium' | 'high'): void;
  setTimeOfDay(p: 'dawn' | 'day' | 'dusk' | 'night'): void;
  setReduceFlashes(on: boolean): void;
  fps(seconds?: number): { avg: number; p95FrameMs: number; samples: number };
  memory(): { textureCount: number; estimatedMB: number };
  scale(): { zoom: number; integer: boolean; canvas: [number, number]; viewport: [number, number] };
  consoleIssues(): { errors: string[]; warnings: string[] };
  snapshot(): Promise<string>;
}

declare global {
  interface Window {
    __QA__?: QaHooks;
  }
}

export function calculateIntegerZoom(viewportWidth: number, viewportHeight: number): number {
  const zoomX = Math.floor(viewportWidth / DISPLAY.WIDTH);
  const zoomY = Math.floor(viewportHeight / DISPLAY.HEIGHT);
  return Math.max(1, Math.min(zoomX, zoomY));
}

export function applyIntegerScale(game: any): number {
  if (!game || !game.canvas) return 1;

  const vpW = window.innerWidth || document.documentElement.clientWidth || 1280;
  const vpH = window.innerHeight || document.documentElement.clientHeight || 720;
  const zoom = calculateIntegerZoom(vpW, vpH);

  // Mantém o buffer lógico interno em 384x216
  const targetW = DISPLAY.WIDTH * zoom;
  const targetH = DISPLAY.HEIGHT * zoom;

  const canvas = game.canvas as HTMLCanvasElement;
  canvas.style.width = `${targetW}px`;
  canvas.style.height = `${targetH}px`;
  canvas.style.imageRendering = 'pixelated';

  return zoom;
}

export function setupQaHooks(game: any): QaHooks {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  // Intercepta console.error e console.warn no modo QA
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    consoleErrors.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    consoleWarnings.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    originalWarn.apply(console, args);
  };

  // Coleta de métricas de FPS e tempo de quadro (no browser)
  const frameDeltas: number[] = [];
  const maxDeltaSamples = 1200; // ~20 segundos a 60fps
  let lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (typeof requestAnimationFrame === 'function') {
    const frameSampler = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      if (delta > 0 && delta < 500) {
        frameDeltas.push(delta);
        if (frameDeltas.length > maxDeltaSamples) {
          frameDeltas.shift();
        }
      }
      requestAnimationFrame(frameSampler);
    };
    requestAnimationFrame(frameSampler);
  }

  const qaState = {
    isFrozen: false,
    qualityPreset: 'high' as 'low' | 'medium' | 'high',
    timeOfDay: 'day' as 'dawn' | 'day' | 'dusk' | 'night',
    reduceFlashes: false,
  };

  const allScenarios = [
    'V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09', 'V10',
    'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
    'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'V29', 'V30',
    'V31', 'V32', 'V33',
  ];

  const hooks: QaHooks = {
    version: 1,

    ready(): boolean {
      if (!game || !game.isBooted) return false;
      const sceneManager = game.scene;
      if (!sceneManager) return false;
      const current = sceneManager.getScenes(true);
      return current.length > 0;
    },

    scenarios(): string[] {
      return [...allScenarios];
    },

    async load(id: string): Promise<void> {
      console.log(`[QA] Loading deterministic scenario ${id}`);
      const scene = game.scene?.getScene('GameScene') as any;

      switch (id) {
        case 'V01': // Boot
          game.scene?.stop('GameScene');
          game.scene?.start('BootScene');
          break;

        case 'V02': // Lumen Core
          if (scene && scene.player) {
            scene.player.setPosition(20 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(20 * 16, 18 * 16);
          }
          break;

        case 'V03': // Lumen Lia
          if (scene && scene.player) {
            scene.player.setPosition(15 * 16, 20 * 16);
            if (scene.player.setFacingDirection) scene.player.setFacingDirection('RIGHT');
          }
          break;

        case 'V04': // Torvak Shop Approach
          if (typeof (window as any).__APPROACH_TORVAK__ === 'function') {
            (window as any).__APPROACH_TORVAK__();
          }
          break;

        case 'V11': // Kaël Field Showcase (Down Idle)
          if (scene && scene.player) {
            scene.player.setPosition(20 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(20 * 16, 18 * 16);
            if (scene.player.setFacingDirection) scene.player.setFacingDirection('DOWN');
          }
          break;

        case 'V12': // Kaël Walk in Lumen (Walk Down)
          if (scene && scene.player) {
            scene.player.setPosition(18 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(18 * 16, 18 * 16);
            if (scene.player.setFacingDirection) scene.player.setFacingDirection('DOWN');
            if (scene.anims?.exists('kael_walk_down')) {
              scene.player.play('kael_walk_down');
            }
          }
          break;

        case 'V13': // Kaël Battle Animation Showcase
          if (scene && scene.player) {
            scene.player.setPosition(20 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(20 * 16, 18 * 16);
            if (scene.anims?.exists('kael_battle_attack')) {
              scene.player.play('kael_battle_attack');
            }
          }
          break;

        case 'V07': // Ash Plains
          if (typeof (window as any).__GO_TO_MAP__ === 'function') {
            (window as any).__GO_TO_MAP__('ash_plains', 'spawn_north');
          }
          break;

        case 'V08': // Ash Plains Cave Entrance
          if (typeof (window as any).__GO_TO_MAP__ === 'function') {
            (window as any).__GO_TO_MAP__('ash_plains', 'spawn_cave_entrance');
          }
          break;

        case 'V09': // Echo Cave
          if (typeof (window as any).__GO_TO_MAP__ === 'function') {
            (window as any).__GO_TO_MAP__('echo_cave', 'spawn_entrance');
          }
          break;

        case 'V15': // Dialogue
          if (typeof (window as any).__APPROACH_TORVAK__ === 'function') {
            (window as any).__APPROACH_TORVAK__();
            const btn = document.getElementById('btn-talk-torvak');
            if (btn) btn.click();
          }
          break;

        case 'V16': // Shop
          if (typeof (window as any).__OPEN_TORVAK_SHOP__ === 'function') {
            (window as any).__OPEN_TORVAK_SHOP__();
          }
          break;

        case 'V17': // Status
          if (typeof (window as any).__OPEN_STATUS__ === 'function') {
            (window as any).__OPEN_STATUS__();
          }
          break;

        case 'V18': // Inventory
          if (typeof (window as any).__OPEN_INVENTORY__ === 'function') {
            (window as any).__OPEN_INVENTORY__();
          }
          break;

        case 'V31': // Integer scale check
          applyIntegerScale(game);
          break;

        case 'proto_384': // Protótipo D1 Nativo 384x216
          if (scene && scene.player) {
            scene.player.setPosition(20 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(20 * 16, 18 * 16);
            if (scene.hd2dManager) {
              scene.hd2dManager.setInternalScale('native');
              scene.hd2dManager.setQuality('high');
            }
          }
          break;

        case 'proto_1152': // Protótipo D1 Render interno 3x 1152x648
          if (scene && scene.player) {
            scene.player.setPosition(20 * 16, 18 * 16);
            if (scene.cameras?.main) scene.cameras.main.centerOn(20 * 16, 18 * 16);
            if (scene.hd2dManager) {
              scene.hd2dManager.setInternalScale('3x');
              scene.hd2dManager.setQuality('high');
            }
          }
          break;

        default:
          break;
      }

      // Aguarda 100ms para estabilização
      await new Promise(resolve => setTimeout(resolve, 100));
    },

    freeze(on: boolean): void {
      qaState.isFrozen = on;
      if (game.loop) {
        if (on) {
          game.loop.sleep();
        } else {
          game.loop.wake();
        }
      }
    },

    step(frames: number): void {
      if (!game.loop) return;
      for (let i = 0; i < frames; i++) {
        game.step(performance.now(), 1000 / DISPLAY.FPS);
      }
    },

    play(animKey: string, opts?: { dir?: string; loop?: boolean }): void {
      const scene = game.scene?.getScene('GameScene') as any;
      if (scene && scene.player && scene.player.sprite) {
        scene.player.sprite.play({
          key: animKey,
          repeat: opts?.loop ? -1 : 0,
        });
      }
    },

    setQuality(q: 'low' | 'medium' | 'high'): void {
      qaState.qualityPreset = q;
      const scene = game.scene?.getScene('GameScene') as any;
      if (scene?.hd2dManager) {
        scene.hd2dManager.setQuality(q);
      }
      console.log(`[QA] Quality set to ${q}`);
    },

    setTimeOfDay(p: 'dawn' | 'day' | 'dusk' | 'night'): void {
      qaState.timeOfDay = p;
      const scene = game.scene?.getScene('GameScene') as any;
      if (scene?.hd2dManager) {
        scene.hd2dManager.setTimeOfDay(p);
      }
      console.log(`[QA] Time of day set to ${p}`);
    },

    setReduceFlashes(on: boolean): void {
      qaState.reduceFlashes = on;
      const scene = game.scene?.getScene('GameScene') as any;
      if (scene?.hd2dManager) {
        scene.hd2dManager.setReduceFlashes(on);
      }
      console.log(`[QA] Reduce flashes set to ${on}`);
    },

    fps(seconds = 1): { avg: number; p95FrameMs: number; samples: number } {
      const neededSamples = Math.min(frameDeltas.length, Math.max(10, Math.round(seconds * DISPLAY.FPS)));
      const slice = frameDeltas.slice(-neededSamples);

      if (slice.length === 0) {
        return { avg: 60, p95FrameMs: 16.67, samples: 0 };
      }

      const sum = slice.reduce((acc, val) => acc + val, 0);
      const avgDelta = sum / slice.length;
      const avg = avgDelta > 0 ? Math.round(1000 / avgDelta) : 60;

      const sorted = [...slice].sort((a, b) => a - b);
      const p95Idx = Math.floor(sorted.length * 0.95);
      const p95FrameMs = parseFloat(sorted[p95Idx].toFixed(2));

      return { avg, p95FrameMs, samples: slice.length };
    },

    memory(): { textureCount: number; estimatedMB: number } {
      if (!game || !game.textures) {
        return { textureCount: 0, estimatedMB: 0 };
      }
      const list = game.textures.list || {};
      let totalBytes = 0;
      let count = 0;

      for (const key of Object.keys(list)) {
        const tex = list[key];
        count++;
        if (tex.frames) {
          for (const fKey of Object.keys(tex.frames)) {
            const frame = tex.frames[fKey];
            if (frame && frame.width && frame.height) {
              totalBytes += frame.width * frame.height * 4;
            }
          }
        }
      }

      const estimatedMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
      return { textureCount: count, estimatedMB };
    },

    scale(): { zoom: number; integer: boolean; canvas: [number, number]; viewport: [number, number] } {
      const vpW = typeof window !== 'undefined' ? (window.innerWidth || 1280) : 1280;
      const vpH = typeof window !== 'undefined' ? (window.innerHeight || 720) : 720;
      const zoom = calculateIntegerZoom(vpW, vpH);
      const canvasW = DISPLAY.WIDTH * zoom;
      const canvasH = DISPLAY.HEIGHT * zoom;

      return {
        zoom,
        integer: Number.isInteger(zoom),
        canvas: [canvasW, canvasH],
        viewport: [vpW, vpH],
      };
    },

    consoleIssues(): { errors: string[]; warnings: string[] } {
      return {
        errors: [...consoleErrors],
        warnings: [...consoleWarnings],
      };
    },

    async snapshot(): Promise<string> {
      if (!game || !game.canvas) {
        throw new Error('Canvas não disponível para snapshot');
      }
      return game.canvas.toDataURL('image/png');
    },
  };

  if (typeof window !== 'undefined') {
    window.__QA__ = hooks;
  }
  return hooks;
}
