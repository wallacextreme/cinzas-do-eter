/**
 * Shop Data — Merchant Catalogs & Products Configuration
 *
 * Decoupled from NPC instances and rendering.
 * Easily extensible for new merchants across the world.
 */

import { getItemDefinition } from '@data/itemsData.ts';

export interface ShopItemConfig {
  readonly itemId: string;
  readonly customPrice?: number; // Optional override of default item price
  readonly stock?: number;       // Optional limited stock (undefined = infinite)
}

export interface ShopCatalog {
  readonly id: string;
  readonly merchantName: string;
  readonly greeting?: string;
  readonly items: readonly ShopItemConfig[];
}

export interface ShopProduct {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly stock?: number;
}

export const SHOPS_DATABASE: Record<string, ShopCatalog> = {
  'shop_torvak': {
    id: 'shop_torvak',
    merchantName: 'Torvak',
    greeting: 'Veja minhas mercadorias! Tudo da mais alta qualidade para sua jornada.',
    items: [
      { itemId: 'elixir_amber' },
      { itemId: 'ether_drop' },
      { itemId: 'antidote' },
      { itemId: 'escape_crystal' },
    ],
  },
};

/**
 * Resolves a shop catalog into detailed products populated with item definitions.
 */
export function resolveShopCatalog(catalog: ShopCatalog): ShopProduct[] {
  const products: ShopProduct[] = [];

  for (const entry of catalog.items) {
    const itemDef = getItemDefinition(entry.itemId);
    if (!itemDef) {
      console.warn(`[ShopData] Item "${entry.itemId}" in shop "${catalog.id}" not found in database.`);
      continue;
    }

    const price = entry.customPrice !== undefined ? entry.customPrice : itemDef.price;

    products.push({
      id: itemDef.id,
      name: itemDef.name,
      description: itemDef.description,
      price,
      stock: entry.stock,
    });
  }

  return products;
}
