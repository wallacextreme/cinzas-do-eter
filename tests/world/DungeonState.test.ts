import { describe, it, expect, beforeEach } from 'vitest';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';

describe('DungeonStateManager', () => {
  let state: DungeonStateManager;

  beforeEach(() => {
    state = new DungeonStateManager();
  });

  it('initializes with empty default state', () => {
    expect(state.isPuzzleSolved('puzzle_1')).toBe(false);
    expect(state.getChestState('chest_1')).toBe('CLOSED');
    expect(state.isChestOpened('chest_1')).toBe(false);
    expect(state.getFlag('flag_1')).toBe(false);
  });

  it('correctly sets and retrieves puzzle status', () => {
    state.setPuzzleSolved('echo_cave_crystals', true);
    expect(state.isPuzzleSolved('echo_cave_crystals')).toBe(true);

    state.setPuzzleSolved('echo_cave_crystals', false);
    expect(state.isPuzzleSolved('echo_cave_crystals')).toBe(false);
  });

  it('correctly sets and retrieves chest state', () => {
    expect(state.getChestState('chest_amber')).toBe('CLOSED');
    expect(state.isChestOpened('chest_amber')).toBe(false);

    state.setChestState('chest_amber', 'OPENED');
    expect(state.getChestState('chest_amber')).toBe('OPENED');
    expect(state.isChestOpened('chest_amber')).toBe(true);
  });

  it('correctly tracks environmental flags', () => {
    expect(state.getFlag('bridge_active')).toBe(false);

    state.setFlag('bridge_active', true);
    expect(state.getFlag('bridge_active')).toBe(true);
  });

  it('resets all dungeon state', () => {
    state.setPuzzleSolved('p1', true);
    state.setChestState('c1', 'OPENED');
    state.setFlag('f1', true);

    state.reset();

    expect(state.isPuzzleSolved('p1')).toBe(false);
    expect(state.getChestState('c1')).toBe('CLOSED');
    expect(state.getFlag('f1')).toBe(false);
  });

  it('supports serialization and deserialization for future persistence', () => {
    state.setPuzzleSolved('p1', true);
    state.setChestState('c1', 'OPENED');
    state.setFlag('f1', true);

    const serialized = state.serialize();
    expect(typeof serialized).toBe('string');

    const newState = new DungeonStateManager();
    const success = newState.deserialize(serialized);
    expect(success).toBe(true);
    expect(newState.isPuzzleSolved('p1')).toBe(true);
    expect(newState.getChestState('c1')).toBe('OPENED');
    expect(newState.getFlag('f1')).toBe(true);
  });

  it('handles corrupted deserialization gracefully without crashing', () => {
    const success = state.deserialize('invalid-json');
    expect(success).toBe(false);
  });
});
