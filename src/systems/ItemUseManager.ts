/**
 * ItemUseManager — Item Consumption and Effect Domain Logic
 *
 * Pure TypeScript, zero Phaser dependencies.
 * Manages item usage preconditions, atomic consumption, and effect application.
 *
 * Conforms strictly to F3-U09 specifications, GDD.md, and CONTRACTS.md.
 *
 * Core Principles:
 * - InventoryManager is the Single Source of Truth for item ownership.
 * - Atomic execution: effects are only retained if the item is successfully consumed;
 *   if item removal fails, any applied effects are rolled back.
 * - Items are NEVER consumed if the effect cannot take place (e.g. full HP/MP).
 * - Equipment cannot be consumed as items.
 * - Effective maximum resources (HP/MP) are derived via EquipmentManager.
 *
 * Emits EventBus events:
 * - 'inventory:itemUsed' ({ itemId, playerId, amountApplied })
 */

import { safeAdd, clamp } from '@utils/math.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { getItemDefinition } from '@data/itemsData.ts';
import type { PlayerState } from '@entities/Player.ts';
import type { InventoryManager } from '@inventory/InventoryManager.ts';
import type { EquipmentManager } from '@systems/EquipmentManager.ts';

export type UseContext = 'exploration' | 'battle';

export interface CanUseResult {
  readonly canUse: boolean;
  readonly reason?: string;
}

export interface ItemUseResult {
  readonly success: boolean;
  readonly itemId: string;
  readonly message: string;
  readonly amountApplied?: number;
}

export class ItemUseManager {
  private readonly inventory: InventoryManager;
  private readonly equipmentManager?: EquipmentManager;

  constructor(inventory: InventoryManager, equipmentManager?: EquipmentManager) {
    this.inventory = inventory;
    this.equipmentManager = equipmentManager;
  }

  /**
   * Resolves the effective maximum HP and MP for the player,
   * taking equipment bonuses into account if EquipmentManager is available.
   */
  private getEffectiveMaxResources(player: PlayerState): { maxHp: number; maxMp: number } {
    if (this.equipmentManager) {
      const stats = this.equipmentManager.calculateEffectiveStats(player);
      return { maxHp: stats.maxHp, maxMp: stats.maxMp };
    }
    return { maxHp: player.maxHp, maxMp: player.maxMp };
  }

  /**
   * Evaluates whether an item can currently be used by the player in the given context.
   * Pure query with zero side-effects.
   */
  canUseItem(
    player: PlayerState,
    itemId: string,
    context: UseContext = 'exploration'
  ): CanUseResult {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) {
      return { canUse: false, reason: 'Item não encontrado.' };
    }

    if (!this.inventory.hasItem(itemId, 1)) {
      return { canUse: false, reason: 'Você não possui este item.' };
    }

    if (itemDef.type === 'equipment') {
      return { canUse: false, reason: 'Este item não pode ser usado desta forma.' };
    }

    if (itemDef.type !== 'consumable') {
      return { canUse: false, reason: 'Este item não pode ser consumido.' };
    }

    const { maxHp, maxMp } = this.getEffectiveMaxResources(player);

    switch (itemId) {
      case 'elixir_amber': {
        if (player.hp >= maxHp) {
          return { canUse: false, reason: 'HP já está no valor máximo!' };
        }
        return { canUse: true };
      }

      case 'ether_drop': {
        if (player.mp >= maxMp) {
          return { canUse: false, reason: 'MP já está no valor máximo!' };
        }
        return { canUse: true };
      }

      case 'antidote': {
        if (context === 'exploration') {
          return { canUse: false, reason: 'Nenhum efeito: Kaël não está envenenado.' };
        }
        return { canUse: false, reason: 'Nenhum efeito: Kaël não está envenenado.' };
      }

      case 'escape_crystal': {
        if (context === 'exploration') {
          return { canUse: false, reason: 'Este item só pode ser usado em batalha.' };
        }
        // Prepared for future Battle Phase (context === 'battle')
        return { canUse: true };
      }

      default:
        return { canUse: false, reason: 'Item não pode ser usado no momento.' };
    }
  }

  /**
   * Executes atomic item consumption and effect application.
   *
   * Atomic Transaction Flow:
   * 1. Validate canUseItem() preconditions.
   * 2. Calculate effect amount.
   * 3. Apply effect to player resources (clamping to effective maximums).
   * 4. Remove 1 unit of the item from InventoryManager.
   * 5. If item removal fails, ROLL BACK player resources to prior state.
   * 6. If removal succeeds, emit 'inventory:itemUsed' and return success result.
   */
  useItem(
    player: PlayerState,
    itemId: string,
    context: UseContext = 'exploration'
  ): ItemUseResult {
    const canUse = this.canUseItem(player, itemId, context);
    if (!canUse.canUse) {
      return {
        success: false,
        itemId,
        message: canUse.reason ?? 'Não é possível usar este item.',
      };
    }

    const { maxHp, maxMp } = this.getEffectiveMaxResources(player);
    const previousHp = player.hp;
    const previousMp = player.mp;
    let amountApplied = 0;
    let message = '';

    switch (itemId) {
      case 'elixir_amber': {
        const healPotential = 50;
        const actualHealed = Math.min(healPotential, Math.max(0, maxHp - player.hp));
        player.hp = clamp(safeAdd(player.hp, healPotential), 0, maxHp);
        amountApplied = actualHealed;
        message = `Recuperou ${amountApplied} HP!`;
        break;
      }

      case 'ether_drop': {
        const mpPotential = 20;
        const actualRestored = Math.min(mpPotential, Math.max(0, maxMp - player.mp));
        player.mp = clamp(safeAdd(player.mp, mpPotential), 0, maxMp);
        amountApplied = actualRestored;
        message = `Restaurou ${amountApplied} MP!`;
        break;
      }

      case 'escape_crystal': {
        if (context === 'battle') {
          message = 'Fuga imediata ativada!';
        }
        break;
      }

      default:
        return {
          success: false,
          itemId,
          message: 'Efeito do item não configurado.',
        };
    }

    // Step 4: Atomic consumption from Single Source of Truth
    const removed = this.inventory.removeItem(itemId, 1);
    if (!removed) {
      // Step 5: Rollback player state if inventory removal failed
      player.hp = previousHp;
      player.mp = previousMp;
      return {
        success: false,
        itemId,
        message: 'Erro ao remover o item do inventário.',
      };
    }

    // Step 6: Emit event and return success
    EventBus.emit('inventory:itemUsed', {
      itemId,
      playerId: player.id,
      amountApplied,
    });

    return {
      success: true,
      itemId,
      message,
      amountApplied,
    };
  }
}
