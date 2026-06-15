import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export type SocialActivityType =
  | 'friend_request'
  | 'friend_accepted'
  | 'trip_logged'
  | 'squad_joined';

export interface SocialActivity {
  id: string;
  actorId: string;
  actorName: string;
  type: SocialActivityType;
  summary: string;
  relatedUserId?: string;
  relatedUserName?: string;
  createdAt: string;
}

const COLLECTION = 'socialActivities';

export async function recordSocialActivity(
  activity: Omit<SocialActivity, 'id' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...activity,
    createdAt: new Date().toISOString(),
  });
}

/** Recent activities from a set of friend user IDs (max 30 per Firestore `in` query). */
export async function fetchFriendActivities(
  friendIds: string[],
  maxResults = 20,
): Promise<SocialActivity[]> {
  const unique = [...new Set(friendIds)].filter(Boolean);
  if (unique.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 30) {
    chunks.push(unique.slice(i, i + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((ids) =>
      getDocs(
        query(
          collection(db, COLLECTION),
          where('actorId', 'in', ids),
          orderBy('createdAt', 'desc'),
          limit(maxResults),
        ),
      ),
    ),
  );

  const merged = snapshots.flatMap((snap) =>
    snap.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SocialActivity,
    ),
  );

  return merged
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxResults);
}
