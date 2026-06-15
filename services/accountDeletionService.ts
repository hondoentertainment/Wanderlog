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
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from 'firebase/auth';
import { auth, db, googleProvider } from './firebaseConfig';
import { shareService } from './shareService';
import { collaborativeListService } from './collaborativeBucketListService';
import { STORAGE_KEY } from '../constants';
import { deleteAllUserStorage } from './storageService';
import { deleteUserDirectoryEntry } from './userDirectory';
import { deleteSquadJoinCode } from './squadJoinLookup';
import { unpublishAllForUser } from './publicLocationService';
import type { SquadTrip, StorageData } from '../types';

const FRIEND_REQUESTS = 'friendRequests';

async function deleteCollectionDocs(...pathSegments: string[]): Promise<void> {
  const colRef = collection(db, ...(pathSegments as [string, ...string[]]));
  const snap = await getDocs(colRef);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

async function removeFriendEdges(userId: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', userId, 'friends'));
  const friendIds = snap.docs.map((d) => d.id);
  await Promise.all(
    friendIds.flatMap((friendId) => [
      deleteDoc(doc(db, 'users', userId, 'friends', friendId)),
      deleteDoc(doc(db, 'users', friendId, 'friends', userId)).catch(() => undefined),
    ]),
  );
}

async function deleteFriendRequestsForUser(userId: string): Promise<void> {
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(collection(db, FRIEND_REQUESTS), where('toUserId', '==', userId))),
    getDocs(query(collection(db, FRIEND_REQUESTS), where('fromUserId', '==', userId))),
  ]);
  await Promise.all(
    [...incoming.docs, ...outgoing.docs].map((d) => deleteDoc(d.ref)),
  );
}

async function deleteSquadTripChatsForIds(tripIds: string[]): Promise<void> {
  await Promise.all(
    tripIds.map(async (tripId) => {
      const chats = await getDocs(collection(db, 'squadTrips', tripId, 'chat'));
      await Promise.all(chats.docs.map((d) => deleteDoc(d.ref)));
    }),
  );
}

async function deleteOwnedSquadTrips(userId: string): Promise<string[]> {
  const ownedSnap = await getDocs(
    query(collection(db, 'squadTrips'), where('ownerId', '==', userId)),
  );
  const tripIds: string[] = [];

  for (const tripDoc of ownedSnap.docs) {
    const data = tripDoc.data();
    tripIds.push(tripDoc.id);
    const joinCode = data.joinCode as string | undefined;
    await deleteSquadTripChatsForIds([tripDoc.id]);
    await deleteDoc(tripDoc.ref).catch(() => undefined);
    if (joinCode) await deleteSquadJoinCode(joinCode);
  }

  return tripIds;
}

async function leaveJoinedSquadTrips(userId: string, ownedTripIds: Set<string>): Promise<void> {
  const memberSnap = await getDocs(
    query(collection(db, 'squadTrips'), where('memberIds', 'array-contains', userId)),
  );

  await Promise.all(
    memberSnap.docs
      .filter((d) => !ownedTripIds.has(d.id))
      .map(async (tripDoc) => {
        const memberIds = (tripDoc.data().memberIds as string[] | undefined) ?? [];
        const next = memberIds.filter((id) => id !== userId);
        if (next.length === 0) {
          await deleteDoc(tripDoc.ref).catch(() => undefined);
          return;
        }
        await setDoc(tripDoc.ref, { memberIds: next }, { merge: true });
      }),
  );
}

async function deleteSquadJoinCodeLookups(userId: string): Promise<void> {
  const ownedLookups = await getDocs(
    query(collection(db, 'squadJoinCodes'), where('ownerId', '==', userId)),
  );
  await Promise.all(ownedLookups.docs.map((d) => deleteDoc(d.ref)));
}

async function reauthenticateCurrentUser(u: User): Promise<void> {
  const providerId = u.providerData[0]?.providerId;

  if (providerId === 'google.com') {
    await reauthenticateWithPopup(u, googleProvider);
    return;
  }

  if (providerId === 'password') {
    const email = u.email;
    if (!email) throw new Error('Email provider without email.');
    const password = window.prompt('Enter your password to permanently delete your account:');
    if (!password) throw new Error('Account deletion cancelled.');
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(email, password));
    return;
  }

  try {
    await reauthenticateWithPopup(u, googleProvider);
  } catch {
    throw new Error('Unsupported sign-in provider for automatic re-auth; sign in again and retry.');
  }
}

/**
 * Deletes Firestore + Storage content for this user. Call only after re-authentication.
 */
export async function purgeUserCloudData(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  let embeddedSquadIds: string[] = [];

  if (userSnap.exists()) {
    const data = userSnap.data() as StorageData;
    embeddedSquadIds = (data.squadTrips || []).map((t: SquadTrip) => t.id).filter(Boolean);
  }

  const [ownedLists, sharedTrips] = await Promise.all([
    collaborativeListService.getOwnedLists(userId),
    shareService.getUserSharedTrips(userId),
  ]);

  await Promise.all(ownedLists.map((list) => collaborativeListService.deleteList(list.id, userId)));

  const sharedPointers = await getDocs(collection(db, 'users', userId, 'sharedLists'));
  await Promise.all(sharedPointers.docs.map((d) => deleteDoc(d.ref)));

  await Promise.all(sharedTrips.map((trip) => shareService.deleteSharedTrip(trip.id, userId)));

  await deleteFriendRequestsForUser(userId);
  await removeFriendEdges(userId);

  const ownedTripIds = await deleteOwnedSquadTrips(userId);
  const ownedSet = new Set(ownedTripIds);
  await leaveJoinedSquadTrips(userId, ownedSet);
  await deleteSquadJoinCodeLookups(userId);

  const legacyTripIds = embeddedSquadIds.filter((id) => !ownedSet.has(id));
  if (legacyTripIds.length > 0) {
    await deleteSquadTripChatsForIds(legacyTripIds);
  }

  await unpublishAllForUser(userId);

  await Promise.all([
    deleteCollectionDocs('users', userId, 'friends'),
    deleteCollectionDocs('users', userId, 'settings'),
    deleteCollectionDocs('users', userId, 'sharedLists'),
  ]);

  await deleteDoc(userRef);
  await deleteUserDirectoryEntry(userId);
  await deleteAllUserStorage(userId);
  localStorage.removeItem(STORAGE_KEY);
}

export async function deleteAccountFully(): Promise<void> {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in');

  await reauthenticateCurrentUser(u);
  await purgeUserCloudData(u.uid);
  await deleteUser(u);
}
