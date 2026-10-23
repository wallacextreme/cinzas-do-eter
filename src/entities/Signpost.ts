/**
 * Signpost — A simple interactable entity for testing the interaction system.
 */

import type { InteractableEntity } from '@entities/InteractableEntity.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

export class Signpost implements InteractableEntity {
  id: string;
  x: number;
  y: number;
  interactionRadius: number = 48;
  message: string;

  constructor(id: string, x: number, y: number, message: string) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.message = message;
  }

  canInteract(): boolean {
    return true; // Always interactable
  }

  onInteract(): void {
    console.log(`[Signpost] Interacted! Message: ${this.message}`);
    EventBus.emit('dialog:start', { dialogId: `dialogue_${this.id}` });
  }
}
