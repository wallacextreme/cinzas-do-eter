/**
 * MapManager — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Phaser completely before it gets imported by MapManager
vi.mock('phaser', () => {
  return {
    default: {
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

import { MapManager, MAP_WIDTH, MAP_HEIGHT } from '@world/MapManager.ts';

// Since MapManager heavily relies on Phaser (Tilemaps, Scene, etc.),
// we test its non-Phaser bounds logic and invariants here.
// Full tilemap collision is tested visually in the browser.

describe('MapManager', () => {
  it('should return empty bounds before initialization', () => {
    const map = new MapManager();
    const bounds = map.getBounds();
    expect(bounds.width).toBe(0);
    expect(bounds.height).toBe(0);
  });

  it('exports correct map dimensions', () => {
    expect(MAP_WIDTH).toBe(40);
    expect(MAP_HEIGHT).toBe(30);
  });

  it('handles loadMap correctly with MapData', () => {
    const map = new MapManager();
    const mockScene = {
      make: {
        tilemap: vi.fn().mockReturnValue({
          destroy: vi.fn(),
          addTilesetImage: vi.fn().mockReturnValue({}),
          createBlankLayer: vi.fn().mockReturnValue({
            putTileAt: vi.fn(),
            setCollisionByExclusion: vi.fn()
          })
        })
      }
    };
    
    const mapData = {
      id: 'test_map',
      displayName: 'Test',
      width: 10,
      height: 10,
      groundData: [],
      wallData: [],
      spawnPoints: {
        'start': { id: 'start', x: 50, y: 50 }
      },
      transitions: [],
      entities: []
    };
    
    const layer = map.loadMap(mockScene as any, mapData);
    expect(layer).toBeDefined();
    expect(map.getCurrentMapId()).toBe('test_map');
    
    const spawn = map.getSpawnPoint('start');
    expect(spawn).toEqual({ id: 'start', x: 50, y: 50 });
  });
});
