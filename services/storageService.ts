import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { TravelLocation, UserProfile, StorageData, SavedRecommendation, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';
import { DEFAULT_PROFILE, normalizeParsedStorage, type StorageDataShape } from './storageNormalize';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  bio: 'Exploring the world one step at a time.',
  travelStyle: ['Adventure'],
  bucketList: [],
  customTravelStyles: []
};

import { offlineQueue } from './offlineQueue';
import { syncUserDirectory } from './userDirectory';

// --- Storage Logic ---

export const saveToCloud = async (userId: string, data: StorageData, bypassQueue = false): Promise<void> => {
  try {
    const meta: Omit<StorageData, 'locations'> = {
      profile: data.profile,
      savedRecommendations: data.savedRecommendations,
      squadTrips: data.squadTrips,
    };
    const metaBytes = estimateMetaPayloadBytes(meta);
    if (metaBytes > META_DOC_WARNING_BYTES) {
      console.warn('[Wanderlog] User metadata payload is very large', metaBytes);
    }

    const userRef = doc(db, 'users', userId);
    const payload: StorageData = {
      ...data,
      profile: {
        ...data.profile,
        searchName: data.profile.name?.trim().toLowerCase() ?? data.profile.searchName,
      },
    };
    await setDoc(userRef, payload, { merge: true });
    await syncUserDirectory(userId, payload.profile);
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
    const locCol = collection(db, 'users', userId, 'locations');
    const [userSnap, locSnap] = await Promise.all([getDoc(userRef), getDocs(locCol)]);

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

function refFromDownloadUrl(downloadUrl: string) {
  const marker = '/o/';
  const i = downloadUrl.indexOf(marker);
  if (i === -1) throw new Error('Invalid storage download URL');
  const after = downloadUrl.slice(i + marker.length);
  const pathPart = after.split('?')[0];
  const objectPath = decodeURIComponent(pathPart);
  return ref(storage, objectPath);
}

export const deletePhoto = async (photoUrl: string): Promise<void> => {
  try {
    await deleteObject(refFromDownloadUrl(photoUrl));
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
};

async function deleteStoragePrefix(dirRef: ReturnType<typeof ref>): Promise<void> {
  const list = await listAll(dirRef);
  await Promise.all(list.items.map((item) => deleteObject(item).catch(() => undefined)));
  await Promise.all(list.prefixes.map((p) => deleteStoragePrefix(p)));
}

export const deleteAllUserStorage = async (userId: string): Promise<void> => {
  try {
    await deleteStoragePrefix(ref(storage, `users/${userId}`));
  } catch {
    /* bucket path may not exist */
  }
};
