/**
 * InventoryBox — 16-bit JRPG Inventory Presentation UI
 *
 * Implements full interactive inventory window for Kaël:
 * - List of owned items with counts (×N)
 * - Navigation cursor with cycling and scrolling
 * - Detailed item inspector (Consumables and Equipment)
 * - Atomic consumable usage via ItemUseManager
 * - Live Fragmentos counter
 * - 2.5s feedback messages for actions
 * - Direction to Status Menu [M] for equipment
 *
 * Conforms strictly to STYLE_GUIDE.md and Decadência Luminosa aesthetics.
 */

import Phaser from 'phaser';
import { DISPLAY, PALETTE } from '@config/constants.ts';
import type { InventoryManager, InventoryItem } from '@inventory/InventoryManager.ts';
import type { ItemUseManager } from '@systems/ItemUseManager.ts';
import type { InputManager } from '@systems/InputManager.ts';
import type { PlayerState } from '@entities/Player.ts';
import { getItemDefinition } from '@data/itemsData.ts';
import { getEquipmentDefinition } from '@data/equipmentData.ts';
import { formatStatBonus } from '@systems/StatusManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

interface ItemRowUI {
  container: Phaser.GameObjects.Container;
  nameText: Phaser.GameObjects.Text;
  quantityText: Phaser.GameObjects.Text;
}

const MAX_VISIBLE_ROWS = 6;
const ROW_START_Y = 46;
const ROW_HEIGHT = 18;

export class InventoryBox extends Phaser.GameObjects.Container {
  private inventoryManager: InventoryManager;
  private itemUseManager: ItemUseManager;
  private inputManager: InputManager;
  private playerState: PlayerState | null = null;

  // Window visual elements
  private bgGraphics: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private cursorText: Phaser.GameObjects.Text;
  private cursorTween?: Phaser.Tweens.Tween;
  private emptyNoticeText: Phaser.GameObjects.Text;
  private footerText: Phaser.GameObjects.Text;

  // Item List UI rows
  private itemRows: ItemRowUI[] = [];

  // Details Column UI
  private detailNameText: Phaser.GameObjects.Text;
  private detailTypeText: Phaser.GameObjects.Text;
  private detailDescText: Phaser.GameObjects.Text;
  private detailExtraText: Phaser.GameObjects.Text;
  private detailActionText: Phaser.GameObjects.Text;
  private feedbackText: Phaser.GameObjects.Text;

  // State
  private selectedIndex: number = 0;
  private scrollOffset: number = 0;
  private justOpened: boolean = false;
  private feedbackTimer: number = 0;

  // Dimensions
  private boxWidth: number;
  private boxHeight: number;

  constructor(
    scene: Phaser.Scene,
    inventoryManager: InventoryManager,
    itemUseManager: ItemUseManager,
    inputManager: InputManager,
    width = 360,
    height = 190
  ) {
    const x = Math.floor((DISPLAY.WIDTH - width) / 2);
    const y = Math.floor((DISPLAY.HEIGHT - height) / 2);

    super(scene, x, y);

    this.inventoryManager = inventoryManager;
    this.itemUseManager = itemUseManager;
    this.inputManager = inputManager;
    this.boxWidth = width;
    this.boxHeight = height;

    this.setScrollFactor(0);
    this.setDepth(650); // Modal depth matching StatusBox

    // 1. Background Graphics
    this.bgGraphics = scene.add.graphics();
    this.drawWindow();
    this.add(this.bgGraphics);

    // 2. Header (y: 9..24)
    this.titleText = scene.add.text(14, 9, '✦ INVENTÁRIO', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    });
    this.add(this.titleText);

    this.goldText = scene.add.text(this.boxWidth - 14, 9, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add(this.goldText);

    // 3. Left Column: Subheader (y: 31)
    const leftHeader = scene.add.text(14, 31, 'ITENS POSSUÍDOS', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#D4A24E',
      fontStyle: 'bold',
    });
    this.add(leftHeader);

