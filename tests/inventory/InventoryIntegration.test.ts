import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { ShopManager } from '@shop/ShopManager.ts';
import { ItemUseManager } from '@systems/ItemUseManager.ts';
import { createDefaultPlayer, type PlayerState } from '@entities/Player.ts';
import { GameStateManager } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('Inventory Integration Tests (F3-U09)', () => {
  let inventory: InventoryManager;
  let equipmentManager: EquipmentManager;
  let shopManager: ShopManager;
  let itemUseManager: ItemUseManager;
  let player: PlayerState;
  let gameState: GameStateManager;

  beforeEach(() => {
    EventBus.removeAll();
    inventory = new InventoryManager({ gold: 300 }); // Kaël starts with enough gold for shop purchases
    equipmentManager = new EquipmentManager(inventory);
    shopManager = new ShopManager(inventory);
    itemUseManager = new ItemUseManager(inventory, equipmentManager);
    player = createDefaultPlayer();
    gameState = new GameStateManager();
    gameState.transitionTo('LOADING');
    gameState.transitionTo('EXPLORING');
  });

  describe('Shop → Inventory → Use Flow', () => {
    it('buys 2 Elixirs, damages player, uses 1st, uses 2nd, and stack reaches 0', () => {
      // 1. Open Torvak's shop
      shopManager.openShop('shop_torvak');
      expect(shopManager.isOpen()).toBe(true);

      // 2. Buy 2 Elixirs (price 30 each = 60 Fragmentos)
      const buy1 = shopManager.buyItemById('elixir_amber');
      const buy2 = shopManager.buyItemById('elixir_amber');
      expect(buy1.success).toBe(true);
      expect(buy2.success).toBe(true);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(2);
      expect(inventory.getGold()).toBe(240); // 300 - 60

      // Close shop
      shopManager.closeShop();
      expect(shopManager.isOpen()).toBe(false);

      // 3. Player is wounded to 80/150 HP
      player.hp = 80;

      // 4. Use 1st Elixir
      const use1 = itemUseManager.useItem(player, 'elixir_amber');
      expect(use1.success).toBe(true);
      expect(player.hp).toBe(130);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

      // 5. Use 2nd Elixir (clamps to 150/150)
      const use2 = itemUseManager.useItem(player, 'elixir_amber');
      expect(use2.success).toBe(true);
      expect(player.hp).toBe(150);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
      expect(inventory.hasItem('elixir_amber')).toBe(false);

      // 6. Attempting to use a 3rd Elixir is rejected because none remain
      const use3 = itemUseManager.useItem(player, 'elixir_amber');
      expect(use3.success).toBe(false);
      expect(use3.message).toBe('Você não possui este item.');
    });
  });

  describe('Equipment Integration Flow', () => {
    it('manages traveler_tunic in inventory, equipping removes it, unequipping returns it', () => {
      // Add traveler_tunic to inventory
      const added = inventory.addItem('traveler_tunic', 1);
      expect(added).toBe(true);
      expect(inventory.getItemQuantity('traveler_tunic')).toBe(1);
      expect(player.equipment.armor).toBeNull();

      // Equip armor
      const equipResult = equipmentManager.equip(player, 'armor', 'traveler_tunic');
      expect(equipResult.success).toBe(true);
      expect(player.equipment.armor).toBe('traveler_tunic');
      // Must be removed from inventory
      expect(inventory.getItemQuantity('traveler_tunic')).toBe(0);

      // Effective stats reflect DEF +3
      const effectiveStats = equipmentManager.calculateEffectiveStats(player);
      expect(effectiveStats.def).toBe(player.stats.def + 3);

      // Unequip armor
      const unequipResult = equipmentManager.unequip(player, 'armor');
      expect(unequipResult.success).toBe(true);
      expect(player.equipment.armor).toBeNull();
      // Must be returned to inventory
      expect(inventory.getItemQuantity('traveler_tunic')).toBe(1);
    });
  });

  describe('Phase Transitions & Concurrency Guards', () => {
    it('transitions EXPLORING → MENU on inventory open, and MENU → EXPLORING on close', () => {
      expect(gameState.getPhase()).toBe('EXPLORING');

      // Open inventory
      gameState.transitionTo('MENU');
      expect(gameState.getPhase()).toBe('MENU');

      // Close inventory
      gameState.transitionTo('EXPLORING');
      expect(gameState.getPhase()).toBe('EXPLORING');
    });

    it('enforces guards preventing inventory opening during blocked states', () => {
      // Helper simulating GameScene canOpenInventory condition
      const canOpenInventory = (
        phase: string,
        isDialogueActive: boolean,
        isShopOpen: boolean,
        isStatusOpen: boolean,
        isTransitioning: boolean
      ): boolean => {
        return (
          phase === 'EXPLORING' &&
          !isDialogueActive &&
          !isShopOpen &&
          !isStatusOpen &&
          !isTransitioning
        );
      };

      // 1. Normal state: allowed
      expect(canOpenInventory('EXPLORING', false, false, false, false)).toBe(true);

      // 2. During dialogue: blocked
      expect(canOpenInventory('EXPLORING', true, false, false, false)).toBe(false);

      // 3. During shop: blocked
      expect(canOpenInventory('EXPLORING', false, true, false, false)).toBe(false);

      // 4. During status menu: blocked
      expect(canOpenInventory('EXPLORING', false, false, true, false)).toBe(false);

      // 5. During map transition: blocked
      expect(canOpenInventory('EXPLORING', false, false, false, true)).toBe(false);

      // 6. When phase is not EXPLORING: blocked
      expect(canOpenInventory('MENU', false, false, false, false)).toBe(false);
      expect(canOpenInventory('BATTLE', false, false, false, false)).toBe(false);
    });
  });

  describe('Save / Load Compatibility', () => {
    it('preserves inventory state faithfully via toState()', () => {
      inventory.addItem('elixir_amber', 3);
      inventory.addItem('ether_drop', 2);
      inventory.addGold(50);

      const state = inventory.toState();
      expect(state.gold).toBe(350);
      expect(state.items).toEqual([
        { itemId: 'elixir_amber', quantity: 3 },
        { itemId: 'ether_drop', quantity: 2 },
      ]);
      expect(state.maxSlots).toBe(20);

      // Restore into a new manager instance
      const restoredInventory = new InventoryManager(state);
      expect(restoredInventory.getGold()).toBe(350);
      expect(restoredInventory.getItemQuantity('elixir_amber')).toBe(3);
      expect(restoredInventory.getItemQuantity('ether_drop')).toBe(2);
      expect(restoredInventory.getMaxSlots()).toBe(20);
    });
  });
});
