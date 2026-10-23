/**
 * ShopManager — Pure TypeScript Shop Controller & Domain Logic
 *
 * Completely decoupled from Phaser and specific NPC instances.
 * Manages shop catalog resolution, selection navigation, purchase validation,
 * atomic transactions, and EventBus lifecycle events.
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import {
  SHOPS_DATABASE,
  resolveShopCatalog,
  type ShopCatalog,
  type ShopProduct,
} from './shopData.ts';
import { isValidNumber } from '@utils/math.ts';

export type PurchaseFailureReason =
  | 'NOT_OPEN'
  | 'ITEM_NOT_FOUND'
  | 'INVALID_PRICE'
  | 'INSUFFICIENT_FUNDS'
  | 'INVENTORY_FULL'
  | 'MAX_STACK_REACHED'
  | 'OUT_OF_STOCK';

export interface PurchaseResult {
  success: boolean;
  reason?: PurchaseFailureReason;
  message: string;
  item?: ShopProduct;
  newGold?: number;
  newQuantity?: number;
}

export class ShopManager {
  private inventory: InventoryManager;
  private currentCatalog: ShopCatalog | null = null;
  private products: ShopProduct[] = [];
  private selectedIndex: number = 0;
  private isShopOpen: boolean = false;

  constructor(inventory: InventoryManager) {
    this.inventory = inventory;
  }

  /**
   * Sets or updates the active inventory manager.
   */
  setInventory(inventory: InventoryManager): void {
    this.inventory = inventory;
  }

  /**
   * Gets the inventory manager used by the shop.
   */
  getInventory(): InventoryManager {
    return this.inventory;
  }

  /**
   * Opens a shop by its catalog ID.
   * Returns true if opened successfully, false if catalog not found.
   */
  openShop(shopId: string, customCatalog?: ShopCatalog): boolean {
    const catalog = customCatalog || SHOPS_DATABASE[shopId];
    if (!catalog) {
      console.warn(`[ShopManager] Shop catalog "${shopId}" not found.`);
      return false;
    }

    this.currentCatalog = catalog;
    this.products = resolveShopCatalog(catalog);
    this.selectedIndex = 0;
    this.isShopOpen = true;

    EventBus.emit('shop:open', {
      shopId: catalog.id,
      merchantName: catalog.merchantName,
    });

    return true;
  }

  /**
   * Closes the active shop.
   */
  closeShop(): void {
    if (!this.isShopOpen) return;

    const closedId = this.currentCatalog ? this.currentCatalog.id : '';
    this.isShopOpen = false;
    this.currentCatalog = null;
    this.products = [];
    this.selectedIndex = 0;

    EventBus.emit('shop:close', { shopId: closedId });
  }

  /**
   * Whether a shop is currently open.
   */
  isOpen(): boolean {
    return this.isShopOpen;
  }

  /**
   * Gets current shop catalog info.
   */
  getCatalog(): ShopCatalog | null {
    return this.currentCatalog;
  }

  /**
   * Gets the merchant's display name.
   */
  getMerchantName(): string {
    return this.currentCatalog ? this.currentCatalog.merchantName : '';
  }

  /**
   * Gets list of available resolved products.
   */
  getProducts(): readonly ShopProduct[] {
    return this.products;
  }

  /**
   * Gets the 0-based index of currently selected item.
   */
  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  /**
   * Sets selected index, clamping within bounds.
   */
  setSelectedIndex(index: number): void {
    if (this.products.length === 0) {
      this.selectedIndex = 0;
      return;
    }
    if (index < 0) {
      this.selectedIndex = this.products.length - 1; // Wrap to end
    } else if (index >= this.products.length) {
      this.selectedIndex = 0; // Wrap to start
    } else {
      this.selectedIndex = index;
    }
  }

  /**
   * Moves selection to previous item.
   */
  selectPrevious(): void {
    this.setSelectedIndex(this.selectedIndex - 1);
  }

  /**
   * Moves selection to next item.
   */
  selectNext(): void {
    this.setSelectedIndex(this.selectedIndex + 1);
  }

  /**
   * Gets currently selected product.
   */
  getSelectedProduct(): ShopProduct | null {
    if (!this.isShopOpen || this.products.length === 0) return null;
    return this.products[this.selectedIndex] ?? null;
  }

  /**
   * Checks if player has sufficient funds for currently selected product.
   */
  canAffordSelected(): boolean {
    const product = this.getSelectedProduct();
    if (!product) return false;
    return this.inventory.hasGold(product.price);
  }

  /**
   * Attempts to purchase the currently selected product.
   * Atomic operation: validates funds, inventory space, and price.
   */
  buySelectedItem(): PurchaseResult {
    if (!this.isShopOpen) {
      return {
        success: false,
        reason: 'NOT_OPEN',
        message: 'A loja não está aberta.',
      };
    }

    const product = this.getSelectedProduct();
    if (!product) {
      return {
        success: false,
        reason: 'ITEM_NOT_FOUND',
        message: 'Produto não selecionado.',
      };
    }

    return this.executePurchase(product);
  }

  /**
   * Directly purchases an item by ID from the current shop.
   */
  buyItemById(itemId: string): PurchaseResult {
    if (!this.isShopOpen) {
      return {
        success: false,
        reason: 'NOT_OPEN',
        message: 'A loja não está aberta.',
      };
    }

    const product = this.products.find(p => p.id === itemId);
    if (!product) {
      return {
        success: false,
        reason: 'ITEM_NOT_FOUND',
        message: 'Produto não encontrado na loja.',
      };
    }

    return this.executePurchase(product);
  }

  /**
   * Internal purchase executor ensuring atomic transaction.
   */
  private executePurchase(product: ShopProduct): PurchaseResult {
    // 1. Validate price
    if (!isValidNumber(product.price) || product.price < 0) {
      return {
        success: false,
        reason: 'INVALID_PRICE',
        message: 'Preço inválido.',
        item: product,
      };
    }

    // 2. Validate sufficient funds
    if (!this.inventory.hasGold(product.price)) {
      return {
        success: false,
        reason: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente!',
        item: product,
      };
    }

    // 3. Validate stock if applicable
    if (product.stock !== undefined && product.stock <= 0) {
      return {
        success: false,
        reason: 'OUT_OF_STOCK',
        message: 'Produto fora de estoque!',
        item: product,
      };
    }

    // 4. Validate inventory stack limits
    const currentQty = this.inventory.getItemQuantity(product.id);
    if (currentQty >= 99) {
      return {
        success: false,
        reason: 'MAX_STACK_REACHED',
        message: 'Você já possui a quantidade máxima (99)!',
        item: product,
      };
    }

    // 5. Attempt atomic transaction:
    // First deduct gold
    const goldDeducted = this.inventory.removeGold(product.price);
    if (!goldDeducted) {
      return {
        success: false,
        reason: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente!',
        item: product,
      };
    }

    // Then add item to inventory
    const itemAdded = this.inventory.addItem(product.id, 1);
    if (!itemAdded) {
      // Rollback gold if item addition fails (e.g. inventory slots full)
      this.inventory.addGold(product.price);
      return {
        success: false,
        reason: 'INVENTORY_FULL',
        message: 'Inventário cheio!',
        item: product,
      };
    }

    const newGold = this.inventory.getGold();
    const newQuantity = this.inventory.getItemQuantity(product.id);

    // Emit event
    EventBus.emit('shop:buy', {
      shopId: this.currentCatalog?.id ?? '',
      itemId: product.id,
      quantity: 1,
      price: product.price,
    });

    return {
      success: true,
      message: `Comprou 1x ${product.name}!`,
      item: product,
      newGold,
      newQuantity,
    };
  }
}
