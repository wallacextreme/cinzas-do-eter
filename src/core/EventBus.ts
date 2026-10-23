/**
 * EventBus — Central event system
 *
 * Decouples systems by allowing publish/subscribe communication.
 * All inter-system communication should go through EventBus
 * unless there is a strong reason for direct coupling.
 *
 * Contract: Event names must be documented in CONTRACTS.md
 */

export type EventCallback = (...args: any[]) => void;

interface EventSubscription {
  callback: EventCallback;
  context?: unknown;
  once: boolean;
}

export class EventBus {
  private listeners = new Map<string, EventSubscription[]>();

  /**
   * Subscribe to an event.
   */
  on(event: string, callback: EventCallback, context?: unknown): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ callback, context, once: false });
    return this;
  }

  /**
   * Subscribe to an event, automatically unsubscribing after first trigger.
   */
  once(event: string, callback: EventCallback, context?: unknown): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ callback, context, once: true });
    return this;
  }

  /**
   * Unsubscribe from an event.
   */
  off(event: string, callback: EventCallback, context?: unknown): this {
    const subs = this.listeners.get(event);
    if (subs) {
      this.listeners.set(
        event,
        subs.filter((s) => {
          if (s.callback !== callback) return true;
          if (context !== undefined && s.context !== context) return true;
          return false;
        })
      );
    }
    return this;
  }

  /**
   * Emit an event with optional arguments.
   */
  emit(event: string, ...args: unknown[]): this {
    const subs = this.listeners.get(event);
    if (!subs) return this;

    const remaining: EventSubscription[] = [];
    for (const sub of subs) {
      sub.callback.apply(sub.context, args);
      if (!sub.once) {
        remaining.push(sub);
      }
    }
    this.listeners.set(event, remaining);
    return this;
  }

  /**
   * Remove all listeners for an event, or all events if none specified.
   */
  removeAll(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}

/** Singleton global event bus for inter-system communication */
export const globalEventBus = new EventBus();
