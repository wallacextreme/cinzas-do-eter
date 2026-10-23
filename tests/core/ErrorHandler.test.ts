/**
 * ErrorHandler — Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorHandler, errorHandler } from '@core/ErrorHandler.ts';

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.reset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a singleton', () => {
    const inst1 = ErrorHandler.getInstance();
    const inst2 = ErrorHandler.getInstance();
    expect(inst1).toBe(inst2);
    expect(inst1).toBe(errorHandler);
  });

  it('reports errors manually', () => {
    const spy = vi.fn();
    errorHandler.onError(spy);

    errorHandler.report(new Error('Test error'));
    
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].message).toBe('Test error');
    expect(console.error).toHaveBeenCalled();
  });

  it('reports string errors with context', () => {
    const spy = vi.fn();
    errorHandler.onError(spy);

    errorHandler.report('Something broke', 'SystemX');
    
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].message).toBe('[SystemX] Something broke');
  });

  it('prevents error spam loops', () => {
    const spy = vi.fn();
    errorHandler.onError(spy);

    // Report same error 10 times
    for (let i = 0; i < 10; i++) {
      errorHandler.report('Spam error');
    }

    // Should only notify listeners once
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('handles crashing listeners safely', () => {
    const badSpy = vi.fn(() => { throw new Error('Listener crash'); });
    const goodSpy = vi.fn();
    
    errorHandler.onError(badSpy);
    errorHandler.onError(goodSpy);

    errorHandler.report('Main error');

    // Both should be called. The bad one shouldn't prevent the good one from running.
    expect(badSpy).toHaveBeenCalledTimes(1);
    expect(goodSpy).toHaveBeenCalledTimes(1);
  });
});
