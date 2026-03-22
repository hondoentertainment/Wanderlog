import { describe, expect, it } from 'vitest';
import { LocationType } from '../types';
import { DEFAULT_PROFILE, normalizeParsedStorage } from './storageNormalize';

describe('normalizeParsedStorage', () => {
  it('returns defaults for null', () => {
    const out = normalizeParsedStorage(null);
    expect(out.locations).toEqual([]);
    expect(out.savedRecommendations).toEqual([]);
    expect(out.squadTrips).toEqual([]);
    expect(out.profile.name).toBe(DEFAULT_PROFILE.name);
  });

  it('merges partial objects', () => {
    const out = normalizeParsedStorage({
      locations: [
        {
          id: '1',
          name: 'A',
          type: LocationType.COUNTRY,
          rating: 5,
          likes: [],
          dislikes: [],
          dateVisited: '2024-01-01',
        },
      ],
      profile: { name: 'K', bio: '', travelStyle: ['X'], bucketList: ['Y'] },
    });
    expect(out.locations).toHaveLength(1);
    expect(out.profile.name).toBe('K');
    expect(out.profile.bucketList).toEqual(['Y']);
  });
});
