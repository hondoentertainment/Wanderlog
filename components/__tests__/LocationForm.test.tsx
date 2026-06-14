import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationForm } from '../LocationForm';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: '123' } }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LocationForm', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should save draft to localStorage on input change', () => {
        render(<LocationForm onAdd={vi.fn()} />);

        const input = screen.getByPlaceholderText(/find a/i);
        fireEvent.change(input, { target: { value: 'Tokyo' } });

        const draft = localStorage.getItem('location_form_draft');
        expect(draft).toBeDefined();
        expect(JSON.parse(draft!).name).toBe('Tokyo');
    });

    it('should load draft from localStorage on mount', () => {
        localStorage.setItem('location_form_draft', JSON.stringify({
            name: 'Kyoto',
            type: 'city',
            rating: 5,
            likes: [],
            dislikes: [],
            companions: []
        }));

        render(<LocationForm onAdd={vi.fn()} />);

        const input = screen.getByPlaceholderText(/find a/i) as HTMLInputElement;
        expect(input.value).toBe('Kyoto');
    });
});
