/**
 * StatusManager — Status Menu Domain Logic & ViewModel Provider
 *
 * Pure TypeScript, zero Phaser dependencies.
 * Formats data for the Status UI strictly consuming effective stats from EquipmentManager.
 *
 * Key rules:
 * - NEVER recalculate equipment bonuses independently.
 * - Source of truth: EquipmentManager.calculateEffectiveStats().
 * - PlayerState base stats remain completely immutable.
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';
import type { PlayerState } from '@entities/Player.ts';
import type { EquipmentManager, EffectiveStats } from '@systems/EquipmentManager.ts';
import {
  getEquipmentDefinition,
  EQUIPMENT_SLOTS,
} from '@data/equipmentData.ts';
import type { EquipmentSlot, StatBonus } from '@data/equipmentData.ts';

/**
 * Display structure for an individual combat attribute.
 */
export interface StatDisplayInfo {
  readonly key: 'atk' | 'def' | 'mag' | 'res' | 'vel' | 'sor';
  readonly label: string;
  readonly base: number;
  readonly effective: number;
  readonly bonus: number; // effective - base
}

/**
 * Display structure for an equipment slot in the status view.
 */
export interface EquipmentSlotDisplayInfo {
  readonly slot: EquipmentSlot;
  readonly slotLabel: string;
  readonly itemId: string | null;
  readonly itemName: string;
  readonly bonusDescription: string;
  readonly description: string;
}

/**
 * Immutable view model consumed directly by StatusBox UI.
 */
export interface StatusViewModel {
  readonly name: string;
  readonly title: string;
  readonly level: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  readonly maxMp: number;
  readonly xp: number;
  readonly xpToNext: number;
  readonly xpRemaining: number;
  readonly stats: readonly StatDisplayInfo[];
  readonly equipment: readonly EquipmentSlotDisplayInfo[];
  readonly selectedSlotIndex: number;
  readonly selectedEquipment: EquipmentSlotDisplayInfo;
}

/**
 * Formats a StatBonus object into a concise string (e.g. "ATK +5, MAG +2").
 */
export function formatStatBonus(bonus?: StatBonus): string {
  if (!bonus) return '—';
  const parts: string[] = [];
  if (bonus.atk) parts.push(`ATK +${bonus.atk}`);
  if (bonus.def) parts.push(`DEF +${bonus.def}`);
  if (bonus.mag) parts.push(`MAG +${bonus.mag}`);
  if (bonus.res) parts.push(`RES +${bonus.res}`);
  if (bonus.vel) parts.push(`VEL +${bonus.vel}`);
  if (bonus.sor) parts.push(`SOR +${bonus.sor}`);
  if (bonus.maxHp) parts.push(`HP +${bonus.maxHp}`);
  if (bonus.maxMp) parts.push(`MP +${bonus.maxMp}`);
  return parts.length > 0 ? parts.join(', ') : '—';
}

const STAT_LABELS: Record<'atk' | 'def' | 'mag' | 'res' | 'vel' | 'sor', string> = {
  atk: 'ATK',
  def: 'DEF',
  mag: 'MAG',
  res: 'RES',
  vel: 'VEL',
  sor: 'SOR',
};

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
};

export class StatusManager {
  private equipmentManager: EquipmentManager;
  private openState: boolean = false;
  private selectedSlotIndex: number = 0;

  constructor(equipmentManager: EquipmentManager) {
    this.equipmentManager = equipmentManager;
  }

  /**
   * Opens the status menu.
   */
  open(player: PlayerState): boolean {
    if (this.openState) return false;
    this.openState = true;
    this.selectedSlotIndex = 0;
    EventBus.emit('menu:statusOpened', { player });
    return true;
  }

  /**
   * Closes the status menu.
   */
  close(): boolean {
    if (!this.openState) return false;
    this.openState = false;
    EventBus.emit('menu:statusClosed', {});
    return true;
  }

  /**
   * Whether the status menu is currently open.
   */
  isOpen(): boolean {
    return this.openState;
  }

  /**
   * Selects the next equipment slot (downward navigation, cyclical).
   */
  selectNextSlot(): number {
    this.selectedSlotIndex = (this.selectedSlotIndex + 1) % EQUIPMENT_SLOTS.length;
    return this.selectedSlotIndex;
  }

  /**
   * Selects the previous equipment slot (upward navigation, cyclical).
   */
  selectPreviousSlot(): number {
    this.selectedSlotIndex =
      (this.selectedSlotIndex - 1 + EQUIPMENT_SLOTS.length) % EQUIPMENT_SLOTS.length;
    return this.selectedSlotIndex;
  }

  /**
   * Gets the index of the currently focused equipment slot.
   */
  getSelectedSlotIndex(): number {
    return this.selectedSlotIndex;
  }

  /**
   * Sets the index of the focused equipment slot explicitly.
   */
  setSelectedSlotIndex(index: number): void {
    if (index >= 0 && index < EQUIPMENT_SLOTS.length) {
      this.selectedSlotIndex = index;
    }
  }

  /**
   * Generates a complete immutable ViewModel for the status view.
   * Delegates effective stat calculations strictly to EquipmentManager.
   */
  getStatusViewModel(player: PlayerState): StatusViewModel {
    // 1. Mandatory delegation to EquipmentManager for effective attributes
    const effectiveStats: EffectiveStats = this.equipmentManager.calculateEffectiveStats(player);

    // 2. Build combat stats array with derived bonus calculation
    const statKeys: ('atk' | 'def' | 'mag' | 'res' | 'vel' | 'sor')[] = [
      'atk',
      'def',
      'mag',
      'res',
      'vel',
      'sor',
    ];

    const stats: StatDisplayInfo[] = statKeys.map((key) => {
      const base = player.stats[key];
      const effective = effectiveStats[key];
      return {
        key,
        label: STAT_LABELS[key],
        base,
        effective,
        bonus: effective - base,
      };
    });

    // 3. Build equipment slot infos from current player loadout
    const equipment: EquipmentSlotDisplayInfo[] = EQUIPMENT_SLOTS.map((slot) => {
      const itemId = player.equipment[slot];
      const slotLabel = SLOT_LABELS[slot];

      if (itemId) {
        const def = getEquipmentDefinition(itemId);
        return {
          slot,
          slotLabel,
          itemId,
          itemName: def ? def.name : itemId,
          bonusDescription: def ? formatStatBonus(def.bonus) : '—',
          description: def ? def.description : 'Item desconhecido.',
        };
      }

      return {
        slot,
        slotLabel,
        itemId: null,
        itemName: '(Nenhum)',
        bonusDescription: '—',
        description: 'Nenhum equipamento equipado neste slot.',
      };
    });

    const selectedEquipment = equipment[this.selectedSlotIndex] ?? equipment[0];

    return {
      name: player.name || 'Kaël',
      title: 'Adepto do Éter',
      level: player.level,
      hp: player.hp,
      maxHp: effectiveStats.maxHp,
      mp: player.mp,
      maxMp: effectiveStats.maxMp,
      xp: player.xp,
      xpToNext: player.xpToNext,
      xpRemaining: Math.max(0, player.xpToNext - player.xp),
      stats,
      equipment,
      selectedSlotIndex: this.selectedSlotIndex,
      selectedEquipment,
    };
  }
}
