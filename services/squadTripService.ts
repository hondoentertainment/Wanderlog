import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { SquadTrip } from '../types';
import { deleteSquadJoinCode, registerSquadJoinCode, resolveTripIdFromJoinCode } from './squadJoinLookup';

async function deleteChatMessages(tripId: string): Promise<void> {
  const chats = await getDocs(collection(db, 'squadTrips', tripId, 'chat'));
  await Promise.all(chats.docs.map((d) => deleteDoc(d.ref)));
}

function docToTrip(id: string, data: Record<string, unknown>): SquadTrip {
  const { ownerId: _o, updatedAt: _u, ...rest } = data;
  return { id, ...rest } as SquadTrip;
}

export function mergeSquadTrips(embedded: SquadTrip[], cloud: SquadTrip[]): SquadTrip[] {
  const map = new Map<string, SquadTrip>();
  for (const t of cloud) map.set(t.id, t);
  for (const t of embedded) map.set(t.id, t);
  return [...map.values()];
}

export const squadTripService = {
  async getSquadTrip(tripId: string): Promise<SquadTrip | null> {
    const snap = await getDoc(doc(db, 'squadTrips', tripId));
    if (!snap.exists()) return null;
    return docToTrip(snap.id, snap.data());
  },

  async syncSquadTrip(userId: string, trip: SquadTrip): Promise<void> {
    const ref = doc(db, 'squadTrips', trip.id);
    const existing = await getDoc(ref);
    const ownerId = existing.exists()
      ? (existing.data().ownerId as string)
      : userId;

    const memberIds = [...new Set([ownerId, userId, ...(trip.memberIds ?? [])])];

    await setDoc(
      ref,
      {
        ...trip,
        ownerId,
        memberIds,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    if (trip.joinCode) {
      await registerSquadJoinCode(trip.id, trip.joinCode, ownerId);
    }
  },

  async joinSquadTrip(tripId: string, userId: string): Promise<SquadTrip | null> {
    const ref = doc(db, 'squadTrips', tripId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    const ownerId = data.ownerId as string;
    const memberIds: string[] = data.memberIds ?? [ownerId].filter(Boolean);
    if (!memberIds.includes(userId)) {
      await setDoc(ref, { memberIds: [...memberIds, userId] }, { merge: true });
    }

    const updated = await getDoc(ref);
    return updated.exists() ? docToTrip(updated.id, updated.data()) : null;
  },

  async fetchCloudSquadTrips(userId: string): Promise<SquadTrip[]> {
    const [ownedSnap, memberSnap] = await Promise.all([
      getDocs(query(collection(db, 'squadTrips'), where('ownerId', '==', userId))),
      getDocs(query(collection(db, 'squadTrips'), where('memberIds', 'array-contains', userId))),
    ]);

    const map = new Map<string, SquadTrip>();
    for (const d of [...ownedSnap.docs, ...memberSnap.docs]) {
      map.set(d.id, docToTrip(d.id, d.data()));
    }
    return [...map.values()];
  },

  async deleteSquadTrip(tripId: string, userId: string): Promise<void> {
    const tripRef = doc(db, 'squadTrips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.ownerId !== userId) {
        throw new Error('Unauthorized: Only the owner can delete this squad trip');
      }
    }

    const joinCode = snap.exists() ? (snap.data().joinCode as string | undefined) : undefined;

    await deleteChatMessages(tripId);
    await deleteDoc(tripRef).catch(() => undefined);
    if (joinCode) await deleteSquadJoinCode(joinCode);
  },

  resolveTripIdFromJoinCode,
};
