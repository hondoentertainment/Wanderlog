import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { TravelLocation, UserProfile, StorageData, SavedRecommendation, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: [],
  customTravelStyles: []
};

import { offlineQueue } from './offlineQueue';

// --- Storage Logic ---

export const saveToCloud = async (userId: string, data: StorageData, bypassQueue = false): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving to cloud:", error);
    if (!bypassQueue) {
      console.log("Network error detected. Enqueuing save operation...");
      await offlineQueue.enqueue(userId, data);
    } else {
      throw error;
    }
  }
};

export const loadAppData = async (userId?: string): Promise<StorageData> => {
  if (!userId) {
    return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as StorageData;
      return {
        locations: data.locations || [],
        profile: data.profile || DEFAULT_PROFILE,
        savedRecommendations: data.savedRecommendations || [],
        squadTrips: data.squadTrips || []
      };
    }
    return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
  } catch (error) {
    console.error("Error loading from cloud:", error);
    return { locations: [], profile: DEFAULT_PROFILE, savedRecommendations: [], squadTrips: [] };
  }
};

export const saveAppData = saveToCloud;

export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      locations: [],
      profile: DEFAULT_PROFILE,
      savedRecommendations: [],
      squadTrips: []
    });
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};

export const uploadPhoto = async (userId: string, file: File): Promise<string> => {
  const fileId = crypto.randomUUID();
  const storageRef = ref(storage, `users/${userId}/photos/${fileId}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const deletePhoto = async (photoUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, photoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
};
