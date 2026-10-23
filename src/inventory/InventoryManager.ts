/**
 * InventoryManager — Minimum Inventory Foundation
 *
 * Implements the official inventory contract from CONTRACTS.md.
 * Manages player currency ("Fragmentos") and item storage safely,
 * preventing NaN, overflow, negative balances, and invalid states.
 *
 * Emits EventBus events:
 * - 'inventory:goldChanged' ({ oldGold, newGold })
 * - 'inventory:itemAdded' ({ itemId, quantity })
 */

import { safeAdd, safeSub, clamp, isValidNumber } from '@utils/math.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

export interface InventoryItem {
  itemId: string;
  quantity: number; // [0, 99]
}

export interface Inventory {
  items: InventoryItem[];
  maxSlots: number;
  gold: number; // [0, 999999] ("Fragmentos")
}

export const MAX_GOLD = 999999;
export const MAX_STACK = 99;
export const DEFAULT_MAX_SLOTS = 20;
export const INITIAL_GOLD = 100; // Kaël starts with 100 Fragmentos per GDD.md

export class InventoryManager {
  private inventory: Inventory;

  constructor(initialInventory?: Partial<Inventory>) {
    const rawGold = initialInventory?.gold ?? INITIAL_GOLD;
    const validatedGold = isValidNumber(rawGold) && rawGold >= 0
      ? clamp(Math.floor(rawGold), 0, MAX_GOLD)
      : INITIAL_GOLD;

    this.inventory = {
      items: initialInventory?.items ? [...initialInventory.items.map(it => ({ ...it }))] : [],
      maxSlots: initialInventory?.maxSlots ?? DEFAULT_MAX_SLOTS,
      gold: validatedGold,
    };

    this.validate();
  }

  /**
   * Returns the current balance in Fragmentos.
   */
  getGold(): number {
    return this.inventory.gold;
  }

  /**
   * Checks if the player has at least the specified amount of Fragmentos.
   */
  hasGold(amount: number): boolean {
    if (!isValidNumber(amount) || amount < 0) return false;
    return this.inventory.gold >= amount;
  }

  /**
   * Adds Fragmentos to the inventory, clamped to MAX_GOLD.
   */
  addGold(amount: number): void {
    if (!isValidNumber(amount) || amount <= 0) return;
    const oldGold = this.inventory.gold;
    this.inventory.gold = clamp(safeAdd(this.inventory.gold, Math.floor(amount)), 0, MAX_GOLD);
    
    if (this.inventory.gold !== oldGold) {
      EventBus.emit('inventory:goldChanged', { oldGold, newGold: this.inventory.gold });
    }
  }

  /**
   * Safely deducts Fragmentos if sufficient funds exist.
   * Returns true if successful, false if insufficient or invalid.
   */
  removeGold(amount: number): boolean {
    if (!isValidNumber(amount) || amount < 0) return false;
    const intAmount = Math.floor(amount);
    if (this.inventory.gold < intAmount) {
      return false;
    }

    const oldGold = this.inventory.gold;
    this.inventory.gold = safeSub(this.inventory.gold, intAmount, true); // true = clamp at 0

    EventBus.emit('inventory:goldChanged', { oldGold, newGold: this.inventory.gold });
    return true;
  }

  /**
   * Gets the quantity owned of a specific item ID.
   */
  getItemQuantity(itemId: string): number {
    if (!itemId) return 0;
    const entry = this.inventory.items.find(it => it.itemId === itemId);
    return entry ? entry.quantity : 0;
  }

  /**
   * Checks if the player owns at least `quantity` of the item.
   */
  hasItem(itemId: string, quantity = 1): boolean {
    if (!isValidNumber(quantity) || quantity <= 0) return false;
    return this.getItemQuantity(itemId) >= quantity;
  }

  /**
   * Adds an item to the inventory.
   * Respects stack limit (99) and maxSlots limit.
   * Returns true on success, false if inventory cannot accommodate.
   */
  addItem(itemId: string, quantity = 1): boolean {
    if (!itemId || !isValidNumber(quantity) || quantity <= 0) {
      return false;
    }

    const intQuantity = Math.floor(quantity);
    const existing = this.inventory.items.find(it => it.itemId === itemId);

    if (existing) {
      // Check stack limit
      if (existing.quantity + intQuantity > MAX_STACK) {
        return false; // Exceeds stack capacity
      }
      existing.quantity = safeAdd(existing.quantity, intQuantity);
    } else {
      // Check slot limit
      if (this.inventory.items.length >= this.inventory.maxSlots) {
        return false; // Inventory full
      }
      if (intQuantity > MAX_STACK) {
        return false;
      }
      this.inventory.items.push({
        itemId,
        quantity: intQuantity,
      });
    }

    EventBus.emit('inventory:itemAdded', { itemId, quantity: intQuantity });
    return true;
  }

  /**
   * Removes an item from the inventory.
   * Removes the slot if quantity reaches 0.
   * Returns true on success, false if not enough items owned.
   */
  removeItem(itemId: string, quantity = 1): boolean {
    if (!itemId || !isValidNumber(quantity) || quantity <= 0) {
      return false;
    }

    const intQuantity = Math.floor(quantity);
    const index = this.inventory.items.findIndex(it => it.itemId === itemId);
    if (index === -1) return false;

    const item = this.inventory.items[index];
    if (item.quantity < intQuantity) return false;

    item.quantity = safeSub(item.quantity, intQuantity, true);

    if (item.quantity === 0) {
      this.inventory.items.splice(index, 1);
    }

    return true;
  }

  /**
   * Returns a copy of the items list.
   */
  getItems(): readonly InventoryItem[] {
    return this.inventory.items.map(it => ({ ...it }));
  }

  /**
   * Returns maximum number of distinct item slots.
   */
  getMaxSlots(): number {
    return this.inventory.maxSlots;
  }

  /**
   * Validates all invariants defined in CONTRACTS.md.
   * Throws if any invariant is violated.
   */
  validate(): void {
    if (!isValidNumber(this.inventory.gold) || this.inventory.gold < 0 || this.inventory.gold > MAX_GOLD) {
      throw new Error(`[InventoryManager] Invalid gold: ${this.inventory.gold}`);
    }

    if (!isValidNumber(this.inventory.maxSlots) || this.inventory.maxSlots <= 0) {
      throw new Error(`[InventoryManager] Invalid maxSlots: ${this.inventory.maxSlots}`);
    }

    if (this.inventory.items.length > this.inventory.maxSlots) {
      throw new Error(`[InventoryManager] Items exceed maxSlots limit`);
    }

    const seenIds = new Set<string>();
    for (const item of this.inventory.items) {
      if (seenIds.has(item.itemId)) {
        throw new Error(`[InventoryManager] Duplicate itemId in inventory: ${item.itemId}`);
      }
      seenIds.add(item.itemId);

      if (!isValidNumber(item.quantity) || item.quantity <= 0 || item.quantity > MAX_STACK) {
        throw new Error(`[InventoryManager] Invalid item quantity for ${item.itemId}: ${item.quantity}`);
      }
    }
  }

  /**
   * Exports raw data representation for saving/serialization.
   */
  toState(): Inventory {
    return {
      items: this.inventory.items.map(it => ({ ...it })),
      maxSlots: this.inventory.maxSlots,
      gold: this.inventory.gold,
    };
  }
}
