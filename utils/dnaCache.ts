import { TravelDNA } from '../types';

const DNA_CACHE_KEY = 'wanderlog_dna_cache';
const DNA_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedDNA {
    dna: TravelDNA;
    timestamp: number;
}

export const getCachedTravelDNA = (): TravelDNA | null => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(DNA_CACHE_KEY);
    if (!cached) return null;

    try {
        const data: CachedDNA = JSON.parse(cached);
        if (Date.now() - data.timestamp < DNA_CACHE_DURATION_MS) {
            return data.dna;
        }
    } catch (e) {
        console.error('Failed to parse cached DNA', e);
    }

    localStorage.removeItem(DNA_CACHE_KEY);
    return null;
};

export const setCachedTravelDNA = (dna: TravelDNA): void => {
    if (typeof window === 'undefined') return;
    const data: CachedDNA = {
        dna,
        timestamp: Date.now(),
    };
    localStorage.setItem(DNA_CACHE_KEY, JSON.stringify(data));
};
