/**
 * StatusBox — 16-bit JRPG Status Menu Presentation UI
 *
 * Implements status modal window, player identity, dynamic HP/MP/XP bars,
 * effective combat stats with bonus indicators, interactive equipment slot inspection,
 * and input handling.
 *
 * Conforms strictly to STYLE_GUIDE.md and Decadência Luminosa aesthetics.
 * Decoupled from PlayerSprite — consumes ViewModel from StatusManager.
 */

import Phaser from 'phaser';
import { DISPLAY, PALETTE } from '@config/constants.ts';
import type { StatusManager, StatusViewModel } from '@systems/StatusManager.ts';
import type { InputManager } from '@systems/InputManager.ts';
import type { PlayerState } from '@entities/Player.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

interface EquipmentRowUI {
  container: Phaser.GameObjects.Container;
  slotText: Phaser.GameObjects.Text;
  itemText: Phaser.GameObjects.Text;
}

interface StatRowUI {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  bonus: Phaser.GameObjects.Text;
}

export class StatusBox extends Phaser.GameObjects.Container {
  private statusManager: StatusManager;
  private inputManager: InputManager;
  private playerState: PlayerState | null = null;

  // Visual graphics and containers
  private bgGraphics: Phaser.GameObjects.Graphics;
  private barsGraphics: Phaser.GameObjects.Graphics;

  // Header texts
  private nameText: Phaser.GameObjects.Text;
  private titleText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;

  // Resource texts
  private hpText: Phaser.GameObjects.Text;
  private mpText: Phaser.GameObjects.Text;
  private xpText: Phaser.GameObjects.Text;

  // Stats rows
  private statRows: StatRowUI[] = [];

  // Equipment UI
  private cursorText: Phaser.GameObjects.Text;
  private cursorTween?: Phaser.Tweens.Tween;
  private equipmentRows: EquipmentRowUI[] = [];

  // Selected Equipment Details Box
  private detailNameText: Phaser.GameObjects.Text;
  private detailBonusText: Phaser.GameObjects.Text;
  private detailDescText: Phaser.GameObjects.Text;

  // Footer instructions
  private footerText: Phaser.GameObjects.Text;

  // Dimensions
  private boxWidth: number;
  private boxHeight: number;

  // Frame guard against immediate double-input on opening frame
  private justOpened: boolean = false;

  constructor(
    scene: Phaser.Scene,
    statusManager: StatusManager,
    inputManager: InputManager,
    width = 360,
    height = 190
  ) {
    // Center horizontally and vertically within 384x216 logical display
    const x = Math.floor((DISPLAY.WIDTH - width) / 2);
    const y = Math.floor((DISPLAY.HEIGHT - height) / 2);

    super(scene, x, y);

    this.statusManager = statusManager;
    this.inputManager = inputManager;
    this.boxWidth = width;
    this.boxHeight = height;

    this.setScrollFactor(0);
    this.setDepth(650); // Above world, dialogue, and shop

    // 1. Background Graphics
    this.bgGraphics = scene.add.graphics();
    this.barsGraphics = scene.add.graphics();
    this.drawWindow();
    this.add(this.bgGraphics);
    this.add(this.barsGraphics);

    // 2. Header (y: 8..24)
    this.nameText = scene.add.text(14, 9, '✦ KAËL', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0', // GOLD_HIGHLIGHT
      fontStyle: 'bold',
    });
    this.add(this.nameText);

