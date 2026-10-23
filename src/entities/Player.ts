/**
 * Player Entity — Base State and Logic
 *
 * Defines the logical state of the player character.
 * Pure TypeScript, no Phaser dependencies.
 * Implements strict invariants defined in CONTRACTS.md.
 */

import { safeAdd, safeSub, clamp } from '@utils/math.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';

export interface PlayerStats {
  atk: number;
  def: number;
  mag: number;
  res: number;
  vel: number;
  sor: number;
}

export interface PlayerEquipment {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
}

export interface PlayerState {
  readonly id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;

  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  stats: PlayerStats;
  equipment: PlayerEquipment;
}

/**
 * Creates a new default PlayerState (Kaël).
 * Validates initial invariants.
 */
export function createDefaultPlayer(id: string = 'player_01'): PlayerState {
  const level = 1;
  const state: PlayerState = {
    id,
    name: 'Kaël',
    level,
    xp: 0,
    xpToNext: calculateXpToNext(level),
    
    hp: 150,
    maxHp: 150,
    mp: 45,
    maxMp: 45,
    
    stats: {
      atk: 12,
      def: 10,
      mag: 8,
      res: 9,
      vel: 11,
      sor: 5,
    },
    
    equipment: {
      weapon: 'tuned_staff',    // Kaël starts equipped with his Bastão Sintonizado (GDD)
      armor: null,
      accessory: null,
    },
  };

  validatePlayerState(state);
  return state;
}

/**
 * Safely sanitizes numeric input amounts, preventing NaN and Infinity propagation.
 */
function sanitizeNumericAmount(amount: number): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return 0;
  }
  return Math.max(0, amount);
}

/**
 * Calculate XP required for next level.
 * Formula defined in CONTRACTS.md: level * level * 20
 */
export function calculateXpToNext(level: number): number {
  const safeLevel = (typeof level !== 'number' || Number.isNaN(level) || !Number.isFinite(level))
    ? 1
    : clamp(Math.floor(level), 1, 99);
  return safeLevel * safeLevel * 20;
}

/**
 * Validates and enforces invariants on a PlayerState.
 * Clamps HP and MP to their bounds.
 * Throws if critical invariants are violated.
 */
export function validatePlayerState(state: PlayerState): void {
  // Enforce types and non-NaN
  if (
    isNaN(state.hp) ||
    isNaN(state.mp) ||
    isNaN(state.xp) ||
    isNaN(state.level) ||
    isNaN(state.maxHp) ||
    isNaN(state.maxMp)
  ) {
    throw new Error('PlayerState validation failed: NaN detected in numeric fields');
  }

  // Bounds checking and clamping
  state.level = clamp(state.level, 1, 99);
  state.maxHp = clamp(state.maxHp, 1, 9999);
  state.maxMp = clamp(state.maxMp, 0, 999);
  
  state.hp = clamp(state.hp, 0, state.maxHp);
  state.mp = clamp(state.mp, 0, state.maxMp);
  state.xp = Math.max(0, state.xp);
  
  state.xpToNext = calculateXpToNext(state.level);
  
  // Validate stats bounds
  const statsKeys: (keyof PlayerStats)[] = ['atk', 'def', 'mag', 'res', 'vel', 'sor'];
  for (const key of statsKeys) {
    if (isNaN(state.stats[key])) {
      throw new Error(`PlayerState validation failed: NaN detected in stat ${key}`);
    }
    state.stats[key] = clamp(state.stats[key], 1, 999);
  }
}

/**
 * Safely applies damage to the player, respecting invariants.
 * Returns the actual damage amount dealt.
 */
export function damagePlayer(state: PlayerState, amount: number): number {
  const safeAmount = sanitizeNumericAmount(amount);
  if (safeAmount === 0) return 0;
  const actualDamage = Math.min(state.hp, safeAmount);
  state.hp = safeSub(state.hp, safeAmount, true); // true = clamp at 0
  return actualDamage;
}

