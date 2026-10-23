/**
 * ShopBox — 16-bit JRPG Shop Presentation UI
 *
 * Implements shop window, product list, selected details, live Fragmentos balance,
 * purchase feedback, and input handling.
 * Conforms strictly to STYLE_GUIDE.md and Decadência Luminosa aesthetics.
 */

import Phaser from 'phaser';
import { DISPLAY, PALETTE } from '@config/constants.ts';
import type { ShopManager, PurchaseResult } from '@shop/ShopManager.ts';
import type { InputManager } from '@systems/InputManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

interface ProductRowUI {
  container: Phaser.GameObjects.Container;
  nameText: Phaser.GameObjects.Text;
  priceText: Phaser.GameObjects.Text;
  ownedText: Phaser.GameObjects.Text;
}

export class ShopBox extends Phaser.GameObjects.Container {
  private shopManager: ShopManager;
  private inputManager: InputManager;

  // Visual container elements
  private bgGraphics: Phaser.GameObjects.Graphics;
  private merchantTitleText: Phaser.GameObjects.Text;
  private goldBalanceText: Phaser.GameObjects.Text;
  private cursorText: Phaser.GameObjects.Text;
  private cursorTween?: Phaser.Tweens.Tween;
  private descriptionText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;

  private productRows: ProductRowUI[] = [];

  // Frame guard against immediate double-input on opening frame
  private justOpened: boolean = false;

  // Active status feedback timeout timer
  private feedbackTimer: number = 0;

  // Dimensions
  private boxWidth: number;
  private boxHeight: number;

  constructor(
    scene: Phaser.Scene,
    shopManager: ShopManager,
    inputManager: InputManager,
    width = 360,
    height = 190
  ) {
    // Center horizontally and vertically within 384x216
    const x = Math.floor((DISPLAY.WIDTH - width) / 2);
    const y = Math.floor((DISPLAY.HEIGHT - height) / 2);

    super(scene, x, y);

    this.shopManager = shopManager;
    this.inputManager = inputManager;
    this.boxWidth = width;
    this.boxHeight = height;

    this.setScrollFactor(0);
    this.setDepth(600); // Above world and dialogue

    // 1. Background and Border Graphics
    this.bgGraphics = scene.add.graphics();
    this.drawWindow();
    this.add(this.bgGraphics);

    // 2. Header: Merchant Name
    this.merchantTitleText = scene.add.text(14, 10, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0', // PALETTE.GOLD_HIGHLIGHT
      fontStyle: 'bold',
    });
    this.add(this.merchantTitleText);

    // 3. Header: Player's Fragmentos balance
    this.goldBalanceText = scene.add.text(this.boxWidth - 14, 10, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add(this.goldBalanceText);

    // 4. Cursor indicator (pulsing arrow ►)
    this.cursorText = scene.add.text(14, 34, '►', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
    });
    this.add(this.cursorText);

    this.cursorTween = scene.tweens.add({
      targets: this.cursorText,
      x: 17,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 5. Description Area
    this.descriptionText = scene.add.text(14, 122, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#9B9286', // PALETTE.GRAY_BONE
      lineSpacing: 4,
      wordWrap: { width: this.boxWidth - 28, useAdvancedWrap: true },
    });
    this.add(this.descriptionText);

    // 6. Footer / Status / Feedback Message
    this.statusText = scene.add.text(14, 168, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#E8C876', // PALETTE.AMBER_LIGHT
    });
    this.add(this.statusText);

    this.setVisible(false);
    scene.add.existing(this);

