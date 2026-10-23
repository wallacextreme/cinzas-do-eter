import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { gameState } from '@core/GameStateManager.ts';
import type { MapManager } from '@world/MapManager.ts';
import type { MapData } from '@world/maps/MapData.ts';
import type { PlayerSprite } from '@entities/PlayerSprite.ts';
import Phaser from 'phaser';

/**
 * MapTransitionManager
 *
 * Handles fading out, loading the new map, positioning the player, and fading in.
 * Uses GameStateManager to prevent input/gameplay during transition.
 */
export class MapTransitionManager {
  private isTransitioning = false;
  private scene: Phaser.Scene;
  private mapManager: MapManager;
  private player: PlayerSprite;
  
  // Simulated map registry since we don't have a real asset loader yet
  private mapRegistry: Map<string, MapData> = new Map();

  constructor(scene: Phaser.Scene, mapManager: MapManager, player: PlayerSprite) {
    this.scene = scene;
    this.mapManager = mapManager;
    this.player = player;
  }

  registerMap(mapData: MapData) {
    this.mapRegistry.set(mapData.id, mapData);
  }

  /**
   * Attempts to transition to a new map.
   * Returns false if a transition is already in progress or invalid.
   */
  transitionToMap(targetMapId: string, spawnId: string): boolean {
    if (this.isTransitioning) {
      console.warn('[MapTransitionManager] Transition already in progress. Ignoring.');
      return false;
    }

    if (gameState.getPhase() !== 'EXPLORING') {
      console.warn('[MapTransitionManager] Can only transition from EXPLORING state.');
      return false;
    }

    const nextMapData = this.mapRegistry.get(targetMapId);
    if (!nextMapData) {
      console.error(`[MapTransitionManager] Map ID not found: ${targetMapId}`);
      return false;
    }

    const spawnPoint = nextMapData.spawnPoints[spawnId];
    if (!spawnPoint) {
      console.error(`[MapTransitionManager] Spawn ID not found: ${spawnId} in map ${targetMapId}`);
      return false;
    }

    this.isTransitioning = true;
    const currentMapId = this.mapManager.getCurrentMapId() || 'unknown';
    EventBus.emit('map:transitionStart', { from: currentMapId, to: targetMapId });

    // Transition state
    gameState.transitionTo('LOADING');
    
    // Stop player physics
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Fade out (30 frames at 60fps is 500ms)
    this.scene.cameras.main.fadeOut(500, 10, 6, 18); // #0A0612 roughly (10, 6, 18)

    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.executeTransition(nextMapData, spawnPoint);
    });

    return true;
  }

  private executeTransition(nextMapData: MapData, spawnPoint: { x: number; y: number; facing?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }) {
    try {
      // Load map and setup collisions
      const collisionLayer = this.mapManager.loadMap(this.scene, nextMapData);
      
      // Position player and set facing direction
      this.player.setPosition(spawnPoint.x, spawnPoint.y);
      if (spawnPoint.facing) {
        this.player.setFacingDirection(spawnPoint.facing);
      }
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(0, 0);
      }
      
      // Update camera bounds
      const bounds = this.mapManager.getBounds();
      this.scene.cameras.main.setBounds(0, 0, bounds.width, bounds.height);

      // Fade in
      this.scene.cameras.main.fadeIn(500, 10, 6, 18);
      
      this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.isTransitioning = false;
        gameState.transitionTo('EXPLORING');
        EventBus.emit('map:transitionEnd', { mapId: nextMapData.id, collisionLayer });
      });

    } catch (e) {
      console.error('[MapTransitionManager] Error during map transition execution:', e);
      // Try to recover state
      this.isTransitioning = false;
      if (gameState.getPhase() === 'LOADING') {
        gameState.transitionTo('EXPLORING');
      }
    }
  }

  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }
}
