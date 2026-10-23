import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Phaser before importing modules that depend on it
vi.mock('phaser', () => {
  return {
    default: {
      Physics: { Arcade: { Body: class {} } },
      Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: 'fadeout', FADE_IN_COMPLETE: 'fadein' } } },
      Scene: class {},
      Geom: {
        Rectangle: class {
          x: number;
          y: number;
          width: number;
          height: number;
          constructor(x: number, y: number, width: number, height: number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
          }
        }
      }
    },
    Scene: class {}
  };
});

import { MapTransitionManager } from '@world/MapTransitionManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';
import { PuzzleManager, ECHO_CAVE_PUZZLE_ID } from '@world/dungeon/PuzzleManager.ts';
import { ChestManager } from '@world/dungeon/ChestManager.ts';
import { DialogueManager } from '@world/DialogueManager.ts';
import { CrystalPillar } from '@entities/CrystalPillar.ts';
import { TreasureChest } from '@entities/TreasureChest.ts';
import { gameState } from '@core/GameStateManager.ts';
import {
  lumenVillageMap,
  ashPlainsMap,
  echoCaveEntranceMap,
  echoCaveR2Map,
  echoCaveR3Map,
  echoCaveR4Map,
  echoCaveR5Map,
  echoCaveR6Map,
  echoCaveR7Map,
} from '@world/maps/index.ts';

