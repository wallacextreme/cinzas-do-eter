/**
 * GameStateManager — Core Game State
 *
 * Manages the high-level phases of the game.
 * Ensures only valid state transitions occur.
 * Emits events via EventBus when state changes.
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';

export type GamePhase = 
  | 'BOOT' 
  | 'LOADING' 
  | 'EXPLORING' 
  | 'DIALOGUE'
  | 'MENU' 
  | 'PAUSED'
  | 'BATTLE'; // BATTLE added for future FASE 4

export class GameStateManager {
  private currentPhase: GamePhase = 'BOOT';

  // Defines valid transitions from each state
  private validTransitions: Record<GamePhase, GamePhase[]> = {
    'BOOT': ['LOADING'],
    'LOADING': ['EXPLORING'],
    'EXPLORING': ['MENU', 'PAUSED', 'BATTLE', 'LOADING', 'DIALOGUE'],
    'DIALOGUE': ['EXPLORING'],
    'MENU': ['EXPLORING'],
    'PAUSED': ['EXPLORING'],
    'BATTLE': ['EXPLORING'], // Return to exploring after battle
  };

  /**
   * Gets the current game phase.
   */
  getPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Attempts to transition to a new phase.
   * Throws an error if the transition is invalid.
   */
  transitionTo(newPhase: GamePhase): void {
    const allowed = this.validTransitions[this.currentPhase];
    
    if (!allowed.includes(newPhase)) {
      throw new Error(`[GameStateManager] Invalid transition from ${this.currentPhase} to ${newPhase}`);
    }

    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;

    EventBus.emit('game:phaseChange', { from: oldPhase, to: newPhase });
  }

  /**
   * Checks if the game is in an active gameplay state (not paused/menu/boot).
   */
  isGameplayActive(): boolean {
    return this.currentPhase === 'EXPLORING' || this.currentPhase === 'BATTLE';
  }
}

// Singleton instance for global access across systems
export const gameState = new GameStateManager();
