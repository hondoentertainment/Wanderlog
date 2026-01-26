
import { TravelLocation, UserProfile, StorageData, SavedRecommendation, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: [],
  customTravelStyles: []
};

export const saveAppData = (
  locations: TravelLocation[], 
  profile: UserProfile, 
  savedRecommendations: SavedRecommendation[],
  squadTrips: SquadTrip[]
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations, profile, savedRecommendations, squadTrips }));
};

export const loadAppData = (): StorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
  try {
    const parsed = JSON.parse(data);
    return {
      locations: parsed.locations || [],
      profile: parsed.profile || DEFAULT_PROFILE,
      savedRecommendations: parsed.savedRecommendations || [],
      squadTrips: parsed.squadTrips || []
    };
  } catch (e) {
    console.error("Failed to parse storage data", e);
    return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
  }
};
