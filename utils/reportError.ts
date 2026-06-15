/**
 * Central client-side error reporting. Extend with PostHog/Sentry/etc. in one place.
 */
export type ErrorContext = Record<string, string | number | boolean | undefined>;

export function reportError(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (import.meta.env.DEV) {
    console.error('[reportError]', err, context);
  } else {
    console.error('[reportError]', err.message, context);
  }

  try {
    const posthog = (window as unknown as { posthog?: { captureException?: (e: Error, props?: ErrorContext) => void } })
      .posthog;
    posthog?.captureException?.(err, context);
  } catch {
    /* no-op */
  }
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, { source: 'window.error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection' });
  });
}
