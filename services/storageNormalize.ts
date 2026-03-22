import type { SavedRecommendation, SquadTrip, TravelLocation, UserProfile } from '../types';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: [],
  customTravelStyles: [],
};

export interface StorageDataShape {
  locations: TravelLocation[];
  profile: UserProfile;
  savedRecommendations: SavedRecommendation[];
  squadTrips: SquadTrip[];
}

export const EMPTY_STORAGE: StorageDataShape = {
  locations: [],
  profile: DEFAULT_PROFILE,
  savedRecommendations: [],
  squadTrips: [],
};

export function normalizeParsedStorage(parsed: unknown): StorageDataShape {
  if (!parsed || typeof parsed !== 'object') {
    return { ...EMPTY_STORAGE, profile: { ...DEFAULT_PROFILE } };
  }
  const p = parsed as Record<string, unknown>;
  return {
    locations: Array.isArray(p.locations) ? (p.locations as TravelLocation[]) : [],
    profile: (p.profile as UserProfile) || { ...DEFAULT_PROFILE },
    savedRecommendations: Array.isArray(p.savedRecommendations)
      ? (p.savedRecommendations as SavedRecommendation[])
      : [],
    squadTrips: Array.isArray(p.squadTrips) ? (p.squadTrips as SquadTrip[]) : [],
  };
}
