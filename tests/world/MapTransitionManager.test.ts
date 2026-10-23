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

describe('MapTransitionManager', () => {
  let transitionManager: MapTransitionManager;
  let mockScene: any;
  let mockMapManager: any;
  let mockPlayer: any;

  beforeEach(() => {
    // Reset game state to EXPLORING
    if (gameState.getPhase() !== 'EXPLORING') {
      if (gameState.getPhase() === 'BOOT') gameState.transitionTo('LOADING');
      if (gameState.getPhase() !== 'EXPLORING') gameState.transitionTo('EXPLORING');
    }

    mockScene = {
      cameras: {
        main: {
          fadeOut: vi.fn(),
          fadeIn: vi.fn(),
          once: vi.fn((_event, cb) => {
            // Immediately execute the callback to simulate camera transition complete for tests
            cb();
          }),
          setBounds: vi.fn(),
        }
      }
    };

    mockMapManager = {
      getCurrentMapId: vi.fn().mockReturnValue('mapA'),
      loadMap: vi.fn().mockReturnValue({}),
      getBounds: vi.fn().mockReturnValue({ width: 100, height: 100 })
    };

    mockPlayer = {
      body: { setVelocity: vi.fn() },
      setPosition: vi.fn()
    };

    transitionManager = new MapTransitionManager(mockScene as any, mockMapManager as any, mockPlayer as any);
  });

  it('registers map data', () => {
    const mapData = {
      id: 'mapB',
      displayName: 'Map B',
      width: 10,
      height: 10,
      groundData: [],
      wallData: [],
      spawnPoints: { 'spawn1': { id: 'spawn1', x: 10, y: 20 } },
      transitions: [],
      entities: []
    };
    transitionManager.registerMap(mapData);
    
    // Transition should succeed since map is registered
    const success = transitionManager.transitionToMap('mapB', 'spawn1');
    expect(success).toBe(true);
    expect(gameState.getPhase()).toBe('EXPLORING'); // Returns to EXPLORING because callbacks execute immediately in our mock
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(10, 20);
    expect(mockMapManager.loadMap).toHaveBeenCalledWith(mockScene, mapData);
  });

  it('fails transition if map not registered', () => {
    const success = transitionManager.transitionToMap('map_invalid', 'spawn1');
    expect(success).toBe(false);
  });

  it('fails transition if spawn not found', () => {
    const mapData = {
      id: 'mapB',
      displayName: 'Map B',
      width: 10,
      height: 10,
      groundData: [],
      wallData: [],
      spawnPoints: { 'spawn1': { id: 'spawn1', x: 10, y: 20 } },
      transitions: [],
      entities: []
    };
    transitionManager.registerMap(mapData);
    
    const success = transitionManager.transitionToMap('mapB', 'invalid_spawn');
    expect(success).toBe(false);
  });

  it('prevents duplicate transitions', () => {
    const mapData = {
      id: 'mapB',
      displayName: 'Map B',
      width: 10,
      height: 10,
      groundData: [],
      wallData: [],
      spawnPoints: { 'spawn1': { id: 'spawn1', x: 10, y: 20 } },
      transitions: [],
      entities: []
    };
    transitionManager.registerMap(mapData);
    
    // Override 'once' so it DOES NOT execute the callback immediately,
    // leaving the manager in 'isTransitioning = true' state
    mockScene.cameras.main.once = vi.fn();
    
    const success1 = transitionManager.transitionToMap('mapB', 'spawn1');
    expect(success1).toBe(true);
    
    const success2 = transitionManager.transitionToMap('mapB', 'spawn1');
    expect(success2).toBe(false); // Second transition should fail
  });
});
