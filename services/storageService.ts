import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { TravelLocation, UserProfile, StorageData, SavedRecommendation, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: [],
  customTravelStyles: []
};

// --- Local Storage (Legacy/Fallback) ---

export const saveLocalData = (
  locations: TravelLocation[],
  profile: UserProfile,
  savedRecommendations: SavedRecommendation[],
  squadTrips: SquadTrip[]
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations, profile, savedRecommendations, squadTrips }));
};

export const loadLocalData = (): StorageData => {
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

// --- Cloud Storage (Firestore) ---

export const saveToCloud = async (userId: string, data: StorageData): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
    // Also update local cache for offline support/faster load next time? 
    // Actually, keeping local storage in sync is good as backup, but Firestore has its own cache.
    // For now, let's keep local storage as a mirror.
    saveLocalData(data.locations, data.profile, data.savedRecommendations, data.squadTrips);
  } catch (error) {
    console.error("Error saving to cloud:", error);
    // Fallback to local
    saveLocalData(data.locations, data.profile, data.savedRecommendations, data.squadTrips);
  }
};

export const loadAppData = async (userId?: string): Promise<StorageData> => {
  // If no user, load local
  if (!userId) {
    return loadLocalData();
  }

  try {
    // Try cloud first
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as StorageData;
      // Validate schema/defaults
      return {
        locations: data.locations || [],
        profile: data.profile || DEFAULT_PROFILE,
        savedRecommendations: data.savedRecommendations || [],
        squadTrips: data.squadTrips || []
      };
    } else {
      // User exists but no data in cloud -> Check local migration
      const localData = loadLocalData();
      if (localData.locations.length > 0 || localData.profile.name !== 'Traveler') {
        // We have local data! Migrate it.
        console.log("Migrating local data to cloud...");
        await saveToCloud(userId, localData);
        return localData;
      }
      return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
    }
  } catch (error) {
    console.error("Error loading from cloud:", error);
    return loadLocalData(); // Fallback to local on error
  }
};

// Backwards compatibility alias if needed, but we should update App.tsx to use saveToCloud
export const saveAppData = saveLocalData;
