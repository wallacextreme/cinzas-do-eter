/**
 * Equipment Integration Tests — F3-U07
 *
 * Tests the integration between EquipmentManager, InventoryManager,
 * and PlayerState to verify end-to-end equipment flows.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { createDefaultPlayer } from '@entities/Player.ts';
import type { PlayerState } from '@entities/Player.ts';

describe('Equipment Integration', () => {
  let inventory: InventoryManager;
  let equipMgr: EquipmentManager;
  let player: PlayerState;

  beforeEach(() => {
    inventory = new InventoryManager();
    equipMgr = new EquipmentManager(inventory);
    player = createDefaultPlayer();
  });

  it('full flow: buy item → equip → stats change → unequip → stats return', () => {
    // Simulate buying apprentice_staff from shop (add to inventory)
    inventory.addItem('apprentice_staff', 1);
    expect(inventory.hasItem('apprentice_staff')).toBe(true);

    // Swap weapon: tuned_staff → apprentice_staff
    const result = equipMgr.equip(player, 'weapon', 'apprentice_staff');
    expect(result.success).toBe(true);

    // Inventory: tuned_staff returned, apprentice_staff consumed
    expect(inventory.hasItem('tuned_staff')).toBe(true);
    expect(inventory.hasItem('apprentice_staff')).toBe(false);

    // Effective stats reflect apprentice_staff bonuses
    let effective = equipMgr.calculateEffectiveStats(player);
    expect(effective.atk).toBe(12 + 3); // 15

    // Unequip
    equipMgr.unequip(player, 'weapon');
    expect(inventory.hasItem('apprentice_staff')).toBe(true);

    effective = equipMgr.calculateEffectiveStats(player);
    expect(effective.atk).toBe(12); // Base only
  });

  it('amber_pendant treasure flow: find in chest → equip → verify bonuses', () => {
    // Simulate finding amber_pendant in chest (Gruta do Eco R7)
    inventory.addItem('amber_pendant', 1);
    expect(inventory.hasItem('amber_pendant')).toBe(true);

    // Equip as accessory
    const result = equipMgr.equip(player, 'accessory', 'amber_pendant');
    expect(result.success).toBe(true);
    expect(player.equipment.accessory).toBe('amber_pendant');
    expect(inventory.hasItem('amber_pendant')).toBe(false);

    // Verify bonuses: RES +2, SOR +2
    const effective = equipMgr.calculateEffectiveStats(player);
    expect(effective.res).toBe(9 + 2);  // 11
    expect(effective.sor).toBe(5 + 2);  // 7

    // Other stats unchanged (except tuned_staff weapon bonuses)
    expect(effective.atk).toBe(12 + 5); // 17 (tuned_staff)
    expect(effective.def).toBe(10);
    expect(effective.vel).toBe(11);
  });

  it('multiple swaps: no stat leakage across 5 cycles', () => {
    inventory.addItem('apprentice_staff', 1);

    const baseAtk = player.stats.atk; // 12

    for (let i = 0; i < 5; i++) {
      // Swap to apprentice_staff (+3)
      equipMgr.equip(player, 'weapon', 'apprentice_staff');
      let effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(baseAtk + 3); // 15

      // Swap back to tuned_staff (+5)
      equipMgr.equip(player, 'weapon', 'tuned_staff');
      effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(baseAtk + 5); // 17
    }

    // Base never changed
    expect(player.stats.atk).toBe(baseAtk);
  });

  it('inventory full: unequip fails, equipment preserved', () => {
    // Fill inventory to max slots
    const maxSlots = inventory.getMaxSlots();
    for (let i = 0; i < maxSlots; i++) {
      inventory.addItem(`test_item_${i}`, 1);
    }

    // Try to unequip tuned_staff — no room in inventory
    const result = equipMgr.unequip(player, 'weapon');
    expect(result.success).toBe(false);

    // Equipment preserved
    expect(player.equipment.weapon).toBe('tuned_staff');
  });

  it('full equipment loadout: weapon + armor + accessory → unequip all → base stats', () => {
    inventory.addItem('ether_cuirass', 1);
    inventory.addItem('crystal_ring', 1);

    equipMgr.equip(player, 'armor', 'ether_cuirass');
    equipMgr.equip(player, 'accessory', 'crystal_ring');

    // Full load
    let effective = equipMgr.calculateEffectiveStats(player);
    expect(effective.atk).toBe(12 + 5);        // tuned_staff
    expect(effective.def).toBe(10 + 5);         // ether_cuirass
    expect(effective.mag).toBe(8 + 2 + 3);      // tuned_staff + crystal_ring
    expect(effective.res).toBe(9 + 3);          // ether_cuirass
    expect(effective.vel).toBe(11 + 1);         // crystal_ring
    expect(effective.sor).toBe(5);

    // Unequip all
    equipMgr.unequip(player, 'weapon');
    equipMgr.unequip(player, 'armor');
    equipMgr.unequip(player, 'accessory');

    effective = equipMgr.calculateEffectiveStats(player);
    expect(effective.atk).toBe(12);
    expect(effective.def).toBe(10);
    expect(effective.mag).toBe(8);
    expect(effective.res).toBe(9);
    expect(effective.vel).toBe(11);
    expect(effective.sor).toBe(5);
    expect(effective.maxHp).toBe(150);
    expect(effective.maxMp).toBe(45);
  });

  it('equip/unequip should maintain inventory item count consistency', () => {
    // Initial: weapon=tuned_staff, inventory empty of equipment
    const initialItemCount = inventory.getItems().length;

    // Unequip adds 1 to inventory
    equipMgr.unequip(player, 'weapon');
    expect(inventory.getItems().length).toBe(initialItemCount + 1);

    // Equip removes 1 from inventory
    equipMgr.equip(player, 'weapon', 'tuned_staff');
    expect(inventory.getItems().length).toBe(initialItemCount);
  });
});
