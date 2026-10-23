/**
 * DungeonState — Session State Management for Dungeons and World Entities
 *
 * Implements minimal decoupled state persistence for:
 * - Puzzle completion status
 * - Chest opening status (CLOSED -> OPENED)
 * - Environmental flags (e.g. ether bridge activated)
 *
 * Prepares state structure for future persistence without coupling to Phaser.
 */

export type ChestState = 'CLOSED' | 'OPENED';

export interface DungeonStateData {
  puzzles: Record<string, boolean>;
  chests: Record<string, ChestState>;
  flags: Record<string, boolean>;
}

export class DungeonStateManager {
  private data: DungeonStateData;

  constructor(initialData?: Partial<DungeonStateData>) {
    this.data = {
      puzzles: initialData?.puzzles ? { ...initialData.puzzles } : {},
      chests: initialData?.chests ? { ...initialData.chests } : {},
      flags: initialData?.flags ? { ...initialData.flags } : {},
    };
  }

  // ── Puzzles ─────────────────────────────────────────

  isPuzzleSolved(puzzleId: string): boolean {
    return !!this.data.puzzles[puzzleId];
  }

  setPuzzleSolved(puzzleId: string, solved = true): void {
    this.data.puzzles[puzzleId] = solved;
  }

  // ── Chests ──────────────────────────────────────────

  getChestState(chestId: string): ChestState {
    return this.data.chests[chestId] ?? 'CLOSED';
  }

  setChestState(chestId: string, state: ChestState): void {
    this.data.chests[chestId] = state;
  }

  isChestOpened(chestId: string): boolean {
    return this.getChestState(chestId) === 'OPENED';
  }

  // ── Flags ───────────────────────────────────────────

  getFlag(flagId: string): boolean {
    return !!this.data.flags[flagId];
  }

  setFlag(flagId: string, value = true): void {
    this.data.flags[flagId] = value;
  }

  // ── State Lifecycle ─────────────────────────────────

  reset(): void {
    this.data = {
      puzzles: {},
      chests: {},
      flags: {},
    };
  }

  serialize(): string {
    return JSON.stringify(this.data);
  }

  deserialize(rawJson: string): boolean {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed && typeof parsed === 'object') {
        this.data = {
          puzzles: parsed.puzzles && typeof parsed.puzzles === 'object' ? parsed.puzzles : {},
          chests: parsed.chests && typeof parsed.chests === 'object' ? parsed.chests : {},
          flags: parsed.flags && typeof parsed.flags === 'object' ? parsed.flags : {},
        };
        return true;
      }
    } catch {
      // Invalid JSON format
    }
    return false;
  }

  getData(): Readonly<DungeonStateData> {
    return this.data;
  }
}

/**
 * Global singleton instance for world and dungeon session state.
 */
export const dungeonState = new DungeonStateManager();
