import {
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, addDoc, getDocs, query, where,
    onSnapshot, runTransaction, writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { SharedBucketList, SharedBucketItem, LocationType } from '../types';

const BUCKET_LISTS_COLLECTION = 'sharedLists';

export const collaborativeListService = {
    // Create a new collaborative bucket list
    async createList(
        name: string,
        ownerId: string,
        ownerName: string,
        sharedWith: string[]
    ): Promise<string> {
        const listId = crypto.randomUUID();
        const listData: SharedBucketList = {
            id: listId,
            name,
            ownerId,
            sharedWith: [...new Set([...sharedWith, ownerId])], // Ensure owner is included
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, BUCKET_LISTS_COLLECTION, listId), listData);

        // Grant access to shared users
        await this.grantAccess(listId, sharedWith, ownerId);

        return listId;
    },

    // Grant access to users
    async grantAccess(listId: string, userIds: string[], ownerId: string): Promise<void> {
        const batch = writeBatch(db);

        userIds.forEach(userId => {
            if (userId !== ownerId) {
                const accessRef = doc(db, 'users', userId, 'sharedLists', listId);
                batch.set(accessRef, {
                    accessGrantedAt: new Date().toISOString(),
                    canEdit: true,
                    listId: listId
                });
            }
        });

        await batch.commit();
    },

    // Get a shared bucket list
    async getList(listId: string): Promise<SharedBucketList | null> {
        const docSnap = await getDoc(doc(db, BUCKET_LISTS_COLLECTION, listId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as SharedBucketList;
    },

    // Add item to list (with optimistic update)
    async addItem(
        listId: string,
        userId: string,
        userName: string,
        destination: string,
        type: LocationType,
        notes?: string
    ): Promise<string> {
        const itemsRef = collection(db, BUCKET_LISTS_COLLECTION, listId, 'items');
        const item: Omit<SharedBucketItem, 'id'> = {
            addedBy: userId,
            addedByName: userName,
            destination,
            type,
            notes,
            votes: { [userId]: 'want' },
            priorityScore: 1,
            status: 'pending',
        };

        const docRef = await addDoc(itemsRef, item);

        await updateDoc(doc(db, BUCKET_LISTS_COLLECTION, listId), {
            updatedAt: new Date().toISOString(),
        });

        return docRef.id;
    },

    // Update item notes
    async updateItemNotes(listId: string, itemId: string, notes: string): Promise<void> {
        await updateDoc(
            doc(db, BUCKET_LISTS_COLLECTION, listId, 'items', itemId),
            { notes }
        );
    },

    // Vote on item (want/pass)
    async vote(listId: string, itemId: string, userId: string, vote: 'want' | 'pass'): Promise<void> {
        const itemRef = doc(db, BUCKET_LISTS_COLLECTION, listId, 'items', itemId);

        await runTransaction(db, async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists()) throw new Error('Item not found');

            const data = itemDoc.data() as SharedBucketItem;
            const currentVotes = { ...(data.votes || {}) };

            if (currentVotes[userId] === vote) {
                // Remove vote (toggle off)
                delete currentVotes[userId];
            } else {
                currentVotes[userId] = vote;
            }

            // Recalculate priority score
            const wantCount = Object.values(currentVotes).filter(v => v === 'want').length;
            const passCount = Object.values(currentVotes).filter(v => v === 'pass').length;
            const priorityScore = wantCount - passCount;

            transaction.update(itemRef, { votes: currentVotes, priorityScore });
        });
    },

    // Mark item as planned
    async markPlanned(listId: string, itemId: string): Promise<void> {
        await updateDoc(
            doc(db, BUCKET_LISTS_COLLECTION, listId, 'items', itemId),
            { status: 'planned' }
        );
    },

    // Mark item as visited
    async markVisited(listId: string, itemId: string, userId: string): Promise<void> {
        await updateDoc(
            doc(db, BUCKET_LISTS_COLLECTION, listId, 'items', itemId),
            {
                status: 'visited',
                completedAt: new Date().toISOString(),
                completedBy: userId,
            }
        );
    },

    // Remove item from list
    async removeItem(listId: string, itemId: string): Promise<void> {
        await deleteDoc(doc(db, BUCKET_LISTS_COLLECTION, listId, 'items', itemId));

        await updateDoc(doc(db, BUCKET_LISTS_COLLECTION, listId), {
            updatedAt: new Date().toISOString(),
        });
    },

    // Get all items in a list
    async getItems(listId: string): Promise<SharedBucketItem[]> {
        const snapshot = await getDocs(
            collection(db, BUCKET_LISTS_COLLECTION, listId, 'items')
        );
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SharedBucketItem));
    },

    // Subscribe to list changes (real-time)
    subscribeToList(
        listId: string,
        callback: (items: SharedBucketItem[]) => void
    ): () => void {
        return onSnapshot(
            collection(db, BUCKET_LISTS_COLLECTION, listId, 'items'),
            (snapshot) => {
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as SharedBucketItem));
                callback(items);
            }
        );
    },

    // Subscribe to list metadata changes
    subscribeToListMeta(
        listId: string,
        callback: (list: SharedBucketList | null) => void
    ): () => void {
        return onSnapshot(
            doc(db, BUCKET_LISTS_COLLECTION, listId),
            (snapshot) => {
                if (snapshot.exists()) {
                    callback({ id: snapshot.id, ...snapshot.data() } as SharedBucketList);
                } else {
                    callback(null);
                }
            }
        );
    },

    // Get lists owned by user
    async getOwnedLists(userId: string): Promise<SharedBucketList[]> {
        const q = query(
            collection(db, BUCKET_LISTS_COLLECTION),
            where('ownerId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SharedBucketList));
    },

    // Get lists shared with user
    async getSharedWithMe(userId: string): Promise<SharedBucketList[]> {
        const snapshot = await getDocs(collection(db, 'users', userId, 'sharedLists'));
        const listIds = snapshot.docs.map(doc => doc.id);

        const lists = await Promise.all(
            listIds.map(async (listId) => {
                const docSnap = await getDoc(doc(db, BUCKET_LISTS_COLLECTION, listId));
                return docSnap.exists() ? { id: listId, ...docSnap.data() } as SharedBucketList : null;
            })
        );

        return lists.filter(Boolean) as SharedBucketList[];
    },

    // Update list name
    async updateListName(listId: string, name: string): Promise<void> {
        await updateDoc(doc(db, BUCKET_LISTS_COLLECTION, listId), {
            name,
            updatedAt: new Date().toISOString(),
        });
    },

    // Add users to share list
    async shareWithUsers(listId: string, userIds: string[], ownerId: string): Promise<void> {
        const listRef = doc(db, BUCKET_LISTS_COLLECTION, listId);
        const list = await this.getList(listId);

        if (!list) throw new Error('List not found');
        if (list.ownerId !== ownerId) throw new Error('Only owner can share list');

        const newSharedWith = [...new Set([...list.sharedWith, ...userIds])];

        await updateDoc(listRef, { sharedWith: newSharedWith });
        await this.grantAccess(listId, userIds, ownerId);
    },

    // Remove user from shared list
    async removeUserAccess(listId: string, userId: string, ownerId: string): Promise<void> {
        const listRef = doc(db, BUCKET_LISTS_COLLECTION, listId);
        const list = await this.getList(listId);

        if (!list) throw new Error('List not found');
        if (list.ownerId !== ownerId) throw new Error('Only owner can remove users');

        const newSharedWith = list.sharedWith.filter(id => id !== userId);

        await updateDoc(listRef, { sharedWith: newSharedWith });
        await deleteDoc(doc(db, 'users', userId, 'sharedLists', listId));
    },

    // Delete a shared list
    async deleteList(listId: string, userId: string): Promise<void> {
        const list = await this.getList(listId);
        if (!list) throw new Error('List not found');
        if (list.ownerId !== userId) throw new Error('Only owner can delete list');

        // Delete all items first
        const itemsSnapshot = await getDocs(
            collection(db, BUCKET_LISTS_COLLECTION, listId, 'items')
        );

        const batch = writeBatch(db);
        itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Remove access for all shared users
        list.sharedWith.forEach(sharedUserId => {
            if (sharedUserId !== userId) {
                batch.delete(doc(db, 'users', sharedUserId, 'sharedLists', listId));
            }
        });

        batch.delete(doc(db, BUCKET_LISTS_COLLECTION, listId));

        await batch.commit();
    },

    // Get vote counts for an item
    getVoteCounts(votes: { [userId: string]: 'want' | 'pass' }): { want: number; pass: number } {
        const values = Object.values(votes || {});
        return {
            want: values.filter(v => v === 'want').length,
            pass: values.filter(v => v === 'pass').length,
        };
    },

    // Sort items by priority score
    sortItemsByPriority(items: SharedBucketItem[]): SharedBucketItem[] {
        return [...items].sort((a, b) => b.priorityScore - a.priorityScore);
    },

    // Sort items by date added
    sortItemsByDate(items: SharedBucketItem[]): SharedBucketItem[] {
        return [...items].sort((a, b) => {
            // Use item id as proxy for creation time (UUID v4 contains timestamp)
            return a.id.localeCompare(b.id);
        });
    },

    // Filter items by status
    filterItemsByStatus(
        items: SharedBucketItem[],
        status: 'all' | 'pending' | 'planned' | 'visited'
    ): SharedBucketItem[] {
        if (status === 'all') return items;
        return items.filter(item => item.status === status);
    },
};
