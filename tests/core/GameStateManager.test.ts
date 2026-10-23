/**
 * GameStateManager — Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('GameStateManager', () => {
  let stateManager: GameStateManager;

  beforeEach(() => {
    stateManager = new GameStateManager();
    EventBus.removeAll('game:phaseChange'); // Clear listeners
  });

  it('starts in BOOT phase', () => {
    expect(stateManager.getPhase()).toBe('BOOT');
    expect(stateManager.isGameplayActive()).toBe(false);
  });

  it('allows valid transitions (BOOT -> LOADING -> EXPLORING)', () => {
    stateManager.transitionTo('LOADING');
    expect(stateManager.getPhase()).toBe('LOADING');
    
    stateManager.transitionTo('EXPLORING');
    expect(stateManager.getPhase()).toBe('EXPLORING');
    expect(stateManager.isGameplayActive()).toBe(true);

    // Test map transition
    stateManager.transitionTo('LOADING');
    expect(stateManager.getPhase()).toBe('LOADING');
    expect(stateManager.isGameplayActive()).toBe(false);

    stateManager.transitionTo('EXPLORING');
    expect(stateManager.getPhase()).toBe('EXPLORING');
  });

  it('throws on invalid transitions', () => {
    // Cannot go from BOOT directly to EXPLORING
    expect(() => {
      stateManager.transitionTo('EXPLORING');
    }).toThrow(/Invalid transition/);
    
    // Phase should remain unchanged
    expect(stateManager.getPhase()).toBe('BOOT');
  });

  it('emits event on transition', () => {
    const spy = vi.fn();
    EventBus.on('game:phaseChange', spy);

    stateManager.transitionTo('LOADING');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ from: 'BOOT', to: 'LOADING' });
  });

  it('handles pause and menu states', () => {
    stateManager.transitionTo('LOADING');
    stateManager.transitionTo('EXPLORING');
    
    // Pause game
    stateManager.transitionTo('PAUSED');
    expect(stateManager.isGameplayActive()).toBe(false);
    
    // Unpause game
    stateManager.transitionTo('EXPLORING');
    expect(stateManager.isGameplayActive()).toBe(true);

    // Open menu
    stateManager.transitionTo('MENU');
    expect(stateManager.isGameplayActive()).toBe(false);
  });

  it('handles DIALOGUE phase transitions and invariants', () => {
    stateManager.transitionTo('LOADING');
    stateManager.transitionTo('EXPLORING');

    // Transition to DIALOGUE
    stateManager.transitionTo('DIALOGUE');
    expect(stateManager.getPhase()).toBe('DIALOGUE');
    expect(stateManager.isGameplayActive()).toBe(false);

    // Cannot transition directly from DIALOGUE to MENU or PAUSED
    expect(() => {
      stateManager.transitionTo('MENU');
    }).toThrow(/Invalid transition/);

    expect(() => {
      stateManager.transitionTo('PAUSED');
    }).toThrow(/Invalid transition/);

    // Return to EXPLORING
    stateManager.transitionTo('EXPLORING');
    expect(stateManager.getPhase()).toBe('EXPLORING');
    expect(stateManager.isGameplayActive()).toBe(true);
  });
});
