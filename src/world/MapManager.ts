/**
 * MapManager — World Generation and Collision
 *
 * FASE 1: Generates a minimal test map programmatically using placeholder
 * textures generated in PreloadScene. Defines a bounding box of walls
 * and some inner obstacles to test collision and camera boundaries.
 */

import Phaser from 'phaser';
import { SPRITE } from '@config/constants.ts';
import type { MapData, MapSpawnPoint } from '@world/maps/MapData.ts';

/**
 * Dimensions of the test map in tiles.
 * 40x30 is ~640x480 pixels, which is larger than the logical
 * resolution (384x216), allowing us to test camera scrolling.
 */
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;

export class MapManager {
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  private currentMapId: string | null = null;
  private currentMapData: MapData | null = null;

  /**
   * Loads a map from MapData definition.
   */
  loadMap(scene: Phaser.Scene, mapData: MapData): Phaser.Tilemaps.TilemapLayer {
    this.currentMapId = mapData.id;
    this.currentMapData = mapData;

    // Destroy existing map if any to prevent memory leaks
    if (this.map) {
      this.map.destroy();
    }

    this.map = scene.make.tilemap({
      tileWidth: SPRITE.TILE_SIZE,
      tileHeight: SPRITE.TILE_SIZE,
      width: mapData.width,
      height: mapData.height,
    });

    // In Phase 2, we load all possible placeholder textures in a specific order.
    // We generated 'placeholder_tileset' in PreloadScene which contains 13 tiles (0 to 12).
    const ts = this.map.addTilesetImage('placeholder_tileset', 'placeholder_tileset', SPRITE.TILE_SIZE, SPRITE.TILE_SIZE, 0, 0, 0);

    if (!ts) {
      throw new Error('[MapManager] Failed to create tileset. Ensure PreloadScene ran.');
    }

    // Both layers can use the single tileset with explicit map dimensions
    this.groundLayer = this.map.createBlankLayer('Ground', ts, 0, 0, mapData.width, mapData.height)!;
    this.wallLayer = this.map.createBlankLayer('Walls', ts, 0, 0, mapData.width, mapData.height)!;

    // Populate from data arrays
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const groundTile = mapData.groundData[y]?.[x];
        if (groundTile !== undefined && groundTile !== -1) {
          try {
            this.groundLayer.putTileAt(groundTile, x, y);
          } catch(e) {
            console.error(`[MapManager] Crash at Ground putTileAt! groundTile=${groundTile}, x=${x}, y=${y}`, e);
            throw e;
          }
        }

        const wallTile = mapData.wallData[y]?.[x];
        if (wallTile !== undefined && wallTile !== -1) {
          try {
            this.wallLayer.putTileAt(wallTile, x, y);
          } catch (e) {
            console.error(`[MapManager] Crash at Wall putTileAt! wallTile=${wallTile}, x=${x}, y=${y}`, e);
            throw e;
          }
        }
      }
    }

    this.wallLayer.setCollisionByExclusion([-1]);
    return this.wallLayer;
  }

  getGroundLayer(): Phaser.Tilemaps.TilemapLayer | null {
    return this.groundLayer || null;
  }

  getWallLayer(): Phaser.Tilemaps.TilemapLayer | null {
    return this.wallLayer || null;
  }

  setTile(layerName: 'Ground' | 'Walls', x: number, y: number, tileIndex: number): void {
    const layer = layerName === 'Ground' ? this.groundLayer : this.wallLayer;
    if (layer) {
      layer.putTileAt(tileIndex, x, y);
    }
  }

  removeTile(layerName: 'Ground' | 'Walls', x: number, y: number): void {
    const layer = layerName === 'Ground' ? this.groundLayer : this.wallLayer;
    if (layer) {
      layer.removeTileAt(x, y);
    }
  }

  recalculateWallCollisions(): void {
    if (this.wallLayer) {
      this.wallLayer.setCollisionByExclusion([-1]);
    }
  }

  getCurrentMapId(): string | null {
    return this.currentMapId;
  }
  
  getCurrentMapData(): MapData | null {
    return this.currentMapData;
  }

  getSpawnPoint(spawnId: string): MapSpawnPoint | null {
    if (!this.currentMapData) return null;
    return this.currentMapData.spawnPoints[spawnId] || null;
  }

  /**
   * Generates a programmatic test map in the given scene.
   * Returns the collision layer so the scene can add colliders.
   * Preserved for FASE 1 regression tests.
   */
  createTestMap(scene: Phaser.Scene): Phaser.Tilemaps.TilemapLayer {
    this.currentMapId = 'test_map';
    this.currentMapData = null;
    
    if (this.map) {
        this.map.destroy();
    }

    // 1. Create a blank tilemap
    this.map = scene.make.tilemap({
      tileWidth: SPRITE.TILE_SIZE,
      tileHeight: SPRITE.TILE_SIZE,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    });

    // 2. Add placeholder tileset (texture generated in PreloadScene)
    const ts = this.map.addTilesetImage('placeholder_tileset', 'placeholder_tileset', SPRITE.TILE_SIZE, SPRITE.TILE_SIZE, 0, 0);

    if (!ts) {
      throw new Error('[MapManager] Failed to create tilesets. Ensure PreloadScene ran.');
    }

    // 3. Create layers
    this.groundLayer = this.map.createBlankLayer('Ground', ts)!;
    this.wallLayer = this.map.createBlankLayer('Walls', ts)!;

    // 4. Populate map data programmatically
    // Ground: fill everything
    this.groundLayer.fill(0, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Walls: map border
    // Top & Bottom
    this.wallLayer.fill(0, 0, 0, MAP_WIDTH, 1);
    this.wallLayer.fill(0, 0, MAP_HEIGHT - 1, MAP_WIDTH, 1);
    // Left & Right
    this.wallLayer.fill(0, 0, 0, 1, MAP_HEIGHT);
    this.wallLayer.fill(0, MAP_WIDTH - 1, 0, 1, MAP_HEIGHT);

    // Inner obstacles (random blocks for testing)
    this.wallLayer.fill(1, 10, 10, 2, 2); // Small block
    this.wallLayer.fill(1, 25, 5, 1, 10); // Vertical wall
    this.wallLayer.fill(1, 5, 20, 10, 1); // Horizontal wall

    // 5. Setup collision
    // Any tile placed in the wallLayer will collide
    this.wallLayer.setCollisionByExclusion([-1]);

    return this.wallLayer;
  }

  getBounds(): Phaser.Geom.Rectangle {
    if (!this.map) {
      return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    }
    return new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }
}
