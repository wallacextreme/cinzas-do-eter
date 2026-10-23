/**
 * StatusManager — Unit Tests
 *
 * F3-U08: Menu de Status
 * Tests cover: initialization, view model creation, effective stats delegation,
 * base stats immutability, equipment slot display, dynamic updates after equip/unequip,
 * navigation, and formatters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatusManager, formatStatBonus } from '@systems/StatusManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { createDefaultPlayer } from '@entities/Player.ts';
import type { PlayerState } from '@entities/Player.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('StatusManager', () => {
  let invMgr: InventoryManager;
  let equipMgr: EquipmentManager;
  let statusMgr: StatusManager;
  let player: PlayerState;

  beforeEach(() => {
    invMgr = new InventoryManager();
    equipMgr = new EquipmentManager(invMgr);
    statusMgr = new StatusManager(equipMgr);
    player = createDefaultPlayer();
  });

  describe('Initialization & Open/Close Lifecycle', () => {
    it('should initialize in closed state with slot index 0', () => {
      expect(statusMgr.isOpen()).toBe(false);
      expect(statusMgr.getSelectedSlotIndex()).toBe(0);
    });

    it('should open and emit menu:statusOpened', () => {
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const opened = statusMgr.open(player);

      expect(opened).toBe(true);
      expect(statusMgr.isOpen()).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('menu:statusOpened', { player });
    });

    it('should not re-open if already open', () => {
      statusMgr.open(player);
      const secondOpen = statusMgr.open(player);
      expect(secondOpen).toBe(false);
    });

    it('should close and emit menu:statusClosed', () => {
      statusMgr.open(player);
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const closed = statusMgr.close();

      expect(closed).toBe(true);
      expect(statusMgr.isOpen()).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith('menu:statusClosed', {});
    });

    it('should return false when closing if already closed', () => {
      const closed = statusMgr.close();
      expect(closed).toBe(false);
    });
  });

  describe('ViewModel Creation & Player Identity', () => {
    it('should correctly format basic player identity and resources', () => {
      const vm = statusMgr.getStatusViewModel(player);

      expect(vm.name).toBe('Kaël');
      expect(vm.title).toBe('Adepto do Éter');
      expect(vm.level).toBe(1);
      expect(vm.hp).toBe(150);
      expect(vm.maxHp).toBe(150);
      expect(vm.mp).toBe(45);
      expect(vm.maxMp).toBe(45);
      expect(vm.xp).toBe(0);
      expect(vm.xpToNext).toBe(20);
      expect(vm.xpRemaining).toBe(20);
    });

    it('should correctly calculate xpRemaining when xp is accumulated', () => {
      player.xp = 12;
      const vm = statusMgr.getStatusViewModel(player);
      expect(vm.xpRemaining).toBe(8);
    });
  });

  describe('Effective Stats Delegation & Base Immutability', () => {
    it('should delegate to EquipmentManager and reflect tuned_staff initial bonuses', () => {
      // Tuned staff gives ATK +5, MAG +2
      // Base stats: ATK 12, DEF 10, MAG 8, RES 9, VEL 11, SOR 5
      const vm = statusMgr.getStatusViewModel(player);

      const atkStat = vm.stats.find((s) => s.key === 'atk')!;
      expect(atkStat.base).toBe(12);
      expect(atkStat.effective).toBe(17);
      expect(atkStat.bonus).toBe(5);

      const magStat = vm.stats.find((s) => s.key === 'mag')!;
      expect(magStat.base).toBe(8);
      expect(magStat.effective).toBe(10);
      expect(magStat.bonus).toBe(2);

      const defStat = vm.stats.find((s) => s.key === 'def')!;
      expect(defStat.base).toBe(10);
      expect(defStat.effective).toBe(10);
      expect(defStat.bonus).toBe(0);

      const resStat = vm.stats.find((s) => s.key === 'res')!;
      expect(resStat.base).toBe(9);
      expect(resStat.effective).toBe(9);
      expect(resStat.bonus).toBe(0);

      const velStat = vm.stats.find((s) => s.key === 'vel')!;
      expect(velStat.base).toBe(11);
      expect(velStat.effective).toBe(11);
      expect(velStat.bonus).toBe(0);

      const sorStat = vm.stats.find((s) => s.key === 'sor')!;
      expect(sorStat.base).toBe(5);
      expect(sorStat.effective).toBe(5);
      expect(sorStat.bonus).toBe(0);
    });

    it('should NEVER mutate player base stats during ViewModel generation', () => {
      const statsSnapshot = { ...player.stats };
      statusMgr.getStatusViewModel(player);

      expect(player.stats).toEqual(statsSnapshot);
      expect(player.stats.atk).toBe(12);
      expect(player.stats.mag).toBe(8);
    });
  });

  describe('Equipment Slot Presentation', () => {
    it('should display initial loadout with tuned_staff and empty armor/accessory', () => {
      const vm = statusMgr.getStatusViewModel(player);

      expect(vm.equipment.length).toBe(3);

      const weaponSlot = vm.equipment[0];
      expect(weaponSlot.slot).toBe('weapon');
      expect(weaponSlot.slotLabel).toBe('Arma');
      expect(weaponSlot.itemId).toBe('tuned_staff');
      expect(weaponSlot.itemName).toBe('Bastão Sintonizado');
      expect(weaponSlot.bonusDescription).toBe('ATK +5, MAG +2');

      const armorSlot = vm.equipment[1];
      expect(armorSlot.slot).toBe('armor');
      expect(armorSlot.slotLabel).toBe('Armadura');
      expect(armorSlot.itemId).toBeNull();
      expect(armorSlot.itemName).toBe('(Nenhum)');
      expect(armorSlot.bonusDescription).toBe('—');

      const accessorySlot = vm.equipment[2];
      expect(accessorySlot.slot).toBe('accessory');
      expect(accessorySlot.slotLabel).toBe('Acessório');
      expect(accessorySlot.itemId).toBeNull();
      expect(accessorySlot.itemName).toBe('(Nenhum)');
      expect(accessorySlot.bonusDescription).toBe('—');
    });
  });

  describe('Dynamic Updates After Equip / Unequip', () => {
    it('should reflect newly equipped armor and accessory in ViewModel', () => {
      // Add items to inventory and equip them
      invMgr.addItem('traveler_tunic', 1);
      equipMgr.equip(player, 'armor', 'traveler_tunic');

      invMgr.addItem('amber_pendant', 1);
      equipMgr.equip(player, 'accessory', 'amber_pendant');

      const vm = statusMgr.getStatusViewModel(player);

      // Verify armor slot
      expect(vm.equipment[1].itemName).toBe('Túnica de Viajante');
      expect(vm.equipment[1].bonusDescription).toBe('DEF +3');

      // Verify accessory slot
      expect(vm.equipment[2].itemName).toBe('Pingente de Âmbar');
      expect(vm.equipment[2].bonusDescription).toBe('RES +2, SOR +2');

      // Verify effective stats reflect new bonuses
      const defStat = vm.stats.find((s) => s.key === 'def')!;
      expect(defStat.effective).toBe(13); // 10 + 3
      expect(defStat.bonus).toBe(3);

      const resStat = vm.stats.find((s) => s.key === 'res')!;
      expect(resStat.effective).toBe(11); // 9 + 2
      expect(resStat.bonus).toBe(2);

      const sorStat = vm.stats.find((s) => s.key === 'sor')!;
      expect(sorStat.effective).toBe(7); // 5 + 2
      expect(sorStat.bonus).toBe(2);
    });

    it('should reflect unequipped weapon reverting stats to pure base', () => {
      // Unequip weapon
      equipMgr.unequip(player, 'weapon');

      const vm = statusMgr.getStatusViewModel(player);

      expect(vm.equipment[0].itemId).toBeNull();
      expect(vm.equipment[0].itemName).toBe('(Nenhum)');

      const atkStat = vm.stats.find((s) => s.key === 'atk')!;
      expect(atkStat.effective).toBe(12);
      expect(atkStat.bonus).toBe(0);

      const magStat = vm.stats.find((s) => s.key === 'mag')!;
      expect(magStat.effective).toBe(8);
      expect(magStat.bonus).toBe(0);
    });
  });

  describe('Slot Navigation', () => {
    it('should cycle through slots with selectNextSlot', () => {
      expect(statusMgr.getSelectedSlotIndex()).toBe(0);

      expect(statusMgr.selectNextSlot()).toBe(1);
      expect(statusMgr.selectNextSlot()).toBe(2);
      expect(statusMgr.selectNextSlot()).toBe(0); // wrap around
    });

    it('should cycle backwards with selectPreviousSlot', () => {
      expect(statusMgr.getSelectedSlotIndex()).toBe(0);

      expect(statusMgr.selectPreviousSlot()).toBe(2); // wrap around
      expect(statusMgr.selectPreviousSlot()).toBe(1);
      expect(statusMgr.selectPreviousSlot()).toBe(0);
    });

    it('should return selectedEquipment matching selectedSlotIndex', () => {
      statusMgr.setSelectedSlotIndex(1); // Armor
      const vm = statusMgr.getStatusViewModel(player);

      expect(vm.selectedSlotIndex).toBe(1);
      expect(vm.selectedEquipment.slot).toBe('armor');
    });

    it('should ignore invalid index in setSelectedSlotIndex', () => {
      statusMgr.setSelectedSlotIndex(0);
      statusMgr.setSelectedSlotIndex(99);
      expect(statusMgr.getSelectedSlotIndex()).toBe(0);

      statusMgr.setSelectedSlotIndex(-1);
      expect(statusMgr.getSelectedSlotIndex()).toBe(0);
    });
  });

  describe('formatStatBonus Helper', () => {
    it('should format multiple stats into comma-separated string', () => {
      expect(formatStatBonus({ atk: 5, mag: 2 })).toBe('ATK +5, MAG +2');
    });

    it('should format single stat', () => {
      expect(formatStatBonus({ def: 3 })).toBe('DEF +3');
    });

    it('should return — for empty or undefined bonus', () => {
      expect(formatStatBonus(undefined)).toBe('—');
      expect(formatStatBonus({})).toBe('—');
    });
  });
});