    this.titleText = scene.add.text(80, 10, 'Adepto do Éter', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#9B9286', // GRAY_BONE
    });
    this.add(this.titleText);

    this.levelText = scene.add.text(this.boxWidth - 14, 9, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add(this.levelText);

    // 3. Left Column: Subheader (y: 31)
    const leftHeader = scene.add.text(14, 31, 'RECURSOS & ATRIBUTOS', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#D4A24E', // AMBER_MID
      fontStyle: 'bold',
    });
    this.add(leftHeader);

    // Resources Text (HP, MP, XP)
    const resLabelX = 14;
    const resValX = 80;

    // HP
    const hpLabel = scene.add.text(resLabelX, 44, 'HP', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#9B9286',
    });
    this.add(hpLabel);
    this.hpText = scene.add.text(resValX, 44, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#E8C876',
    });
    this.add(this.hpText);

    // MP
    const mpLabel = scene.add.text(resLabelX, 56, 'MP', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#9B9286',
    });
    this.add(mpLabel);
    this.mpText = scene.add.text(resValX, 56, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#E8C876',
    });
    this.add(this.mpText);

    // XP
    const xpLabel = scene.add.text(resLabelX, 68, 'XP', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#9B9286',
    });
    this.add(xpLabel);
    this.xpText = scene.add.text(resValX, 68, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#E8C876',
    });
    this.add(this.xpText);

    // 4. Left Column: Stats Rows (ATK, DEF, MAG, RES, VEL, SOR)
    const statsStartY = 84;
    const statRowHeight = 13;
    const statNames = ['ATK', 'DEF', 'MAG', 'RES', 'VEL', 'SOR'];

    statNames.forEach((name, idx) => {
      const rowY = statsStartY + idx * statRowHeight;

      const label = scene.add.text(14, rowY, name, {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#9B9286',
      });
      this.add(label);

      const value = scene.add.text(52, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#E8C876',
        fontStyle: 'bold',
      });
      this.add(value);

      const bonus = scene.add.text(82, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#7DE8F0', // CRYSTAL_LIGHT
        fontStyle: 'bold',
      });
      this.add(bonus);

      this.statRows.push({ label, value, bonus });
    });

    // 5. Right Column: Subheader (x: 184, y: 31)
    const rightHeader = scene.add.text(184, 31, 'EQUIPAMENTO', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#D4A24E',
      fontStyle: 'bold',
    });
    this.add(rightHeader);

    // Cursor indicator
    this.cursorText = scene.add.text(178, 46, '►', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
    });
    this.add(this.cursorText);

    this.cursorTween = scene.tweens.add({
      targets: this.cursorText,
      x: 181,
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3 Equipment rows
    const equipStartY = 46;
    const equipRowHeight = 18;

    for (let i = 0; i < 3; i++) {
      const rowY = equipStartY + i * equipRowHeight;
      const container = scene.add.container(0, 0);

      const slotText = scene.add.text(190, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#9B9286',
      });
      container.add(slotText);

      const itemText = scene.add.text(244, rowY, '', {
        fontSize: '7px',
        fontFamily: 'monospace',
        color: '#E8C876',
      });
      container.add(itemText);

      this.add(container);
      this.equipmentRows.push({ container, slotText, itemText });
    }

    // 6. Right Column: Details Panel (y: 104..164)
    const detailHeader = scene.add.text(184, 108, 'DETALHES DO ITEM', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#9B9286',
      fontStyle: 'bold',
    });
    this.add(detailHeader);

    this.detailNameText = scene.add.text(184, 118, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
      fontStyle: 'bold',
    });
    this.add(this.detailNameText);

    this.detailBonusText = scene.add.text(184, 129, '', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#7DE8F0',
    });
    this.add(this.detailBonusText);

    this.detailDescText = scene.add.text(184, 140, '', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#9B9286',
      lineSpacing: 2,
      wordWrap: { width: this.boxWidth - 198, useAdvancedWrap: true },
    });
    this.add(this.detailDescText);

    // 7. Footer Instructions (y: 173)
    this.footerText = scene.add.text(
      Math.floor(this.boxWidth / 2),
      173,
      '[↑/↓] Selecionar Slot      [X / ESC / M] Fechar',
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

    // Listen to equipment changes to refresh display if open
    EventBus.on('equipment:changed', this.handleEquipmentChanged, this);
  }

  private drawWindow(): void {
    this.bgGraphics.clear();

    // Solid dark background (STYLE_GUIDE: UI Fundo #1A0F2E sem transparência)
    this.bgGraphics.fillStyle(PALETTE.UI_BG_DARK, 1);
    this.bgGraphics.fillRect(0, 0, this.boxWidth, this.boxHeight);

    // 2px border (STYLE_GUIDE: Borda 2px em #6B3FA0)
    this.bgGraphics.lineStyle(2, PALETTE.UI_BORDER, 1);
    this.bgGraphics.strokeRect(0, 0, this.boxWidth, this.boxHeight);

    // Crystalline corner accents
    this.bgGraphics.fillStyle(PALETTE.CRYSTAL_LIGHT, 1);
    this.bgGraphics.fillRect(2, 2, 2, 2);
    this.bgGraphics.fillRect(this.boxWidth - 4, 2, 2, 2);
    this.bgGraphics.fillRect(2, this.boxHeight - 4, 2, 2);
    this.bgGraphics.fillRect(this.boxWidth - 4, this.boxHeight - 4, 2, 2);

    // Inner hairline frame
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.6);
    this.bgGraphics.strokeRect(3, 3, this.boxWidth - 6, this.boxHeight - 6);

    // Divider under Header (y = 25)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 25, this.boxWidth - 8, 25);

    // Vertical column divider (x = 175)
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.8);
    this.bgGraphics.lineBetween(175, 27, 175, 166);

    // Divider above Details in Right Column (y = 104)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.6);
    this.bgGraphics.lineBetween(177, 104, this.boxWidth - 8, 104);

    // Divider above Footer (y = 168)
    this.bgGraphics.lineStyle(1, PALETTE.UI_BORDER, 0.8);
    this.bgGraphics.lineBetween(8, 168, this.boxWidth - 8, 168);
  }

  /**
   * Opens the status menu with the specified player state.
   */
  open(player: PlayerState): void {
    this.playerState = player;
    this.statusManager.open(player);
    this.justOpened = true;
    this.renderContent();
    this.setVisible(true);
  }

  /**
   * Closes the status menu.
   */
  close(): void {
    this.statusManager.close();
    this.setVisible(false);
  }

  private handleEquipmentChanged(): void {
    if (this.visible && this.playerState) {
      this.renderContent();
    }
  }

  /**
   * Renders the complete view model.
   */
  private renderContent(): void {
    if (!this.playerState) return;

    const vm: StatusViewModel = this.statusManager.getStatusViewModel(this.playerState);

    // 1. Header
    this.nameText.setText(`✦ ${vm.name.toUpperCase()}`);
    this.titleText.setText(vm.title);
    this.levelText.setText(`NÍVEL ${vm.level} ✦`);

    // 2. Resources Text
    this.hpText.setText(`${vm.hp} / ${vm.maxHp}`);
    this.mpText.setText(`${vm.mp} / ${vm.maxMp}`);
    this.xpText.setText(`${vm.xp} / ${vm.xpToNext}`);

    // 3. Resources Bars Graphics
    this.barsGraphics.clear();
    const barW = 44;
    const barH = 4;
    const barX = 32;

    // HP Bar
    const hpRatio = vm.maxHp > 0 ? Phaser.Math.Clamp(vm.hp / vm.maxHp, 0, 1) : 0;
    this.barsGraphics.fillStyle(PALETTE.SHADOW_DEEP, 1);
    this.barsGraphics.fillRect(barX, 46, barW, barH);
    this.barsGraphics.fillStyle(hpRatio < 0.25 ? PALETTE.HP_RED : PALETTE.GREEN_ALIVE, 1);
    this.barsGraphics.fillRect(barX, 46, Math.round(barW * hpRatio), barH);

    // MP Bar
    const mpRatio = vm.maxMp > 0 ? Phaser.Math.Clamp(vm.mp / vm.maxMp, 0, 1) : 0;
    this.barsGraphics.fillStyle(PALETTE.SHADOW_DEEP, 1);
    this.barsGraphics.fillRect(barX, 58, barW, barH);
    this.barsGraphics.fillStyle(PALETTE.CRYSTAL_MID, 1);
    this.barsGraphics.fillRect(barX, 58, Math.round(barW * mpRatio), barH);

    // XP Bar
    const xpRatio = vm.xpToNext > 0 ? Phaser.Math.Clamp(vm.xp / vm.xpToNext, 0, 1) : 0;
    this.barsGraphics.fillStyle(PALETTE.SHADOW_DEEP, 1);
    this.barsGraphics.fillRect(barX, 70, barW, barH);
    this.barsGraphics.fillStyle(PALETTE.AMBER_MID, 1);
    this.barsGraphics.fillRect(barX, 70, Math.round(barW * xpRatio), barH);

    // 4. Combat Stats
    vm.stats.forEach((st, idx) => {
      if (idx < this.statRows.length) {
        const row = this.statRows[idx];
        row.value.setText(`${st.effective}`);
        if (st.bonus > 0) {
          row.bonus.setText(`(+${st.bonus})`);
        } else {
          row.bonus.setText('');
        }
      }
    });

    // 5. Equipment Rows & Details
    this.updateEquipmentVisuals(vm);
  }

  private updateEquipmentVisuals(vm?: StatusViewModel): void {
    if (!this.playerState) return;
    const model = vm ?? this.statusManager.getStatusViewModel(this.playerState);

    const equipStartY = 46;
    const equipRowHeight = 18;
    const selectedIdx = model.selectedSlotIndex;

    this.cursorText.setY(equipStartY + selectedIdx * equipRowHeight);

    model.equipment.forEach((eq, idx) => {
      if (idx < this.equipmentRows.length) {
        const row = this.equipmentRows[idx];
        const isSelected = idx === selectedIdx;

        row.slotText.setText(`[${eq.slotLabel}]`);
        row.itemText.setText(eq.itemName);

        if (isSelected) {
          row.slotText.setColor('#FFE4A0');
          row.itemText.setColor('#FFE4A0');
          row.itemText.setFontStyle('bold');
        } else {
          row.slotText.setColor('#9B9286');
          row.itemText.setColor(eq.itemId ? '#E8C876' : '#7A7A7A');
          row.itemText.setFontStyle('normal');
        }
      }
    });

    // Details box
    const sel = model.selectedEquipment;
    this.detailNameText.setText(sel.itemName);
    this.detailBonusText.setText(sel.bonusDescription !== '—' ? `Bônus: ${sel.bonusDescription}` : '');
    this.detailDescText.setText(sel.description);
  }

  /**
   * Called each frame from GameScene.update().
   */
  update(_delta: number): void {
    if (!this.visible || !this.statusManager.isOpen()) {
      return;
    }

    // Guard against immediate double-input on opening frame
    if (this.justOpened) {
      this.justOpened = false;
      return;
    }

    // Navigation UP
    if (this.inputManager.isActionJustPressed('MOVE_UP')) {
      this.inputManager.consumeAction('MOVE_UP');
      this.statusManager.selectPreviousSlot();
      this.updateEquipmentVisuals();
    }
    // Navigation DOWN
    else if (this.inputManager.isActionJustPressed('MOVE_DOWN')) {
      this.inputManager.consumeAction('MOVE_DOWN');
      this.statusManager.selectNextSlot();
      this.updateEquipmentVisuals();
    }

    // Closing via CANCEL (X / ESC) or MENU (M / ESC)
    if (
      this.inputManager.isActionJustPressed('CANCEL') ||
      this.inputManager.isActionJustPressed('MENU')
    ) {
      this.inputManager.consumeAction('CANCEL');
      this.inputManager.consumeAction('MENU');
      this.close();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.cursorTween) {
      this.cursorTween.stop();
    }
    EventBus.off('equipment:changed', this.handleEquipmentChanged, this);
    super.destroy(fromScene);
  }
}
