import { describe, it, expect, beforeEach } from 'vitest';
import {
  InventoryManager,
  INITIAL_GOLD,
  MAX_GOLD,
} from '@inventory/InventoryManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('InventoryManager', () => {
  let inventory: InventoryManager;

  beforeEach(() => {
    EventBus.removeAll();
    inventory = new InventoryManager();
  });

  describe('Currency (Fragmentos)', () => {
    it('initializes with 100 Fragmentos by default per GDD', () => {
      expect(inventory.getGold()).toBe(INITIAL_GOLD);
      expect(inventory.getGold()).toBe(100);
    });

    it('checks if player has enough gold', () => {
      expect(inventory.hasGold(50)).toBe(true);
      expect(inventory.hasGold(100)).toBe(true);
      expect(inventory.hasGold(101)).toBe(false);
      expect(inventory.hasGold(-10)).toBe(false);
      expect(inventory.hasGold(NaN)).toBe(false);
    });

    it('adds gold safely and clamps to MAX_GOLD', () => {
      inventory.addGold(50);
      expect(inventory.getGold()).toBe(150);

      inventory.addGold(MAX_GOLD * 2);
      expect(inventory.getGold()).toBe(MAX_GOLD);
    });

    it('ignores invalid gold additions (NaN, negative, zero)', () => {
      inventory.addGold(NaN);
      expect(inventory.getGold()).toBe(100);

      inventory.addGold(-50);
      expect(inventory.getGold()).toBe(100);

      inventory.addGold(0);
      expect(inventory.getGold()).toBe(100);
    });

    it('removes gold when balance is sufficient', () => {
      const success = inventory.removeGold(30);
      expect(success).toBe(true);
      expect(inventory.getGold()).toBe(70);
    });

    it('rejects gold removal when balance is insufficient (no overdraft)', () => {
      const success = inventory.removeGold(150);
      expect(success).toBe(false);
      expect(inventory.getGold()).toBe(100);
    });

    it('allows exact balance deduction to zero', () => {
      const success = inventory.removeGold(100);
      expect(success).toBe(true);
      expect(inventory.getGold()).toBe(0);
    });

    it('rejects invalid removal amounts (negative, NaN)', () => {
      expect(inventory.removeGold(-10)).toBe(false);
      expect(inventory.removeGold(NaN)).toBe(false);
      expect(inventory.getGold()).toBe(100);
    });

    it('emits inventory:goldChanged on balance modifications', () => {
      let emitted: { oldGold: number; newGold: number } | null = null;
      EventBus.on('inventory:goldChanged', (payload: any) => {
        emitted = payload;
      });

      inventory.removeGold(30);
      expect(emitted).toEqual({ oldGold: 100, newGold: 70 });

      inventory.addGold(20);
      expect(emitted).toEqual({ oldGold: 70, newGold: 90 });
    });
  });

  describe('Item Management', () => {
    it('initializes with empty items list', () => {
      expect(inventory.getItems()).toEqual([]);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
      expect(inventory.hasItem('elixir_amber')).toBe(false);
    });

    it('adds an item to a new inventory slot', () => {
      const added = inventory.addItem('elixir_amber', 1);
      expect(added).toBe(true);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
      expect(inventory.hasItem('elixir_amber', 1)).toBe(true);
      expect(inventory.getItems().length).toBe(1);
    });

    it('stacks quantity on existing item slot', () => {
      inventory.addItem('elixir_amber', 2);
      inventory.addItem('elixir_amber', 3);

      expect(inventory.getItemQuantity('elixir_amber')).toBe(5);
      expect(inventory.getItems().length).toBe(1);
    });

    it('rejects addition exceeding max stack (99)', () => {
      inventory.addItem('elixir_amber', 95);
      const addedOver = inventory.addItem('elixir_amber', 10);

      expect(addedOver).toBe(false);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(95);
    });

    it('rejects addition if distinct item slots exceed maxSlots', () => {
      const smallInventory = new InventoryManager({ maxSlots: 2, gold: 100 });
      smallInventory.addItem('item_1', 1);
      smallInventory.addItem('item_2', 1);

      const addedThird = smallInventory.addItem('item_3', 1);
      expect(addedThird).toBe(false);
      expect(smallInventory.getItems().length).toBe(2);
    });

    it('removes item quantity and deletes slot when quantity reaches zero', () => {
      inventory.addItem('elixir_amber', 2);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(2);

      const removedOne = inventory.removeItem('elixir_amber', 1);
      expect(removedOne).toBe(true);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
      expect(inventory.getItems().length).toBe(1);

      const removedLast = inventory.removeItem('elixir_amber', 1);
      expect(removedLast).toBe(true);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
      expect(inventory.getItems().length).toBe(0);
    });

    it('rejects removal when quantity owned is insufficient', () => {
      inventory.addItem('elixir_amber', 1);
      const removed = inventory.removeItem('elixir_amber', 5);
      expect(removed).toBe(false);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
    });

    it('rejects removal of non-existent item', () => {
      const removed = inventory.removeItem('ghost_item', 1);
      expect(removed).toBe(false);
    });

    it('emits inventory:itemAdded event on addition', () => {
      let eventPayload: any = null;
      EventBus.on('inventory:itemAdded', (payload: any) => {
        eventPayload = payload;
      });

      inventory.addItem('ether_drop', 2);
      expect(eventPayload).toEqual({ itemId: 'ether_drop', quantity: 2 });
    });
  });

  describe('Invariants & Validation', () => {
    it('validates state and throws if gold is NaN or negative', () => {
      const inv = new InventoryManager();
      (inv as any).inventory.gold = NaN;
      expect(() => inv.validate()).toThrow(/Invalid gold/);

      (inv as any).inventory.gold = -10;
      expect(() => inv.validate()).toThrow(/Invalid gold/);
    });

    it('validates state and throws on duplicate item IDs', () => {
      const inv = new InventoryManager();
      (inv as any).inventory.items = [
        { itemId: 'elixir_amber', quantity: 1 },
        { itemId: 'elixir_amber', quantity: 2 },
      ];
      expect(() => inv.validate()).toThrow(/Duplicate itemId/);
    });

    it('validates state and throws if item quantity exceeds MAX_STACK', () => {
      const inv = new InventoryManager();
      (inv as any).inventory.items = [{ itemId: 'elixir_amber', quantity: 150 }];
      expect(() => inv.validate()).toThrow(/Invalid item quantity/);
    });
  });
});
