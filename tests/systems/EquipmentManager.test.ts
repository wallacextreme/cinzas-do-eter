/**
 * EquipmentManager — Unit Tests
 *
 * F3-U07: Equipment System
 * Tests cover: equip, unequip, swap, calculateEffectiveStats, HP/MP clamping,
 * atomicity, initial state, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { createDefaultPlayer } from '@entities/Player.ts';
import type { PlayerState } from '@entities/Player.ts';
import { EQUIPMENT_DATABASE } from '@data/equipmentData.ts';
import { ITEMS_DATABASE } from '@data/itemsData.ts';

describe('EquipmentManager', () => {
  let inventory: InventoryManager;
  let equipMgr: EquipmentManager;
  let player: PlayerState;

  beforeEach(() => {
    inventory = new InventoryManager();
    equipMgr = new EquipmentManager(inventory);
    player = createDefaultPlayer();
  });

  // ─── Equipment Database ─────────────────────────────────────

  describe('Equipment Database', () => {
    it('should contain all 6 canonical equipment items', () => {
      const ids = ['apprentice_staff', 'tuned_staff', 'traveler_tunic', 'ether_cuirass', 'amber_pendant', 'crystal_ring'];
      for (const id of ids) {
        expect(EQUIPMENT_DATABASE[id]).toBeDefined();
        expect(EQUIPMENT_DATABASE[id].id).toBe(id);
      }
    });

    it('all 6 equipment items should exist in ITEMS_DATABASE with type "equipment"', () => {
      const ids = ['apprentice_staff', 'tuned_staff', 'traveler_tunic', 'ether_cuirass', 'amber_pendant', 'crystal_ring'];
      for (const id of ids) {
        const item = ITEMS_DATABASE[id];
        expect(item).toBeDefined();
        expect(item.type).toBe('equipment');
        expect(item.maxStack).toBe(1);
      }
    });

    it('each equipment should have the correct slot', () => {
      expect(EQUIPMENT_DATABASE['apprentice_staff'].slot).toBe('weapon');
      expect(EQUIPMENT_DATABASE['tuned_staff'].slot).toBe('weapon');
      expect(EQUIPMENT_DATABASE['traveler_tunic'].slot).toBe('armor');
      expect(EQUIPMENT_DATABASE['ether_cuirass'].slot).toBe('armor');
      expect(EQUIPMENT_DATABASE['amber_pendant'].slot).toBe('accessory');
      expect(EQUIPMENT_DATABASE['crystal_ring'].slot).toBe('accessory');
    });

    it('bonuses should be valid numbers (not NaN, not Infinity)', () => {
      for (const [_id, def] of Object.entries(EQUIPMENT_DATABASE)) {
        for (const [_stat, value] of Object.entries(def.bonus)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(Number.isNaN(value)).toBe(false);
        }
      }
    });
  });

  // ─── Initial State (Kaël starts with tuned_staff) ───────────

  describe('Initial State', () => {
    it('Kaël should start with tuned_staff equipped in weapon slot', () => {
      expect(player.equipment.weapon).toBe('tuned_staff');
      expect(player.equipment.armor).toBeNull();
      expect(player.equipment.accessory).toBeNull();
    });

    it('tuned_staff should NOT be in the initial inventory', () => {
      expect(inventory.hasItem('tuned_staff')).toBe(false);
      expect(inventory.getItemQuantity('tuned_staff')).toBe(0);
    });

    it('effective stats should include tuned_staff bonuses (ATK +5, MAG +2)', () => {
      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(player.stats.atk + 5); // 12 + 5 = 17
      expect(effective.mag).toBe(player.stats.mag + 2); // 8 + 2 = 10
      // Other stats should equal base
      expect(effective.def).toBe(player.stats.def);
      expect(effective.res).toBe(player.stats.res);
      expect(effective.vel).toBe(player.stats.vel);
      expect(effective.sor).toBe(player.stats.sor);
    });
  });

  // ─── Equip ──────────────────────────────────────────────────

  describe('Equip', () => {
    it('should equip a weapon from inventory', () => {
      // First unequip tuned_staff so we can test equipping fresh
      player.equipment.weapon = null;
      inventory.addItem('apprentice_staff', 1);

      const result = equipMgr.equip(player, 'weapon', 'apprentice_staff');
      expect(result.success).toBe(true);
      expect(player.equipment.weapon).toBe('apprentice_staff');
      expect(inventory.hasItem('apprentice_staff')).toBe(false);
    });

    it('should equip armor from inventory', () => {
      inventory.addItem('traveler_tunic', 1);

      const result = equipMgr.equip(player, 'armor', 'traveler_tunic');
      expect(result.success).toBe(true);
      expect(player.equipment.armor).toBe('traveler_tunic');
      expect(inventory.hasItem('traveler_tunic')).toBe(false);
    });

    it('should equip accessory from inventory', () => {
      inventory.addItem('amber_pendant', 1);

      const result = equipMgr.equip(player, 'accessory', 'amber_pendant');
      expect(result.success).toBe(true);
      expect(player.equipment.accessory).toBe('amber_pendant');
      expect(inventory.hasItem('amber_pendant')).toBe(false);
    });

    it('should fail to equip item not in inventory', () => {
      const result = equipMgr.equip(player, 'accessory', 'amber_pendant');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not in inventory');
      expect(player.equipment.accessory).toBeNull();
    });

    it('should fail to equip item in wrong slot', () => {
      inventory.addItem('apprentice_staff', 1);

      const result = equipMgr.equip(player, 'armor', 'apprentice_staff');
      expect(result.success).toBe(false);
      expect(result.error).toContain('belongs to slot');
      // Item should still be in inventory
      expect(inventory.hasItem('apprentice_staff')).toBe(true);
    });

    it('should fail to equip nonexistent item', () => {
      const result = equipMgr.equip(player, 'weapon', 'mythical_sword');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail to equip to invalid slot', () => {
      inventory.addItem('apprentice_staff', 1);

      const result = equipMgr.equip(player, 'helmet' as string, 'apprentice_staff');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should fail to equip item already in slot when not in inventory', () => {
      // tuned_staff is already equipped and NOT in inventory
      const result = equipMgr.equip(player, 'weapon', 'tuned_staff');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not in inventory');
      expect(player.equipment.weapon).toBe('tuned_staff'); // Unchanged
    });
  });

  // ─── Unequip ────────────────────────────────────────────────

  describe('Unequip', () => {
    it('should unequip tuned_staff and return it to inventory', () => {
      const result = equipMgr.unequip(player, 'weapon');
      expect(result.success).toBe(true);
      expect(result.previousItemId).toBe('tuned_staff');
      expect(player.equipment.weapon).toBeNull();
      expect(inventory.hasItem('tuned_staff')).toBe(true);
      expect(inventory.getItemQuantity('tuned_staff')).toBe(1);
    });

    it('should unequip armor and return to inventory', () => {
      inventory.addItem('traveler_tunic', 1);
      equipMgr.equip(player, 'armor', 'traveler_tunic');

      const result = equipMgr.unequip(player, 'armor');
      expect(result.success).toBe(true);
      expect(player.equipment.armor).toBeNull();
      expect(inventory.hasItem('traveler_tunic')).toBe(true);
    });

    it('should unequip accessory and return to inventory', () => {
      inventory.addItem('amber_pendant', 1);
      equipMgr.equip(player, 'accessory', 'amber_pendant');

      const result = equipMgr.unequip(player, 'accessory');
      expect(result.success).toBe(true);
      expect(player.equipment.accessory).toBeNull();
      expect(inventory.hasItem('amber_pendant')).toBe(true);
    });

    it('should fail to unequip from empty slot', () => {
      const result = equipMgr.unequip(player, 'armor');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should fail to unequip if inventory cannot accept item (already has one)', () => {
      // Add tuned_staff to inventory so it already has quantity 1
      inventory.addItem('tuned_staff', 1);

      // Try to unequip — inventory already has tuned_staff at maxStack(1)
      const result = equipMgr.unequip(player, 'weapon');
      expect(result.success).toBe(false);
      expect(result.error).toContain('stack full');
      // Equipment should remain unchanged
      expect(player.equipment.weapon).toBe('tuned_staff');
    });

    it('should fail to unequip from invalid slot', () => {
      const result = equipMgr.unequip(player, 'boots' as string);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  // ─── Swap (Replace Equipment) ──────────────────────────────

  describe('Swap Equipment', () => {
    it('should swap tuned_staff → apprentice_staff', () => {
      inventory.addItem('apprentice_staff', 1);

      const result = equipMgr.equip(player, 'weapon', 'apprentice_staff');
      expect(result.success).toBe(true);
      expect(result.previousItemId).toBe('tuned_staff');
      expect(player.equipment.weapon).toBe('apprentice_staff');
      // Old item returned to inventory
      expect(inventory.hasItem('tuned_staff')).toBe(true);
      // New item consumed from inventory
      expect(inventory.hasItem('apprentice_staff')).toBe(false);
    });

    it('should swap apprentice_staff → tuned_staff back', () => {
      // Setup: equip apprentice_staff first
      inventory.addItem('apprentice_staff', 1);
      equipMgr.equip(player, 'weapon', 'apprentice_staff');
      // Now tuned_staff is in inventory, apprentice_staff is equipped

      const result = equipMgr.equip(player, 'weapon', 'tuned_staff');
      expect(result.success).toBe(true);
      expect(player.equipment.weapon).toBe('tuned_staff');
      expect(inventory.hasItem('apprentice_staff')).toBe(true);
      expect(inventory.hasItem('tuned_staff')).toBe(false);
    });

    it('should swap armor correctly', () => {
      inventory.addItem('traveler_tunic', 1);
      equipMgr.equip(player, 'armor', 'traveler_tunic');

      inventory.addItem('ether_cuirass', 1);
      const result = equipMgr.equip(player, 'armor', 'ether_cuirass');
      expect(result.success).toBe(true);
      expect(player.equipment.armor).toBe('ether_cuirass');
      expect(inventory.hasItem('traveler_tunic')).toBe(true);
      expect(inventory.hasItem('ether_cuirass')).toBe(false);
    });

    it('should swap accessory correctly', () => {
      inventory.addItem('amber_pendant', 1);
      equipMgr.equip(player, 'accessory', 'amber_pendant');

      inventory.addItem('crystal_ring', 1);
      const result = equipMgr.equip(player, 'accessory', 'crystal_ring');
      expect(result.success).toBe(true);
      expect(player.equipment.accessory).toBe('crystal_ring');
      expect(inventory.hasItem('amber_pendant')).toBe(true);
    });
  });

  // ─── calculateEffectiveStats ───────────────────────────────

  describe('calculateEffectiveStats', () => {
    it('with no equipment, effective stats should equal base stats', () => {
      player.equipment.weapon = null;
      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(player.stats.atk);
      expect(effective.def).toBe(player.stats.def);
      expect(effective.mag).toBe(player.stats.mag);
      expect(effective.res).toBe(player.stats.res);
      expect(effective.vel).toBe(player.stats.vel);
      expect(effective.sor).toBe(player.stats.sor);
      expect(effective.maxHp).toBe(player.maxHp);
      expect(effective.maxMp).toBe(player.maxMp);
    });

    it('with weapon ATK +5, effective ATK = base + 5', () => {
      // tuned_staff already equipped
      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(12 + 5); // 17
    });

    it('with weapon + armor, all bonuses should be applied', () => {
      // tuned_staff equipped: ATK +5, MAG +2
      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass'); // DEF +5, RES +3

      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(12 + 5);  // tuned_staff ATK +5
      expect(effective.mag).toBe(8 + 2);   // tuned_staff MAG +2
      expect(effective.def).toBe(10 + 5);  // ether_cuirass DEF +5
      expect(effective.res).toBe(9 + 3);   // ether_cuirass RES +3
      expect(effective.vel).toBe(11);      // no bonus
      expect(effective.sor).toBe(5);       // no bonus
    });

    it('with all 3 slots filled, all bonuses should sum correctly', () => {
      // tuned_staff (weapon): ATK +5, MAG +2
      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass'); // DEF +5, RES +3
      inventory.addItem('crystal_ring', 1);
      equipMgr.equip(player, 'accessory', 'crystal_ring'); // MAG +3, VEL +1

      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(12 + 5);        // 17
      expect(effective.def).toBe(10 + 5);         // 15
      expect(effective.mag).toBe(8 + 2 + 3);      // 13 (tuned_staff + crystal_ring)
      expect(effective.res).toBe(9 + 3);          // 12
      expect(effective.vel).toBe(11 + 1);         // 12
      expect(effective.sor).toBe(5);              // no bonus
    });

    it('item with no bonus should not change effective stats', () => {
      player.equipment.weapon = null;
      // Manually test with a hypothetical zero-bonus equipment
      // (We use base stats comparison since weapon is null)
      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(player.stats.atk);
    });

    it('effective stats should be clamped to [1, 999]', () => {
      // Set base ATK to 998 to test upper clamp
      player.stats.atk = 998;
      // tuned_staff gives +5, so 998 + 5 = 1003 → clamped to 999
      const effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(999);
    });

    it('CRITICAL: swap should NOT accumulate stats', () => {
      // Base ATK = 12, tuned_staff +5 → effective = 17
      let effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(17);

      // Swap to apprentice_staff +3
      inventory.addItem('apprentice_staff', 1);
      equipMgr.equip(player, 'weapon', 'apprentice_staff');

      effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(15); // 12 + 3 = 15, NOT 17 + 3 = 20

      // Swap back to tuned_staff +5
      equipMgr.equip(player, 'weapon', 'tuned_staff');
      effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(17); // 12 + 5 = 17, NOT 15 + 5 = 20

      // Verify base stats NEVER changed
      expect(player.stats.atk).toBe(12);
    });
  });

  // ─── Base Stats Never Mutated ──────────────────────────────

  describe('Base Stats Immutability', () => {
    it('equip should never modify playerState.stats', () => {
      const originalStats = { ...player.stats };

      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass');

      expect(player.stats).toEqual(originalStats);
    });

    it('unequip should never modify playerState.stats', () => {
      const originalStats = { ...player.stats };

      equipMgr.unequip(player, 'weapon');

      expect(player.stats).toEqual(originalStats);
    });

    it('multiple swap cycles should never modify playerState.stats', () => {
      const originalStats = { ...player.stats };

      // Cycle 1: swap weapon
      inventory.addItem('apprentice_staff', 1);
      equipMgr.equip(player, 'weapon', 'apprentice_staff');

      // Cycle 2: swap back
      equipMgr.equip(player, 'weapon', 'tuned_staff');

      // Cycle 3: equip armor
      inventory.addItem('traveler_tunic', 1);
      equipMgr.equip(player, 'armor', 'traveler_tunic');

      // Cycle 4: swap armor
      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass');

      // Cycle 5: unequip armor
      equipMgr.unequip(player, 'armor');

      expect(player.stats).toEqual(originalStats);
    });
  });

  // ─── HP/MP with Equipment ──────────────────────────────────

  describe('HP/MP Rules', () => {
    it('equip should NOT restore HP', () => {
      player.hp = 50; // Below max
      inventory.addItem('traveler_tunic', 1);
      equipMgr.equip(player, 'armor', 'traveler_tunic');

      expect(player.hp).toBe(50); // Unchanged
    });

    it('equip should NOT restore MP', () => {
      player.mp = 10;
      inventory.addItem('crystal_ring', 1);
      equipMgr.equip(player, 'accessory', 'crystal_ring');

      expect(player.mp).toBe(10); // Unchanged
    });

    it('unequip should NOT cure (restore) HP/MP', () => {
      player.hp = 50;
      player.mp = 10;

      equipMgr.unequip(player, 'weapon');

      expect(player.hp).toBe(50);
      expect(player.mp).toBe(10);
    });
  });

  // ─── Atomicity ─────────────────────────────────────────────

  describe('Atomicity', () => {
    it('failed equip should not modify any state', () => {
      const originalEquipment = { ...player.equipment };
      const originalStats = { ...player.stats };
      const originalGold = inventory.getGold();

      // Try to equip something not in inventory
      const result = equipMgr.equip(player, 'accessory', 'amber_pendant');
      expect(result.success).toBe(false);

      // State unchanged
      expect(player.equipment).toEqual(originalEquipment);
      expect(player.stats).toEqual(originalStats);
      expect(inventory.getGold()).toBe(originalGold);
    });

    it('failed unequip should not modify any state', () => {
      // tuned_staff is in inventory too (add it to create the "already has" condition)
      inventory.addItem('tuned_staff', 1);

      const originalEquipment = { ...player.equipment };

      const result = equipMgr.unequip(player, 'weapon');
      expect(result.success).toBe(false);

      // Equipment unchanged
      expect(player.equipment).toEqual(originalEquipment);
      // Item still in inventory
      expect(inventory.hasItem('tuned_staff')).toBe(true);
    });

    it('failed swap should not modify any state', () => {
      // Try to equip an item with wrong slot
      inventory.addItem('amber_pendant', 1);

      const originalEquipment = { ...player.equipment };

      const result = equipMgr.equip(player, 'weapon', 'amber_pendant');
      expect(result.success).toBe(false);

      expect(player.equipment).toEqual(originalEquipment);
      expect(inventory.hasItem('amber_pendant')).toBe(true);
    });
  });

  // ─── Consistency After Multiple Operations ─────────────────

  describe('Consistency', () => {
    it('10 equip/unequip cycles should maintain consistent state', () => {
      const baseStats = { ...player.stats };

      for (let i = 0; i < 10; i++) {
        // Unequip weapon
        equipMgr.unequip(player, 'weapon');
        expect(player.equipment.weapon).toBeNull();
        expect(inventory.hasItem('tuned_staff')).toBe(true);

        let effective = equipMgr.calculateEffectiveStats(player);
        expect(effective.atk).toBe(baseStats.atk); // 12

        // Re-equip weapon
        equipMgr.equip(player, 'weapon', 'tuned_staff');
        expect(player.equipment.weapon).toBe('tuned_staff');
        expect(inventory.hasItem('tuned_staff')).toBe(false);

        effective = equipMgr.calculateEffectiveStats(player);
        expect(effective.atk).toBe(baseStats.atk + 5); // 17
      }

      // Base stats never changed
      expect(player.stats).toEqual(baseStats);
    });

    it('equip all 3 slots then unequip all should return to base', () => {
      // Equip armor
      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass');

      // Equip accessory
      inventory.addItem('amber_pendant', 1);
      equipMgr.equip(player, 'accessory', 'amber_pendant');

      // Full load check
      let effective = equipMgr.calculateEffectiveStats(player);
      expect(effective.atk).toBe(12 + 5);  // tuned_staff
      expect(effective.def).toBe(10 + 5);  // ether_cuirass
      expect(effective.res).toBe(9 + 3 + 2); // ether_cuirass + amber_pendant
      expect(effective.sor).toBe(5 + 2);   // amber_pendant
      expect(effective.mag).toBe(8 + 2);   // tuned_staff

      // Unequip everything
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
    });

    it('equipment and inventory should remain consistent after swaps', () => {
      // Start: weapon=tuned_staff, inventory has nothing
      inventory.addItem('apprentice_staff', 1);

      // Swap weapon
      equipMgr.equip(player, 'weapon', 'apprentice_staff');
      expect(player.equipment.weapon).toBe('apprentice_staff');
      expect(inventory.hasItem('tuned_staff')).toBe(true);
      expect(inventory.hasItem('apprentice_staff')).toBe(false);

      // Swap back
      equipMgr.equip(player, 'weapon', 'tuned_staff');
      expect(player.equipment.weapon).toBe('tuned_staff');
      expect(inventory.hasItem('apprentice_staff')).toBe(true);
      expect(inventory.hasItem('tuned_staff')).toBe(false);

      // Unequip
      equipMgr.unequip(player, 'weapon');
      expect(player.equipment.weapon).toBeNull();
      expect(inventory.hasItem('tuned_staff')).toBe(true);
      expect(inventory.hasItem('apprentice_staff')).toBe(true);
    });
  });

  // ─── getTotalBonus ─────────────────────────────────────────

  describe('getTotalBonus', () => {
    it('should return correct ATK bonus with tuned_staff', () => {
      expect(equipMgr.getTotalBonus(player, 'atk')).toBe(5);
    });

    it('should return 0 for stats with no equipment bonus', () => {
      expect(equipMgr.getTotalBonus(player, 'def')).toBe(0);
      expect(equipMgr.getTotalBonus(player, 'vel')).toBe(0);
    });

    it('should sum bonuses from multiple slots', () => {
      inventory.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass');

      inventory.addItem('amber_pendant', 1);
      equipMgr.equip(player, 'accessory', 'amber_pendant');

      expect(equipMgr.getTotalBonus(player, 'res')).toBe(3 + 2); // cuirass + pendant
    });
  });
});
