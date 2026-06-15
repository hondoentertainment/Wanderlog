import { deleteDoc, doc, setDoc } from 'firebase/firestore';

import { db } from './firebaseConfig';

import type { UserProfile } from '../types';



const COLLECTION = 'userDirectory';



export function buildSearchKeywords(displayName: string): string[] {

  const normalized = displayName.trim().toLowerCase();

  if (!normalized) return [];



  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);

  const keywords = new Set<string>([normalized, ...words]);



  for (const word of words) {

    for (let i = 2; i <= Math.min(word.length, 12); i++) {

      keywords.add(word.slice(0, i));

    }

  }



  return [...keywords].slice(0, 30);

}



export async function syncUserDirectory(

  userId: string,

  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'searchName'>,

): Promise<void> {

  const displayName = profile.name?.trim() || 'Traveler';

  const searchName = (profile.searchName ?? displayName.toLowerCase()) || '';

  if (!searchName) return;



  await setDoc(

    doc(db, COLLECTION, userId),

    {

      displayName,

      avatarUrl: profile.avatarUrl ?? null,

      searchName,

      searchKeywords: buildSearchKeywords(displayName),

      updatedAt: new Date().toISOString(),

    },

    { merge: true },

  );

}



export async function deleteUserDirectoryEntry(userId: string): Promise<void> {

  await deleteDoc(doc(db, COLLECTION, userId)).catch(() => undefined);

}

