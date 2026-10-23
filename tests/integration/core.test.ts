/**
 * FASE 1 — Integration Tests
 *
 * Verifies that the core systems of FASE 1 interact correctly.
 * - GameStateManager
 * - EventBus
 * - Player
 * - SaveManager
 * - Math utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameStateManager } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { createDefaultPlayer, damagePlayer, addPlayerXp } from '@entities/Player.ts';
import { SaveManager } from '@save/SaveManager.ts';

// Mock localStorage for SaveManager
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value.toString(); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
  };
})();

describe('FASE 1 Core Integration', () => {
  let stateManager: GameStateManager;
  let saveManager: SaveManager;

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    
    stateManager = new GameStateManager();
    saveManager = new SaveManager();
    
    localStorage.clear();
    EventBus.removeAll();
    
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orchestrates a full gameplay loop (State -> Player -> Save -> State)', () => {
    // 1. Boot to Exploring
    const phaseSpy = vi.fn();
    EventBus.on('game:phaseChange', phaseSpy);

    stateManager.transitionTo('LOADING');
    stateManager.transitionTo('EXPLORING');
    
    expect(stateManager.isGameplayActive()).toBe(true);
    expect(phaseSpy).toHaveBeenCalledTimes(2);

    // 2. Initialize Player and apply gameplay events
    const player = createDefaultPlayer();
    
    // Take damage, gain XP
    damagePlayer(player, 30);
    addPlayerXp(player, 25);
    
    expect(player.hp).toBe(player.maxHp - 30);
    expect(player.xp).toBe(25);

    // 3. Save the game state
    const saveSuccess = saveManager.saveGame(1, {
      playtime: 3600,
      player,
    });
    
    expect(saveSuccess).toBe(true);

    // 4. Pause the game
    stateManager.transitionTo('PAUSED');
    expect(stateManager.isGameplayActive()).toBe(false);

    // 5. Load the game back and verify integrity
    const loadedData = saveManager.loadGame(1);
    expect(loadedData).not.toBeNull();
    expect(loadedData!.player.hp).toBe(120); // 150 - 30
    expect(loadedData!.player.xp).toBe(25);
    expect(loadedData!.playtime).toBe(3600);
    
    // 6. Resume exploring
    stateManager.transitionTo('EXPLORING');
    expect(stateManager.isGameplayActive()).toBe(true);
  });
});
