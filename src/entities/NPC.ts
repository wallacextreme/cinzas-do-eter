/**
 * NPC — Non-Playable Character
 *
 * Implements InteractableEntity for interaction and extends Arcade.Sprite
 * for visual representation and collision in the game world.
 */

import Phaser from 'phaser';
import type { InteractableEntity } from '@entities/InteractableEntity.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

export class NPC extends Phaser.Physics.Arcade.Sprite implements InteractableEntity {
  public readonly id: string;
  public interactionRadius: number = 48;
  
  private dialogueId: string;
  private isInteracting: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, id: string, dialogueId: string) {
    super(scene, x, y, texture);
    
    this.id = id;
    this.dialogueId = dialogueId;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Make NPC static (immovable) for physics collisions
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    
    // Adjust hitbox for top-down perspective
    body.setSize(this.width - 8, this.height / 2);
    body.setOffset(4, this.height / 2);

    EventBus.on('dialog:end', this.handleDialogEnd, this);
  }

  private handleDialogEnd(payload: { dialogId: string }): void {
    if (payload.dialogId === this.dialogueId) {
      this.isInteracting = false;
    }
  }

  canInteract(): boolean {
    return !this.isInteracting;
  }

  onInteract(): void {
    if (!this.canInteract()) return;
    
    this.isInteracting = true;
    console.log(`[NPC] ${this.id} interaction triggered. Dialogue: ${this.dialogueId}`);
    
    EventBus.emit('dialog:start', { dialogId: this.dialogueId, npcId: this.id });
  }

  destroy(fromScene?: boolean): void {
    EventBus.off('dialog:end', this.handleDialogEnd, this);
    super.destroy(fromScene);
  }
}
