
import { TravelLocation, UserProfile, StorageData, SavedRecommendation } from '../types';
import { STORAGE_KEY } from '../constants';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: []
};

export const saveAppData = (
  locations: TravelLocation[], 
  profile: UserProfile, 
  savedRecommendations: SavedRecommendation[]
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations, profile, savedRecommendations }));
};

export const loadAppData = (): StorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [] };
  try {
    const parsed = JSON.parse(data);
    return {
      locations: parsed.locations || [],
      profile: parsed.profile || DEFAULT_PROFILE,
      savedRecommendations: parsed.savedRecommendations || []
    };
  } catch (e) {
    console.error("Failed to parse storage data", e);
    return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [] };
  }
};
