/**
 * EquipmentManager — Equipment System Domain Logic
 *
 * Pure TypeScript, no Phaser dependencies.
 * Manages equip/unequip operations and calculates effective stats.
 *
 * Key design principles:
 * - PlayerState.stats is NEVER mutated by equipment operations.
 * - Effective stats are always DERIVED: base + Σ(bonuses).
 * - Equipment items leave the inventory when equipped and return when unequipped.
 * - All operations are atomic: if a precondition fails, no state changes.
 *
 * Emits EventBus events:
 * - 'equipment:changed' ({ slot, previousItemId, newItemId })
 */

import { safeAdd, clamp, isValidNumber } from '@utils/math.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import {
  getEquipmentDefinition,
  EQUIPMENT_SLOTS,
} from '@data/equipmentData.ts';
import type {
  EquipmentSlot,
  StatBonus,
} from '@data/equipmentData.ts';
import type { PlayerState } from '@entities/Player.ts';
import type { InventoryManager } from '@inventory/InventoryManager.ts';

/**
 * Effective stats computed from base stats + equipment bonuses.
 * This is a derived, immutable snapshot — never stored as source of truth.
 */
export interface EffectiveStats {
  readonly atk: number;
  readonly def: number;
  readonly mag: number;
  readonly res: number;
  readonly vel: number;
  readonly sor: number;
  readonly maxHp: number;
  readonly maxMp: number;
}

/**
 * Result of an equip/unequip operation.
 */
export interface EquipResult {
  readonly success: boolean;
  readonly previousItemId: string | null;
  readonly error?: string;
}

/**
 * Validates that a slot string is a valid EquipmentSlot.
 */
function isValidSlot(slot: string): slot is EquipmentSlot {
  return EQUIPMENT_SLOTS.includes(slot as EquipmentSlot);
}

/**
 * Safely reads a numeric bonus value, returning 0 for invalid/NaN/undefined.
 */
function safeBonusValue(value: number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (!isValidNumber(value)) return 0;
  return value;
}

export class EquipmentManager {
  private readonly inventory: InventoryManager;

  constructor(inventory: InventoryManager) {
    this.inventory = inventory;
  }

  /**
   * Equips an item into the specified slot.
   *
   * Atomic operation:
   * 1. Validate item exists in EQUIPMENT_DATABASE
   * 2. Validate slot matches item's designated slot
   * 3. Verify player owns the item in inventory
   * 4. If slot already occupied, verify inventory can accept the old item
   * 5. Execute the swap atomically
   * 6. Clamp HP/MP if effective maxHp/maxMp decreased
   * 7. Emit 'equipment:changed' event
   */
  equip(playerState: PlayerState, slot: string, itemId: string): EquipResult {
    // Validate slot
    if (!isValidSlot(slot)) {
      return { success: false, previousItemId: null, error: 'Invalid equipment slot' };
    }

    // Validate item exists in equipment database
    const equipDef = getEquipmentDefinition(itemId);
    if (!equipDef) {
      return { success: false, previousItemId: null, error: 'Item not found in equipment database' };
    }

    // Validate slot matches
    if (equipDef.slot !== slot) {
      return { success: false, previousItemId: null, error: `Item "${itemId}" belongs to slot "${equipDef.slot}", not "${slot}"` };
    }

    // Verify player owns the item
    if (!this.inventory.hasItem(itemId, 1)) {
      return { success: false, previousItemId: null, error: 'Item not in inventory' };
    }

    const previousItemId = playerState.equipment[slot];

    // If there's already an item equipped, check if we can return it to inventory
    // For swap: we need space. But since we're removing the new item first and adding the old one,
    // the net slot count doesn't change if both are different items.
    // Edge case: if they're the same item, it's a no-op.
    if (previousItemId === itemId) {
      return { success: true, previousItemId };
    }

    // Pre-validate the swap can complete:
    // - Remove new item from inventory (frees 1 slot if it's the last of its kind)
    // - Add old item to inventory (needs 1 slot if it's a new entry)
    // We need to simulate this to ensure atomicity.
    if (previousItemId) {
      // Swap scenario: removing new item first, then adding old item.
      // Since equipment items have maxStack: 1, removing the new item always frees a slot
      // if it was the only one. Adding the old item might need a slot.
      // Net effect: inventory count stays the same or decreases by 1.
      // However, to be safe, let's check if inventory can handle the return.

      // Simulate: can we do removeItem(newItem) + addItem(oldItem)?
      // The safest approach: check that after removing newItem, we can add oldItem.
      // Since both are maxStack:1 equipment, removing frees a slot that adding can use.
      // Exception: if the old item already exists in inventory (duplicate check).
      const oldItemQuantity = this.inventory.getItemQuantity(previousItemId);
      if (oldItemQuantity >= 1) {
        // Old item already in inventory and maxStack is 1 — can't return it
        return { success: false, previousItemId, error: 'Cannot return previous equipment to inventory (stack full)' };
      }
    }

    // === Execute atomic transaction ===

    // Step 1: Remove new item from inventory
    const removeSuccess = this.inventory.removeItem(itemId, 1);
    if (!removeSuccess) {
      return { success: false, previousItemId: null, error: 'Failed to remove item from inventory' };
    }

    // Step 2: Return old item to inventory (if any)
    if (previousItemId) {
      const addSuccess = this.inventory.addItem(previousItemId, 1);
      if (!addSuccess) {
        // Rollback: put the new item back
        this.inventory.addItem(itemId, 1);
        return { success: false, previousItemId, error: 'Failed to return previous item to inventory' };
      }
    }

    // Step 3: Update equipment slot
    playerState.equipment[slot] = itemId;

    // Step 4: Clamp HP/MP to new effective maximums
    this.clampCurrentResources(playerState);

    // Step 5: Emit event
    EventBus.emit('equipment:changed', {
      slot,
      previousItemId,
      newItemId: itemId,
    });

    return { success: true, previousItemId };
  }

