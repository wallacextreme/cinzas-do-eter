import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { echoCaveR7Map } from '@world/maps/EchoCaveR7Map.ts';
import { TreasureChest } from '@entities/TreasureChest.ts';
import { ChestManager } from '@world/dungeon/ChestManager.ts';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { DialogueManager } from '@world/DialogueManager.ts';

describe('Echo Cave R7 & Treasure Chest Integration', () => {
  let dungeonState: DungeonStateManager;
  let chestManager: ChestManager;
  let inventory: InventoryManager;
  let dialogueManager: DialogueManager;

  beforeEach(() => {
    dungeonState = new DungeonStateManager();
    chestManager = new ChestManager(dungeonState);
    inventory = new InventoryManager();
    dialogueManager = new DialogueManager();
  });

  afterEach(() => {
    dialogueManager.destroy();
  });

  describe('R7: Câmara Esquecida Map Data', () => {
    it('has valid dimensions and tile matrices', () => {
      expect(echoCaveR7Map.width).toBe(24);
      expect(echoCaveR7Map.height).toBe(18);
      expect(echoCaveR7Map.groundData.length).toBe(18);
      expect(echoCaveR7Map.wallData.length).toBe(18);
      echoCaveR7Map.groundData.forEach(row => expect(row.length).toBe(24));
      echoCaveR7Map.wallData.forEach(row => expect(row.length).toBe(24));
    });

    it('contains spawn point and transition leading back to R5', () => {
      expect(echoCaveR7Map.spawnPoints['spawn_north']).toBeDefined();
      expect(echoCaveR7Map.spawnPoints['spawn_north'].facing).toBe('DOWN');

      const toR5 = echoCaveR7Map.transitions.find(t => t.targetMapId === 'echo_cave_r5');
      expect(toR5).toBeDefined();
      expect(toR5?.targetSpawnId).toBe('spawn_south');
    });

    it('contains the chest entity with type chest', () => {
      const chestEntity = echoCaveR7Map.entities.find(e => e.entityId === 'chest_echo_cave_r7');
      expect(chestEntity).toBeDefined();
      expect(chestEntity?.type).toBe('chest');
    });
  });

  describe('TreasureChest Entity & Strict Reward Rules (Ajuste 2)', () => {
    it('initializes in CLOSED state and grants Amber Pendant on first open', () => {
      const stateChangeSpy = vi.fn();
      const chest = new TreasureChest(
        'chest_echo_cave_r7',
        100,
        100,
        'amber_pendant',
        chestManager,
        inventory,
        dialogueManager,
        stateChangeSpy
      );

      expect(chest.getState()).toBe('CLOSED');
      expect(chest.isOpened()).toBe(false);
      expect(inventory.getItemQuantity('amber_pendant')).toBe(0);

      const res = chest.onInteract();
      expect(res.success).toBe(true);
      expect(res.alreadyOpened).toBe(false);
      expect(res.itemId).toBe('amber_pendant');
      expect(res.itemName).toBe('Pingente de Âmbar');
      expect(chest.getState()).toBe('OPENED');
      expect(chest.isOpened()).toBe(true);
      expect(stateChangeSpy).toHaveBeenCalledWith('OPENED');

      // Inventory has received exactly 1 Amber Pendant
      expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
    });

    it('strictly prevents reward duplication on subsequent interactions in same room', () => {
      const chest = new TreasureChest(
        'chest_echo_cave_r7',
        100,
        100,
        'amber_pendant',
        chestManager,
        inventory,
        dialogueManager
      );

      // First open
      chest.onInteract();
      expect(inventory.getItemQuantity('amber_pendant')).toBe(1);

      // Second open attempt
      const secondRes = chest.onInteract();
      expect(secondRes.success).toBe(false);
      expect(secondRes.alreadyOpened).toBe(true);
      expect(secondRes.message).toContain('já está aberto');

      // Quantity strictly remains 1
      expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
    });

    it('strictly prevents reward duplication across map reloads / re-entries during the session', () => {
      // 1. Player enters R7 and opens the chest
      const initialChest = new TreasureChest(
        'chest_echo_cave_r7',
        100,
        100,
        'amber_pendant',
        chestManager,
        inventory,
        dialogueManager
      );
      initialChest.onInteract();
      expect(inventory.getItemQuantity('amber_pendant')).toBe(1);

      // 2. Player leaves R7 to R5, room is unloaded (entities cleared)
      // ... player explores, then returns to R7 ...
      // 3. R7 is reloaded with a new ChestManager referencing the persistent session DungeonState
      const sessionChestManager = new ChestManager(dungeonState);
      const reloadedChest = new TreasureChest(
        'chest_echo_cave_r7',
        100,
        100,
        'amber_pendant',
        sessionChestManager,
        inventory,
        dialogueManager
      );

      // Verify that upon reload, chest is immediately detected as OPENED
      expect(reloadedChest.isOpened()).toBe(true);
      expect(reloadedChest.getState()).toBe('OPENED');

      // 4. Attempting to open the reloaded chest
      const reloadRes = reloadedChest.onInteract();
      expect(reloadRes.success).toBe(false);
      expect(reloadRes.alreadyOpened).toBe(true);

      // Item count strictly remains 1!
      expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
    });
  });
});
