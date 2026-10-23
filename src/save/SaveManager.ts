/**
 * SaveManager — Persistence Foundation
 *
 * Handles serializing and saving the game state to LocalStorage.
 * Implements versioning and basic structure for FASE 1.
 */

import type { PlayerState } from '@entities/Player.ts';

export const SAVE_VERSION = 1;
const STORAGE_PREFIX = 'cinzas_do_eter_save_';

export interface GameSaveData {
  version: number;
  timestamp: number;
  playtime: number; // in seconds
  player: PlayerState;
  // Extensible for future systems:
  // inventory: InventoryState;
  // story: StoryState;
}

export class SaveManager {
  /**
   * Saves the game data to the specified slot.
   */
  saveGame(slot: number, data: Omit<GameSaveData, 'version' | 'timestamp'>): boolean {
    if (slot < 1 || slot > 3) {
      console.error(`[SaveManager] Invalid save slot: ${slot}`);
      return false;
    }

    try {
      const fullData: GameSaveData = {
        ...data,
        version: SAVE_VERSION,
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(fullData);
      localStorage.setItem(`${STORAGE_PREFIX}${slot}`, serialized);
      
      console.log(`[SaveManager] Saved successfully to slot ${slot}`);
      return true;
    } catch (e) {
      console.error(`[SaveManager] Failed to save to slot ${slot}`, e);
      return false;
    }
  }

  /**
   * Loads game data from a specified slot.
   * Performs basic validation and version checking.
   */
  loadGame(slot: number): GameSaveData | null {
    if (slot < 1 || slot > 3) {
      console.error(`[SaveManager] Invalid load slot: ${slot}`);
      return null;
    }

    try {
      const serialized = localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized) as unknown;

      if (!this.isValidSaveData(data)) {
        console.error(`[SaveManager] Save data in slot ${slot} is invalid or corrupted`);
        return null;
      }

      // Handle migrations if version < SAVE_VERSION in the future
      if (data.version !== SAVE_VERSION) {
        console.warn(`[SaveManager] Save version mismatch (found ${data.version}, expected ${SAVE_VERSION}).`);
        // We'd run migrations here. For FASE 1, we just return it if it passed validation.
      }

      return data;
    } catch (e) {
      console.error(`[SaveManager] Failed to load from slot ${slot}`, e);
      return null;
    }
  }

  /**
   * Validates if the loaded JSON object matches the GameSaveData contract.
   */
  private isValidSaveData(data: any): data is GameSaveData {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'number') return false;
    if (typeof data.timestamp !== 'number') return false;
    if (typeof data.playtime !== 'number') return false;
    if (!data.player || typeof data.player !== 'object') return false;
    
    // Validate player structure basically
    if (typeof data.player.id !== 'string') return false;
    if (typeof data.player.level !== 'number') return false;
    if (typeof data.player.hp !== 'number') return false;

    return true;
  }

  /**
   * Checks if a save exists in a slot without loading the full object.
   */
  saveExists(slot: number): boolean {
    return localStorage.getItem(`${STORAGE_PREFIX}${slot}`) !== null;
  }

  /**
   * Deletes a save in a specified slot.
   */
  deleteSave(slot: number): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${slot}`);
  }
}
