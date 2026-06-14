import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { hashJoinCode } from '../utils/joinCodeHash';

const COLLECTION = 'squadJoinCodes';

export async function registerSquadJoinCode(
  tripId: string,
  joinCode: string,
  ownerId: string,
): Promise<void> {
  const code = joinCode.trim();
  if (!code) return;
  const lookupId = await hashJoinCode(code);
  await setDoc(
    doc(db, COLLECTION, lookupId),
    { tripId, ownerId, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function resolveTripIdFromJoinCode(joinCode: string): Promise<string | null> {
  const code = joinCode.trim();
  if (!code) return null;
  const lookupId = await hashJoinCode(code);
  const snap = await getDoc(doc(db, COLLECTION, lookupId));
  if (!snap.exists()) return null;
  return (snap.data().tripId as string) || null;
}

export async function deleteSquadJoinCode(joinCode: string): Promise<void> {
  const code = joinCode.trim();
  if (!code) return;
  const lookupId = await hashJoinCode(code);
  await deleteDoc(doc(db, COLLECTION, lookupId)).catch(() => undefined);
}
