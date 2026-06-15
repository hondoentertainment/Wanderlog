import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

vi.mock('../../utils/reportError', () => ({
    reportError: vi.fn(),
}));

function ThrowingChild(): React.ReactElement {
    throw new Error('error-boundary-test');
}

describe('ErrorBoundary', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('shows fallback UI when a child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild />
            </ErrorBoundary>,
        );

        expect(screen.getByRole('heading', { name: /Something went wrong/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument();
    });
});
