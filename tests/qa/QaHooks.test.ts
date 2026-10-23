import { describe, it, expect, vi } from 'vitest';
import { calculateIntegerZoom, setupQaHooks } from '../../src/qa/QaHooks.ts';
import { DISPLAY } from '../../src/config/constants.ts';

describe('src/qa/QaHooks.ts', () => {
  describe('calculateIntegerZoom (HG8 - 5 resoluções canônicas)', () => {
    it('calcula zoom inteiro 3x para 1280x720 (720p)', () => {
      const zoom = calculateIntegerZoom(1280, 720);
      expect(zoom).toBe(3);
      expect(DISPLAY.WIDTH * zoom).toBe(1152);
      expect(DISPLAY.HEIGHT * zoom).toBe(648);
    });

    it('calcula zoom inteiro 3x para 1366x768', () => {
      const zoom = calculateIntegerZoom(1366, 768);
      expect(zoom).toBe(3);
    });

    it('calcula zoom inteiro 5x exato para 1920x1080 (1080p)', () => {
      const zoom = calculateIntegerZoom(1920, 1080);
      expect(zoom).toBe(5);
      expect(DISPLAY.WIDTH * zoom).toBe(1920);
      expect(DISPLAY.HEIGHT * zoom).toBe(1080);
    });

    it('calcula zoom inteiro 6x para 2560x1440 (1440p)', () => {
      const zoom = calculateIntegerZoom(2560, 1440);
      expect(zoom).toBe(6);
    });

    it('calcula zoom inteiro 10x exato para 3840x2160 (4K)', () => {
      const zoom = calculateIntegerZoom(3840, 2160);
      expect(zoom).toBe(10);
      expect(DISPLAY.WIDTH * zoom).toBe(3840);
      expect(DISPLAY.HEIGHT * zoom).toBe(2160);
    });

    it('garante zoom mínimo 1x para resoluções muito pequenas', () => {
      expect(calculateIntegerZoom(200, 150)).toBe(1);
    });
  });

  describe('Contrato window.__QA__', () => {
    it('cumpre todos os métodos exigidos por QA.md §2-G', () => {
      const mockGame = {
        isBooted: true,
        canvas: {
          style: {},
          toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
        },
        scene: {
          getScenes: vi.fn().mockReturnValue([{ scene: { key: 'GameScene' } }]),
          getScene: vi.fn().mockReturnValue({}),
        },
        textures: {
          list: {
            tex1: {
              frames: {
                __BASE: { width: 32, height: 48 },
              },
            },
          },
        },
        loop: {
          sleep: vi.fn(),
          wake: vi.fn(),
        },
        step: vi.fn(),
      };

      const hooks = setupQaHooks(mockGame);

      expect(hooks.version).toBe(1);
      expect(typeof hooks.ready).toBe('function');
      expect(typeof hooks.scenarios).toBe('function');
      expect(typeof hooks.load).toBe('function');
      expect(typeof hooks.freeze).toBe('function');
      expect(typeof hooks.step).toBe('function');
      expect(typeof hooks.play).toBe('function');
      expect(typeof hooks.setQuality).toBe('function');
      expect(typeof hooks.setTimeOfDay).toBe('function');
      expect(typeof hooks.setReduceFlashes).toBe('function');
      expect(typeof hooks.fps).toBe('function');
      expect(typeof hooks.memory).toBe('function');
      expect(typeof hooks.scale).toBe('function');
      expect(typeof hooks.consoleIssues).toBe('function');
      expect(typeof hooks.snapshot).toBe('function');

      // Testa ready()
      expect(hooks.ready()).toBe(true);

      // Testa scenarios()
      const list = hooks.scenarios();
      expect(list).toContain('V01');
      expect(list).toContain('V31');
      expect(list.length).toBe(33);

      // Testa memory()
      const mem = hooks.memory();
      expect(mem.textureCount).toBe(1);
      expect(mem.estimatedMB).toBeGreaterThan(0);

      // Testa scale()
      const sc = hooks.scale();
      expect(sc.integer).toBe(true);
      expect(Array.isArray(sc.canvas)).toBe(true);
      expect(Array.isArray(sc.viewport)).toBe(true);
    });
  });
});
