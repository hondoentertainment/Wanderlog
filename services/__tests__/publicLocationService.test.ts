import { describe, it, expect } from 'vitest';
import { shouldPublishToDiscoveryFeed } from '../publicLocationService';
import { LocationType, type TravelLocation, type UserProfile } from '../../types';

const baseLocation: TravelLocation = {
  id: 'loc-1',
  name: 'Paris',
  type: LocationType.COUNTRY,
  rating: 5,
  likes: [],
  dislikes: [],
  dateVisited: '2024-01-01',
  isVisited: true,
  photoUrls: ['https://example.com/photo.jpg'],
};

describe('shouldPublishToDiscoveryFeed', () => {
  it('returns false when user opted out', () => {
    const profile: UserProfile = {
      name: 'Traveler',
      bio: '',
      travelStyle: [],
      bucketList: [],
      publishToDiscoveryFeed: false,
    };
    expect(shouldPublishToDiscoveryFeed(baseLocation, profile)).toBe(false);
  });

  it('returns false without photos', () => {
    expect(shouldPublishToDiscoveryFeed({ ...baseLocation, photoUrls: [] })).toBe(false);
  });

  it('returns true for photo logs when opted in', () => {
    expect(shouldPublishToDiscoveryFeed(baseLocation)).toBe(true);
  });
});

describe('unpublishAllForUser', () => {
  it('is exported for account deletion and privacy opt-out', async () => {
    const mod = await import('../publicLocationService');
    expect(typeof mod.unpublishAllForUser).toBe('function');
  });
});
