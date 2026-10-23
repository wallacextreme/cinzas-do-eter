import { describe, it, expect, beforeEach } from 'vitest';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { DialogueManager } from '@world/DialogueManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { ShopManager } from '@shop/ShopManager.ts';
import { GameStateManager } from '@core/GameStateManager.ts';

describe('Shop & Dialogue Integration', () => {
  let gameState: GameStateManager;
  let dialogueManager: DialogueManager;
  let inventory: InventoryManager;
  let shopManager: ShopManager;

  beforeEach(() => {
    EventBus.removeAll();
    gameState = new GameStateManager();
    gameState.transitionTo('LOADING');
    gameState.transitionTo('EXPLORING');

    dialogueManager = new DialogueManager(undefined, gameState);
    inventory = new InventoryManager({ gold: 100 });
    shopManager = new ShopManager(inventory);
  });

  it('completes the full flow: dialogue -> shop open -> buy -> balance updated -> shop close -> exploring', () => {
    let shopOpened = false;
    let shopClosed = false;

    EventBus.on('dialog:end', (payload: { dialogId: string }) => {
      if (payload.dialogId === 'dialogue_npc_torvak') {
        shopManager.openShop('shop_torvak');
        shopOpened = true;
      }
    });

    EventBus.on('shop:close', () => {
      shopClosed = true;
    });

    // 1. Interaction triggers dialogue
    expect(gameState.getPhase()).toBe('EXPLORING');
    dialogueManager.startDialogue('dialogue_npc_torvak');
    expect(gameState.getPhase()).toBe('DIALOGUE');
    expect(dialogueManager.getCurrentMessage()?.speakerName).toBe('Torvak');

    // 2. Advance dialogue through messages
    dialogueManager.advance(); // To message index 1 ("perigosos")
    expect(dialogueManager.getCurrentIndex()).toBe(1);

    dialogueManager.advance(); // To message index 2 ("loja")
    expect(dialogueManager.getCurrentIndex()).toBe(2);

    // 3. Advance dialogue past end (closes dialogue)
    dialogueManager.advance();
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(dialogueManager.isDialogueActive()).toBe(false);

    // 4. Shop opened via dialog:end handler
    expect(shopOpened).toBe(true);
    expect(shopManager.isOpen()).toBe(true);
    expect(shopManager.getMerchantName()).toBe('Torvak');

    // 5. Select and buy Elixir Âmbar (30 Fragmentos)
    expect(shopManager.getSelectedProduct()?.id).toBe('elixir_amber');
    const purchaseResult = shopManager.buySelectedItem();

    expect(purchaseResult.success).toBe(true);
    expect(inventory.getGold()).toBe(70);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(1);

    // 6. Buy again
    const purchaseResult2 = shopManager.buySelectedItem();
    expect(purchaseResult2.success).toBe(true);
    expect(inventory.getGold()).toBe(40);
    expect(inventory.getItemQuantity('elixir_amber')).toBe(2);

    // 7. Close shop
    shopManager.closeShop();
    expect(shopClosed).toBe(true);
    expect(shopManager.isOpen()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
  });

  it('preserves inventory state across multiple shop sessions', () => {
    // Session 1: Buy 1 Antidote (20 Frag)
    shopManager.openShop('shop_torvak');
    shopManager.setSelectedIndex(2); // Antídoto (20)
    shopManager.buySelectedItem();
    shopManager.closeShop();

    expect(inventory.getGold()).toBe(80);
    expect(inventory.getItemQuantity('antidote')).toBe(1);

    // Session 2: Re-open shop, buy 1 Gota de Éter (50 Frag)
    shopManager.openShop('shop_torvak');
    shopManager.setSelectedIndex(1); // Gota de Éter (50)
    shopManager.buySelectedItem();
    shopManager.closeShop();

    expect(inventory.getGold()).toBe(30);
    expect(inventory.getItemQuantity('antidote')).toBe(1);
    expect(inventory.getItemQuantity('ether_drop')).toBe(1);
  });
});
