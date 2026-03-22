import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { TravelLocation, UserProfile, StorageData, SavedRecommendation, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';
import { DEFAULT_PROFILE, normalizeParsedStorage, type StorageDataShape } from './storageNormalize';

export { DEFAULT_PROFILE } from './storageNormalize';

/** Warn when user metadata (without locations) approaches Firestore’s ~1 MiB doc limit */
export const META_DOC_WARNING_BYTES = 750_000;

export function estimateMetaPayloadBytes(meta: Omit<StorageData, 'locations'>): number {
  return new Blob([
    JSON.stringify({
      profile: meta.profile,
      savedRecommendations: meta.savedRecommendations,
      squadTrips: meta.squadTrips,
    }),
  ]).size;
}

function storageDataFromParts(parts: StorageDataShape): StorageData {
  return {
    locations: parts.locations,
    profile: parts.profile || DEFAULT_PROFILE,
    savedRecommendations: parts.savedRecommendations || [],
    squadTrips: parts.squadTrips || [],
  };
}

async function migrateLegacyLocationsToSubcollection(userId: string, locations: TravelLocation[]): Promise<void> {
  let batch = writeBatch(db);
  let n = 0;
  for (const loc of locations) {
    batch.set(doc(db, 'users', userId, 'locations', loc.id), loc);
    n++;
    if (n >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
}

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
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return storageDataFromParts(normalizeParsedStorage(null));
  try {
    return storageDataFromParts(normalizeParsedStorage(JSON.parse(raw)));
  } catch (e) {
    console.error('Failed to parse storage data', e);
    return storageDataFromParts(normalizeParsedStorage(null));
  }
};

// --- Cloud Storage (Firestore): metadata on user doc, locations in subcollection ---

export const saveToCloud = async (userId: string, data: StorageData): Promise<void> => {
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
    await setDoc(
      userRef,
      {
        profile: data.profile,
        savedRecommendations: data.savedRecommendations,
        squadTrips: data.squadTrips,
        _schemaV2: true,
        locations: deleteField(),
      },
      { merge: true }
    );

    const locCol = collection(db, 'users', userId, 'locations');
    const existing = await getDocs(locCol);
    const currentIds = new Set(data.locations.map((l) => l.id));
    for (const d of existing.docs) {
      if (!currentIds.has(d.id)) {
        await deleteDoc(d.ref);
      }
    }

    let batch = writeBatch(db);
    let count = 0;
    for (const loc of data.locations) {
      batch.set(doc(db, 'users', userId, 'locations', loc.id), loc);
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();

    saveLocalData(data.locations, data.profile, data.savedRecommendations, data.squadTrips);
  } catch (error) {
    console.error('Error saving to cloud:', error);
    saveLocalData(data.locations, data.profile, data.savedRecommendations, data.squadTrips);
  }
};

export const loadAppData = async (userId?: string): Promise<StorageData> => {
  if (!userId) {
    return loadLocalData();
  }

  try {
    const userRef = doc(db, 'users', userId);
    const locCol = collection(db, 'users', userId, 'locations');
    const [userSnap, locSnap] = await Promise.all([getDoc(userRef), getDocs(locCol)]);

    if (!userSnap.exists()) {
      const localData = loadLocalData();
      if (localData.locations.length > 0 || localData.profile.name !== 'Traveler') {
        console.log('Migrating local data to cloud...');
        await saveToCloud(userId, localData);
        return localData;
      }
      return storageDataFromParts(normalizeParsedStorage(null));
    }

    const userData = userSnap.data() as Record<string, unknown>;
    let locations: TravelLocation[] = [];
    if (!locSnap.empty) {
      locations = locSnap.docs.map((d) => d.data() as TravelLocation);
    } else {
      const legacy = userData.locations;
      locations = Array.isArray(legacy) ? (legacy as TravelLocation[]) : [];
      if (locations.length > 0) {
        await migrateLegacyLocationsToSubcollection(userId, locations);
        await setDoc(userRef, { locations: deleteField(), _schemaV2: true }, { merge: true });
      }
    }

    const merged = storageDataFromParts({
      locations,
      profile: (userData.profile as UserProfile) || DEFAULT_PROFILE,
      savedRecommendations: Array.isArray(userData.savedRecommendations)
        ? (userData.savedRecommendations as SavedRecommendation[])
        : [],
      squadTrips: Array.isArray(userData.squadTrips) ? (userData.squadTrips as SquadTrip[]) : [],
    });
    return merged;
  } catch (error) {
    console.error('Error loading from cloud:', error);
    return loadLocalData();
  }
};

export async function deleteUserCloudData(userId: string): Promise<void> {
  const locCol = collection(db, 'users', userId, 'locations');
  const snap = await getDocs(locCol);
  let batch = writeBatch(db);
  let n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    n++;
    if (n >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  await deleteDoc(doc(db, 'users', userId));
}

export const saveAppData = saveLocalData;
