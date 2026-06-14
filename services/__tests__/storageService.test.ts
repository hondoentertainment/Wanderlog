import { describe, it, expect } from 'vitest';
import { loadAppData, DEFAULT_PROFILE } from '../storageService';

describe('storageService', () => {
    it('loadAppData returns empty defaults when userId is omitted', async () => {
        const data = await loadAppData(undefined);
        expect(data.locations).toEqual([]);
        expect(data.profile).toEqual(DEFAULT_PROFILE);
        expect(data.savedRecommendations).toEqual([]);
        expect(data.squadTrips).toEqual([]);
    });
});
