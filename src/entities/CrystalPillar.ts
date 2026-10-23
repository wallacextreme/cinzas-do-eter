import type { InteractableEntity } from '@entities/InteractableEntity.ts';
import { PuzzleManager } from '@world/dungeon/PuzzleManager.ts';
import { DialogueManager } from '@world/DialogueManager.ts';

export type PillarColor = 'AMBER' | 'VIOLET' | 'CELESTE';

export class CrystalPillar implements InteractableEntity {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly interactionRadius = 40;
  readonly pillarColor: PillarColor;
  readonly displayName: string;
  private puzzleManager: PuzzleManager;
  private dialogueManager: DialogueManager;

  constructor(
    id: string,
    x: number,
    y: number,
    puzzleManager: PuzzleManager,
    dialogueManager: DialogueManager
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.puzzleManager = puzzleManager;
    this.dialogueManager = dialogueManager;

    if (id.includes('amber')) {
      this.pillarColor = 'AMBER';
      this.displayName = 'Pilar Âmbar';
    } else if (id.includes('violet')) {
      this.pillarColor = 'VIOLET';
      this.displayName = 'Pilar Violeta';
    } else {
      this.pillarColor = 'CELESTE';
      this.displayName = 'Pilar Celeste';
    }
  }

  canInteract(): boolean {
    return true;
  }

  onInteract(): void {
    const result = this.puzzleManager.interactPillar(this.id);
    const dialogId = `dialogue_${this.id}`;

    this.dialogueManager.registerDialogue({
      id: dialogId,
      messages: [
        {
          speakerName: this.displayName,
          text: result.message,
        },
      ],
    });

    this.dialogueManager.startDialogue(dialogId);
  }

  getPillarColor(): PillarColor {
    return this.pillarColor;
  }
}
