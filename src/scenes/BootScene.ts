/**
 * BootScene — Initial Boot Scene
 *
 * First scene to run. Displays the game title briefly,
 * then transitions to PreloadScene for asset loading.
 *
 * FASE 1: Added timed transition to PreloadScene.
 */

import { Scene } from 'phaser';
import { gameState } from '@core/GameStateManager.ts';

export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // BootScene loads nothing — it exists to display the title
    // and delegate loading to PreloadScene.
  }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 16, 'CINZAS DO ÉTER', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#E8C876',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 8, 'FASE 1 — Core', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#9B6DD7',
      align: 'center',
    }).setOrigin(0.5);

    console.log('[BootScene] Boot complete, transitioning to PreloadScene...');

    // Transition to PreloadScene after a brief display
    this.time.delayedCall(1000, () => {
      gameState.transitionTo('LOADING');
      this.scene.start('PreloadScene');
    });
  }
}
