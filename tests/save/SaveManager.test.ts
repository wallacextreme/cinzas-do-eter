/**
 * SaveManager — Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SaveManager, SAVE_VERSION } from '@save/SaveManager.ts';
import { createDefaultPlayer } from '@entities/Player.ts';

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

// Not needed, we will use vi.stubGlobal in beforeEach

describe('SaveManager', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    saveManager = new SaveManager();
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves and loads game data correctly', () => {
    const player = createDefaultPlayer();
    const dataToSave = {
      playtime: 120,
      player,
    };

    const success = saveManager.saveGame(1, dataToSave);
    expect(success).toBe(true);
    expect(saveManager.saveExists(1)).toBe(true);

    const loadedData = saveManager.loadGame(1);
    expect(loadedData).not.toBeNull();
    expect(loadedData!.version).toBe(SAVE_VERSION);
    expect(loadedData!.playtime).toBe(120);
    expect(loadedData!.player.name).toBe('Kaël');
  });

  it('returns null for non-existent save', () => {
    expect(saveManager.saveExists(2)).toBe(false);
    expect(saveManager.loadGame(2)).toBeNull();
  });

  it('rejects invalid slots', () => {
    const data = { playtime: 0, player: createDefaultPlayer() };
    
    expect(saveManager.saveGame(0, data)).toBe(false);
    expect(saveManager.saveGame(4, data)).toBe(false);
    
    expect(saveManager.loadGame(0)).toBeNull();
    expect(saveManager.loadGame(4)).toBeNull();
  });

  it('fails validation on corrupted data', () => {
    localStorage.setItem('cinzas_do_eter_save_1', JSON.stringify({ version: 1 })); // Missing player, timestamp, etc.
    
    const loaded = saveManager.loadGame(1);
    expect(loaded).toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('invalid or corrupted'));
  });

  it('can delete saves', () => {
    saveManager.saveGame(1, { playtime: 0, player: createDefaultPlayer() });
    expect(saveManager.saveExists(1)).toBe(true);
    
    saveManager.deleteSave(1);
    expect(saveManager.saveExists(1)).toBe(false);
  });
});
