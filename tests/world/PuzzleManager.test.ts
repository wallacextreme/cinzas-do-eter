import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PuzzleManager, ECHO_CAVE_PUZZLE_ID } from '@world/dungeon/PuzzleManager.ts';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('PuzzleManager', () => {
  let dungeonState: DungeonStateManager;
  let puzzleManager: PuzzleManager;

  beforeEach(() => {
    dungeonState = new DungeonStateManager();
    puzzleManager = new PuzzleManager(ECHO_CAVE_PUZZLE_ID, ['pillar_amber', 'pillar_violet', 'pillar_celeste'], dungeonState);
  });

  it('initializes in an unsolved state with step 0', () => {
    expect(puzzleManager.isSolved()).toBe(false);
    expect(puzzleManager.getCurrentStep()).toBe(0);
    expect(puzzleManager.getActivatedPillars()).toEqual([]);
  });

  it('progresses through the correct sequence and completes the puzzle', () => {
    const solvedSpy = vi.fn();
    EventBus.on('puzzle:solved', solvedSpy);

    // Step 1: Amber
    const res1 = puzzleManager.interactPillar('pillar_amber');
    expect(res1.success).toBe(true);
    expect(res1.isComplete).toBe(false);
    expect(res1.isReset).toBe(false);
    expect(res1.currentStep).toBe(1);
    expect(puzzleManager.getCurrentStep()).toBe(1);
    expect(puzzleManager.getActivatedPillars()).toEqual(['pillar_amber']);
    expect(puzzleManager.isSolved()).toBe(false);

    // Step 2: Violet
    const res2 = puzzleManager.interactPillar('pillar_violet');
    expect(res2.success).toBe(true);
    expect(res2.isComplete).toBe(false);
    expect(res2.isReset).toBe(false);
    expect(res2.currentStep).toBe(2);
    expect(puzzleManager.getActivatedPillars()).toEqual(['pillar_amber', 'pillar_violet']);
    expect(puzzleManager.isSolved()).toBe(false);

    // Step 3: Celeste (Final)
    const res3 = puzzleManager.interactPillar('pillar_celeste');
    expect(res3.success).toBe(true);
    expect(res3.isComplete).toBe(true);
    expect(res3.isReset).toBe(false);
    expect(res3.currentStep).toBe(3);
    expect(puzzleManager.getActivatedPillars()).toEqual(['pillar_amber', 'pillar_violet', 'pillar_celeste']);
    expect(puzzleManager.isSolved()).toBe(true);

    // Verifies DungeonState and EventBus
    expect(dungeonState.isPuzzleSolved(ECHO_CAVE_PUZZLE_ID)).toBe(true);
    expect(dungeonState.getFlag('bridge_active')).toBe(true);
    expect(solvedSpy).toHaveBeenCalledWith({ puzzleId: ECHO_CAVE_PUZZLE_ID });

    EventBus.off('puzzle:solved', solvedSpy);
  });

  it('resets sequence on incorrect pillar activation and notifies EventBus', () => {
    const resetSpy = vi.fn();
    EventBus.on('puzzle:reset', resetSpy);

    // Step 1: Amber (correct)
    puzzleManager.interactPillar('pillar_amber');
    expect(puzzleManager.getCurrentStep()).toBe(1);

    // Step 2: Celeste (wrong, expected Violet)
    const resWrong = puzzleManager.interactPillar('pillar_celeste');
    expect(resWrong.success).toBe(false);
    expect(resWrong.isComplete).toBe(false);
    expect(resWrong.isReset).toBe(true);
    expect(resWrong.currentStep).toBe(0);
    expect(puzzleManager.getCurrentStep()).toBe(0);
    expect(puzzleManager.getActivatedPillars()).toEqual([]);
    expect(puzzleManager.isSolved()).toBe(false);
    expect(resetSpy).toHaveBeenCalledWith({ puzzleId: ECHO_CAVE_PUZZLE_ID });

    EventBus.off('puzzle:reset', resetSpy);
  });

  it('allows full resolution after a previous reset', () => {
    // Fail first
    puzzleManager.interactPillar('pillar_violet'); // wrong first step
    expect(puzzleManager.getCurrentStep()).toBe(0);

    // Then perform correct sequence
    puzzleManager.interactPillar('pillar_amber');
    puzzleManager.interactPillar('pillar_violet');
    const finalRes = puzzleManager.interactPillar('pillar_celeste');

    expect(finalRes.isComplete).toBe(true);
    expect(puzzleManager.isSolved()).toBe(true);
  });

  it('remains peaceful and completed upon subsequent pillar interactions once solved', () => {
    // Solve it
    puzzleManager.interactPillar('pillar_amber');
    puzzleManager.interactPillar('pillar_violet');
    puzzleManager.interactPillar('pillar_celeste');
    expect(puzzleManager.isSolved()).toBe(true);

    // Interact again with any pillar
    const res = puzzleManager.interactPillar('pillar_amber');
    expect(res.success).toBe(true);
    expect(res.isComplete).toBe(true);
    expect(res.isReset).toBe(false);
    expect(puzzleManager.isSolved()).toBe(true);
  });

  it('supports resetAll without throwing errors', () => {
    puzzleManager.interactPillar('pillar_amber');
    puzzleManager.interactPillar('pillar_violet');
    puzzleManager.interactPillar('pillar_celeste');
    expect(puzzleManager.isSolved()).toBe(true);

    puzzleManager.resetAll();
    expect(puzzleManager.isSolved()).toBe(false);
    expect(puzzleManager.getCurrentStep()).toBe(0);
    expect(dungeonState.getFlag('bridge_active')).toBe(false);
  });
});
