import { describe, it, expect, beforeEach } from 'vitest';
import { ShopManager } from '@shop/ShopManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import type { ShopCatalog } from '@shop/shopData.ts';

describe('ShopManager', () => {
  let inventory: InventoryManager;
  let shopManager: ShopManager;

  beforeEach(() => {
    EventBus.removeAll();
    inventory = new InventoryManager({ gold: 100 });
    shopManager = new ShopManager(inventory);
  });

  describe('Catalog & Initialization', () => {
    it('opens canonical shop_torvak and resolves products correctly', () => {
      const opened = shopManager.openShop('shop_torvak');
      expect(opened).toBe(true);
      expect(shopManager.isOpen()).toBe(true);
      expect(shopManager.getMerchantName()).toBe('Torvak');

      const products = shopManager.getProducts();
      expect(products.length).toBe(4);

      // Verify canonical items from GDD
      expect(products[0]).toMatchObject({
        id: 'elixir_amber',
        name: 'Elixir Âmbar',
        price: 30,
      });
      expect(products[1]).toMatchObject({
        id: 'ether_drop',
        name: 'Gota de Éter',
        price: 50,
      });
      expect(products[2]).toMatchObject({
        id: 'antidote',
        name: 'Antídoto',
        price: 20,
      });
      expect(products[3]).toMatchObject({
        id: 'escape_crystal',
        name: 'Cristal de Fuga',
        price: 80,
      });
    });

    it('returns false when attempting to open a non-existent shop ID', () => {
      const opened = shopManager.openShop('shop_unknown');
      expect(opened).toBe(false);
      expect(shopManager.isOpen()).toBe(false);
      expect(shopManager.getProducts().length).toBe(0);
    });

    it('supports custom catalog for future merchant expansion', () => {
      const customCatalog: ShopCatalog = {
        id: 'shop_future_merchant',
        merchantName: 'Alquimista Elden',
        items: [{ itemId: 'elixir_amber', customPrice: 25 }],
      };

      const opened = shopManager.openShop('custom', customCatalog);
      expect(opened).toBe(true);
      expect(shopManager.getMerchantName()).toBe('Alquimista Elden');
      expect(shopManager.getProducts()[0].price).toBe(25);
    });
  });

  describe('Selection Navigation', () => {
    beforeEach(() => {
      shopManager.openShop('shop_torvak');
    });

    it('starts with first product selected', () => {
      expect(shopManager.getSelectedIndex()).toBe(0);
      expect(shopManager.getSelectedProduct()?.id).toBe('elixir_amber');
    });

    it('navigates next and previous through products', () => {
      shopManager.selectNext();
      expect(shopManager.getSelectedIndex()).toBe(1);
      expect(shopManager.getSelectedProduct()?.id).toBe('ether_drop');

      shopManager.selectPrevious();
      expect(shopManager.getSelectedIndex()).toBe(0);
      expect(shopManager.getSelectedProduct()?.id).toBe('elixir_amber');
    });

    it('wraps around bounds properly', () => {
      // Previous from index 0 wraps to last item (index 3)
      shopManager.selectPrevious();
      expect(shopManager.getSelectedIndex()).toBe(3);
      expect(shopManager.getSelectedProduct()?.id).toBe('escape_crystal');

      // Next from last item wraps to index 0
      shopManager.selectNext();
      expect(shopManager.getSelectedIndex()).toBe(0);
      expect(shopManager.getSelectedProduct()?.id).toBe('elixir_amber');
    });

    it('checks affordability of currently selected product', () => {
      // 100 gold: can afford Elixir Âmbar (30)
      expect(shopManager.canAffordSelected()).toBe(true);

      // Select Cristal de Fuga (80)
      shopManager.setSelectedIndex(3);
      expect(shopManager.canAffordSelected()).toBe(true);

      // Reduce gold to 50: cannot afford Cristal de Fuga (80)
      inventory.removeGold(50); // Balance now 50
      expect(shopManager.canAffordSelected()).toBe(false);
    });
  });

  describe('Purchase Logic', () => {
    beforeEach(() => {
      shopManager.openShop('shop_torvak');
    });

    it('executes a valid purchase and updates gold and inventory', () => {
      // Buy Elixir Âmbar (30 Frag) with 100 Frag initial balance
      const result = shopManager.buySelectedItem();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Elixir Âmbar');
      expect(result.newGold).toBe(70);
      expect(result.newQuantity).toBe(1);

      expect(inventory.getGold()).toBe(70);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
    });

    it('rejects purchase with insufficient funds (no money deducted)', () => {
      // Select Cristal de Fuga (80 Frag)
      shopManager.setSelectedIndex(3);

      // Reduce gold to 50
      inventory.removeGold(50);
      expect(inventory.getGold()).toBe(50);

      const result = shopManager.buySelectedItem();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INSUFFICIENT_FUNDS');
      expect(result.message).toContain('Saldo insuficiente');
      expect(inventory.getGold()).toBe(50); // Untouched
      expect(inventory.getItemQuantity('escape_crystal')).toBe(0);
    });

    it('allows purchase with exact balance (bringing gold to 0)', () => {
      // Set gold exactly to 30
      inventory.removeGold(70);
      expect(inventory.getGold()).toBe(30);

      const result = shopManager.buySelectedItem(); // Elixir Âmbar (30)
      expect(result.success).toBe(true);
      expect(result.newGold).toBe(0);
      expect(inventory.getGold()).toBe(0);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);
    });

    it('handles multiple consecutive purchases', () => {
      // 1st purchase: 100 -> 70, qty 1
      const res1 = shopManager.buySelectedItem();
      expect(res1.success).toBe(true);
      expect(inventory.getGold()).toBe(70);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

      // 2nd purchase: 70 -> 40, qty 2
      const res2 = shopManager.buySelectedItem();
      expect(res2.success).toBe(true);
      expect(inventory.getGold()).toBe(40);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(2);

      // 3rd purchase: 40 -> 10, qty 3
      const res3 = shopManager.buySelectedItem();
      expect(res3.success).toBe(true);
      expect(inventory.getGold()).toBe(10);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(3);

      // 4th purchase: needs 30, has 10 -> fails!
      const res4 = shopManager.buySelectedItem();
      expect(res4.success).toBe(false);
      expect(res4.reason).toBe('INSUFFICIENT_FUNDS');
      expect(inventory.getGold()).toBe(10);
      expect(inventory.getItemQuantity('elixir_amber')).toBe(3);
    });

    it('rejects purchase of non-existent item ID', () => {
      const result = shopManager.buyItemById('non_existent_item');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('ITEM_NOT_FOUND');
      expect(inventory.getGold()).toBe(100);
    });

    it('rejects purchase if item price is negative or NaN', () => {
      const invalidCatalog: ShopCatalog = {
        id: 'shop_buggy',
        merchantName: 'Buggy',
        items: [{ itemId: 'elixir_amber', customPrice: -10 }],
      };

      shopManager.openShop('buggy', invalidCatalog);
      const result = shopManager.buySelectedItem();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_PRICE');
      expect(inventory.getGold()).toBe(100);
    });

    it('rejects purchase if inventory is full (slots)', () => {
      const smallInventory = new InventoryManager({ maxSlots: 1, gold: 100 });
      smallInventory.addItem('existing_item', 1);

      const customShop = new ShopManager(smallInventory);
      customShop.openShop('shop_torvak');

      // Attempting to buy Elixir Âmbar (new slot needed)
      const result = customShop.buySelectedItem();
      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVENTORY_FULL');
      expect(smallInventory.getGold()).toBe(100); // Gold not lost
    });

    it('rejects purchase if item stack already reached MAX_STACK (99)', () => {
      inventory.addItem('elixir_amber', 99);

      const result = shopManager.buySelectedItem();
      expect(result.success).toBe(false);
      expect(result.reason).toBe('MAX_STACK_REACHED');
      expect(inventory.getGold()).toBe(100);
    });

    it('rejects purchase when shop is closed', () => {
      shopManager.closeShop();
      const result = shopManager.buySelectedItem();
      expect(result.success).toBe(false);
      expect(result.reason).toBe('NOT_OPEN');
    });

    it('emits shop:buy event on successful transaction', () => {
      let emittedPayload: any = null;
      EventBus.on('shop:buy', (payload: any) => {
        emittedPayload = payload;
      });

      shopManager.buySelectedItem(); // Elixir Âmbar (30)
      expect(emittedPayload).toEqual({
        shopId: 'shop_torvak',
        itemId: 'elixir_amber',
        quantity: 1,
        price: 30,
      });
    });
  });

  describe('Shop Lifecycle & Events', () => {
    it('emits shop:open when opening a shop', () => {
      let openPayload: any = null;
      EventBus.on('shop:open', (payload: any) => {
        openPayload = payload;
      });

      shopManager.openShop('shop_torvak');
      expect(openPayload).toEqual({
        shopId: 'shop_torvak',
        merchantName: 'Torvak',
      });
    });

    it('emits shop:close and resets state when closing', () => {
      shopManager.openShop('shop_torvak');

      let closePayload: any = null;
      EventBus.on('shop:close', (payload: any) => {
        closePayload = payload;
      });

      shopManager.closeShop();
      expect(shopManager.isOpen()).toBe(false);
      expect(shopManager.getProducts().length).toBe(0);
      expect(closePayload).toEqual({ shopId: 'shop_torvak' });
    });
  });
});