    // Empty inventory notice
    this.emptyNoticeText = scene.add.text(28, 54, 'Inventário vazio', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#9B9286',
    });
    this.add(this.emptyNoticeText);

    // Item rows pool
    for (let i = 0; i < MAX_VISIBLE_ROWS; i++) {
      const rowY = ROW_START_Y + i * ROW_HEIGHT;
      const container = scene.add.container(0, 0);

      const nameText = scene.add.text(28, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#E8C876',
      });
      container.add(nameText);

      const quantityText = scene.add.text(175, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#9B9286',
      }).setOrigin(1, 0);
      container.add(quantityText);

      this.add(container);
      this.itemRows.push({ container, nameText, quantityText });
    }

    // Cursor indicator (►)
    this.cursorText = scene.add.text(14, ROW_START_Y, '►', {
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

    // 4. Right Column: Details Panel (x: 195..346)
    const rightHeader = scene.add.text(195, 31, 'DETALHES DO ITEM', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#9B9286',
      fontStyle: 'bold',
    });
    this.add(rightHeader);

    this.detailNameText = scene.add.text(195, 44, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    });
    this.add(this.detailNameText);

    this.detailTypeText = scene.add.text(195, 56, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#7DE8F0',
    });
    this.add(this.detailTypeText);

    this.detailDescText = scene.add.text(195, 70, '', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#9B9286',
      lineSpacing: 2,
      wordWrap: { width: this.boxWidth - 208, useAdvancedWrap: true },
    });
    this.add(this.detailDescText);

    this.detailExtraText = scene.add.text(195, 106, '', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#D4A24E',
      lineSpacing: 2,
      wordWrap: { width: this.boxWidth - 208, useAdvancedWrap: true },
    });
    this.add(this.detailExtraText);

    this.detailActionText = scene.add.text(195, 140, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    });
    this.add(this.detailActionText);

    this.feedbackText = scene.add.text(195, 154, '', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#7DE8F0',
    });
    this.add(this.feedbackText);

    // 5. Footer Instructions (y: 173)
    this.footerText = scene.add.text(
      Math.floor(this.boxWidth / 2),
      173,
      '[↑/↓] Navegar      [Z] Usar      [X / ESC / I] Fechar',
      {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#E8C876',
        align: 'center',
      }
    ).setOrigin(0.5, 0);
    this.add(this.footerText);

    this.setVisible(false);
    scene.add.existing(this);

    // Event listeners
    EventBus.on('inventory:goldChanged', this.handleGoldChanged, this);
    EventBus.on('inventory:itemAdded', this.handleInventoryModified, this);
  }

  private drawWindow(): void {
    this.bgGraphics.clear();

    // Solid dark background (STYLE_GUIDE: #1A0F2E)
    this.bgGraphics.fillStyle(PALETTE.UI_BG_DARK, 1);
    this.bgGraphics.fillRect(0, 0, this.boxWidth, this.boxHeight);

    // 2px border (STYLE_GUIDE: #6B3FA0)
    this.bgGraphics.lineStyle(2, PALETTE.UI_BORDER, 1);
    this.bgGraphics.strokeRect(0, 0, this.boxWidth, this.boxHeight);

    // Crystalline corner accents (#7DE8F0)
    this.bgGraphics.fillStyle(PALETTE.CRYSTAL_LIGHT, 1);
    this.bgGraphics.fillRect(2, 2, 2, 2);
    this.bgGraphics.fillRect(this.boxWidth - 4, 2, 2, 2);
    this.bgGraphics.fillRect(2, this.boxHeight - 4, 2, 2);
    this.bgGraphics.fillRect(this.boxWidth - 4, this.boxHeight - 4, 2, 2);

    // Inner hairline frame (#4A2875)
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.6);
    this.bgGraphics.strokeRect(3, 3, this.boxWidth - 6, this.boxHeight - 6);

    // Divider under Header (y = 25)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 25, this.boxWidth - 8, 25);

    // Vertical column divider (x = 185)
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.8);
    this.bgGraphics.lineBetween(185, 27, 185, 166);

    // Divider above Footer (y = 168)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 168, this.boxWidth - 8, 168);
  }

  /**
   * Opens the inventory window.
   */
  open(player: PlayerState): void {
    this.playerState = player;
    this.justOpened = true;
    this.feedbackTimer = 0;
    this.feedbackText.setText('');
    this.refreshContent();
    this.setVisible(true);
    EventBus.emit('menu:inventoryOpened', { player });
  }

  /**
   * Closes the inventory window.
   */
  close(): void {
    this.setVisible(false);
    EventBus.emit('menu:inventoryClosed', {});
  }

  private handleGoldChanged(): void {
    if (this.visible) {
      this.refreshGoldDisplay();
    }
  }

  private handleInventoryModified(): void {
    if (this.visible) {
      this.refreshContent();
    }
  }

  private refreshGoldDisplay(): void {
    const gold = this.inventoryManager.getGold();
    this.goldText.setText(`Fragmentos: ${gold} ✦`);
  }

  /**
   * Re-renders item list and details according to current state.
   */
  private refreshContent(): void {
    this.refreshGoldDisplay();

    const items: readonly InventoryItem[] = this.inventoryManager.getItems().filter(it => it.quantity > 0);

    if (items.length === 0) {
      this.emptyNoticeText.setVisible(true);
      this.cursorText.setVisible(false);
      this.selectedIndex = 0;
      this.scrollOffset = 0;

      // Hide item rows
      for (const row of this.itemRows) {
        row.container.setVisible(false);
      }

      // Clear details
      this.detailNameText.setText('');
      this.detailTypeText.setText('');
      this.detailDescText.setText('Nenhum item em posse.');
      this.detailExtraText.setText('');
      this.detailActionText.setText('');
      return;
    }

    this.emptyNoticeText.setVisible(false);
    this.cursorText.setVisible(true);

    // Clamp selectedIndex within bounds
    if (this.selectedIndex >= items.length) {
      this.selectedIndex = Math.max(0, items.length - 1);
    }
    if (this.selectedIndex < 0) {
      this.selectedIndex = 0;
    }

    // Adjust scrollOffset to keep selected row visible
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + MAX_VISIBLE_ROWS) {
      this.scrollOffset = this.selectedIndex - MAX_VISIBLE_ROWS + 1;
    }

    // Render up to MAX_VISIBLE_ROWS
    for (let i = 0; i < MAX_VISIBLE_ROWS; i++) {
      const itemIndex = this.scrollOffset + i;
      const row = this.itemRows[i];

      if (itemIndex < items.length) {
        const item = items[itemIndex];
        const def = getItemDefinition(item.itemId);
        const name = def ? def.name : item.itemId;
        const isSelected = itemIndex === this.selectedIndex;

        row.nameText.setText(name);
        row.quantityText.setText(`×${item.quantity}`);

        if (isSelected) {
          row.nameText.setColor('#FFE4A0');
          row.nameText.setFontStyle('bold');
          row.quantityText.setColor('#FFE4A0');
        } else {
          row.nameText.setColor('#E8C876');
          row.nameText.setFontStyle('normal');
          row.quantityText.setColor('#9B9286');
        }

        row.container.setVisible(true);
      } else {
        row.container.setVisible(false);
      }
    }

    // Position cursor
    const visibleIndex = this.selectedIndex - this.scrollOffset;
    this.cursorText.setY(ROW_START_Y + visibleIndex * ROW_HEIGHT);

    // Render details of selected item
    this.renderSelectedItemDetails(items[this.selectedIndex]);
  }

  /**
   * Renders the details panel for the given inventory item.
   */
  private renderSelectedItemDetails(item?: InventoryItem): void {
    if (!item) {
      this.detailNameText.setText('');
      this.detailTypeText.setText('');
      this.detailDescText.setText('');
      this.detailExtraText.setText('');
      this.detailActionText.setText('');
      return;
    }

    const def = getItemDefinition(item.itemId);
    const equipDef = getEquipmentDefinition(item.itemId);

    const name = def ? def.name : item.itemId;
    this.detailNameText.setText(name);

    if (def?.type === 'equipment' || equipDef) {
      this.detailTypeText.setText('[Equipamento]');
      this.detailTypeText.setColor('#D4A24E');

      const slotNames: Record<string, string> = {
        weapon: 'Arma',
        armor: 'Armadura',
        accessory: 'Acessório',
      };
      const slotLabel = equipDef ? (slotNames[equipDef.slot] ?? equipDef.slot) : 'Equipamento';
      const bonusStr = equipDef ? formatStatBonus(equipDef.bonus) : '—';

      this.detailDescText.setText(def?.description ?? equipDef?.description ?? '');
      this.detailExtraText.setText(`Slot: ${slotLabel}\nBônus: ${bonusStr}\n\nEquipe através do Menu de Status [M].`);
      this.detailActionText.setText('[Ação em Menu Status]');
      this.detailActionText.setColor('#9B9286');
    } else {
      this.detailTypeText.setText('[Consumível]');
      this.detailTypeText.setColor('#7DE8F0');
      this.detailDescText.setText(def?.description ?? '');

      let availabilityInfo = '';
      let actionLabel = '[Z] Usar Item';
      let actionColor = '#FFE4A0';

      if (this.playerState) {
        const canUse = this.itemUseManager.canUseItem(this.playerState, item.itemId, 'exploration');
        if (canUse.canUse) {
          availabilityInfo = 'Disponível para uso.';
          actionLabel = '[Z] Usar Item';
          actionColor = '#FFE4A0';
        } else {
          availabilityInfo = canUse.reason ?? 'Indisponível no momento.';
          actionLabel = '[Ação indisponível]';
          actionColor = '#7A7A7A';
        }
      }

      this.detailExtraText.setText(`Estado: ${availabilityInfo}`);
      this.detailActionText.setText(actionLabel);
      this.detailActionText.setColor(actionColor);
    }
  }

  /**
   * Sets temporary user-facing feedback banner (2.5s duration).
   */
  private setFeedback(message: string, isSuccess: boolean): void {
    this.feedbackText.setText(isSuccess ? `✓ ${message}` : `✗ ${message}`);
    this.feedbackText.setColor(isSuccess ? '#7DE8F0' : '#C04040');
    this.feedbackTimer = 2500; // 2.5 seconds
  }

  /**
   * Updates input and feedback timers each frame.
   */
  update(delta: number): void {
    if (!this.visible) return;

    // Handle feedback message timeout
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= delta;
      if (this.feedbackTimer <= 0) {
        this.feedbackTimer = 0;
        this.feedbackText.setText('');
      }
    }

    // Guard against immediate double-input on opening frame
    if (this.justOpened) {
      this.justOpened = false;
      return;
    }

    const items = this.inventoryManager.getItems().filter(it => it.quantity > 0);

    // Navigation UP
    if (this.inputManager.isActionJustPressed('MOVE_UP')) {
      this.inputManager.consumeAction('MOVE_UP');
      if (items.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
        this.refreshContent();
      }
      return;
    }

    // Navigation DOWN
    if (this.inputManager.isActionJustPressed('MOVE_DOWN')) {
      this.inputManager.consumeAction('MOVE_DOWN');
      if (items.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % items.length;
        this.refreshContent();
      }
      return;
    }

    // Action CONFIRM: Use consumable item
    if (this.inputManager.isActionJustPressed('CONFIRM')) {
      this.inputManager.consumeAction('CONFIRM');
      if (items.length > 0 && this.playerState) {
        const selectedItem = items[this.selectedIndex];
        if (selectedItem) {
          const result = this.itemUseManager.useItem(this.playerState, selectedItem.itemId, 'exploration');
          this.setFeedback(result.message, result.success);
          this.refreshContent();
        }
      }
      return;
    }

    // Closing via CANCEL (X / ESC) or INVENTORY (I)
    if (
      this.inputManager.isActionJustPressed('CANCEL') ||
      this.inputManager.isActionJustPressed('INVENTORY')
    ) {
      this.inputManager.consumeAction('CANCEL');
      this.inputManager.consumeAction('INVENTORY');
      this.close();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.cursorTween) {
      this.cursorTween.stop();
    }
    EventBus.off('inventory:goldChanged', this.handleGoldChanged, this);
    EventBus.off('inventory:itemAdded', this.handleInventoryModified, this);
    super.destroy(fromScene);
  }
}
