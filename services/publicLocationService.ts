import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { TravelLocation, UserProfile } from '../types';

/** Publish visited logs with photos when user has opted in. */
export function shouldPublishToDiscoveryFeed(
  location: TravelLocation,
  profile?: UserProfile,
): boolean {
  if (profile?.publishToDiscoveryFeed === false) return false;
  return Boolean(location.photoUrls?.length) && location.isVisited !== false;
}

export async function publishLocation(
  userId: string,
  location: TravelLocation,
  profile?: UserProfile,
): Promise<void> {
  if (!shouldPublishToDiscoveryFeed(location, profile)) return;

  await setDoc(
    doc(db, 'public_locations', location.id),
    {
      ownerId: userId,
      name: location.name,
      type: location.type,
      rating: location.rating,
      likes: location.likes ?? [],
      dislikes: [],
      dateVisited: location.dateVisited,
      photoUrls: location.photoUrls,
      isVisited: true,
      publishedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function unpublishLocation(locationId: string, _userId: string): Promise<void> {
  await deleteDoc(doc(db, 'public_locations', locationId)).catch(() => undefined);
}

/** Remove all discovery feed entries owned by this user (opt-out or account deletion). */
export async function unpublishAllForUser(userId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'public_locations'), where('ownerId', '==', userId)),
  );
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
