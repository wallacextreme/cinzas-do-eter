/**
 * InputManager — Decoupled Input System
 *
 * Maps physical keys to logical game actions.
 * The logic layer is pure TypeScript (testable without Phaser).
 * Integration with Phaser keyboard events happens via `bindToScene()`.
 *
 * Default bindings:
 *   Movement: WASD + Arrow keys
 *   Confirm:  Z / Enter
 *   Cancel:   X / Escape
 *   Menu:     Escape / M
 *
 * CONTRACTS.md: New events added — input:actionDown, input:actionUp
 */

// ─── Logical Actions ────────────────────────────────────────

export type InputAction =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'CONFIRM'
  | 'CANCEL'
  | 'MENU'
  | 'INVENTORY';

// ─── Key Bindings ───────────────────────────────────────────

/** Map of action → key codes (KeyboardEvent.code values) */
export type KeyBindings = Record<InputAction, readonly string[]>;

export const DEFAULT_BINDINGS: KeyBindings = {
  MOVE_UP: ['KeyW', 'ArrowUp', 'w', 'W', 'Up'],
  MOVE_DOWN: ['KeyS', 'ArrowDown', 's', 'S', 'Down'],
  MOVE_LEFT: ['KeyA', 'ArrowLeft', 'a', 'A', 'Left'],
  MOVE_RIGHT: ['KeyD', 'ArrowRight', 'd', 'D', 'Right'],
  CONFIRM: ['KeyZ', 'Enter', 'z', 'Z', 'Space'],
  CANCEL: ['KeyX', 'Escape', 'x', 'X'],
  MENU: ['Escape', 'KeyM', 'm', 'M'],
  INVENTORY: ['KeyI', 'i', 'I'],
} as const;

// ─── Input State ────────────────────────────────────────────

interface ActionState {
  down: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

function createActionState(): ActionState {
  return { down: false, justPressed: false, justReleased: false };
}

// ─── InputManager ───────────────────────────────────────────

export class InputManager {
  private bindings: KeyBindings;

  /** Raw key state: code → pressed */
  private keysDown = new Set<string>();
  private keysJustDown = new Set<string>();
  private keysJustUp = new Set<string>();

  /** Cached action states (rebuilt each frame) */
  private actionStates = new Map<InputAction, ActionState>();

  /** Whether input is enabled (disabled during cutscenes, menus, etc.) */
  private enabled = true;

  constructor(bindings?: KeyBindings) {
    this.bindings = bindings ?? { ...DEFAULT_BINDINGS };
    this.initActionStates();
  }

  // ─── Public API ─────────────────────────────────────────

  /** Call once per frame BEFORE reading actions, to snapshot just-pressed state */
  update(): void {
    for (const [action, keys] of Object.entries(this.bindings) as [InputAction, readonly string[]][]) {
      const state = this.actionStates.get(action)!;
      const wasDown = state.down;
      const isCurrentlyDown = keys.some((k) => this.keysDown.has(k));
      const wasJustDown = keys.some((k) => this.keysJustDown.has(k));
      const wasJustUp = keys.some((k) => this.keysJustUp.has(k));

      state.down = this.enabled && (isCurrentlyDown || wasJustDown);
      state.justPressed = this.enabled && (wasJustDown || (state.down && !wasDown));
      state.justReleased = this.enabled && (wasJustUp || (!state.down && wasDown));
    }
    // Clear per-frame sets after processing
    this.keysJustDown.clear();
    this.keysJustUp.clear();
  }

  /** Is the action currently held down? */
  isActionDown(action: InputAction): boolean {
    return this.actionStates.get(action)?.down ?? false;
  }

  /** Was the action pressed this frame? */
  isActionJustPressed(action: InputAction): boolean {
    return this.actionStates.get(action)?.justPressed ?? false;
  }

  /** Was the action released this frame? */
  isActionJustReleased(action: InputAction): boolean {
    return this.actionStates.get(action)?.justReleased ?? false;
  }

  /** Consumes an action for the current frame so other systems don't trigger it */
  consumeAction(action: InputAction): void {
    const state = this.actionStates.get(action);
    if (state) {
      state.justPressed = false;
    }
  }

  /** Enable or disable all input */
  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) {
      // Clear all states when disabling
      for (const state of this.actionStates.values()) {
        state.down = false;
        state.justPressed = false;
        state.justReleased = false;
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Rebind an action to new keys */
  rebind(action: InputAction, keys: readonly string[]): void {
    this.bindings[action] = keys;
  }

  /** Get current bindings (read-only copy) */
  getBindings(): Readonly<KeyBindings> {
    return { ...this.bindings };
  }

  // ─── Key Event Handlers (called by Phaser or tests) ───

  /** Notify that a key was pressed */
  handleKeyDown(code: string): void {
    if (!this.keysDown.has(code)) {
      this.keysJustDown.add(code);
    }
    this.keysDown.add(code);
  }

  /** Notify that a key was released */
  handleKeyUp(code: string): void {
    this.keysDown.delete(code);
    this.keysJustUp.add(code);
  }

  // ─── Phaser Integration ───────────────────────────────

  /** Bind keyboard events from a Phaser scene */
  bindToScene(scene: { input: { keyboard: { on: (event: string, callback: (evt: KeyboardEvent) => void) => void } | null } }): void {
    const kb = scene.input.keyboard;
    if (kb) {
      kb.on('keydown', (evt: KeyboardEvent) => {
        if (evt.code) this.handleKeyDown(evt.code);
        if (evt.key) this.handleKeyDown(evt.key);
      });
      kb.on('keyup', (evt: KeyboardEvent) => {
        if (evt.code) this.handleKeyUp(evt.code);
        if (evt.key) this.handleKeyUp(evt.key);
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (evt: KeyboardEvent) => {
        if (evt.code) this.handleKeyDown(evt.code);
        if (evt.key) this.handleKeyDown(evt.key);
      });
      window.addEventListener('keyup', (evt: KeyboardEvent) => {
        if (evt.code) this.handleKeyUp(evt.code);
        if (evt.key) this.handleKeyUp(evt.key);
      });
    }
  }

  // ─── Internals ────────────────────────────────────────

  private initActionStates(): void {
    const actions: InputAction[] = [
      'MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT',
      'CONFIRM', 'CANCEL', 'MENU', 'INVENTORY',
    ];
    for (const a of actions) {
      this.actionStates.set(a, createActionState());
    }
  }
}
