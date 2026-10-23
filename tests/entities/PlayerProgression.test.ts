/**
 * Player Progression & Combat Logic — Unit Tests (FASE 3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDefaultPlayer,
  levelUp,
  addPlayerXp,
  gainExperience,
  damagePlayer,
  healPlayer,
  restoreMp,
  consumeMp,
  calculateXpToNext
} from '@entities/Player.ts';
import type { PlayerState } from '@entities/Player.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

describe('Player Progression & Combat (FASE 3)', () => {
  let player: PlayerState;

  beforeEach(() => {
    player = createDefaultPlayer();
    EventBus.removeAll();
  });

  describe('levelUp()', () => {
    it('increases level by 1 and advances stats according to GDD', () => {
      const initialAtk = player.stats.atk;
      const initialMaxHp = player.maxHp;
      const initialMaxMp = player.maxMp;

      levelUp(player);

      expect(player.level).toBe(2);
      expect(player.maxHp).toBe(initialMaxHp + 25);
      expect(player.maxMp).toBe(initialMaxMp + 8);
      expect(player.hp).toBe(player.maxHp);
      expect(player.mp).toBe(player.maxMp);

      expect(player.stats.atk).toBe(initialAtk + 2);
      expect(player.stats.def).toBe(12);
      expect(player.stats.mag).toBe(10);
      expect(player.stats.res).toBe(11);
      expect(player.stats.vel).toBe(12);
      expect(player.stats.sor).toBe(6);

      expect(player.xpToNext).toBe(calculateXpToNext(2)); // 2 * 2 * 20 = 80
    });

    it('emits player:levelUp event on EventBus with new stats', () => {
      const listener = vi.fn();
      EventBus.on('player:levelUp', listener);

      levelUp(player);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          newLevel: 2,
          stats: expect.objectContaining({ atk: 14, def: 12 })
        })
      );
    });

    it('respects level 99 cap without exceeding', () => {
      player.level = 99;
      levelUp(player);
      expect(player.level).toBe(99);
    });
  });

  describe('addPlayerXp() and Multi-Level Ups', () => {
    it('adds XP without leveling up when below threshold', () => {
      const result = addPlayerXp(player, 10);

      expect(result.leveledUp).toBe(false);
      expect(result.levelsGained).toBe(0);
      expect(player.level).toBe(1);
      expect(player.xp).toBe(10);
    });

    it('triggers single level up when XP crosses threshold with gainExperience', () => {
      // Level 1 threshold is 20
      const result = gainExperience(player, 25);

      expect(result.leveledUp).toBe(true);
      expect(result.levelsGained).toBe(1);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(player.level).toBe(2);
      expect(player.xp).toBe(25);
    });

    it('triggers multiple level ups sequentially on large XP gain', () => {
      // Level 1 -> needs 20 (xp >= 20 -> lv 2)
      // Level 2 -> needs 80 (xp >= 80 -> lv 3)
      // Level 3 -> needs 180 (xp >= 180 -> lv 4)
      const result = gainExperience(player, 200);

      expect(result.leveledUp).toBe(true);
      expect(result.levelsGained).toBe(3);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(4);
      expect(player.level).toBe(4);
      expect(player.maxHp).toBe(150 + 25 * 3);
    });

    it('ignores negative XP input', () => {
      addPlayerXp(player, -50);
      expect(player.xp).toBe(0);
      expect(player.level).toBe(1);
    });
  });

  describe('MP Management and Skills', () => {
    it('consumes MP successfully when available', () => {
      expect(player.mp).toBe(45);
      const success = consumeMp(player, 6); // ex: Harmonia spell
      expect(success).toBe(true);
      expect(player.mp).toBe(39);
    });

    it('rejects consumption when MP is insufficient', () => {
      player.mp = 3;
      const success = consumeMp(player, 4); // ex: Pulso spell
      expect(success).toBe(false);
      expect(player.mp).toBe(3); // unchanged
    });

    it('handles zero or negative MP cost safely', () => {
      const success0 = consumeMp(player, 0);
      expect(success0).toBe(true);
      expect(player.mp).toBe(45);

      const successNeg = consumeMp(player, -10);
      expect(successNeg).toBe(true);
      expect(player.mp).toBe(45);
    });

    it('rejects NaN MP cost safely without mutating MP', () => {
      const success = consumeMp(player, NaN);
      expect(success).toBe(false);
      expect(player.mp).toBe(45);
    });

    it('restores MP up to maxMp and returns actual amount restored', () => {
      player.mp = 40;
      const restored = restoreMp(player, 10);
      expect(restored).toBe(5);
      expect(player.mp).toBe(45);
    });

    it('handles zero, negative, and NaN MP restoration safely', () => {
      player.mp = 20;

      const restoredZero = restoreMp(player, 0);
      expect(restoredZero).toBe(0);
      expect(player.mp).toBe(20);

      const restoredNeg = restoreMp(player, -15);
      expect(restoredNeg).toBe(0);
      expect(player.mp).toBe(20);

      const restoredNan = restoreMp(player, NaN);
      expect(restoredNan).toBe(0);
      expect(player.mp).toBe(20);
    });
  });

  describe('Damage & Healing Calculations', () => {
    it('returns actual damage dealt and does not drop below zero', () => {
      player.hp = 30;
      const dealt = damagePlayer(player, 50);
      expect(dealt).toBe(30);
      expect(player.hp).toBe(0);
    });

    it('safely ignores 0, negative, and NaN damage amounts', () => {
      player.hp = 100;

      const dealtZero = damagePlayer(player, 0);
      expect(dealtZero).toBe(0);
      expect(player.hp).toBe(100);

      const dealtNeg = damagePlayer(player, -25);
      expect(dealtNeg).toBe(0);
      expect(player.hp).toBe(100);

      const dealtNan = damagePlayer(player, NaN);
      expect(dealtNan).toBe(0);
      expect(player.hp).toBe(100);
    });

    it('returns actual healed amount and clamps at maxHp', () => {
      player.hp = 140;
      const healed = healPlayer(player, 25);
      expect(healed).toBe(10);
      expect(player.hp).toBe(150);
    });

    it('safely ignores 0, negative, and NaN heal amounts', () => {
      player.hp = 50;

      const healedZero = healPlayer(player, 0);
      expect(healedZero).toBe(0);
      expect(player.hp).toBe(50);

      const healedNeg = healPlayer(player, -30);
      expect(healedNeg).toBe(0);
      expect(player.hp).toBe(50);

      const healedNan = healPlayer(player, NaN);
      expect(healedNan).toBe(0);
      expect(player.hp).toBe(50);
    });
  });

  describe('Integration Flow: Combat & Progression Synergy', () => {
    it('executes Damage -> Heal -> Consume MP -> Restore MP -> XP -> Level Up in full loop', () => {
      // 1. Initial State: Level 1, HP 150/150, MP 45/45
      expect(player.level).toBe(1);
      expect(player.hp).toBe(150);
      expect(player.mp).toBe(45);

      // 2. Combat Damage: take 70 damage -> HP 80
      const dmg = damagePlayer(player, 70);
      expect(dmg).toBe(70);
      expect(player.hp).toBe(80);

      // 3. Cast Resonance skill costing 6 MP -> MP 39
      const castOk = consumeMp(player, 6);
      expect(castOk).toBe(true);
      expect(player.mp).toBe(39);

      // 4. Use potion: heal 30 HP -> HP 110
      const healed = healPlayer(player, 30);
      expect(healed).toBe(30);
      expect(player.hp).toBe(110);

      // 5. Use ether drop: restore 10 MP -> MP 45 (maxed)
      const restored = restoreMp(player, 10);
      expect(restored).toBe(6);
      expect(player.mp).toBe(45);

      // 6. Win battle: gain 25 XP -> triggers level up to Level 2
      // Level 2 raises maxHp to 175, maxMp to 53, restores HP/MP fully
      const xpResult = gainExperience(player, 25);
      expect(xpResult.leveledUp).toBe(true);
      expect(player.level).toBe(2);
      expect(player.maxHp).toBe(175);
      expect(player.hp).toBe(175);
      expect(player.maxMp).toBe(53);
      expect(player.mp).toBe(53);
      expect(player.stats.atk).toBe(14);
      expect(player.stats.def).toBe(12);
    });

    it('safely ignores NaN in gainExperience and addPlayerXp', () => {
      player.xp = 10;
      const r1 = addPlayerXp(player, NaN);
      expect(r1.leveledUp).toBe(false);
      expect(player.xp).toBe(10);

      const r2 = gainExperience(player, NaN);
      expect(r2.leveledUp).toBe(false);
      expect(player.xp).toBe(10);
    });
  });
});
