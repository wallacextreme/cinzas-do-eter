import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser completely before it gets imported
vi.mock('phaser', () => {
  return {
    default: {
      Math: {
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          }
        }
      }
    }
  };
});

import { InteractionManager } from '@world/InteractionManager.ts';
import { InputManager } from '@systems/InputManager.ts';

// Mock InteractionPrompt
vi.mock('@ui/InteractionPrompt.ts', () => {
  return {
    InteractionPrompt: class {
      show = vi.fn();
      hide = vi.fn();
    }
  };
});

describe('InteractionManager', () => {
  let input: InputManager;
  let player: any;
  let scene: any;

  beforeEach(() => {
    input = new InputManager();
    player = {
      x: 100,
      y: 100,
      getFacingDirection: vi.fn().mockReturnValue('RIGHT')
    };
    scene = {};
  });

  it('detects closest entity in range and facing', () => {
    const manager = new InteractionManager(scene, player, input);
    const entity = {
      id: '1',
      x: 120, // 20 px right
      y: 100,
      interactionRadius: 32,
      canInteract: vi.fn().mockReturnValue(true),
      onInteract: vi.fn()
    };
    
    manager.registerEntity(entity);
    manager.update();

    // The prompt should be shown
    expect((manager as any).prompt.show).toHaveBeenCalledWith(120, 100);
  });

  it('ignores entity if not facing', () => {
    const manager = new InteractionManager(scene, player, input);
    
    const entity = {
      id: '1',
      x: 120, 
      y: 100,
      interactionRadius: 32,
      canInteract: vi.fn().mockReturnValue(true),
      onInteract: vi.fn()
    };
    
    manager.registerEntity(entity);
    manager.update();
    expect((manager as any).prompt.show).toHaveBeenCalled();

    // Now turn away
    player.getFacingDirection.mockReturnValue('LEFT'); // Facing away
    manager.update();

    expect((manager as any).prompt.hide).toHaveBeenCalled();
  });

  it('triggers onInteract when CONFIRM is pressed and consumes input', () => {
    const manager = new InteractionManager(scene, player, input);
    const entity = {
      id: '1',
      x: 120,
      y: 100,
      interactionRadius: 32,
      canInteract: vi.fn().mockReturnValue(true),
      onInteract: vi.fn()
    };
    
    manager.registerEntity(entity);
    
    // Simulate CONFIRM pressed
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a) => a === 'CONFIRM');
    const consumeSpy = vi.spyOn(input, 'consumeAction');

    manager.update();

    expect(entity.onInteract).toHaveBeenCalled();
    expect(consumeSpy).toHaveBeenCalledWith('CONFIRM');
  });
});
