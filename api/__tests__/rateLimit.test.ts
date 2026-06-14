import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, clientRateLimitKey } from '../../api/lib/rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
  });

  it('blocks when the limit is exceeded', () => {
    const key = 'blocked-key';
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('resets after the window expires', () => {
    const key = 'window-key';
    checkRateLimit(key, 1, 1000);
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(true);
  });
});

describe('clientRateLimitKey', () => {
  it('prefers x-forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(clientRateLimitKey(req)).toBe('1.2.3.4');
  });

  it('falls back to anonymous', () => {
    expect(clientRateLimitKey(new Request('https://example.com'))).toBe('anonymous');
  });
});
