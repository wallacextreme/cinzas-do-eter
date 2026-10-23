/**
 * Equipment Data — Definition of all canonical equipment in Cinzas do Éter
 *
 * Conforms to GDD.md (Vertical Slice).
 * Pure data definitions, decoupled from rendering and game state.
 *
 * This module defines SLOT and STAT BONUSES for equipment items.
 * Item metadata (name, price, type) lives in itemsData.ts.
 * The two modules share the same item IDs.
 */

import type { PlayerStats } from '@entities/Player.ts';

/**
 * Valid equipment slot types matching CONTRACTS.md PlayerEquipment.
 */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

/**
 * Stat bonuses granted by an equipment item.
 * All fields are optional — only specified stats receive bonuses.
 * Supports the 6 core stats plus maxHp/maxMp for future use.
 */
export interface StatBonus {
  readonly atk?: number;
  readonly def?: number;
  readonly mag?: number;
  readonly res?: number;
  readonly vel?: number;
  readonly sor?: number;
  readonly maxHp?: number;
  readonly maxMp?: number;
}

/**
 * Full definition of an equipment piece.
 */
export interface EquipmentDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly slot: EquipmentSlot;
  readonly bonus: StatBonus;
}

/**
 * The 6 canonical stats that can receive bonuses.
 */
export const STAT_BONUS_KEYS: readonly (keyof PlayerStats)[] = [
  'atk', 'def', 'mag', 'res', 'vel', 'sor',
] as const;

/**
 * Extended bonus keys including maxHp/maxMp.
 */
export const ALL_BONUS_KEYS: readonly (keyof StatBonus)[] = [
  'atk', 'def', 'mag', 'res', 'vel', 'sor', 'maxHp', 'maxMp',
] as const;

/**
 * All valid equipment slot values.
 */
export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  'weapon', 'armor', 'accessory',
] as const;

/**
 * Canonical Equipment Database — GDD.md Vertical Slice
 *
 * Bônus aprovados pelo diretor criativo:
 * - apprentice_staff:  ATK +3
 * - tuned_staff:       ATK +5, MAG +2
 * - traveler_tunic:    DEF +3
 * - ether_cuirass:     DEF +5, RES +3
 * - amber_pendant:     RES +2, SOR +2
 * - crystal_ring:      MAG +3, VEL +1
 */
export const EQUIPMENT_DATABASE: Record<string, EquipmentDefinition> = {
  'apprentice_staff': {
    id: 'apprentice_staff',
    name: 'Bastão de Aprendiz',
    description: 'Bastão simples de madeira tratada, usado por sintonizadores iniciantes.',
    slot: 'weapon',
    bonus: { atk: 3 },
  },
  'tuned_staff': {
    id: 'tuned_staff',
    name: 'Bastão Sintonizado',
    description: 'Bastão condutor de Éter, afinado para amplificar ressonâncias.',
    slot: 'weapon',
    bonus: { atk: 5, mag: 2 },
  },
  'traveler_tunic': {
    id: 'traveler_tunic',
    name: 'Túnica de Viajante',
    description: 'Veste leve de tecido reforçado, ideal para longas jornadas.',
    slot: 'armor',
    bonus: { def: 3 },
  },
  'ether_cuirass': {
    id: 'ether_cuirass',
    name: 'Couraça de Éter',
    description: 'Armadura leve infundida com cristais de Éter estabilizado.',
    slot: 'armor',
    bonus: { def: 5, res: 3 },
  },
  'amber_pendant': {
    id: 'amber_pendant',
    name: 'Pingente de Âmbar',
    description: 'Amuleto ancestral que ressoa com o calor primordial do Éter.',
    slot: 'accessory',
    bonus: { res: 2, sor: 2 },
  },
  'crystal_ring': {
    id: 'crystal_ring',
    name: 'Anel de Cristal',
    description: 'Anel facetado de cristal de Éter que amplifica a sensibilidade mágica.',
    slot: 'accessory',
    bonus: { mag: 3, vel: 1 },
  },
};

/**
 * Retrieves an equipment definition by ID. Returns undefined if not found.
 */
export function getEquipmentDefinition(id: string): EquipmentDefinition | undefined {
  return EQUIPMENT_DATABASE[id];
}
