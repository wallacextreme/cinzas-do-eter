/**
 * ChestManager — Pure Logic for Chests and World Rewards
 *
 * Implements strict one-time rewards, state verification (CLOSED -> OPENED),
 * and anti-duplication logic decoupled from rendering and sprite presentation.
 *
 * Emits EventBus events:
 * - 'chest:opened' ({ chestId: string, itemId: string })
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { dungeonState, DungeonStateManager } from './DungeonState.ts';
import type { ChestState } from './DungeonState.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { getItemDefinition } from '@data/itemsData.ts';

export interface ChestOpenResult {
  readonly success: boolean;
  readonly alreadyOpened: boolean;
  readonly itemId?: string;
  readonly itemName?: string;
  readonly message: string;
}

export class ChestManager {
  private stateManager: DungeonStateManager;

  constructor(stateManager: DungeonStateManager = dungeonState) {
    this.stateManager = stateManager;
  }

  /**
   * Retrieves the current state of a chest.
   */
  getChestState(chestId: string): ChestState {
    return this.stateManager.getChestState(chestId);
  }

  /**
   * Checks if the chest has already been opened in this session.
   */
  isChestOpened(chestId: string): boolean {
    return this.stateManager.isChestOpened(chestId);
  }

  /**
   * Attempts to open a chest and grant its reward to the player's inventory.
   * If already opened, no item is granted and a notice is returned.
   */
  openChest(
    chestId: string,
    rewardItemId: string,
    inventory: InventoryManager,
    quantity = 1
  ): ChestOpenResult {
    if (this.isChestOpened(chestId)) {
      return {
        success: false,
        alreadyOpened: true,
        message: 'O baú já está aberto e vazio.',
      };
    }

    const itemDef = getItemDefinition(rewardItemId);
    const itemName = itemDef ? itemDef.name : rewardItemId;

    // Add item to player's inventory
    const added = inventory.addItem(rewardItemId, quantity);
    if (!added) {
      return {
        success: false,
        alreadyOpened: false,
        message: 'Inventário cheio! Não há espaço para o item.',
      };
    }

    // Set chest state to OPENED in session
    this.stateManager.setChestState(chestId, 'OPENED');
    EventBus.emit('chest:opened', { chestId, itemId: rewardItemId });

    return {
      success: true,
      alreadyOpened: false,
      itemId: rewardItemId,
      itemName,
      message: `Você abriu o baú e obteve: ${itemName}!`,
    };
  }

  /**
   * Resets a specific chest to CLOSED (for testing purposes).
   */
  resetChest(chestId: string): void {
    this.stateManager.setChestState(chestId, 'CLOSED');
  }
}

/**
 * Default global instance for chest operations.
 */
export const chestManager = new ChestManager();
