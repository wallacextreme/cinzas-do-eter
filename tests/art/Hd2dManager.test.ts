import { describe, it, expect, vi } from 'vitest';
import { Hd2dManager } from '../../src/art/Hd2dManager.ts';
import { DISPLAY } from '../../src/config/constants.ts';

describe('src/art/Hd2dManager.ts (HD-2D-lite & GraphicsSettings)', () => {
  it('inicializa com preset high, timeOfDay day e escala native por padrão', () => {
    const manager = new Hd2dManager(null);
    expect(manager.getPreset()).toBe('high');
    expect(manager.getTimeOfDay()).toBe('day');
    expect(manager.getIsInternal3x()).toBe(false);
    expect(manager.getReduceFlashes()).toBe(false);
  });

  it('permite alternar presets de qualidade (low, medium, high)', () => {
    const manager = new Hd2dManager(null);
    manager.setQuality('low');
    expect(manager.getPreset()).toBe('low');
    manager.setQuality('medium');
    expect(manager.getPreset()).toBe('medium');
    manager.setQuality('high');
    expect(manager.getPreset()).toBe('high');
  });

  it('permite alternar horários do dia (dawn, day, dusk, night)', () => {
    const manager = new Hd2dManager(null);
    manager.setTimeOfDay('dusk');
    expect(manager.getTimeOfDay()).toBe('dusk');
    manager.setTimeOfDay('night');
    expect(manager.getTimeOfDay()).toBe('night');
  });

  it('permite alternar modo de redução de flashes para acessibilidade', () => {
    const manager = new Hd2dManager(null);
    manager.setReduceFlashes(true);
    expect(manager.getReduceFlashes()).toBe(true);
    manager.setReduceFlashes(false);
    expect(manager.getReduceFlashes()).toBe(false);
  });

  it('alterna escala interna entre native (384x216) e 3x (1152x648)', () => {
    const resizeMock = vi.fn();
    const zoomMock = vi.fn();
    const mockScene = {
      game: {
        scale: {
          resize: resizeMock,
        },
      },
      cameras: {
        main: {
          setZoom: zoomMock,
        },
      },
    };

    const manager = new Hd2dManager(mockScene);
    manager.setInternalScale('3x');
    expect(manager.getIsInternal3x()).toBe(true);
    expect(resizeMock).toHaveBeenCalledWith(DISPLAY.WIDTH * 3, DISPLAY.HEIGHT * 3);
    expect(zoomMock).toHaveBeenCalledWith(3);

    manager.setInternalScale('native');
    expect(manager.getIsInternal3x()).toBe(false);
    expect(resizeMock).toHaveBeenCalledWith(DISPLAY.WIDTH, DISPLAY.HEIGHT);
    expect(zoomMock).toHaveBeenCalledWith(1);
  });
});
