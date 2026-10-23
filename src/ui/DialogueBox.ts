/**
 * DialogueBox — 16-bit JRPG Dialogue Presentation UI
 *
 * Renders dialogue window, speaker name, typewriter text effect, and next-page indicator.
 * Conforms to STYLE_GUIDE.md palette and 16-bit aesthetics.
 * Decoupled from specific NPCs, scenes, or quest systems.
 */

import Phaser from 'phaser';
import { DISPLAY, PALETTE } from '@config/constants.ts';
import type { DialogueManager } from '@world/DialogueManager.ts';
import type { InputManager } from '@systems/InputManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

export class DialogueBox extends Phaser.GameObjects.Container {
  private dialogueManager: DialogueManager;
  private inputManager: InputManager;

  // Visual elements
  private bgGraphics: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private contentText: Phaser.GameObjects.Text;
  private nextIndicator: Phaser.GameObjects.Text;
  private indicatorTween?: Phaser.Tweens.Tween;

  // Typewriter state
  private fullText: string = '';
  private displayedLength: number = 0;
  private charTimer: number = 0;
  private readonly charDelayMs: number = 25; // Typewriter speed (ms per char)
  private isTyping: boolean = false;

  // Opening frame guard against immediate double-consumption
  private justOpened: boolean = false;

  // Dimensions
  private boxWidth: number;
  private boxHeight: number;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    inputManager: InputManager,
    width = 360,
    height = 58
  ) {
    // Center horizontally, position near bottom of 384x216 screen
    const x = Math.floor((DISPLAY.WIDTH - width) / 2);
    const y = DISPLAY.HEIGHT - height - 10; // 148px

    super(scene, x, y);

    this.dialogueManager = dialogueManager;
    this.inputManager = inputManager;
    this.boxWidth = width;
    this.boxHeight = height;

    // Fixed to camera viewport
    this.setScrollFactor(0);
    this.setDepth(500);

    // 1. Background and 16-bit border
    this.bgGraphics = scene.add.graphics();
    this.drawBox();
    this.add(this.bgGraphics);

    // 2. Speaker Name
    this.speakerText = scene.add.text(10, 6, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#FFE4A0', // PALETTE.GOLD_HIGHLIGHT
      fontStyle: 'bold',
    });
    this.add(this.speakerText);

    // 3. Dialogue Content
    this.contentText = scene.add.text(10, 18, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#E8C876', // PALETTE.AMBER_LIGHT
      lineSpacing: 4,
      wordWrap: { width: this.boxWidth - 20, useAdvancedWrap: true },
    });
    this.add(this.contentText);

    // 4. Next-page Indicator (pulsing arrow)
    this.nextIndicator = scene.add.text(this.boxWidth - 14, this.boxHeight - 12, '▼', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#FFE4A0',
    }).setOrigin(0.5);
    this.nextIndicator.setVisible(false);
    this.add(this.nextIndicator);

    // Setup pulsing animation for the next indicator
    this.indicatorTween = scene.tweens.add({
      targets: this.nextIndicator,
      y: this.boxHeight - 10,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.setVisible(false);
    scene.add.existing(this);

    // Hook into EventBus
    EventBus.on('dialog:start', this.handleDialogStart, this);
    EventBus.on('dialog:advance', this.handleDialogAdvance, this);
    EventBus.on('dialog:end', this.handleDialogEnd, this);
  }

  private drawBox(): void {
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

    // Subtle inner hairline
    this.bgGraphics.lineStyle(1, PALETTE.VIOLET_DARK, 0.6);
    this.bgGraphics.strokeRect(3, 3, this.boxWidth - 6, this.boxHeight - 6);
  }

  private handleDialogStart(): void {
    const msg = this.dialogueManager.getCurrentMessage();
    if (msg) {
      this.displayMessage(msg.speakerName, msg.text);
      this.justOpened = true;
      this.setVisible(true);
    }
  }

  private handleDialogAdvance(): void {
    const msg = this.dialogueManager.getCurrentMessage();
    if (msg) {
      this.displayMessage(msg.speakerName, msg.text);
    }
  }

  private handleDialogEnd(): void {
    this.hide();
  }

  private displayMessage(speaker: string | undefined, text: string): void {
    if (speaker && speaker.trim().length > 0) {
      this.speakerText.setText(speaker);
      this.speakerText.setVisible(true);
      this.contentText.setY(18);
    } else {
      this.speakerText.setText('');
      this.speakerText.setVisible(false);
      this.contentText.setY(10);
    }

    this.fullText = text;
    this.displayedLength = 0;
    this.charTimer = 0;
    this.isTyping = true;
    this.contentText.setText('');
    this.nextIndicator.setVisible(false);
  }

  private completeTypewriter(): void {
    this.displayedLength = this.fullText.length;
    this.contentText.setText(this.fullText);
    this.isTyping = false;
    this.nextIndicator.setVisible(true);
  }

  /**
   * Update method called from Scene.update().
   * Handles typewriter progression and CONFIRM input.
   */
  update(delta: number): void {
    if (!this.visible || !this.dialogueManager.isDialogueActive()) {
      return;
    }

    // Advance typewriter effect
    if (this.isTyping) {
      this.charTimer += delta;
      while (this.charTimer >= this.charDelayMs && this.isTyping) {
        this.charTimer -= this.charDelayMs;
        this.displayedLength++;
        this.contentText.setText(this.fullText.substring(0, this.displayedLength));

        if (this.displayedLength >= this.fullText.length) {
          this.completeTypewriter();
          break;
        }
      }
    }

    // If opened in this exact frame, skip checking input to prevent immediate advance
    if (this.justOpened) {
      this.justOpened = false;
      return;
    }

    // Check for player input
    if (this.inputManager.isActionJustPressed('CONFIRM')) {
      // Consume the action so other systems don't receive it
      this.inputManager.consumeAction('CONFIRM');

      if (this.isTyping) {
        // First CONFIRM during typing: immediately reveal complete message
        this.completeTypewriter();
      } else {
        // CONFIRM when message is already complete: advance to next or close
        this.dialogueManager.advance();
      }
    }
  }

  hide(): void {
    this.setVisible(false);
    this.isTyping = false;
    this.nextIndicator.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    if (this.indicatorTween) {
      this.indicatorTween.stop();
    }
    EventBus.off('dialog:start', this.handleDialogStart, this);
    EventBus.off('dialog:advance', this.handleDialogAdvance, this);
    EventBus.off('dialog:end', this.handleDialogEnd, this);
    super.destroy(fromScene);
  }
}
