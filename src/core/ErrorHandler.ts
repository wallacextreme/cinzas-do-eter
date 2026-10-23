/**
 * ErrorHandler — Global Error Tracking
 *
 * Catches unhandled exceptions and promise rejections.
 * Provides a unified way to report errors.
 * For FASE 1, this simply logs them safely. Future phases
 * may show a visual "Crash Screen" via DOM overlays.
 */

export type ErrorReport = {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
};

type ErrorListener = (report: ErrorReport) => void;

export class ErrorHandler {
  private static instance: ErrorHandler;
  private listeners: ErrorListener[] = [];
  private isInitialized = false;
  
  // Keep track of recent errors to avoid spam loops
  private recentErrors: string[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Binds global error listeners to the window.
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError({
        message: typeof message === 'string' ? message : 'Unknown Error',
        source,
        lineno,
        colno,
        error: error instanceof Error ? error : undefined,
      });
      return false; // Let default browser handler run too
    };

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: `Unhandled Rejection: ${event.reason}`,
        error: event.reason instanceof Error ? event.reason : undefined,
      });
    });

    console.log('[ErrorHandler] Initialized.');
  }

  /**
   * Manually report an error from a try/catch block.
   */
  report(error: Error | string, context?: string): void {
    if (typeof error === 'string') {
      this.handleError({ message: `${context ? `[${context}] ` : ''}${error}` });
    } else {
      this.handleError({
        message: `${context ? `[${context}] ` : ''}${error.message}`,
        error,
      });
    }
  }

  /**
   * Subscribe to error events (e.g. for telemetry or UI overlays).
   */
  onError(listener: ErrorListener): void {
    this.listeners.push(listener);
  }

  /**
   * Internal processing of errors.
   */
  private handleError(report: ErrorReport): void {
    const errorKey = report.message;
    
    // Prevent spam
    if (this.recentErrors.includes(errorKey)) {
      return; 
    }
    
    this.recentErrors.push(errorKey);
    if (this.recentErrors.length > 5) {
      this.recentErrors.shift();
    }

    console.error('[ErrorHandler] Caught:', report.message, report.error || '');

    for (const listener of this.listeners) {
      try {
        listener(report);
      } catch (e) {
        console.error('[ErrorHandler] Listener crashed', e);
      }
    }
  }

  /**
   * Reset state for testing purposes.
   */
  reset(): void {
    this.listeners = [];
    this.recentErrors = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();
