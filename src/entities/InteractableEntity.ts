/**
 * InteractableEntity — Interface for objects/NPCs that the player can interact with.
 *
 * Defines the contract for an interactable entity in the game world.
 */

export interface InteractableEntity {
  /** Unique identifier for the entity */
  id: string;
  
  /** X coordinate in world space */
  x: number;
  
  /** Y coordinate in world space */
  y: number;
  
  /** Radius in pixels within which the player can interact */
  interactionRadius: number;

  /** 
   * Returns true if the entity is currently in a state where it can be interacted with.
   */
  canInteract(): boolean;

  /**
   * Called when the player successfully interacts with this entity.
   */
  onInteract(): void;
}