describe('Echo Cave Full Dungeon Progression (R1 → R7 & Return to Plains/Village)', () => {
  let mockScene: any;
  let mockMapManager: any;
  let mockPlayer: any;
  let transitionManager: MapTransitionManager;
  let inventory: InventoryManager;
  let dungeonState: DungeonStateManager;
  let puzzleManager: PuzzleManager;
  let chestManager: ChestManager;
  let dialogueManager: DialogueManager;
  let currentLoadedMapId: string;

  beforeEach(() => {
    if (gameState.getPhase() !== 'EXPLORING') {
      if (gameState.getPhase() === 'BOOT') gameState.transitionTo('LOADING');
      if (gameState.getPhase() !== 'EXPLORING') gameState.transitionTo('EXPLORING');
    }

    currentLoadedMapId = 'echo_cave';

    mockScene = {
      cameras: {
        main: {
          fadeOut: vi.fn(),
          fadeIn: vi.fn(),
          once: vi.fn((_event, cb) => cb()),
          setBounds: vi.fn(),
        }
      }
    };

    mockMapManager = {
      getCurrentMapId: vi.fn(() => currentLoadedMapId),
      loadMap: vi.fn((_scene, mapData) => {
        currentLoadedMapId = mapData.id;
        return {};
      }),
      getBounds: vi.fn(() => ({ width: 384, height: 288 })),
    };

    mockPlayer = {
      x: 100,
      y: 100,
      body: { setVelocity: vi.fn() },
      setPosition: vi.fn((x, y) => {
        mockPlayer.x = x;
        mockPlayer.y = y;
      }),
      setFacingDirection: vi.fn((dir: string) => { mockPlayer.facingDirection = dir; }),
      getFacingDirection: vi.fn(() => mockPlayer.facingDirection),
      facingDirection: 'DOWN'
    };

    inventory = new InventoryManager();
    dungeonState = new DungeonStateManager();
    puzzleManager = new PuzzleManager(ECHO_CAVE_PUZZLE_ID, ['pillar_amber', 'pillar_violet', 'pillar_celeste'], dungeonState);
    chestManager = new ChestManager(dungeonState);
    dialogueManager = new DialogueManager();

    transitionManager = new MapTransitionManager(mockScene, mockMapManager, mockPlayer as any);
    transitionManager.registerMap(lumenVillageMap);
    transitionManager.registerMap(ashPlainsMap);
    transitionManager.registerMap(echoCaveEntranceMap);
    transitionManager.registerMap(echoCaveR2Map);
    transitionManager.registerMap(echoCaveR3Map);
    transitionManager.registerMap(echoCaveR4Map);
    transitionManager.registerMap(echoCaveR5Map);
    transitionManager.registerMap(echoCaveR6Map);
    transitionManager.registerMap(echoCaveR7Map);
  });

  afterEach(() => {
    dialogueManager.destroy();
  });

  it('completes the entire canonical dungeon gauntlet with 0 state corruption', () => {
    // 1. Enter R1 (Entrance) from Ash Plains
    const t1 = transitionManager.transitionToMap('echo_cave', 'spawn_entrance');
    expect(t1).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave');
    expect(mockPlayer.x).toBe(echoCaveEntranceMap.spawnPoints['spawn_entrance'].x);
    expect(mockPlayer.y).toBe(echoCaveEntranceMap.spawnPoints['spawn_entrance'].y);

    // 2. Walk South to R2 (Cruzamento das Sombras)
    const t2 = transitionManager.transitionToMap('echo_cave_r2', 'spawn_north');
    expect(t2).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r2');

    // 3. Optional exploration: Walk West to R3 (Câmara dos Ecos)
    const t3 = transitionManager.transitionToMap('echo_cave_r3', 'spawn_east');
    expect(t3).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r3');
    // Verify clue exists in map data
    const steleEntity = echoCaveR3Map.entities.find(e => e.entityId === 'stele_r3_clue');
    expect(steleEntity).toBeDefined();

    // 4. Return East from R3 to R2
    const t4 = transitionManager.transitionToMap('echo_cave_r2', 'spawn_west');
    expect(t4).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r2');

    // 5. Walk East to R4 (Câmara da Harmonia)
    const t5 = transitionManager.transitionToMap('echo_cave_r4', 'spawn_west');
    expect(t5).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r4');
    expect(puzzleManager.isSolved()).toBe(false);

    // 6. Test puzzle error/reset
    const amber = new CrystalPillar('pillar_amber', 100, 100, puzzleManager, dialogueManager);
    const violet = new CrystalPillar('pillar_violet', 150, 100, puzzleManager, dialogueManager);
    const celeste = new CrystalPillar('pillar_celeste', 200, 100, puzzleManager, dialogueManager);

    amber.onInteract();
    expect(puzzleManager.getCurrentStep()).toBe(1);
    dialogueManager.close();

    celeste.onInteract(); // Wrong order -> Reset
    expect(puzzleManager.getCurrentStep()).toBe(0);
    expect(puzzleManager.isSolved()).toBe(false);
    dialogueManager.close();

    // 7. Solve puzzle in correct sequence
    amber.onInteract();
    dialogueManager.close();

    violet.onInteract();
    dialogueManager.close();

    celeste.onInteract();
    dialogueManager.close();

    expect(puzzleManager.isSolved()).toBe(true);
    expect(dungeonState.getFlag('bridge_active')).toBe(true);

    // 8. Cross Ether Bridge to R5 (Ponte do Abismo)
    const t6 = transitionManager.transitionToMap('echo_cave_r5', 'spawn_west');
    expect(t6).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r5');

    // 9. Explore North to R6 (Santuário do Eco)
    const t7 = transitionManager.transitionToMap('echo_cave_r6', 'spawn_south');
    expect(t7).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r6');
    // Verify environmental altar only, NO enemies/boss
    const altar = echoCaveR6Map.entities.find(e => e.entityId === 'altar_corrupted_core');
    expect(altar).toBeDefined();
    const combat = echoCaveR6Map.entities.filter(e => (e.type as string) === 'enemy' || (e.type as string) === 'boss');
    expect(combat.length).toBe(0);

    // 10. Return South to R5
    const t8 = transitionManager.transitionToMap('echo_cave_r5', 'spawn_north');
    expect(t8).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r5');

    // 11. Head South to R7 (Câmara Esquecida)
    const t9 = transitionManager.transitionToMap('echo_cave_r7', 'spawn_north');
    expect(t9).toBe(true);
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r7');

    // 12. Interact with Chest
    expect(inventory.getItemQuantity('amber_pendant')).toBe(0);
    const chest = new TreasureChest('chest_echo_cave_r7', 100, 100, 'amber_pendant', chestManager, inventory, dialogueManager);
    const chestRes1 = chest.onInteract();
    expect(chestRes1.success).toBe(true);
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
    expect(dungeonState.isChestOpened('chest_echo_cave_r7')).toBe(true);
    dialogueManager.close();

    // 13. Exit to R5 and re-enter R7 to test anti-duplication
    transitionManager.transitionToMap('echo_cave_r5', 'spawn_south');
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r5');

    transitionManager.transitionToMap('echo_cave_r7', 'spawn_north');
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave_r7');

    // Reloaded chest in re-entered room
    const chestReloaded = new TreasureChest('chest_echo_cave_r7', 100, 100, 'amber_pendant', chestManager, inventory, dialogueManager);
    expect(chestReloaded.isOpened()).toBe(true);
    const chestRes2 = chestReloaded.onInteract();
    expect(chestRes2.success).toBe(false);
    expect(chestRes2.alreadyOpened).toBe(true);
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1); // strictly 1!
    dialogueManager.close();

    // 14. Full back-tracking to Planície das Cinzas and Vila de Lumen
    transitionManager.transitionToMap('echo_cave_r5', 'spawn_south');
    transitionManager.transitionToMap('echo_cave_r4', 'spawn_east');
    // Bridge remains active
    expect(puzzleManager.isSolved()).toBe(true);

    transitionManager.transitionToMap('echo_cave_r2', 'spawn_east');
    transitionManager.transitionToMap('echo_cave', 'spawn_south');
    expect(mockMapManager.getCurrentMapId()).toBe('echo_cave');

    // Exit cave to ash_plains
    transitionManager.transitionToMap('ash_plains', 'spawn_south');
    expect(mockMapManager.getCurrentMapId()).toBe('ash_plains');

    // Return to village
    transitionManager.transitionToMap('lumen_village', 'spawn_south');
    expect(mockMapManager.getCurrentMapId()).toBe('lumen_village');

    // Final integrity checks
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
    expect(inventory.getGold()).toBe(100);
    expect(transitionManager.getIsTransitioning()).toBe(false);
  });
});
