/**
 * Dialogue Integration Tests — Unit 5 Gauntlet Verification
 *
 * Validates the full contract and interaction loop between:
 * - InputManager
 * - InteractionManager
 * - DialogueManager
 * - GameStateManager
 * - Entities (Lia and Torvak)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Phaser distance calculation
vi.mock('phaser', () => {
  return {
    default: {
      Math: {
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          },
        },
      },
    },
  };
});

// Mock InteractionPrompt
vi.mock('@ui/InteractionPrompt.ts', () => {
  return {
    InteractionPrompt: class {
      show = vi.fn();
      hide = vi.fn();
    },
  };
});

import { InputManager } from '@systems/InputManager.ts';
import { InteractionManager } from '@world/InteractionManager.ts';
import { DialogueManager } from '@world/DialogueManager.ts';
import { GameStateManager } from '@core/GameStateManager.ts';
import { globalEventBus as EventBus } from '@core/EventBus.ts';
import { DEFAULT_DIALOGUES } from '@data/dialogueData.ts';

describe('Dialogue Integration & Full Gauntlet Verification', () => {
  let input: InputManager;
  let gameState: GameStateManager;
  let dialogueManager: DialogueManager;
  let interactionManager: InteractionManager;
  let mockPlayer: any;
  let scene: any;

  beforeEach(() => {
    EventBus.removeAll();

    input = new InputManager();
    gameState = new GameStateManager();
    gameState.transitionTo('LOADING');
    gameState.transitionTo('EXPLORING');

    dialogueManager = new DialogueManager(DEFAULT_DIALOGUES, gameState);

    mockPlayer = {
      x: 448, // Lia is at 448, 240
      y: 260, // 20px below Lia
      getFacingDirection: vi.fn().mockReturnValue('UP'),
    };

    scene = {};
    interactionManager = new InteractionManager(scene, mockPlayer, input, gameState);
  });

  afterEach(() => {
    dialogueManager.destroy();
    EventBus.removeAll();
  });

  it('completes the full interaction loop with Lia: open -> paginate -> close -> restore movement', () => {
    // 1. Setup Lia entity
    let liaIsInteracting = false;
    const lia = {
      id: 'npc_lia',
      x: 448,
      y: 240,
      interactionRadius: 32,
      canInteract: () => !liaIsInteracting,
      onInteract: () => {
        liaIsInteracting = true;
        EventBus.emit('dialog:start', { dialogId: 'dialogue_npc_lia' });
      },
    };
    interactionManager.registerEntity(lia as any);

    // 2. Approach and face Lia
    interactionManager.update();
    expect((interactionManager as any).prompt.show).toHaveBeenCalledWith(448, 240);

    // 3. Press CONFIRM to interact
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((action) => action === 'CONFIRM');
    const consumeSpy = vi.spyOn(input, 'consumeAction');

    interactionManager.update();

    // Confirm input was consumed so other systems don't re-trigger it on the same frame
    expect(consumeSpy).toHaveBeenCalledWith('CONFIRM');

    // Dialogue is now open
    expect(dialogueManager.isDialogueActive()).toBe(true);
    expect(gameState.getPhase()).toBe('DIALOGUE');
    expect(gameState.isGameplayActive()).toBe(false); // Movement blocked

    // Verify first message content
    const msg1 = dialogueManager.getCurrentMessage();
    expect(msg1?.speakerName).toBe('Lia');
    expect(msg1?.text).toContain('vibrações do Éter');

    // 4. Advance to second message
    expect(dialogueManager.hasMoreMessages()).toBe(true);
    const hasNext1 = dialogueManager.advance();
    expect(hasNext1).toBe(true);
    expect(dialogueManager.getCurrentIndex()).toBe(1);
    const msg2 = dialogueManager.getCurrentMessage();
    expect(msg2?.text).toContain('colheita');

    // 5. Advance to third message
    expect(dialogueManager.hasMoreMessages()).toBe(true);
    const hasNext2 = dialogueManager.advance();
    expect(hasNext2).toBe(true);
    expect(dialogueManager.getCurrentIndex()).toBe(2);
    const msg3 = dialogueManager.getCurrentMessage();
    expect(msg3?.text).toContain('Planície das Cinzas');

    // 6. Last message advance closes the dialogue
    expect(dialogueManager.hasMoreMessages()).toBe(false);
    const hasNext3 = dialogueManager.advance();
    expect(hasNext3).toBe(false); // Closed
    expect(dialogueManager.isDialogueActive()).toBe(false);

    // GameState restored to EXPLORING
    expect(gameState.getPhase()).toBe('EXPLORING');
    expect(gameState.isGameplayActive()).toBe(true);
  });

  it('supports Torvak dialogue with merchant messages and restores state', () => {
    // 1. Setup Torvak entity
    const torvak = {
      id: 'npc_torvak',
      x: 352,
      y: 320,
      interactionRadius: 32,
      canInteract: () => true,
      onInteract: () => {
        EventBus.emit('dialog:start', { dialogId: 'dialogue_npc_torvak' });
      },
    };
    interactionManager.registerEntity(torvak as any);

    mockPlayer.x = 352;
    mockPlayer.y = 340;
    mockPlayer.getFacingDirection.mockReturnValue('UP');

    vi.spyOn(input, 'isActionJustPressed').mockImplementation((action) => action === 'CONFIRM');
    interactionManager.update();

    expect(dialogueManager.isDialogueActive()).toBe(true);
    expect(gameState.getPhase()).toBe('DIALOGUE');

    const msg1 = dialogueManager.getCurrentMessage();
    expect(msg1?.speakerName).toBe('Torvak');
    expect(msg1?.text).toContain('Torvak a seu dispor');

    // Step through Torvak's messages
    dialogueManager.advance();
    expect(dialogueManager.getCurrentMessage()?.text).toContain('perigosos');

    dialogueManager.advance();
    expect(dialogueManager.getCurrentMessage()?.text).toContain('loja');

    // Final close
    dialogueManager.advance();
    expect(dialogueManager.isDialogueActive()).toBe(false);
    expect(gameState.getPhase()).toBe('EXPLORING');
  });

  it('InteractionManager suppresses prompt and interactions when GameState is DIALOGUE', () => {
    const dummyEntity = {
      id: 'dummy',
      x: 448,
      y: 250,
      interactionRadius: 32,
      canInteract: () => true,
      onInteract: vi.fn(),
    };
    interactionManager.registerEntity(dummyEntity as any);

    // Enter DIALOGUE state
    gameState.transitionTo('DIALOGUE');

    interactionManager.update();

    expect((interactionManager as any).prompt.hide).toHaveBeenCalled();
    expect(dummyEntity.onInteract).not.toHaveBeenCalled();
  });
});
