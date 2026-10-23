/**
 * PuzzleManager — Pure TypeScript Logic for Environmental Puzzles
 *
 * Implements "Harmonia dos Três Cristais" for Gruta do Eco (R4).
 * Completely decoupled from Phaser rendering and physics.
 *
 * Expected sequence:
 * 1. Âmbar   ('pillar_amber')
 * 2. Violeta ('pillar_violet')
 * 3. Celeste ('pillar_celeste')
 *
 * Emits EventBus events:
 * - 'puzzle:solved' ({ puzzleId: string })
 * - 'puzzle:reset'  ({ puzzleId: string })
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { dungeonState, DungeonStateManager } from './DungeonState.ts';

export interface PuzzleInteractionResult {
  readonly success: boolean;
  readonly isComplete: boolean;
  readonly isReset: boolean;
  readonly currentStep: number;
  readonly activatedPillars: string[];
  readonly message: string;
}

export const ECHO_CAVE_PUZZLE_ID = 'echo_cave_crystals';
export const ECHO_CAVE_CRYSTAL_SEQUENCE: readonly string[] = [
  'pillar_amber',
  'pillar_violet',
  'pillar_celeste',
];

export class PuzzleManager {
  private readonly puzzleId: string;
  private readonly expectedSequence: readonly string[];
  private currentStep = 0;
  private activatedPillars: string[] = [];
  private stateManager: DungeonStateManager;

  constructor(
    puzzleId: string = ECHO_CAVE_PUZZLE_ID,
    expectedSequence: readonly string[] = ECHO_CAVE_CRYSTAL_SEQUENCE,
    stateManager: DungeonStateManager = dungeonState
  ) {
    this.puzzleId = puzzleId;
    this.expectedSequence = expectedSequence;
    this.stateManager = stateManager;
  }

  /**
   * Checks if this puzzle has already been completed in the current session.
   */
  isSolved(): boolean {
    return this.stateManager.isPuzzleSolved(this.puzzleId);
  }

  /**
   * Interacts with a specific crystal pillar.
   */
  interactPillar(pillarId: string): PuzzleInteractionResult {
    // If already solved, the mechanism remains active and peaceful
    if (this.isSolved()) {
      return {
        success: true,
        isComplete: true,
        isReset: false,
        currentStep: this.expectedSequence.length,
        activatedPillars: [...this.expectedSequence],
        message: 'A harmonia dos três cristais ressoa continuamente na câmara.',
      };
    }

    const expectedPillar = this.expectedSequence[this.currentStep];

    // Correct step in the sequence
    if (pillarId === expectedPillar) {
      this.activatedPillars.push(pillarId);
      this.currentStep++;

      // Check if this interaction completed the puzzle
      if (this.currentStep >= this.expectedSequence.length) {
        this.stateManager.setPuzzleSolved(this.puzzleId, true);
        this.stateManager.setFlag('bridge_active', true);
        EventBus.emit('puzzle:solved', { puzzleId: this.puzzleId });

        return {
          success: true,
          isComplete: true,
          isReset: false,
          currentStep: this.currentStep,
          activatedPillars: [...this.activatedPillars],
          message: 'Os três cristais vibram em uníssono. A Ponte de Éter se materializa sobre o abismo!',
        };
      }

      return {
        success: true,
        isComplete: false,
        isReset: false,
        currentStep: this.currentStep,
        activatedPillars: [...this.activatedPillars],
        message: 'O cristal emite um tom harmônico límpido.',
      };
    }

    // Incorrect pillar: immediate reset
    this.currentStep = 0;
    this.activatedPillars = [];
    EventBus.emit('puzzle:reset', { puzzleId: this.puzzleId });

    return {
      success: false,
      isComplete: false,
      isReset: true,
      currentStep: 0,
      activatedPillars: [],
      message: 'As frequências colidem em dissonância. O mecanismo cristalino retornou ao estado de repouso.',
    };
  }

  /**
   * Resets active in-progress sequence without un-solving if already solved.
   */
  resetSequence(): void {
    this.currentStep = 0;
    this.activatedPillars = [];
  }

  /**
   * Resets everything including solved state (useful for tests or full restart).
   */
  resetAll(): void {
    this.resetSequence();
    this.stateManager.setPuzzleSolved(this.puzzleId, false);
    this.stateManager.setFlag('bridge_active', false);
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getActivatedPillars(): readonly string[] {
    return [...this.activatedPillars];
  }

  getPuzzleId(): string {
    return this.puzzleId;
  }
}
