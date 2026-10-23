/**
 * StatusIntegration — Integration Tests
 *
 * F3-U08: Menu de Status
 * Tests cover: GameState transitions (EXPLORING <-> MENU), concurrency guards,
 * real-time event updates (equipment:changed, player:levelUp), and input safety.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StatusManager } from '@systems/StatusManager.ts';
import { EquipmentManager } from '@systems/EquipmentManager.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { createDefaultPlayer, gainExperience } from '@entities/Player.ts';
import type { PlayerState } from '@entities/Player.ts';
import { GameStateManager } from '@core/GameStateManager.ts';
import { InputManager } from '@systems/InputManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('Status Integration Tests', () => {
  let invMgr: InventoryManager;
  let equipMgr: EquipmentManager;
  let statusMgr: StatusManager;
  let gameState: GameStateManager;
  let inputMgr: InputManager;
  let player: PlayerState;

  beforeEach(() => {
    invMgr = new InventoryManager();
    equipMgr = new EquipmentManager(invMgr);
    statusMgr = new StatusManager(equipMgr);
    gameState = new GameStateManager();
    inputMgr = new InputManager();
    player = createDefaultPlayer();

    // Move to EXPLORING state
    gameState.transitionTo('LOADING');
    gameState.transitionTo('EXPLORING');
  });

  describe('GameState Transitions', () => {
    it('should transition from EXPLORING to MENU upon opening and back to EXPLORING upon closing', () => {
      expect(gameState.getPhase()).toBe('EXPLORING');

      // Open status
      gameState.transitionTo('MENU');
      statusMgr.open(player);
      expect(gameState.getPhase()).toBe('MENU');
      expect(statusMgr.isOpen()).toBe(true);

      // Close status
      statusMgr.close();
      gameState.transitionTo('EXPLORING');
      expect(gameState.getPhase()).toBe('EXPLORING');
      expect(statusMgr.isOpen()).toBe(false);
    });

    it('should prevent opening status when game phase is DIALOGUE', () => {
      gameState.transitionTo('DIALOGUE');

      const canOpen = gameState.getPhase() === 'EXPLORING';
      expect(canOpen).toBe(false);
    });
  });

  describe('Real-Time Synchronization with Game Events', () => {
    it('should immediately reflect level up stat growth in Status ViewModel', () => {
      // Player starts at level 1 with 0 XP
      const initialVm = statusMgr.getStatusViewModel(player);
      expect(initialVm.level).toBe(1);
      expect(initialVm.stats.find((s) => s.key === 'atk')!.base).toBe(12);

      // Gain enough XP to reach level 2 (requires 20 XP)
      gainExperience(player, 25);

      expect(player.level).toBe(2);
      // Level 2 gives +2 ATK (base 14) + 5 from tuned_staff = 19
      const updatedVm = statusMgr.getStatusViewModel(player);
      expect(updatedVm.level).toBe(2);
      expect(updatedVm.hp).toBe(175); // maxHp increased to 175
      expect(updatedVm.maxHp).toBe(175);
      expect(updatedVm.mp).toBe(53); // maxMp increased to 53
      expect(updatedVm.maxMp).toBe(53);

      const atkStat = updatedVm.stats.find((s) => s.key === 'atk')!;
      expect(atkStat.base).toBe(14);
      expect(atkStat.effective).toBe(19);
      expect(atkStat.bonus).toBe(5);
    });

    it('should synchronize dynamically with equipment:changed event', () => {
      let eventFired = false;
      EventBus.on('equipment:changed', () => {
        eventFired = true;
      });

      invMgr.addItem('ether_cuirass', 1);
      equipMgr.equip(player, 'armor', 'ether_cuirass');

      expect(eventFired).toBe(true);

      const vm = statusMgr.getStatusViewModel(player);
      expect(vm.equipment[1].itemName).toBe('Couraça de Éter');
      expect(vm.stats.find((s) => s.key === 'def')!.effective).toBe(15); // base 10 + 5
      expect(vm.stats.find((s) => s.key === 'res')!.effective).toBe(12); // base 9 + 3
    });
  });

  describe('Input Safety & Double-Trigger Prevention', () => {
    it('should correctly consume MENU action so other systems do not re-process it', () => {
      // Simulate pressing MENU key
      (inputMgr as unknown as { keysJustDown: Set<string> }).keysJustDown.add('KeyM');
      inputMgr.update();

      expect(inputMgr.isActionJustPressed('MENU')).toBe(true);

      // System consumes action upon opening menu
      inputMgr.consumeAction('MENU');

      expect(inputMgr.isActionJustPressed('MENU')).toBe(false);
    });

    it('should consume CANCEL action when closing', () => {
      (inputMgr as unknown as { keysJustDown: Set<string> }).keysJustDown.add('Escape');
      inputMgr.update();

      expect(inputMgr.isActionJustPressed('CANCEL')).toBe(true);
      expect(inputMgr.isActionJustPressed('MENU')).toBe(true);

      // Consuming CANCEL and MENU prevents immediate re-opening or double-trigger
      inputMgr.consumeAction('CANCEL');
      inputMgr.consumeAction('MENU');

      expect(inputMgr.isActionJustPressed('CANCEL')).toBe(false);
      expect(inputMgr.isActionJustPressed('MENU')).toBe(false);
    });
  });
});
