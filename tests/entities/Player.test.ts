/**
 * Player Entity — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  createDefaultPlayer, 
  validatePlayerState,
  damagePlayer,
  healPlayer,
  addPlayerXp,
  calculateXpToNext 
} from '@entities/Player.ts';

describe('Player Entity', () => {

  describe('Initialization', () => {
    it('should create a valid default player', () => {
      const player = createDefaultPlayer();
      expect(player.id).toBe('player_01');
      expect(player.name).toBe('Kaël');
      expect(player.level).toBe(1);
      expect(player.hp).toBe(150);
      expect(player.maxHp).toBe(150);
      expect(player.mp).toBe(45);
      expect(player.maxMp).toBe(45);
      expect(player.xpToNext).toBe(20); // 1 * 1 * 20
      
      // All 6 stats defined in GDD / CONTRACTS.md
      expect(player.stats).toEqual({
        atk: 12,
        def: 10,
        mag: 8,
        res: 9,
        vel: 11,
        sor: 5,
      });
    });
  });

  describe('Validation and Invariants', () => {
    it('should throw if NaN is detected in core fields', () => {
      const player = createDefaultPlayer();
      player.hp = NaN;
      expect(() => validatePlayerState(player)).toThrow(/NaN detected/);

      const player2 = createDefaultPlayer();
      player2.mp = NaN;
      expect(() => validatePlayerState(player2)).toThrow(/NaN detected/);

      const player3 = createDefaultPlayer();
      player3.xp = NaN;
      expect(() => validatePlayerState(player3)).toThrow(/NaN detected/);

      const player4 = createDefaultPlayer();
      player4.level = NaN;
      expect(() => validatePlayerState(player4)).toThrow(/NaN detected/);
    });

    it('should throw if NaN is detected in any of the 6 stats', () => {
      const statsKeys: (keyof typeof player.stats)[] = ['atk', 'def', 'mag', 'res', 'vel', 'sor'];
      const player = createDefaultPlayer();

      for (const stat of statsKeys) {
        const p = createDefaultPlayer();
        p.stats[stat] = NaN;
        expect(() => validatePlayerState(p)).toThrow(new RegExp(`NaN detected in stat ${stat}`));
      }
    });

    it('should clamp HP between 0 and maxHp', () => {
      const player = createDefaultPlayer();
      
      player.hp = 99999;
      validatePlayerState(player);
      expect(player.hp).toBe(player.maxHp);

      player.hp = -50;
      validatePlayerState(player);
      expect(player.hp).toBe(0);
    });

    it('should clamp all 6 stats to valid ranges [1, 999]', () => {
      const statsKeys: (keyof typeof player.stats)[] = ['atk', 'def', 'mag', 'res', 'vel', 'sor'];
      const player = createDefaultPlayer();

      for (const stat of statsKeys) {
        player.stats[stat] = 5000;
      }
      validatePlayerState(player);
      for (const stat of statsKeys) {
        expect(player.stats[stat]).toBe(999);
      }

      for (const stat of statsKeys) {
        player.stats[stat] = -10;
      }
      validatePlayerState(player);
      for (const stat of statsKeys) {
        expect(player.stats[stat]).toBe(1);
      }
    });
  });

  describe('Damage and Healing', () => {
    it('should properly apply damage without dropping below 0', () => {
      const player = createDefaultPlayer();
      
      damagePlayer(player, 50);
      expect(player.hp).toBe(100);

      damagePlayer(player, 200);
      expect(player.hp).toBe(0);
    });

    it('should properly apply healing without exceeding maxHp', () => {
      const player = createDefaultPlayer();
      player.hp = 10;
      
      healPlayer(player, 50);
      expect(player.hp).toBe(60);

      healPlayer(player, 200);
      expect(player.hp).toBe(player.maxHp);
    });

    it('should ignore negative damage/healing', () => {
      const player = createDefaultPlayer();
      player.hp = 100;

      damagePlayer(player, -50);
      expect(player.hp).toBe(100);

      healPlayer(player, -50);
      expect(player.hp).toBe(100);
    });
  });

  describe('XP Logic', () => {
    it('should safely add XP', () => {
      const player = createDefaultPlayer();
      addPlayerXp(player, 15);
      expect(player.xp).toBe(15);
      
      addPlayerXp(player, -5); // Ignore negative
      expect(player.xp).toBe(15);
    });

    it('calculateXpToNext follows level * level * 20', () => {
      expect(calculateXpToNext(1)).toBe(20);
      expect(calculateXpToNext(2)).toBe(80);
      expect(calculateXpToNext(10)).toBe(2000);
    });
  });

});
