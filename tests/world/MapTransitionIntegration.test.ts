import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing any modules that might use it
vi.mock('phaser', () => {
  return {
    default: {
      Physics: { Arcade: { Body: class {} } },
      Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: 'fadeout', FADE_IN_COMPLETE: 'fadein' } } },
      Scene: class {},
      Geom: {
        Rectangle: class {
          x: number;
          y: number;
          width: number;
          height: number;
          constructor(x: number, y: number, width: number, height: number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
          }
        }
      }
    },
    Scene: class {}
  };
});

import { MapTransitionManager } from '@world/MapTransitionManager.ts';
import { gameState } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { lumenVillageMap } from '@world/maps/LumenVillageMap.ts';
import { ashPlainsMap } from '@world/maps/AshPlainsMap.ts';
import { echoCaveEntranceMap } from '@world/maps/EchoCaveEntranceMap.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';

describe('MapTransitionIntegration (Vila ↔ Planície ↔ Gruta do Eco)', () => {
  let transitionManager: MapTransitionManager;
  let mockScene: any;
  let mockMapManager: any;
  let mockPlayer: any;
  let currentLoadedMapId: string;

  beforeEach(() => {
    // Ensure GameStateManager is in EXPLORING state
    if (gameState.getPhase() !== 'EXPLORING') {
      if (gameState.getPhase() === 'BOOT') gameState.transitionTo('LOADING');
      if (gameState.getPhase() !== 'EXPLORING') gameState.transitionTo('EXPLORING');
    }

    currentLoadedMapId = 'lumen_village';

    mockScene = {
      cameras: {
        main: {
          fadeOut: vi.fn(),
          fadeIn: vi.fn(),
          once: vi.fn((_event, cb) => {
            cb(); // Immediately execute callback in tests
          }),
          setBounds: vi.fn(),
        }
      }
    };

    mockMapManager = {
      getCurrentMapId: vi.fn(() => currentLoadedMapId),
      loadMap: vi.fn((_scene, mapData) => {
        currentLoadedMapId = mapData.id;
        return {};
      }),
      getBounds: vi.fn(() => {
        if (currentLoadedMapId === 'lumen_village') return { width: 960, height: 640 };
        if (currentLoadedMapId === 'ash_plains') return { width: 512, height: 640 };
        if (currentLoadedMapId === 'echo_cave') return { width: 384, height: 288 };
        return { width: 100, height: 100 };
      })
    };

    mockPlayer = {
      body: { setVelocity: vi.fn() },
      setPosition: vi.fn(),
      setFacingDirection: vi.fn((dir: string) => { mockPlayer.facingDirection = dir; }),
      getFacingDirection: vi.fn(() => mockPlayer.facingDirection),
      facingDirection: 'DOWN'
    };

    transitionManager = new MapTransitionManager(mockScene as any, mockMapManager as any, mockPlayer as any);
    transitionManager.registerMap(lumenVillageMap);
    transitionManager.registerMap(ashPlainsMap);
    transitionManager.registerMap(echoCaveEntranceMap);
  });

  it('transitions from Lumen Village to Ash Plains with correct spawn and facing', () => {
    const startListener = vi.fn();
    const endListener = vi.fn();
    EventBus.on('map:transitionStart', startListener);
    EventBus.on('map:transitionEnd', endListener);

    const success = transitionManager.transitionToMap('ash_plains', 'spawn_north');
    expect(success).toBe(true);

    // Player position updated to spawn_north (16 * 16, 2 * 16)
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(256, 32);
    // Facing direction set to DOWN
    expect(mockPlayer.facingDirection).toBe('DOWN');
    // Camera bounds updated to ash_plains dimensions (512, 640)
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 512, 640);
    // Player velocity zeroed
    expect(mockPlayer.body.setVelocity).toHaveBeenCalledWith(0, 0);
    // GameState restored to EXPLORING
    expect(gameState.getPhase()).toBe('EXPLORING');

    expect(startListener).toHaveBeenCalledWith({ from: 'lumen_village', to: 'ash_plains' });
    expect(endListener).toHaveBeenCalledWith(expect.objectContaining({ mapId: 'ash_plains' }));

    EventBus.off('map:transitionStart', startListener);
    EventBus.off('map:transitionEnd', endListener);
  });

  it('transitions back from Ash Plains to Lumen Village with correct spawn and facing', () => {
    // First in ash_plains
    currentLoadedMapId = 'ash_plains';

    const success = transitionManager.transitionToMap('lumen_village', 'spawn_south');
    expect(success).toBe(true);

    // Player position updated to spawn_south (30 * 16, 38 * 16)
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(480, 608);
    // Facing direction set to UP
    expect(mockPlayer.facingDirection).toBe('UP');
    // Camera bounds updated to lumen_village dimensions (960, 640)
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 960, 640);
    expect(gameState.getPhase()).toBe('EXPLORING');
  });

  it('transitions from Ash Plains to Echo Cave entrance and returns', () => {
    currentLoadedMapId = 'ash_plains';

    // Enter Echo Cave
    const successEnter = transitionManager.transitionToMap('echo_cave', 'spawn_entrance');
    expect(successEnter).toBe(true);
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(192, 48);
    expect(mockPlayer.facingDirection).toBe('DOWN');
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 384, 288);

    // Return to Ash Plains
    const successReturn = transitionManager.transitionToMap('ash_plains', 'spawn_south');
    expect(successReturn).toBe(true);
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(256, 576);
    expect(mockPlayer.facingDirection).toBe('UP');
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 512, 640);
  });

  it('preserves inventory and Fragmentos balance across map transitions', () => {
    const inventory = new InventoryManager();
    // Simulate player having 70 Fragmentos and 1x elixir_amber from Unit 6
    inventory.removeGold(30);
    inventory.addItem('elixir_amber', 1);

    expect(inventory.getGold()).toBe(70);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

    // Transition across all 3 maps
    transitionManager.transitionToMap('ash_plains', 'spawn_north');
    transitionManager.transitionToMap('echo_cave', 'spawn_entrance');
    transitionManager.transitionToMap('ash_plains', 'spawn_south');
    transitionManager.transitionToMap('lumen_village', 'spawn_south');

    // Data must remain completely intact
    expect(inventory.getGold()).toBe(70);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
  });

  it('rejects duplicate transition calls while transition is in progress', () => {
    // Override camera.once so it does not auto-complete immediately
    mockScene.cameras.main.once = vi.fn();

    const first = transitionManager.transitionToMap('ash_plains', 'spawn_north');
    expect(first).toBe(true);
    expect(transitionManager.getIsTransitioning()).toBe(true);

    const second = transitionManager.transitionToMap('ash_plains', 'spawn_north');
    expect(second).toBe(false);
  });

  it('safely handles non-existent map ID without crashing and recovers state', () => {
    const success = transitionManager.transitionToMap('invalid_map_id', 'spawn_north');
    expect(success).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(transitionManager.getIsTransitioning()).toBe(false);
  });

  it('safely handles non-existent spawn point ID without crashing', () => {
    const success = transitionManager.transitionToMap('ash_plains', 'non_existent_spawn');
    expect(success).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(transitionManager.getIsTransitioning()).toBe(false);
  });
});
