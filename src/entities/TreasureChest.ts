import type { InteractableEntity } from '@entities/InteractableEntity.ts';
import { ChestManager } from '@world/dungeon/index.ts';
import type { ChestState, ChestOpenResult } from '@world/dungeon/index.ts';
import { InventoryManager } from '@inventory/InventoryManager.ts';
import { DialogueManager } from '@world/DialogueManager.ts';

export class TreasureChest implements InteractableEntity {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly interactionRadius = 40;
  readonly rewardItemId: string;
  private chestManager: ChestManager;
  private inventoryManager: InventoryManager;
  private dialogueManager: DialogueManager;
  private onStateChanged?: (newState: ChestState) => void;

  constructor(
    id: string,
    x: number,
    y: number,
    rewardItemId: string,
    chestManager: ChestManager,
    inventoryManager: InventoryManager,
    dialogueManager: DialogueManager,
    onStateChanged?: (newState: ChestState) => void
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.rewardItemId = rewardItemId;
    this.chestManager = chestManager;
    this.inventoryManager = inventoryManager;
    this.dialogueManager = dialogueManager;
    this.onStateChanged = onStateChanged;
  }

  canInteract(): boolean {
    return true;
  }

  getState(): ChestState {
    return this.chestManager.getChestState(this.id);
  }

  isOpened(): boolean {
    return this.chestManager.isChestOpened(this.id);
  }

  onInteract(): ChestOpenResult {
    const result = this.chestManager.openChest(
      this.id,
      this.rewardItemId,
      this.inventoryManager
    );

    if (result.success && this.onStateChanged) {
      this.onStateChanged('OPENED');
    }

    const dialogId = `dialogue_${this.id}`;
    this.dialogueManager.registerDialogue({
      id: dialogId,
      messages: [
        {
          speakerName: 'Baú Antigo',
          text: result.message,
        },
      ],
    });

    this.dialogueManager.startDialogue(dialogId);
    return result;
  }
}
