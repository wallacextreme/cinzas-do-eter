/**
 * InteractionPrompt — Visual indicator for interactable entities
 *
 * Displays a floating prompt (e.g. "Z") above an entity when the player
 * is in range and facing it.
 */

import Phaser from 'phaser';

export class InteractionPrompt extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    
    // Background box
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x1A0F2E, 0.8); // UI_BG_DARK with some transparency
    this.bg.lineStyle(1, 0xE8C876); // UI_TEXT border
    this.bg.fillRect(-6, -6, 12, 12);
    this.bg.strokeRect(-6, -6, 12, 12);
    
    // Text prompt
    this.text = scene.add.text(0, 0, 'Z', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#F5F0E1', // WHITE_HIGHLIGHT
    }).setOrigin(0.5);

    this.add(this.bg);
    this.add(this.text);

    // Initial state
    this.setVisible(false);
    this.setDepth(100); // ensure it renders above entities

    scene.add.existing(this);
  }

  show(x: number, y: number): void {
    this.setPosition(x, y - 24); // floating above entity
    
    if (!this.visible) {
      this.setVisible(true);
      
      // Simple bobbing animation
      this.scene.tweens.add({
        targets: this,
        y: y - 28,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  hide(): void {
    if (this.visible) {
      this.setVisible(false);
      this.scene.tweens.killTweensOf(this);
    }
  }
}
