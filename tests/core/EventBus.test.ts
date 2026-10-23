/**
 * EventBus — Unit Tests
 *
 * Tests the core event system that all inter-system
 * communication depends on.
 */

import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@core/EventBus.ts';

describe('EventBus', () => {
  it('should call listener when event is emitted', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', 'hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('test', fn1);
    bus.on('test', fn2);
    bus.emit('test');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should remove listener with off()', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.off('test', fn);
    bus.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should fire once() listener only once', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.once('test', fn);
    bus.emit('test');
    bus.emit('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass multiple arguments', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', 1, 'two', true);
    expect(fn).toHaveBeenCalledWith(1, 'two', true);
  });

  it('should removeAll listeners for a specific event', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('a', fn1);
    bus.on('b', fn2);
    bus.removeAll('a');
    bus.emit('a');
    bus.emit('b');
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should removeAll listeners for all events', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('a', fn1);
    bus.on('b', fn2);
    bus.removeAll();
    bus.emit('a');
    bus.emit('b');
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it('should return correct listenerCount', () => {
    const bus = new EventBus();
    expect(bus.listenerCount('test')).toBe(0);
    bus.on('test', () => {});
    bus.on('test', () => {});
    expect(bus.listenerCount('test')).toBe(2);
  });

  it('should not throw when emitting event with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });
});
