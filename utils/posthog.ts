function loadPosthogScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-posthog]')) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.dataset.posthog = 'true';
    s.async = true;
    s.src = 'https://app.posthog.com/static/array.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('PostHog script failed to load'));
    document.head.appendChild(s);
  });
}

export async function initPosthog(): Promise<void> {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || typeof window === 'undefined') return;

  try {
    await loadPosthogScript();
    const w = window as Window & {
      posthog?: { init: (k: string, o: { api_host: string }) => void };
    };
    w.posthog?.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    });
  } catch (e) {
    console.warn('PostHog init skipped:', e);
  }
}
