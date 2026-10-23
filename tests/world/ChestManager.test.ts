import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChestManager } from '@world/dungeon/ChestManager.ts';
import { DungeonStateManager } from '@world/dungeon/DungeonState.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('ChestManager', () => {
  let dungeonState: DungeonStateManager;
  let chestManager: ChestManager;
  let inventory: InventoryManager;

  beforeEach(() => {
    dungeonState = new DungeonStateManager();
    chestManager = new ChestManager(dungeonState);
    inventory = new InventoryManager();
  });

  it('initializes chest as CLOSED', () => {
    expect(chestManager.getChestState('chest_r7')).toBe('CLOSED');
    expect(chestManager.isChestOpened('chest_r7')).toBe(false);
  });

  it('opens a closed chest, awards item, sets state to OPENED and notifies EventBus', () => {
    const openedSpy = vi.fn();
    EventBus.on('chest:opened', openedSpy);

    const result = chestManager.openChest('chest_r7', 'amber_pendant', inventory);

    expect(result.success).toBe(true);
    expect(result.alreadyOpened).toBe(false);
    expect(result.itemId).toBe('amber_pendant');
    expect(result.itemName).toBe('Pingente de Âmbar');
    expect(chestManager.getChestState('chest_r7')).toBe('OPENED');
    expect(chestManager.isChestOpened('chest_r7')).toBe(true);

    // Verifies inventory received the item
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);

    // Verifies event
    expect(openedSpy).toHaveBeenCalledWith({ chestId: 'chest_r7', itemId: 'amber_pendant' });

    EventBus.off('chest:opened', openedSpy);
  });

  it('strictly prevents reward duplication on repeated openings', () => {
    // First open
    chestManager.openChest('chest_r7', 'amber_pendant', inventory);
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);

    // Second open attempt
    const secondResult = chestManager.openChest('chest_r7', 'amber_pendant', inventory);
    expect(secondResult.success).toBe(false);
    expect(secondResult.alreadyOpened).toBe(true);
    expect(secondResult.message).toContain('já está aberto');

    // Quantity strictly remains 1
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
  });

  it('persists chest state across simulated map unloads/reloads via DungeonState', () => {
    // First visit: open chest
    chestManager.openChest('chest_r7', 'amber_pendant', inventory);
    expect(chestManager.isChestOpened('chest_r7')).toBe(true);

    // Player leaves room, map is unloaded, new ChestManager created with same session DungeonState
    const newRoomChestManager = new ChestManager(dungeonState);
    expect(newRoomChestManager.isChestOpened('chest_r7')).toBe(true);
    expect(newRoomChestManager.getChestState('chest_r7')).toBe('OPENED');

    // Attempting to interact in the reloaded room
    const reloadResult = newRoomChestManager.openChest('chest_r7', 'amber_pendant', inventory);
    expect(reloadResult.success).toBe(false);
    expect(reloadResult.alreadyOpened).toBe(true);
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);
  });

  it('fails safely if inventory cannot accommodate the reward and keeps chest closed', () => {
    // Fill up inventory slots with dummy items
    const fullInventory = new InventoryManager({ maxSlots: 1, items: [{ itemId: 'elixir_amber', quantity: 1 }] });
    
    const result = chestManager.openChest('chest_r7', 'amber_pendant', fullInventory);
    expect(result.success).toBe(false);
    expect(result.alreadyOpened).toBe(false);
    expect(result.message).toContain('Inventário cheio');
    expect(chestManager.getChestState('chest_r7')).toBe('CLOSED');
  });
});
