/**
 * DialogueManager — Dialogue Rules & Flow Controller
 *
 * Decoupled from Phaser rendering; manages active dialogue state, pagination,
 * GameStateManager phase transitions, and EventBus emissions.
 */

import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { GameStateManager, gameState as globalGameState } from '@core/GameStateManager.ts';
import { DEFAULT_DIALOGUES, type DialogueDatabase, type DialogueMessage, type DialogueNode } from '@data/dialogueData.ts';

export class DialogueManager {
  private database: DialogueDatabase;
  private gameState: GameStateManager;
  private activeNode: DialogueNode | null = null;
  private currentIndex: number = 0;
  private isEmitting: boolean = false;

  constructor(customDatabase?: DialogueDatabase, gameStateManager?: GameStateManager) {
    this.database = customDatabase ? { ...customDatabase } : { ...DEFAULT_DIALOGUES };
    this.gameState = gameStateManager ?? globalGameState;

    // Listen for external trigger to start dialogue
    EventBus.on('dialog:start', this.handleDialogStartEvent, this);
  }

  /**
   * Registers or updates a dialogue node in the database.
   */
  registerDialogue(node: DialogueNode): void {
    this.database[node.id] = node;
  }

  /**
   * Initiates a dialogue by ID.
   * Updates GameStateManager to DIALOGUE and emits 'dialog:start'.
   */
  startDialogue(dialogueId: string): boolean {
    const node = this.database[dialogueId];
    if (!node || node.messages.length === 0) {
      console.warn(`[DialogueManager] Dialogue ID "${dialogueId}" not found or has no messages.`);
      return false;
    }

    if (this.activeNode && this.activeNode.id === dialogueId) {
      // Already running this dialogue
      return true;
    }

    this.activeNode = node;
    this.currentIndex = 0;

    // Transition gameState to DIALOGUE if not already there
    if (this.gameState.getPhase() === 'EXPLORING') {
      this.gameState.transitionTo('DIALOGUE');
    }

    // Trigger initial message events
    this.triggerMessageEvents(this.getCurrentMessage());

    if (!this.isEmitting) {
      this.isEmitting = true;
      EventBus.emit('dialog:start', { dialogId: dialogueId });
      this.isEmitting = false;
    }

    return true;
  }

  private handleDialogStartEvent(payload: { dialogId?: string; dialogueId?: string }): void {
    const id = payload.dialogId || payload.dialogueId;
    if (id && (!this.activeNode || this.activeNode.id !== id)) {
      this.startDialogue(id);
    }
  }

  /**
   * Gets the currently active dialogue node.
   */
  getActiveNode(): DialogueNode | null {
    return this.activeNode;
  }

  /**
   * Gets the current dialogue message being shown.
   */
  getCurrentMessage(): DialogueMessage | null {
    if (!this.activeNode) return null;
    return this.activeNode.messages[this.currentIndex] ?? null;
  }

  /**
   * Gets the 0-based index of the current message.
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Gets total message count of current dialogue.
   */
  getTotalMessages(): number {
    return this.activeNode ? this.activeNode.messages.length : 0;
  }

  /**
   * Checks if dialogue has more messages after the current one.
   */
  hasMoreMessages(): boolean {
    if (!this.activeNode) return false;
    return this.currentIndex < this.activeNode.messages.length - 1;
  }

  /**
   * Checks if dialogue is actively running.
   */
  isDialogueActive(): boolean {
    return this.activeNode !== null;
  }

  /**
   * Advances dialogue to the next message.
   * If on the last message, ends the dialogue.
   * Returns true if advanced to a new message, false if ended.
   */
  advance(): boolean {
    if (!this.activeNode) return false;

    if (this.hasMoreMessages()) {
      const currentMsg = this.getCurrentMessage();
      if (currentMsg?.onComplete) {
        try {
          currentMsg.onComplete();
        } catch (err) {
          console.error('[DialogueManager] Error in message onComplete callback:', err);
        }
      }

      this.currentIndex++;
      const nextMsg = this.getCurrentMessage();
      this.triggerMessageEvents(nextMsg);

      EventBus.emit('dialog:advance', {
        dialogId: this.activeNode.id,
        pageIndex: this.currentIndex,
        totalPages: this.activeNode.messages.length,
      });

      return true;
    } else {
      this.close();
      return false;
    }
  }

  /**
   * Closes active dialogue and returns GameStateManager to EXPLORING.
   */
  close(): void {
    if (!this.activeNode) return;

    const currentMsg = this.getCurrentMessage();
    if (currentMsg?.onComplete) {
      try {
        currentMsg.onComplete();
      } catch (err) {
        console.error('[DialogueManager] Error in message onComplete callback:', err);
      }
    }

    const closedId = this.activeNode.id;
    this.activeNode = null;
    this.currentIndex = 0;

    // Restore gameState to EXPLORING
    if (this.gameState.getPhase() === 'DIALOGUE') {
      this.gameState.transitionTo('EXPLORING');
    }

    EventBus.emit('dialog:end', { dialogId: closedId });
  }

  /**
   * Clean up event listeners.
   */
  destroy(): void {
    EventBus.off('dialog:start', this.handleDialogStartEvent, this);
  }

  private triggerMessageEvents(msg: DialogueMessage | null): void {
    if (!msg) return;
    if (msg.eventTrigger) {
      EventBus.emit(msg.eventTrigger, { message: msg });
    }
  }
}
