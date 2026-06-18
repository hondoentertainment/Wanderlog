
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { installGlobalErrorHandlers } from './utils/reportError';
import { initPosthog } from './utils/posthog';

void initPosthog();
installGlobalErrorHandlers();

const release =
  import.meta.env.VITE_APP_RELEASE && import.meta.env.VITE_APP_RELEASE.length > 0
    ? `wanderlog@${import.meta.env.VITE_APP_RELEASE}`
    : undefined;

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    release,
    environment: import.meta.env.MODE === 'production' ? 'production' : import.meta.env.MODE,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