  /**
   * Removes the equipped item from a slot, returning it to inventory.
   *
   * Atomic operation:
   * 1. Validate slot
   * 2. Check slot is occupied
   * 3. Verify inventory can accept the item
   * 4. Return item to inventory
   * 5. Clear the slot
   * 6. Clamp HP/MP if effective maxHp/maxMp decreased
   * 7. Emit 'equipment:changed' event
   */
  unequip(playerState: PlayerState, slot: string): EquipResult {
    // Validate slot
    if (!isValidSlot(slot)) {
      return { success: false, previousItemId: null, error: 'Invalid equipment slot' };
    }

    const currentItemId = playerState.equipment[slot];

    // Check slot is occupied
    if (!currentItemId) {
      return { success: false, previousItemId: null, error: 'Slot is empty' };
    }

    // Check inventory can accept the item
    const currentQuantity = this.inventory.getItemQuantity(currentItemId);
    if (currentQuantity >= 1) {
      // Equipment items have maxStack: 1, so we can't add if already present
      return { success: false, previousItemId: currentItemId, error: 'Cannot return item to inventory (stack full)' };
    }

    // Check inventory has slot space
    const addSuccess = this.inventory.addItem(currentItemId, 1);
    if (!addSuccess) {
      return { success: false, previousItemId: currentItemId, error: 'Inventory full, cannot return item' };
    }

    // Clear the slot
    playerState.equipment[slot] = null;

    // Clamp HP/MP to new effective maximums
    this.clampCurrentResources(playerState);

    // Emit event
    EventBus.emit('equipment:changed', {
      slot,
      previousItemId: currentItemId,
      newItemId: null,
    });

    return { success: true, previousItemId: currentItemId };
  }

  /**
   * Returns the currently equipped item ID for a given slot.
   */
  getEquipped(playerState: PlayerState, slot: string): string | null {
    if (!isValidSlot(slot)) return null;
    return playerState.equipment[slot];
  }

  /**
   * Calculates effective stats by combining base stats with all equipment bonuses.
   *
   * This is a PURE DERIVATION — it never mutates PlayerState.
   * Formula: effective[stat] = base[stat] + Σ(equipment[slot].bonus[stat])
   *
   * All values are clamped to CONTRACTS.md bounds:
   * - Stats: [1, 999]
   * - maxHp: [1, 9999]
   * - maxMp: [0, 999]
   */
  calculateEffectiveStats(playerState: PlayerState): EffectiveStats {
    // Start with base stats
    let atk = playerState.stats.atk;
    let def = playerState.stats.def;
    let mag = playerState.stats.mag;
    let res = playerState.stats.res;
    let vel = playerState.stats.vel;
    let sor = playerState.stats.sor;
    let maxHp = playerState.maxHp;
    let maxMp = playerState.maxMp;

    // Sum bonuses from all equipped items
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = playerState.equipment[slot];
      if (!itemId) continue;

      const equipDef = getEquipmentDefinition(itemId);
      if (!equipDef) continue;

      const b = equipDef.bonus;
      atk = safeAdd(atk, safeBonusValue(b.atk));
      def = safeAdd(def, safeBonusValue(b.def));
      mag = safeAdd(mag, safeBonusValue(b.mag));
      res = safeAdd(res, safeBonusValue(b.res));
      vel = safeAdd(vel, safeBonusValue(b.vel));
      sor = safeAdd(sor, safeBonusValue(b.sor));
      maxHp = safeAdd(maxHp, safeBonusValue(b.maxHp));
      maxMp = safeAdd(maxMp, safeBonusValue(b.maxMp));
    }

    // Clamp to CONTRACTS.md bounds
    return {
      atk: clamp(atk, 1, 999),
      def: clamp(def, 1, 999),
      mag: clamp(mag, 1, 999),
      res: clamp(res, 1, 999),
      vel: clamp(vel, 1, 999),
      sor: clamp(sor, 1, 999),
      maxHp: clamp(maxHp, 1, 9999),
      maxMp: clamp(maxMp, 0, 999),
    };
  }

  /**
   * Clamps current HP and MP to the effective maximums derived from equipment.
   * Called after every equip/unequip operation to enforce invariants.
   *
   * If removing equipment reduced effective maxHp/maxMp below current hp/mp,
   * hp/mp are clamped down. If equipment increased the maximums, hp/mp remain unchanged.
   */
  clampCurrentResources(playerState: PlayerState): void {
    const effective = this.calculateEffectiveStats(playerState);

    if (playerState.hp > effective.maxHp) {
      playerState.hp = effective.maxHp;
    }
    if (playerState.mp > effective.maxMp) {
      playerState.mp = effective.maxMp;
    }
  }

  /**
   * Returns the total stat bonus from all currently equipped items for a specific stat.
   * Useful for UI display (showing "+5 ATK" next to base stat).
   */
  getTotalBonus(playerState: PlayerState, stat: keyof StatBonus): number {
    let total = 0;

    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = playerState.equipment[slot];
      if (!itemId) continue;

      const equipDef = getEquipmentDefinition(itemId);
      if (!equipDef) continue;

      total = safeAdd(total, safeBonusValue(equipDef.bonus[stat]));
    }

    return total;
  }
}