    // Listen to EventBus for shop triggers
    EventBus.on('shop:open', this.handleShopOpenEvent, this);
    EventBus.on('shop:close', this.handleShopCloseEvent, this);
    EventBus.on('inventory:goldChanged', this.refreshBalanceDisplay, this);
  }

  private drawWindow(): void {
    this.bgGraphics.clear();

    // Solid dark background (STYLE_GUIDE.md: UI Fundo #1A0F2E sem transparência)
    this.bgGraphics.fillStyle(PALETTE.UI_BG_DARK, 1);
    this.bgGraphics.fillRect(0, 0, this.boxWidth, this.boxHeight);

    // 2px border (STYLE_GUIDE.md: Borda 2px em #6B3FA0)
    this.bgGraphics.lineStyle(2, PALETTE.UI_BORDER, 1);
    this.bgGraphics.strokeRect(0, 0, this.boxWidth, this.boxHeight);

    // Crystalline pixel corner decorations (STYLE_GUIDE.md: Cantos cristalinos em pixels)
    this.bgGraphics.fillStyle(PALETTE.CRYSTAL_LIGHT, 1);
    // Top-left
    this.bgGraphics.fillRect(2, 2, 2, 2);
    // Top-right
    this.bgGraphics.fillRect(this.boxWidth - 4, 2, 2, 2);
    // Bottom-left
    this.bgGraphics.fillRect(2, this.boxHeight - 4, 2, 2);
    // Bottom-right
    this.bgGraphics.fillRect(this.boxWidth - 4, this.boxHeight - 4, 2, 2);

    // Inner hairline frame
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.6);
    this.bgGraphics.strokeRect(3, 3, this.boxWidth - 6, this.boxHeight - 6);

    // Divider after Header (y = 24)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 24, this.boxWidth - 8, 24);

    // Divider before Description (y = 114)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 114, this.boxWidth - 8, 114);

    // Divider before Footer (y = 160)
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.8);
    this.bgGraphics.lineBetween(8, 160, this.boxWidth - 8, 160);
  }

  /**
   * Opens the shop UI with the specified shop catalog.
   */
  open(shopId: string): void {
    const success = this.shopManager.openShop(shopId);
    if (!success) return;

    this.justOpened = true;
    this.feedbackTimer = 0;
    this.renderShopContent();
    this.setVisible(true);
  }

  /**
   * Closes the shop UI and notifies manager.
   */
  close(): void {
    this.shopManager.closeShop();
    this.hide();
  }

  private hide(): void {
    this.setVisible(false);
    this.feedbackTimer = 0;
  }

  private handleShopOpenEvent(): void {
    if (!this.visible) {
      this.justOpened = true;
      this.feedbackTimer = 0;
      this.renderShopContent();
      this.setVisible(true);
    }
  }

  private handleShopCloseEvent(): void {
    this.hide();
  }

  private refreshBalanceDisplay(): void {
    const gold = this.shopManager.getInventory().getGold();
    this.goldBalanceText.setText(`Fragmentos: ${gold}`);
  }

  private renderShopContent(): void {
    // 1. Header info
    const merchantName = this.shopManager.getMerchantName() || 'Comerciante';
    this.merchantTitleText.setText(`MERCADOR ${merchantName.toUpperCase()}`);
    this.refreshBalanceDisplay();

    // 2. Clear old product rows
    for (const row of this.productRows) {
      row.container.destroy();
    }
    this.productRows = [];

    // 3. Populate product rows
    const products = this.shopManager.getProducts();
    const startY = 34;
    const rowHeight = 19;
    const inv = this.shopManager.getInventory();

    products.forEach((product, index) => {
      const rowY = startY + index * rowHeight;
      const rowContainer = this.scene.add.container(0, rowY);

      // Product name (x = 26)
      const nameText = this.scene.add.text(26, 0, product.name, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#E8C876', // PALETTE.AMBER_LIGHT
      });
      rowContainer.add(nameText);

      // Price (x = 180)
      const priceText = this.scene.add.text(180, 0, `${product.price} Frag.`, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#FFE4A0',
      });
      rowContainer.add(priceText);

      // Owned count (x = 270)
      const owned = inv.getItemQuantity(product.id);
      const ownedText = this.scene.add.text(270, 0, `[Possui: ${owned}]`, {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#9B9286',
      });
      rowContainer.add(ownedText);

      this.add(rowContainer);
      this.productRows.push({ container: rowContainer, nameText, priceText, ownedText });
    });

    this.updateSelectionVisuals();
    this.resetDefaultStatus();
  }

  private updateSelectionVisuals(): void {
    const selectedIdx = this.shopManager.getSelectedIndex();
    const products = this.shopManager.getProducts();
    const inv = this.shopManager.getInventory();

    // Update cursor Y position
    const startY = 34;
    const rowHeight = 19;
    this.cursorText.setY(startY + selectedIdx * rowHeight);

    // Update text highlighting and owned values
    this.productRows.forEach((row, idx) => {
      const isSelected = idx === selectedIdx;
      const product = products[idx];
      const canAfford = inv.hasGold(product.price);

      if (isSelected) {
        row.nameText.setColor('#FFE4A0');
        row.nameText.setFontStyle('bold');
        row.priceText.setColor(canAfford ? '#FFE4A0' : '#C04040');
      } else {
        row.nameText.setColor('#E8C876');
        row.nameText.setFontStyle('normal');
        row.priceText.setColor(canAfford ? '#D4A24E' : '#7A7A7A');
      }

      const owned = inv.getItemQuantity(product.id);
      row.ownedText.setText(`[Possui: ${owned}]`);
    });

    // Update description
    const selectedProduct = this.shopManager.getSelectedProduct();
    if (selectedProduct) {
      this.descriptionText.setText(selectedProduct.description);
    } else {
      this.descriptionText.setText('');
    }
  }

  private resetDefaultStatus(): void {
    this.statusText.setText('[↑/↓] Selecionar   [Z] Comprar   [X] Sair');
    this.statusText.setColor('#E8C876');
  }

  private showFeedback(result: PurchaseResult): void {
    if (result.success) {
      this.statusText.setText(`✓ ${result.message}`);
      this.statusText.setColor('#7DE8F0'); // CRYSTAL_LIGHT
    } else {
      this.statusText.setText(`✗ ${result.message}`);
      this.statusText.setColor('#C04040'); // HP_RED
    }
    this.feedbackTimer = 2500; // Display feedback for 2.5 seconds
  }

  /**
   * Called every frame from Scene.update().
   * Handles navigation, purchasing, exiting, and feedback timeout.
   */
  update(delta: number): void {
    if (!this.visible || !this.shopManager.isOpen()) {
      return;
    }

    // Guard against immediate double-input on opening frame
    if (this.justOpened) {
      this.justOpened = false;
      return;
    }

    // Feedback message timer countdown
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= delta;
      if (this.feedbackTimer <= 0) {
        this.resetDefaultStatus();
      }
    }

    // 1. Navigation UP
    if (this.inputManager.isActionJustPressed('MOVE_UP')) {
      this.inputManager.consumeAction('MOVE_UP');
      this.shopManager.selectPrevious();
      this.updateSelectionVisuals();
    }
    // 2. Navigation DOWN
    else if (this.inputManager.isActionJustPressed('MOVE_DOWN')) {
      this.inputManager.consumeAction('MOVE_DOWN');
      this.shopManager.selectNext();
      this.updateSelectionVisuals();
    }

    // 3. Purchase Confirmation (CONFIRM: Z / Enter)
    if (this.inputManager.isActionJustPressed('CONFIRM')) {
      this.inputManager.consumeAction('CONFIRM');
      const result = this.shopManager.buySelectedItem();
      this.refreshBalanceDisplay();
      this.updateSelectionVisuals();
      this.showFeedback(result);
    }

    // 4. Exit / Cancel (CANCEL: X / Escape)
    if (this.inputManager.isActionJustPressed('CANCEL')) {
      this.inputManager.consumeAction('CANCEL');
      this.close();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.cursorTween) {
      this.cursorTween.stop();
    }
    EventBus.off('shop:open', this.handleShopOpenEvent, this);
    EventBus.off('shop:close', this.handleShopCloseEvent, this);
    EventBus.off('inventory:goldChanged', this.refreshBalanceDisplay, this);
    super.destroy(fromScene);
  }
}
