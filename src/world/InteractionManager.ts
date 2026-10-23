/**
 * InteractionManager — Handles player interactions with the world
 *
 * Detects interactable entities in range and proper facing direction,
 * displays the prompt, and handles input consumption.
 */

import type { PlayerSprite } from '@entities/PlayerSprite.ts';
import type { InteractableEntity } from '@entities/InteractableEntity.ts';
import type { InputManager } from '@systems/InputManager.ts';
import { InteractionPrompt } from '@ui/InteractionPrompt.ts';
import { GameStateManager, gameState as globalGameState } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import Phaser from 'phaser';

export class InteractionManager {
  private entities: InteractableEntity[] = [];
  private player: PlayerSprite;
  private inputManager: InputManager;
  private prompt: InteractionPrompt;
  private activeEntity: InteractableEntity | null = null;
  private gameState: GameStateManager;

  constructor(
    scene: Phaser.Scene,
    player: PlayerSprite,
    inputManager: InputManager,
    gameStateManager?: GameStateManager
  ) {
    this.player = player;
    this.inputManager = inputManager;
    this.prompt = new InteractionPrompt(scene);
    this.gameState = gameStateManager ?? globalGameState;

    EventBus.on('shop:open', this.handleShopOpen, this);
  }

  private handleShopOpen(): void {
    this.activeEntity = null;
    this.prompt.hide();
  }

  registerEntity(entity: InteractableEntity): void {
    this.entities.push(entity);
  }

  unregisterEntity(id: string): void {
    this.entities = this.entities.filter(e => e.id !== id);
    if (this.activeEntity?.id === id) {
      this.activeEntity = null;
      this.prompt.hide();
    }
  }

  update(): void {
    if (this.gameState.getPhase() === 'DIALOGUE') {
      if (this.activeEntity) {
        this.activeEntity = null;
      }
      this.prompt.hide();
      return;
    }

    // Determine closest interactable entity
    let closestEntity: InteractableEntity | null = null;
    let closestDist = Infinity;

    const px = this.player.x;
    const py = this.player.y;
    const facing = this.player.getFacingDirection();

    for (const entity of this.entities) {
      if (!entity.canInteract()) continue;

      const dist = Phaser.Math.Distance.Between(px, py, entity.x, entity.y);
      if (dist <= entity.interactionRadius && dist < closestDist) {
        // Check facing direction
        const dx = entity.x - px;
        const dy = entity.y - py;
        let isFacing = false;

        // Facing check (4-way)
        if (facing === 'RIGHT' && dx > 0 && Math.abs(dx) >= Math.abs(dy)) isFacing = true;
        if (facing === 'LEFT' && dx < 0 && Math.abs(dx) >= Math.abs(dy)) isFacing = true;
        if (facing === 'DOWN' && dy > 0 && Math.abs(dy) >= Math.abs(dx)) isFacing = true;
        if (facing === 'UP' && dy < 0 && Math.abs(dy) >= Math.abs(dx)) isFacing = true;

        // Allow some leniency for overlapping entities
        if (dist < entity.interactionRadius / 2) {
          isFacing = true;
        }

        if (isFacing) {
          closestEntity = entity;
          closestDist = dist;
        }
      }
    }

    // Update active entity and prompt
    if (closestEntity !== this.activeEntity) {
      this.activeEntity = closestEntity;
      if (this.activeEntity) {
        this.prompt.show(this.activeEntity.x, this.activeEntity.y);
      } else {
        this.prompt.hide();
      }
    }

    // Handle input consumption
    // If the input manager is enabled and CONFIRM is pressed
    if (this.activeEntity && this.inputManager.isEnabled() && this.inputManager.isActionJustPressed('CONFIRM')) {
      // Consume the input so other systems (like Dialog) don't immediately trigger it again
      this.inputManager.consumeAction('CONFIRM');
      this.activeEntity.onInteract();
    }
  }

  destroy(): void {
    EventBus.off('shop:open', this.handleShopOpen, this);
  }
}
