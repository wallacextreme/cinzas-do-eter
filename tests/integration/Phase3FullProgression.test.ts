/**
 * Phase 3 Full Progression Integration Test (F3-U10)
 *
 * Comprehensive end-to-end integration test validating the entire Phase 3
 * lifecycle for Kaël:
 * - F3-U01 & F3-U02: Entity representation & facing
 * - F3-U03: Canonical base stats & invariant bounds
 * - F3-U04: XP progression curve (level * level * 20)
 * - F3-U05: Level up stat growth (+25 Max HP, +8 Max MP, +2 ATK/DEF/MAG/RES, +1 VEL/SOR)
 * - F3-U06: Combat operations (damagePlayer, healPlayer, consumeMp, restoreMp)
 * - F3-U07: Equipment loadout & pure derived EffectiveStats (tuned_staff, traveler_tunic, amber_pendant)
 * - F3-U08: StatusManager & StatusViewModel consumption
 * - F3-U09: InventoryManager & ItemUseManager atomic consumption & rollback guarantees
 * - Full Save/Load state preservation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultPlayer,
  damagePlayer,
  consumeMp,
  addPlayerXp,
  type PlayerState,
} from '@entities/Player.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { StatusManager } from '@systems/StatusManager.ts';
import { ItemUseManager } from '@systems/ItemUseManager.ts';
import { ShopManager } from '@shop/ShopManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('Phase 3: Full Progression & System Integration (F3-U10)', () => {
  let player: PlayerState;
  let inventory: InventoryManager;
  let equipmentManager: EquipmentManager;
  let statusManager: StatusManager;
  let itemUseManager: ItemUseManager;
  let shopManager: ShopManager;

  beforeEach(() => {
    EventBus.removeAll();
    player = createDefaultPlayer();
    inventory = new InventoryManager({ gold: 300 }); // Starting gold adequate for tests
    equipmentManager = new EquipmentManager(inventory);
    statusManager = new StatusManager(equipmentManager);
    itemUseManager = new ItemUseManager(inventory, equipmentManager);
    shopManager = new ShopManager(inventory);
  });

  it('orchestrates Kaël from Level 1 baseline through shopping, equipping, combat operations, leveling up, and saving', () => {
    // ── 1. Canonical Baseline & Loadout Verification ──
    expect(player.name).toBe('Kaël');
    expect(player.level).toBe(1);
    expect(player.hp).toBe(150);
    expect(player.maxHp).toBe(150);
    expect(player.mp).toBe(45);
    expect(player.maxMp).toBe(45);
    expect(player.xp).toBe(0);
    expect(player.xpToNext).toBe(20);

    // Kaël starts equipped with tuned_staff (GDD)
    expect(player.equipment.weapon).toBe('tuned_staff');
    expect(player.equipment.armor).toBeNull();
    expect(player.equipment.accessory).toBeNull();
    expect(inventory.getItemQuantity('tuned_staff')).toBe(0);

    // Derived effective stats: tuned_staff gives ATK +5, MAG +2
    const initEffective = equipmentManager.calculateEffectiveStats(player);
    expect(initEffective.atk).toBe(17); // 12 base + 5
    expect(initEffective.def).toBe(10); // 10 base
    expect(initEffective.mag).toBe(10); // 8 base + 2
    expect(initEffective.res).toBe(9);  // 9 base
    expect(initEffective.vel).toBe(11); // 11 base
    expect(initEffective.sor).toBe(5);  // 5 base

    // Immutability: base stats must never be mutated
    expect(player.stats.atk).toBe(12);
    expect(player.stats.mag).toBe(8);

    // ── 2. Torvak Shop Interaction & Economy ──
    shopManager.openShop('shop_torvak');
    expect(shopManager.isOpen()).toBe(true);

    // Buy 2x Elixir Âmbar (30 ea = 60) and 1x Gota de Éter (50 ea = 50)
    const buyElixir1 = shopManager.buyItemById('elixir_amber');
    const buyElixir2 = shopManager.buyItemById('elixir_amber');
    const buyEther = shopManager.buyItemById('ether_drop');

    expect(buyElixir1.success).toBe(true);
    expect(buyElixir2.success).toBe(true);
    expect(buyEther.success).toBe(true);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(2);
    expect(inventory.getItemQuantity('ether_drop')).toBe(1);
    expect(inventory.getGold()).toBe(190); // 300 - 110

    shopManager.closeShop();
    expect(shopManager.isOpen()).toBe(false);

    // ── 3. Equipment Acquisition & Loadout Upgrade ──
    // Player acquires Traveler's Tunic (armor)
    inventory.addItem('traveler_tunic', 1);
    expect(inventory.getItemQuantity('traveler_tunic')).toBe(1);

    const equipArmor = equipmentManager.equip(player, 'armor', 'traveler_tunic');
    expect(equipArmor.success).toBe(true);
    expect(player.equipment.armor).toBe('traveler_tunic');
    expect(inventory.getItemQuantity('traveler_tunic')).toBe(0); // Removed from inventory

    // Effective stats reflect traveler_tunic bonus (DEF +3)
    const midEffective = equipmentManager.calculateEffectiveStats(player);
    expect(midEffective.def).toBe(13); // 10 base + 3
    expect(player.stats.def).toBe(10); // Base remains 10

    // ── 4. Combat Simulation: Damage, Healing, and Atomic Consumption ──
    // Kaël suffers 70 environmental / combat damage
    const damageDealt = damagePlayer(player, 70);
    expect(damageDealt).toBe(70);
    expect(player.hp).toBe(80);

    // Consume 1st Elixir Âmbar via ItemUseManager
    const use1 = itemUseManager.useItem(player, 'elixir_amber');
    expect(use1.success).toBe(true);
    expect(use1.amountApplied).toBe(50);
    expect(player.hp).toBe(130);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

    // Consume 2nd Elixir Âmbar (clamps to maxHp 150)
    const use2 = itemUseManager.useItem(player, 'elixir_amber');
    expect(use2.success).toBe(true);
    expect(use2.amountApplied).toBe(20);
    expect(player.hp).toBe(150);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(0);
    expect(inventory.hasItem('elixir_amber')).toBe(false); // Entry cleared

    // Attempting 3rd Elixir when none exist is rejected
    const use3 = itemUseManager.useItem(player, 'elixir_amber');
    expect(use3.success).toBe(false);

    // MP Consumption & Restoration: Cast magic (cost 25 MP)
    const mpUsed = consumeMp(player, 25);
    expect(mpUsed).toBe(true);
    expect(player.mp).toBe(20); // 45 - 25

    // Consume Gota de Éter (+20 MP)
    const useEther = itemUseManager.useItem(player, 'ether_drop');
    expect(useEther.success).toBe(true);
    expect(useEther.amountApplied).toBe(20);
    expect(player.mp).toBe(40);
    expect(inventory.getItemQuantity('ether_drop')).toBe(0);

    // ── 5. Echo Cave Dungeon Reward: Amber Pendant (Accessory) ──
    // Player opens treasure chest in R7 and obtains amber_pendant
    inventory.addItem('amber_pendant', 1);
    expect(inventory.getItemQuantity('amber_pendant')).toBe(1);

    const equipAccessory = equipmentManager.equip(player, 'accessory', 'amber_pendant');
    expect(equipAccessory.success).toBe(true);
    expect(player.equipment.accessory).toBe('amber_pendant');
    expect(inventory.getItemQuantity('amber_pendant')).toBe(0);

    // Complete 3-piece loadout effective stats:
    // tuned_staff (ATK +5, MAG +2) + traveler_tunic (DEF +3) + amber_pendant (RES +2, SOR +2)
    const fullLoadoutStats = equipmentManager.calculateEffectiveStats(player);
    expect(fullLoadoutStats.atk).toBe(17); // 12 + 5
    expect(fullLoadoutStats.def).toBe(13); // 10 + 3
    expect(fullLoadoutStats.mag).toBe(10); // 8 + 2
    expect(fullLoadoutStats.res).toBe(11); // 9 + 2
    expect(fullLoadoutStats.vel).toBe(11); // 11
    expect(fullLoadoutStats.sor).toBe(7);  // 5 + 2

    // ── 6. Experience Progression & Level Up ──
    let levelUpEventFired = false;
    let newLevelEmitted = 0;
    EventBus.on('player:levelUp', (payload: any) => {
      levelUpEventFired = true;
      newLevelEmitted = payload.newLevel;
    });

    // Kaël earns 25 XP (xpToNext = 20), triggering Level Up to 2
    const xpResult = addPlayerXp(player, 25, true);
    expect(xpResult.leveledUp).toBe(true);
    expect(xpResult.newLevel).toBe(2);
    expect(levelUpEventFired).toBe(true);
    expect(newLevelEmitted).toBe(2);

    // Level Up stat gains:
    // Max HP +25 (150 -> 175) with full restore (hp = 175)
    // Max MP +8 (45 -> 53) with full restore (mp = 53)
    // Base stats +2 ATK, +2 DEF, +2 MAG, +2 RES, +1 VEL, +1 SOR
    expect(player.level).toBe(2);
    expect(player.maxHp).toBe(175);
    expect(player.hp).toBe(175);
    expect(player.maxMp).toBe(53);
    expect(player.mp).toBe(53);
    expect(player.xp).toBe(25);
    expect(player.xpToNext).toBe(80); // 2 * 2 * 20 = 80

    expect(player.stats.atk).toBe(14); // 12 + 2
    expect(player.stats.def).toBe(12); // 10 + 2
    expect(player.stats.mag).toBe(10); // 8 + 2
    expect(player.stats.res).toBe(11); // 9 + 2
    expect(player.stats.vel).toBe(12); // 11 + 1
    expect(player.stats.sor).toBe(6);  // 5 + 1

    // Effective stats at Level 2 with 3 equipped items
    const level2Effective = equipmentManager.calculateEffectiveStats(player);
    expect(level2Effective.atk).toBe(19); // 14 + 5
    expect(level2Effective.def).toBe(15); // 12 + 3
    expect(level2Effective.mag).toBe(12); // 10 + 2
    expect(level2Effective.res).toBe(13); // 11 + 2
    expect(level2Effective.vel).toBe(12); // 12
    expect(level2Effective.sor).toBe(8);  // 6 + 2
    expect(level2Effective.maxHp).toBe(175);
    expect(level2Effective.maxMp).toBe(53);

    // ── 7. Status Menu ViewModel Validation ──
    const vm = statusManager.getStatusViewModel(player);
    expect(vm.name).toBe('Kaël');
    expect(vm.level).toBe(2);
    expect(vm.hp).toBe(175);
    expect(vm.maxHp).toBe(175);
    expect(vm.mp).toBe(53);
    expect(vm.maxMp).toBe(53);
    expect(vm.xp).toBe(25);
    expect(vm.xpToNext).toBe(80);
    expect(vm.xpRemaining).toBe(55);

    // Verify all 6 stats in ViewModel match level2Effective with correct bonuses
    const vmAtk = vm.stats.find(s => s.key === 'atk');
    expect(vmAtk?.base).toBe(14);
    expect(vmAtk?.effective).toBe(19);
    expect(vmAtk?.bonus).toBe(5);

    const vmDef = vm.stats.find(s => s.key === 'def');
    expect(vmDef?.base).toBe(12);
    expect(vmDef?.effective).toBe(15);
    expect(vmDef?.bonus).toBe(3);

    // Verify equipment slots in ViewModel
    expect(vm.equipment[0].itemName).toBe('Bastão Sintonizado');
    expect(vm.equipment[1].itemName).toBe('Túnica de Viajante');
    expect(vm.equipment[2].itemName).toBe('Pingente de Âmbar');

    // ── 8. Serialization / Deserialization Roundtrip ──
    const savedInventory = inventory.toState();
    const savedPlayerState = JSON.parse(JSON.stringify(player));

    // Restore into fresh instances
    const restoredInventory = new InventoryManager(savedInventory);
    const restoredEquipment = new EquipmentManager(restoredInventory);
    const restoredEffective = restoredEquipment.calculateEffectiveStats(savedPlayerState);

    expect(restoredInventory.getGold()).toBe(190);
    expect(savedPlayerState.level).toBe(2);
    expect(savedPlayerState.equipment.weapon).toBe('tuned_staff');
    expect(savedPlayerState.equipment.armor).toBe('traveler_tunic');
    expect(savedPlayerState.equipment.accessory).toBe('amber_pendant');
    expect(restoredEffective.atk).toBe(19);
    expect(restoredEffective.def).toBe(15);
    expect(restoredEffective.maxHp).toBe(175);
  });
});