/**
 * Safely applies healing to the player, respecting invariants.
 * Returns the actual amount of HP restored.
 */
export function healPlayer(state: PlayerState, amount: number): number {
  const safeAmount = sanitizeNumericAmount(amount);
  if (safeAmount === 0) return 0;
  const actualHealed = Math.min(state.maxHp - state.hp, safeAmount);
  state.hp = Math.min(state.maxHp, safeAdd(state.hp, safeAmount));
  return actualHealed;
}

/**
 * Safely restores MP to the player, respecting invariants.
 * Returns the actual amount of MP restored.
 */
export function restoreMp(state: PlayerState, amount: number): number {
  const safeAmount = sanitizeNumericAmount(amount);
  if (safeAmount === 0) return 0;
  const actualRestored = Math.min(state.maxMp - state.mp, safeAmount);
  state.mp = Math.min(state.maxMp, safeAdd(state.mp, safeAmount));
  return actualRestored;
}

/**
 * Consumes MP if player has enough.
 * Returns true if MP was consumed successfully, false if insufficient or invalid.
 */
export function consumeMp(state: PlayerState, amount: number): boolean {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return false;
  }
  const cost = Math.max(0, amount);
  if (cost === 0) return true;
  if (state.mp < cost) return false;
  state.mp = safeSub(state.mp, cost, true);
  return true;
}

/**
 * Advances the player by one level, increasing attributes according to the GDD curves,
 * fully restoring HP and MP, and emitting the 'player:levelUp' event.
 */
export function levelUp(state: PlayerState): void {
  if (state.level >= 99) return;

  state.level += 1;
  
  // Stat gains defined in GDD:
  // Max HP +25, Max MP +8, Atk +2, Def +2, Mag +2, Res +2, Vel +1, Sor +1
  state.maxHp = safeAdd(state.maxHp, 25);
  state.maxMp = safeAdd(state.maxMp, 8);
  state.hp = state.maxHp;
  state.mp = state.maxMp;

  state.stats.atk = safeAdd(state.stats.atk, 2);
  state.stats.def = safeAdd(state.stats.def, 2);
  state.stats.mag = safeAdd(state.stats.mag, 2);
  state.stats.res = safeAdd(state.stats.res, 2);
  state.stats.vel = safeAdd(state.stats.vel, 1);
  state.stats.sor = safeAdd(state.stats.sor, 1);

  state.xpToNext = calculateXpToNext(state.level);
  validatePlayerState(state);

  EventBus.emit('player:levelUp', {
    newLevel: state.level,
    stats: { ...state.stats }
  });
}

/**
 * Adds experience to the player with automatic level progression and stat scaling (FASE 3).
 */
export function gainExperience(
  state: PlayerState,
  amount: number
): { leveledUp: boolean; levelsGained: number; oldLevel: number; newLevel: number } {
  const safeAmount = sanitizeNumericAmount(amount);
  if (safeAmount > 0) {
    state.xp = safeAdd(state.xp, safeAmount);
  }

  const oldLevel = state.level;
  let levelsGained = 0;

  while (state.level < 99 && state.xp >= state.xpToNext) {
    levelUp(state);
    levelsGained++;
  }

  return {
    leveledUp: levelsGained > 0,
    levelsGained,
    oldLevel,
    newLevel: state.level
  };
}

/**
 * Safely adds XP to player.
 * If autoLevelUp is true, triggers levelUp() upon crossing xpToNext threshold.
 */
export function addPlayerXp(
  state: PlayerState,
  amount: number,
  autoLevelUp: boolean = false
): { leveledUp: boolean; levelsGained: number; oldLevel: number; newLevel: number } {
  if (autoLevelUp) {
    return gainExperience(state, amount);
  }

  const safeAmount = sanitizeNumericAmount(amount);
  if (safeAmount > 0) {
    state.xp = safeAdd(state.xp, safeAmount);
  }
  return {
    leveledUp: false,
    levelsGained: 0,
    oldLevel: state.level,
    newLevel: state.level
  };
}


