import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemUseManager } from '@systems/ItemUseManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { createDefaultPlayer, type PlayerState } from '@entities/Player.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('ItemUseManager', () => {
  let inventory: InventoryManager;
  let equipmentManager: EquipmentManager;
  let itemUseManager: ItemUseManager;
  let player: PlayerState;

  beforeEach(() => {
    inventory = new InventoryManager();
    equipmentManager = new EquipmentManager(inventory);
    itemUseManager = new ItemUseManager(inventory, equipmentManager);
    player = createDefaultPlayer();
    EventBus.removeAll();
  });

  describe('Elixir Âmbar (elixir_amber)', () => {
    it('restores 50 HP and consumes 1 item when player is wounded', () => {
      inventory.addItem('elixir_amber', 2);
      player.hp = 80;
      player.maxHp = 150;

      const canUse = itemUseManager.canUseItem(player, 'elixir_amber');
      expect(canUse.canUse).toBe(true);

      const result = itemUseManager.useItem(player, 'elixir_amber');
      expect(result.success).toBe(true);
      expect(result.amountApplied).toBe(50);
      expect(player.hp).toBe(130);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
    });

    it('clamps to effective max HP and consumes 1 item', () => {
      inventory.addItem('elixir_amber', 1);
      player.hp = 130;
      player.maxHp = 150;

      const result = itemUseManager.useItem(player, 'elixir_amber');
      expect(result.success).toBe(true);
      expect(result.amountApplied).toBe(20);
      expect(player.hp).toBe(150);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
    });

    it('rejects usage when HP is already at effective maximum and does not consume item', () => {
      inventory.addItem('elixir_amber', 1);
      player.hp = 150;
      player.maxHp = 150;

      const canUse = itemUseManager.canUseItem(player, 'elixir_amber');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('HP já está no valor máximo!');

      const result = itemUseManager.useItem(player, 'elixir_amber');
      expect(result.success).toBe(false);
      expect(result.message).toBe('HP já está no valor máximo!');
      expect(player.hp).toBe(150);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
    });
  });

  describe('Gota de Éter (ether_drop)', () => {
    it('restores 20 MP and consumes 1 item when MP is depleted', () => {
      inventory.addItem('ether_drop', 2);
      player.mp = 15;
      player.maxMp = 45;

      const canUse = itemUseManager.canUseItem(player, 'ether_drop');
      expect(canUse.canUse).toBe(true);

      const result = itemUseManager.useItem(player, 'ether_drop');
      expect(result.success).toBe(true);
      expect(result.amountApplied).toBe(20);
      expect(player.mp).toBe(35);
      expect(inventory.getItemQuantity('ether_drop')).toBe(1);
    });

    it('clamps to effective max MP and consumes 1 item', () => {
      inventory.addItem('ether_drop', 1);
      player.mp = 35;
      player.maxMp = 45;

      const result = itemUseManager.useItem(player, 'ether_drop');
      expect(result.success).toBe(true);
      expect(result.amountApplied).toBe(10);
      expect(player.mp).toBe(45);
      expect(inventory.getItemQuantity('ether_drop')).toBe(0);
    });

    it('rejects usage when MP is full and does not consume item', () => {
      inventory.addItem('ether_drop', 1);
      player.mp = 45;
      player.maxMp = 45;

      const canUse = itemUseManager.canUseItem(player, 'ether_drop');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('MP já está no valor máximo!');

      const result = itemUseManager.useItem(player, 'ether_drop');
      expect(result.success).toBe(false);
      expect(result.message).toBe('MP já está no valor máximo!');
      expect(player.mp).toBe(45);
      expect(inventory.getItemQuantity('ether_drop')).toBe(1);
    });
  });

  describe('Antídoto (antidote)', () => {
    it('rejects in exploration when player is not poisoned and does not consume item', () => {
      inventory.addItem('antidote', 1);

      const canUse = itemUseManager.canUseItem(player, 'antidote', 'exploration');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('Nenhum efeito: Kaël não está envenenado.');

      const result = itemUseManager.useItem(player, 'antidote', 'exploration');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nenhum efeito: Kaël não está envenenado.');
      expect(inventory.getItemQuantity('antidote')).toBe(1);
    });
  });

  describe('Cristal de Fuga (escape_crystal)', () => {
    it('rejects in exploration and does not consume item', () => {
      inventory.addItem('escape_crystal', 1);

      const canUse = itemUseManager.canUseItem(player, 'escape_crystal', 'exploration');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('Este item só pode ser usado em batalha.');

      const result = itemUseManager.useItem(player, 'escape_crystal', 'exploration');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Este item só pode ser usado em batalha.');
      expect(inventory.getItemQuantity('escape_crystal')).toBe(1);
    });

    it('permits usage in battle context', () => {
      inventory.addItem('escape_crystal', 1);

      const canUse = itemUseManager.canUseItem(player, 'escape_crystal', 'battle');
      expect(canUse.canUse).toBe(true);

      const result = itemUseManager.useItem(player, 'escape_crystal', 'battle');
      expect(result.success).toBe(true);
      expect(inventory.getItemQuantity('escape_crystal')).toBe(0);
    });
  });

  describe('General Validations', () => {
    it('rejects when item is not in inventory (quantity 0)', () => {
      player.hp = 50;
      const canUse = itemUseManager.canUseItem(player, 'elixir_amber');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('Você não possui este item.');

      const result = itemUseManager.useItem(player, 'elixir_amber');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Você não possui este item.');
      expect(player.hp).toBe(50);
    });

    it('rejects non-existent item id', () => {
      const canUse = itemUseManager.canUseItem(player, 'unknown_item');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('Item não encontrado.');

      const result = itemUseManager.useItem(player, 'unknown_item');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Item não encontrado.');
    });

    it('rejects equipment from being consumed as consumable', () => {
      inventory.addItem('traveler_tunic', 1);

      const canUse = itemUseManager.canUseItem(player, 'traveler_tunic');
      expect(canUse.canUse).toBe(false);
      expect(canUse.reason).toBe('Este item não pode ser usado desta forma.');

      const result = itemUseManager.useItem(player, 'traveler_tunic');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Este item não pode ser usado desta forma.');
      expect(inventory.getItemQuantity('traveler_tunic')).toBe(1);
    });

    it('removes the last item completely from inventory', () => {
      inventory.addItem('elixir_amber', 1);
      player.hp = 50;

      const result = itemUseManager.useItem(player, 'elixir_amber');
      expect(result.success).toBe(true);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
      expect(inventory.hasItem('elixir_amber')).toBe(false);
      expect(inventory.getItems().length).toBe(0);
    });
  });

  describe('EventBus Notifications', () => {
    it('emits inventory:itemUsed only on successful usage with correct payload', () => {
      const listener = vi.fn();
      EventBus.on('inventory:itemUsed', listener);

      inventory.addItem('elixir_amber', 1);
      player.hp = 100;

      itemUseManager.useItem(player, 'elixir_amber');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        itemId: 'elixir_amber',
        playerId: player.id,
        amountApplied: 50,
      });
    });

    it('does not emit inventory:itemUsed on failed usage', () => {
      const listener = vi.fn();
      EventBus.on('inventory:itemUsed', listener);

      inventory.addItem('elixir_amber', 1);
      player.hp = 150; // Full HP

      itemUseManager.useItem(player, 'elixir_amber');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Atomic Transaction & Rollback Guarantees', () => {
    it('rolls back HP and returns error if inventory removal fails', () => {
      inventory.addItem('elixir_amber', 1);
      player.hp = 80;

      // Mock removeItem to return false (simulating catastrophic failure/race condition)
      const removeSpy = vi.spyOn(inventory, 'removeItem').mockReturnValueOnce(false);

      const result = itemUseManager.useItem(player, 'elixir_amber');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao remover o item do inventário.');
      // Strong atomicity check: player HP must be restored to prior value
      expect(player.hp).toBe(80);
      // Item still present
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

      removeSpy.mockRestore();
    });

    it('does not mutate player state or remove item when preconditions fail', () => {
      inventory.addItem('ether_drop', 1);
      player.mp = 45; // Full MP

      const result = itemUseManager.useItem(player, 'ether_drop');

      expect(result.success).toBe(false);
      expect(player.mp).toBe(45);
      expect(inventory.getItemQuantity('ether_drop')).toBe(1);
    });
  });
});
