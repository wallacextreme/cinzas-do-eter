import { describe, it, expect, vi } from 'vitest';
import {
  validateManifestStructure,
  getAssetById,
  getAssetsByType,
  AssetLoader,
} from '../../src/art/AssetLoader.ts';
import type { AssetManifest } from '../../src/art/AssetLoader.ts';

describe('src/art/AssetLoader.ts', () => {
  const sampleManifest: AssetManifest = {
    version: 1,
    strict: true,
    assets: [
      {
        id: 'char_kael',
        path: 'assets/characters/char_kael_32x48.png',
        type: 'char',
        frame: [32, 48],
        grid: [4, 4],
        status: 'DRAFT',
      },
      {
        id: 'icon_potion',
        path: 'assets/icons/icon_potion_16x16.png',
        type: 'icon',
        status: 'APPROVED',
      },
      {
        id: 'bg_battle',
        path: 'assets/backgrounds/bg_battle_384x216.png',
        type: 'bg',
        status: 'APPROVED',
      },
    ],
  };

  it('valida estrutura correta de manifesto', () => {
    const res = validateManifestStructure(sampleManifest);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('detecta campos obrigatórios ausentes ou tipos inválidos', () => {
    const invalidManifest = {
      version: '1', // string em vez de número
      strict: 'true',
      assets: [
        { path: 'no_id.png', type: 'prop' }, // sem id
        { id: 'dup', path: 'p1.png', type: 'prop' },
        { id: 'dup', path: 'p2.png', type: 'prop' }, // id duplicado
      ],
    };
    const res = validateManifestStructure(invalidManifest);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('version'))).toBe(true);
    expect(res.errors.some(e => e.includes('strict'))).toBe(true);
    expect(res.errors.some(e => e.includes('id" obrigatório ausente'))).toBe(true);
    expect(res.errors.some(e => e.includes('id duplicado'))).toBe(true);
  });

  it('busca asset por id e filtra por categoria/tipo', () => {
    const kael = getAssetById(sampleManifest, 'char_kael');
    expect(kael).toBeDefined();
    expect(kael?.type).toBe('char');

    const notFound = getAssetById(sampleManifest, 'non_existent');
    expect(notFound).toBeUndefined();

    const icons = getAssetsByType(sampleManifest, 'icon');
    expect(icons.length).toBe(1);
    expect(icons[0].id).toBe('icon_potion');
  });

  it('enfileira spritesheets e imagens em mock de cena Phaser', () => {
    const loader = new AssetLoader(sampleManifest);
    const mockScene = {
      textures: {
        exists: vi.fn().mockReturnValue(false),
      },
      load: {
        spritesheet: vi.fn(),
        image: vi.fn(),
        once: vi.fn(),
      },
    };

    const queued = loader.queueManifestAssets(mockScene);
    expect(queued).toBe(3);
    expect(mockScene.load.spritesheet).toHaveBeenCalledWith(
      'char_kael',
      'assets/characters/char_kael_32x48.png',
      { frameWidth: 32, frameHeight: 48 }
    );
    expect(mockScene.load.image).toHaveBeenCalledWith(
      'icon_potion',
      'assets/icons/icon_potion_16x16.png'
    );
  });

  it('não enfileira assets já existentes no cache de texturas do Phaser', () => {
    const loader = new AssetLoader(sampleManifest);
    const mockScene = {
      textures: {
        exists: vi.fn((id: string) => id === 'char_kael'),
      },
      load: {
        spritesheet: vi.fn(),
        image: vi.fn(),
        once: vi.fn(),
      },
    };

    const queued = loader.queueManifestAssets(mockScene);
    expect(queued).toBe(2);
    expect(mockScene.load.spritesheet).not.toHaveBeenCalled();
    expect(loader.isLoaded('char_kael')).toBe(true);
  });

  it('rastreia falha e ativa fallback ao receber erro de carregamento', () => {
    const loader = new AssetLoader(sampleManifest);
    const listeners: Record<string, () => void> = {};
    const mockScene = {
      textures: { exists: vi.fn().mockReturnValue(false) },
      load: {
        spritesheet: vi.fn(),
        image: vi.fn(),
        once: vi.fn((event: string, cb: () => void) => {
          listeners[event] = cb;
        }),
      },
    };

    loader.queueManifestAssets(mockScene);
    expect(loader.hasFailed('icon_potion')).toBe(false);

    // Simula erro de carregamento do arquivo
    listeners['loaderror-icon_potion']?.();
    expect(loader.hasFailed('icon_potion')).toBe(true);
  });
});
