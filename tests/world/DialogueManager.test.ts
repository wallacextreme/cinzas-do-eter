import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DialogueManager } from '@world/DialogueManager.ts';
import { GameStateManager } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import type { DialogueDatabase } from '@data/dialogueData.ts';

describe('DialogueManager', () => {
  let gameState: GameStateManager;
  let dialogueManager: DialogueManager;

  const mockDatabase: DialogueDatabase = {
    'test_dialogue': {
      id: 'test_dialogue',
      messages: [
        { speakerName: 'Lia', text: 'Hello, world!' },
        { speakerName: 'Lia', text: 'Second page.', eventTrigger: 'custom:event' },
        { speakerName: 'Lia', text: 'Final message.' },
      ],
    },
    'single_page': {
      id: 'single_page',
      messages: [
        { speakerName: 'Torvak', text: 'Only one line.' },
      ],
    },
  };

  beforeEach(() => {
    EventBus.removeAll();
    gameState = new GameStateManager();
    // Simulate being in EXPLORING state
    gameState.transitionTo('LOADING');
    gameState.transitionTo('EXPLORING');

    dialogueManager = new DialogueManager(mockDatabase, gameState);
  });

  afterEach(() => {
    dialogueManager.destroy();
    EventBus.removeAll();
  });

  it('starts inactive and in EXPLORING phase', () => {
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(dialogueManager.getCurrentMessage()).toBeNull();
    expect(gameState.getPhase()).toBe('EXPLORING');
  });

  it('starts dialogue, changes GameState to DIALOGUE, and emits dialog:start', () => {
    const startSpy = vi.fn();
    EventBus.on('dialog:start', startSpy);

    const success = dialogueManager.startDialogue('test_dialogue');

    expect(success).toBe(true);
    expect(dialogueManager.isDialogueActive()).toBe(true);
    expect(dialogueManager.getCurrentIndex()).toBe(0);
    expect(dialogueManager.getCurrentMessage()?.text).toBe('Hello, world!');
    expect(gameState.getPhase()).toBe('DIALOGUE');
    expect(startSpy).toHaveBeenCalledWith({ dialogId: 'test_dialogue' });
  });

  it('gracefully handles non-existent dialogue IDs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const success = dialogueManager.startDialogue('non_existent');

    expect(success).toBe(false);
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('paginates multiple messages, emits dialog:advance, and closes at the end', () => {
    const advanceSpy = vi.fn();
    const endSpy = vi.fn();
    EventBus.on('dialog:advance', advanceSpy);
    EventBus.on('dialog:end', endSpy);

    dialogueManager.startDialogue('test_dialogue');

    // Page 1 -> Page 2
    expect(dialogueManager.hasMoreMessages()).toBe(true);
    const advanced1 = dialogueManager.advance();
    expect(advanced1).toBe(true);
    expect(dialogueManager.getCurrentIndex()).toBe(1);
    expect(dialogueManager.getCurrentMessage()?.text).toBe('Second page.');
    expect(advanceSpy).toHaveBeenCalledWith({
      dialogId: 'test_dialogue',
      pageIndex: 1,
      totalPages: 3,
    });

    // Page 2 -> Page 3
    expect(dialogueManager.hasMoreMessages()).toBe(true);
    const advanced2 = dialogueManager.advance();
    expect(advanced2).toBe(true);
    expect(dialogueManager.getCurrentIndex()).toBe(2);
    expect(dialogueManager.getCurrentMessage()?.text).toBe('Final message.');

    // Page 3 is final -> close
    expect(dialogueManager.hasMoreMessages()).toBe(false);
    const advanced3 = dialogueManager.advance();
    expect(advanced3).toBe(false); // Closed
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(endSpy).toHaveBeenCalledWith({ dialogId: 'test_dialogue' });
  });

  it('closes single-page dialogues correctly on first advance', () => {
    const endSpy = vi.fn();
    EventBus.on('dialog:end', endSpy);

    dialogueManager.startDialogue('single_page');
    expect(dialogueManager.hasMoreMessages()).toBe(false);

    const advanced = dialogueManager.advance();
    expect(advanced).toBe(false);
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(endSpy).toHaveBeenCalledWith({ dialogId: 'single_page' });
  });

  it('supports direct close() and restores EXPLORING', () => {
    const endSpy = vi.fn();
    EventBus.on('dialog:end', endSpy);

    dialogueManager.startDialogue('test_dialogue');
    expect(gameState.getPhase()).toBe('DIALOGUE');

    dialogueManager.close();
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(endSpy).toHaveBeenCalledWith({ dialogId: 'test_dialogue' });
  });

  it('fires onComplete callbacks and narrative eventTriggers', () => {
    const onCompleteMock = vi.fn();
    const eventSpy = vi.fn();
    EventBus.on('custom:event', eventSpy);

    dialogueManager.registerDialogue({
      id: 'event_dialogue',
      messages: [
        {
          speakerName: 'Lia',
          text: 'Triggering...',
          eventTrigger: 'custom:event',
          onComplete: onCompleteMock,
        },
      ],
    });

    dialogueManager.startDialogue('event_dialogue');
    expect(eventSpy).toHaveBeenCalled();

    dialogueManager.advance();
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('responds to external dialog:start EventBus trigger', () => {
    EventBus.emit('dialog:start', { dialogId: 'test_dialogue' });
    expect(dialogueManager.isDialogueActive()).toBe(true);
    expect(gameState.getPhase()).toBe('DIALOGUE');
  });
});
