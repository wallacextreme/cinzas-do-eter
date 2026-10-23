/**
 * InputManager — Unit Tests
 *
 * Tests the logical input system without Phaser dependency.
 * Verifies: bindings, key state tracking, just-pressed detection,
 * enable/disable, and rebinding.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager, DEFAULT_BINDINGS } from '@systems/InputManager.ts';
import type { InputAction } from '@systems/InputManager.ts';

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  describe('default state', () => {
    it('should start with no actions down', () => {
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(false);
      expect(input.isActionDown('MOVE_DOWN')).toBe(false);
      expect(input.isActionDown('CONFIRM')).toBe(false);
    });

    it('should be enabled by default', () => {
      expect(input.isEnabled()).toBe(true);
    });

    it('should have default bindings', () => {
      const bindings = input.getBindings();
      expect(bindings.MOVE_UP).toEqual(DEFAULT_BINDINGS.MOVE_UP);
      expect(bindings.CONFIRM).toEqual(DEFAULT_BINDINGS.CONFIRM);
    });
  });

  describe('key tracking', () => {
    it('should detect action down when key is pressed', () => {
      input.handleKeyDown('KeyW');
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(true);
    });

    it('should detect action up when key is released', () => {
      input.handleKeyDown('KeyW');
      input.update();
      input.handleKeyUp('KeyW');
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(false);
    });

    it('should support alternative key bindings (arrows)', () => {
      input.handleKeyDown('ArrowUp');
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(true);
    });

    it('should track multiple simultaneous keys', () => {
      input.handleKeyDown('KeyW');
      input.handleKeyDown('KeyA');
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(true);
      expect(input.isActionDown('MOVE_LEFT')).toBe(true);
      expect(input.isActionDown('MOVE_DOWN')).toBe(false);
    });
  });

  describe('just-pressed detection', () => {
    it('should detect justPressed on first frame only', () => {
      input.handleKeyDown('KeyZ');
      input.update();
      expect(input.isActionJustPressed('CONFIRM')).toBe(true);

      // Next frame: still held, but no longer "just pressed"
      input.update();
      expect(input.isActionJustPressed('CONFIRM')).toBe(false);
      expect(input.isActionDown('CONFIRM')).toBe(true);
    });

    it('should detect justReleased on release frame only', () => {
      input.handleKeyDown('KeyZ');
      input.update();
      input.handleKeyUp('KeyZ');
      input.update();
      expect(input.isActionJustReleased('CONFIRM')).toBe(true);

      input.update();
      expect(input.isActionJustReleased('CONFIRM')).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should not report actions when disabled', () => {
      input.handleKeyDown('KeyW');
      input.setEnabled(false);
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(false);
    });

    it('should resume reporting after re-enabled', () => {
      input.handleKeyDown('KeyW');
      input.setEnabled(false);
      input.update();
      input.setEnabled(true);
      input.update();
      expect(input.isActionDown('MOVE_UP')).toBe(true);
    });
  });

  describe('rebinding', () => {
    it('should allow rebinding an action', () => {
      input.rebind('CONFIRM', ['Space']);
      input.handleKeyDown('Space');
      input.update();
      expect(input.isActionJustPressed('CONFIRM')).toBe(true);
    });

    it('should no longer respond to old key after rebind', () => {
      input.rebind('CONFIRM', ['Space']);
      input.handleKeyDown('KeyZ');
      input.update();
      expect(input.isActionDown('CONFIRM')).toBe(false);
    });
  });

  describe('all actions have bindings', () => {
    it('should have bindings for all movement actions', () => {
      const movements: InputAction[] = ['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT'];
      for (const action of movements) {
        const bindings = input.getBindings();
        expect(bindings[action].length).toBeGreaterThan(0);
      }
    });

    it('should have bindings for UI actions including INVENTORY', () => {
      const uiActions: InputAction[] = ['CONFIRM', 'CANCEL', 'MENU', 'INVENTORY'];
      for (const action of uiActions) {
        const bindings = input.getBindings();
        expect(bindings[action].length).toBeGreaterThan(0);
      }
    });

    it('should map KeyI to INVENTORY action', () => {
      input.handleKeyDown('KeyI');
      input.update();
      expect(input.isActionDown('INVENTORY')).toBe(true);
      expect(input.isActionJustPressed('INVENTORY')).toBe(true);

      input.handleKeyUp('KeyI');
      input.update();
      expect(input.isActionDown('INVENTORY')).toBe(false);
      expect(input.isActionJustReleased('INVENTORY')).toBe(true);
    });
  });
});
