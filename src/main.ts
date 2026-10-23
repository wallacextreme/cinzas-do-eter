/**
 * Cinzas do Éter — Main Entry Point
 *
 * FASE 0: Foundation only.
 * This file will bootstrap Phaser 3 with the correct configuration
 * for pixel-perfect 16-bit rendering.
 *
 * No gameplay is implemented yet.
 */

import { GAME_CONFIG } from '@config/game-config.ts';
import { errorHandler } from '@core/ErrorHandler.ts';
import { applyIntegerScale, setupQaHooks } from './qa/QaHooks.ts';

/**
 * Boot the game when the DOM is ready.
 * Phaser is dynamically imported to allow tree-shaking and
 * to keep the initial bundle analysis clean.
 */
async function boot(): Promise<void> {
  errorHandler.init();
  
  const PhaserModule = await import('phaser');
  const game = new PhaserModule.Game(GAME_CONFIG);

  // Aplica escala inteira no carregamento e em redimensionamento
  game.events.once('ready', () => {
    applyIntegerScale(game);
  });
  window.addEventListener('resize', () => {
    applyIntegerScale(game);
  });

  // Ativa window.__QA__ SOMENTE quando a URL contiver ?qa=1
  const isQaMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('qa') === '1';
  if (isQaMode) {
    setupQaHooks(game);
    const dbg = document.getElementById('debug-controls');
    if (dbg) dbg.style.display = 'none';
    console.log('[QA] Modo de automação ?qa=1 ativo. window.__QA__ inicializado.');
  }

  // Expose game instance for debugging in development only
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>)['__GAME__'] = game;

    (window as any)['__PRESS_KEY__'] = (code: string, key?: string) => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.inputManager) {
        gs.inputManager.handleKeyDown(code);
        if (key) gs.inputManager.handleKeyDown(key);
        setTimeout(() => {
          gs.inputManager.handleKeyUp(code);
          if (key) gs.inputManager.handleKeyUp(key);
        }, 50);
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key: key || code }));
      setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key: key || code }));
      }, 50);
    };

    (window as any)['__OPEN_INVENTORY__'] = () => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.inventoryBox && gs.player) {
        gs.inventoryBox.open(gs.player.getPlayerState());
      }
    };

    (window as any)['__CLOSE_INVENTORY__'] = () => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.inventoryBox) {
        gs.inventoryBox.close();
      }
    };

    (window as any)['__APPROACH_TORVAK__'] = () => {
      const player = (window as any)['__PLAYER__'];
      if (player) {
        player.setPosition(23 * 16, 20 * 16);
        if (typeof player.setFacingDirection === 'function') {
          player.setFacingDirection('LEFT');
        } else {
          player.facingDirection = 'LEFT';
        }
      }
    };

    (window as any)['__GO_TO_MAP__'] = (mapId: string, spawnId: string) => {
      const tm = (window as any)['__TRANSITION_MANAGER__'];
      if (tm) return tm.transitionToMap(mapId, spawnId);
      return false;
    };

    (window as any)['__WALK_TO_SOUTH_EXIT__'] = () => {
      const player = (window as any)['__PLAYER__'];
      if (player) {
        player.setPosition(30 * 16, 38 * 16);
        player.facingDirection = 'DOWN';
      }
    };

    (window as any)['__WALK_TO_CAVE_EXIT__'] = () => {
      const player = (window as any)['__PLAYER__'];
      if (player) {
        player.setPosition(16 * 16, 38 * 16);
        player.facingDirection = 'DOWN';
      }
    };

    (window as any)['__WALK_TO_NORTH_EXIT__'] = () => {
      const player = (window as any)['__PLAYER__'];
      if (player) {
        player.setPosition(16 * 16, 2 * 16);
        player.facingDirection = 'UP';
      }
    };

    const bindBtn = (id: string, action: () => void) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', action);
    };

    bindBtn('btn-approach-torvak', () => (window as any)['__APPROACH_TORVAK__']());
    bindBtn('btn-talk-torvak', () => {
      const dm = (window as any)['__DIALOGUE_MANAGER__'];
      if (dm) dm.startDialogue('dialogue_npc_torvak');
    });
    bindBtn('btn-goto-plains', () => (window as any)['__GO_TO_MAP__']('ash_plains', 'spawn_north'));
    bindBtn('btn-goto-village', () => (window as any)['__GO_TO_MAP__']('lumen_village', 'spawn_south'));
    bindBtn('btn-goto-cave', () => (window as any)['__GO_TO_MAP__']('echo_cave', 'spawn_entrance'));
    bindBtn('btn-advance-z', () => (window as any)['__PRESS_KEY__']('KeyZ', 'z'));
    bindBtn('btn-cancel-x', () => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.inventoryBox && gs.inventoryBox.visible) {
        gs.inventoryBox.close();
      } else if (gs && gs.statusBox && gs.statusBox.visible) {
        gs.statusBox.close();
      } else {
        (window as any)['__PRESS_KEY__']('KeyX', 'x');
      }
    });
    bindBtn('btn-menu-m', () => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.statusBox && gs.statusBox.visible) {
        gs.statusBox.close();
      } else if (gs && gs.statusBox && gs.player) {
        gs.statusBox.open(gs.player.getPlayerState());
      } else {
        (window as any)['__PRESS_KEY__']('KeyM', 'm');
      }
    });
    bindBtn('btn-inventory-i', () => {
      const gs = (window as any)['__GAME_SCENE__'];
      if (gs && gs.inventoryBox && gs.inventoryBox.visible) {
        gs.inventoryBox.close();
      } else if (gs && gs.inventoryBox && gs.player) {
        gs.inventoryBox.open(gs.player.getPlayerState());
      } else {
        (window as any)['__PRESS_KEY__']('KeyI', 'i');
      }
    });
    bindBtn('btn-escape', () => (window as any)['__PRESS_KEY__']('Escape', 'Escape'));
    bindBtn('btn-down', () => (window as any)['__PRESS_KEY__']('ArrowDown', 'ArrowDown'));
    bindBtn('btn-up', () => (window as any)['__PRESS_KEY__']('ArrowUp', 'ArrowUp'));
  }
}

boot().catch((err: unknown) => {
  console.error('[CinzasDoEter] Failed to boot game:', err);
});
