/**
 * PlayerSprite — Phaser Visual Representation
 *
 * Handles rendering and physical movement of the player within the game world.
 * Uses placeholder textures from PreloadScene in FASE 1.
 * Integrates with InputManager for movement logic.
 */

import Phaser from 'phaser';
import type { InputManager } from '@systems/InputManager.ts';
import type { PlayerState } from '@entities/Player.ts';
import { SPRITE } from '@config/constants.ts';
import { TEX } from '@scenes/PreloadScene.ts';
import { gameState } from '@core/GameStateManager.ts';

export class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  private inputManager: InputManager;
  private playerState: PlayerState;
  
  // Movement speed in pixels per second. 
  // Base speed: 5 tiles per second (80px/s)
  private speed = SPRITE.TILE_SIZE * 5;
  
  private facingDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'DOWN';

  constructor(scene: Phaser.Scene, x: number, y: number, playerState: PlayerState, inputManager: InputManager) {
    const defaultTexture = scene.textures?.exists('char_kael_field') ? 'char_kael_field' : TEX.PLAYER;
    super(scene, x, y, defaultTexture, 0);
    
    this.scene = scene;
    this.playerState = playerState;
    this.inputManager = inputManager;

    // Add to scene and enable physics
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    // Setup physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // Set a smaller collision box (bottom half of the sprite) for top-down perspective
    const hitboxWidth = SPRITE.CHAR_WIDTH - 8;
    const hitboxHeight = SPRITE.CHAR_HEIGHT / 2;
    body.setSize(hitboxWidth, hitboxHeight);
    
    // Offset the hitbox to the bottom center
    body.setOffset(4, SPRITE.CHAR_HEIGHT / 2);
    
    body.setCollideWorldBounds(true);

    // Initial idle animation
    if (this.scene.anims?.exists('kael_idle_down')) {
      this.play('kael_idle_down');
    }
  }

  /**
   * Called every frame from the scene's update loop.
   */
  update(): void {
    if (!this.active || !this.inputManager.isEnabled()) {
      return;
    }

    // Freeze player during dialogue and preserve idle orientation
    if (gameState.getPhase() === 'DIALOGUE') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(0, 0);
      }
      this.playIdleAnimation();
      return;
    }

    this.handleMovement();
    this.updateAnimation();
  }

  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    let vx = 0;
    let vy = 0;

    if (this.inputManager.isActionDown('MOVE_UP')) {
      vy = -1;
      this.facingDirection = 'UP';
    } else if (this.inputManager.isActionDown('MOVE_DOWN')) {
      vy = 1;
      this.facingDirection = 'DOWN';
    }

    if (this.inputManager.isActionDown('MOVE_LEFT')) {
      vx = -1;
      this.facingDirection = 'LEFT';
    } else if (this.inputManager.isActionDown('MOVE_RIGHT')) {
      vx = 1;
      this.facingDirection = 'RIGHT';
    }

    // Normalize diagonal movement to maintain consistent speed
    if (vx !== 0 && vy !== 0) {
      const length = Math.sqrt(vx * vx + vy * vy);
      vx /= length;
      vy /= length;
    }

    body.setVelocity(vx * this.speed, vy * this.speed);
  }

  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isMoving = body && (Math.abs(body.velocity.x) > 1 || Math.abs(body.velocity.y) > 1);
    const dirKey = this.facingDirection.toLowerCase();

    if (isMoving) {
      const walkAnim = `kael_walk_${dirKey}`;
      if (this.anims.currentAnim?.key !== walkAnim && this.scene.anims?.exists(walkAnim)) {
        this.play(walkAnim);
      }
    } else {
      this.playIdleAnimation();
    }
  }

  private playIdleAnimation(): void {
    const dirKey = this.facingDirection.toLowerCase();
    const idleAnim = `kael_idle_${dirKey}`;
    if (this.anims.currentAnim?.key !== idleAnim && this.scene.anims?.exists(idleAnim)) {
      this.play(idleAnim);
    }
  }

  /**
   * Retrieves the logical state associated with this sprite.
   */
  getPlayerState(): PlayerState {
    return this.playerState;
  }
  
  /**
   * Retrieves the current facing direction.
   */
  getFacingDirection(): 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' {
    return this.facingDirection;
  }

  /**
   * Sets the facing direction and updates idle sprite frame accordingly.
   */
  setFacingDirection(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    this.facingDirection = direction;
    this.playIdleAnimation();
  }
}
