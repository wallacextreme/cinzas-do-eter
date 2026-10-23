import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { echoCaveR4Map } from '@world/maps/EchoCaveR4Map.ts';
import { CrystalPillar } from '@entities/CrystalPillar.ts';
import { PuzzleManager, ECHO_CAVE_PUZZLE_ID } from '@world/dungeon/PuzzleManager.ts';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';
import { DialogueManager } from '@world/DialogueManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('Echo Cave R4 & Crystal Puzzle Integration', () => {
  let dungeonState: DungeonStateManager;
  let puzzleManager: PuzzleManager;
  let dialogueManager: DialogueManager;

  beforeEach(() => {
    dungeonState = new DungeonStateManager();
    puzzleManager = new PuzzleManager(ECHO_CAVE_PUZZLE_ID, ['pillar_amber', 'pillar_violet', 'pillar_celeste'], dungeonState);
    dialogueManager = new DialogueManager();
  });

  afterEach(() => {
    dialogueManager.destroy();
  });

  describe('R4: Câmara da Harmonia Map Data', () => {
    it('has valid dimensions and tile matrices', () => {
      expect(echoCaveR4Map.width).toBe(24);
      expect(echoCaveR4Map.height).toBe(18);
      expect(echoCaveR4Map.groundData.length).toBe(18);
      expect(echoCaveR4Map.wallData.length).toBe(18);
      echoCaveR4Map.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveR4Map.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('contains chasm barrier at columns 16 and 17 in wallData', () => {
      // Row 9, col 16 and 17 must be solid chasm (14) before puzzle is solved
      expect(echoCaveR4Map.wallData[9][16]).toBe(14);
      expect(echoCaveR4Map.wallData[9][17]).toBe(14);
    });

    it('contains transitions to R2 (west) and R5 (east)', () => {
      const toR2 = echoCaveR4Map.transitions.find(t => t.targetMapId === 'echo_cave_r2');
      expect(toR2).toBeDefined();
      expect(toR2?.targetSpawnId).toBe('spawn_east');

      const toR5 = echoCaveR4Map.transitions.find(t => t.targetMapId === 'echo_cave_r5');
      expect(toR5).toBeDefined();
      expect(toR5?.targetSpawnId).toBe('spawn_west');
    });

    it('contains all 3 identifiable crystal pillars as entities', () => {
      const amber = echoCaveR4Map.entities.find(e => e.entityId === 'pillar_amber');
      const violet = echoCaveR4Map.entities.find(e => e.entityId === 'pillar_violet');
      const celeste = echoCaveR4Map.entities.find(e => e.entityId === 'pillar_celeste');

      expect(amber).toBeDefined();
      expect(violet).toBeDefined();
      expect(celeste).toBeDefined();

      expect(amber?.type).toBe('pillar');
      expect(violet?.type).toBe('pillar');
      expect(celeste?.type).toBe('pillar');
    });
  });

  describe('CrystalPillar Interaction & Resolution Flow', () => {
    it('instantiates crystal pillars with correct color and display name', () => {
      const amberPillar = new CrystalPillar('pillar_amber', 100, 100, puzzleManager, dialogueManager);
      const violetPillar = new CrystalPillar('pillar_violet', 150, 100, puzzleManager, dialogueManager);
      const celestePillar = new CrystalPillar('pillar_celeste', 200, 100, puzzleManager, dialogueManager);

      expect(amberPillar.getPillarColor()).toBe('AMBER');
      expect(amberPillar.displayName).toBe('Pilar Âmbar');

      expect(violetPillar.getPillarColor()).toBe('VIOLET');
      expect(violetPillar.displayName).toBe('Pilar Violeta');

      expect(celestePillar.getPillarColor()).toBe('CELESTE');
      expect(celestePillar.displayName).toBe('Pilar Celeste');
    });

    it('solves puzzle when interacting in canonical order (Âmbar -> Violeta -> Celeste)', () => {
      const amberPillar = new CrystalPillar('pillar_amber', 100, 100, puzzleManager, dialogueManager);
      const violetPillar = new CrystalPillar('pillar_violet', 150, 100, puzzleManager, dialogueManager);
      const celestePillar = new CrystalPillar('pillar_celeste', 200, 100, puzzleManager, dialogueManager);

      const dialogStartSpy = vi.fn();
      EventBus.on('dialog:start', dialogStartSpy);

      // Step 1: Âmbar
      amberPillar.onInteract();
      expect(puzzleManager.getCurrentStep()).toBe(1);
      expect(puzzleManager.isSolved()).toBe(false);

      // Step 2: Violeta
      violetPillar.onInteract();
      expect(puzzleManager.getCurrentStep()).toBe(2);
      expect(puzzleManager.isSolved()).toBe(false);

      // Step 3: Celeste (Solution)
      celestePillar.onInteract();
      expect(puzzleManager.getCurrentStep()).toBe(3);
      expect(puzzleManager.isSolved()).toBe(true);
      expect(dungeonState.isPuzzleSolved(ECHO_CAVE_PUZZLE_ID)).toBe(true);
      expect(dungeonState.getFlag('bridge_active')).toBe(true);

      expect(dialogStartSpy).toHaveBeenCalledTimes(3);
      EventBus.off('dialog:start', dialogStartSpy);
    });

    it('resets progress on wrong sequence and allows recovery', () => {
      const amberPillar = new CrystalPillar('pillar_amber', 100, 100, puzzleManager, dialogueManager);
      const violetPillar = new CrystalPillar('pillar_violet', 150, 100, puzzleManager, dialogueManager);
      const celestePillar = new CrystalPillar('pillar_celeste', 200, 100, puzzleManager, dialogueManager);

      // Âmbar (correct)
      amberPillar.onInteract();
      expect(puzzleManager.getCurrentStep()).toBe(1);

      // Celeste (wrong, should be Violeta) -> Reset
      celestePillar.onInteract();
      expect(puzzleManager.getCurrentStep()).toBe(0);
      expect(puzzleManager.isSolved()).toBe(false);

      // Now do full correct sequence
      amberPillar.onInteract();
      violetPillar.onInteract();
      celestePillar.onInteract();

      expect(puzzleManager.isSolved()).toBe(true);
    });
  });
});
