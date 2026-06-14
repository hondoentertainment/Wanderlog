import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportError, installGlobalErrorHandlers } from '../reportError';

describe('reportError', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('normalizes non-Error values and logs with context', () => {
        reportError('oops', { source: 'test' });
        expect(console.error).toHaveBeenCalled();
        const args = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(args[0]).toBe('[reportError]');
        expect(args[1]).toBeInstanceOf(Error);
        expect((args[1] as Error).message).toBe('oops');
        expect(args[2]).toEqual({ source: 'test' });
    });

    it('uses installGlobalErrorHandlers without throwing', () => {
        expect(() => installGlobalErrorHandlers()).not.toThrow();
    });
});
