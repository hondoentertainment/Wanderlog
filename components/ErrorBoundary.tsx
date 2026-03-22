import * as Sentry from '@sentry/react';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN.length > 0) {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[#14181c] text-[#9ab]">
          <p className="text-sm font-black uppercase tracking-widest text-[#ff8000]">Something went wrong</p>
          <p className="text-center text-sm max-w-md">Refresh the page to continue. If this keeps happening, try signing out and back in.</p>
          <button
            type="button"
            className="px-4 py-2 rounded-sm bg-[#2c3440] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#456] transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return (this as React.Component<Props, State>).props.children;
  }
}
