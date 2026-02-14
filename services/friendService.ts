import {
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, addDoc, getDocs, query, where,
    onSnapshot, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { FriendConnection, FriendRequest, PublicProfile, StatComparison, LocationType } from '../types';

const FRIEND_REQUESTS_COLLECTION = 'friendRequests';

export const friendService = {
    // Send friend request
    async sendRequest(fromUserId: string, fromUserName: string, fromUserAvatar: string | null, toUserId: string): Promise<void> {
        if (fromUserId === toUserId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if already friends
        const existingFriend = await getDoc(doc(db, 'users', fromUserId, 'friends', toUserId));
        if (existingFriend.exists()) {
            throw new Error('Already friends with this user');
        }

        // Check if request already exists
        const requestId = `${fromUserId}_${toUserId}`;
        const existingRequest = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
        if (existingRequest.exists()) {
            throw new Error('Friend request already sent');
        }

        // Check if reverse request exists (auto-accept)
        const reverseRequestId = `${toUserId}_${fromUserId}`;
        const reverseRequest = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, reverseRequestId));
        if (reverseRequest.exists()) {
            // Auto-accept
            await this.acceptRequest(reverseRequestId, fromUserId);
            return;
        }

        await setDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), {
            fromUserId,
            fromUserName,
            fromUserAvatar,
            toUserId,
            status: 'pending',
            createdAt: new Date().toISOString(),
        });
    },

    // Accept friend request
    async acceptRequest(requestId: string, userId: string): Promise<void> {
        const requestDoc = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
        const request = requestDoc.data() as FriendRequest;

        if (!request) throw new Error('Request not found');
        if (request.toUserId !== userId && request.fromUserId !== userId) {
            throw new Error('Unauthorized');
        }

        const batch = writeBatch(db);

        // Create bidirectional friendship
        batch.set(doc(db, 'users', request.toUserId, 'friends', request.fromUserId), {
            userId: request.toUserId,
            friendId: request.fromUserId,
            status: 'accepted',
            createdAt: new Date().toISOString(),
        });

        batch.set(doc(db, 'users', request.fromUserId, 'friends', request.toUserId), {
            userId: request.fromUserId,
            friendId: request.toUserId,
            status: 'accepted',
            createdAt: new Date().toISOString(),
        });

        // Delete request
        batch.delete(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));

        await batch.commit();
    },

    // Reject friend request
    async rejectRequest(requestId: string, userId: string): Promise<void> {
        const requestDoc = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
        const request = requestDoc.data() as FriendRequest;

        if (!request) throw new Error('Request not found');
        if (request.toUserId !== userId) throw new Error('Unauthorized');

        await deleteDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
    },

    // Cancel sent friend request
    async cancelRequest(requestId: string, userId: string): Promise<void> {
        const requestDoc = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
        const request = requestDoc.data() as FriendRequest;

        if (!request) throw new Error('Request not found');
        if (request.fromUserId !== userId) throw new Error('Unauthorized');

        await deleteDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
    },

    // Remove friend
    async removeFriend(userId: string, friendId: string): Promise<void> {
        const batch = writeBatch(db);

        batch.delete(doc(db, 'users', userId, 'friends', friendId));
        batch.delete(doc(db, 'users', friendId, 'friends', userId));

        await batch.commit();
    },

    // Get friends list (real-time)
    subscribeToFriends(
        userId: string,
        callback: (friends: FriendConnection[]) => void
    ): () => void {
        return onSnapshot(
            collection(db, 'users', userId, 'friends'),
            (snapshot) => {
                const friends = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FriendConnection));
                callback(friends);
            }
        );
    },

    // Get pending friend requests (real-time)
    subscribeToPendingRequests(
        userId: string,
        callback: (requests: FriendRequest[]) => void
    ): () => void {
        return onSnapshot(
            query(
                collection(db, FRIEND_REQUESTS_COLLECTION),
                where('toUserId', '==', userId),
                where('status', '==', 'pending')
            ),
            (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FriendRequest));
                callback(requests);
            }
        );
    },

    // Get sent friend requests
    subscribeToSentRequests(
        userId: string,
        callback: (requests: FriendRequest[]) => void
    ): () => void {
        return onSnapshot(
            query(
                collection(db, FRIEND_REQUESTS_COLLECTION),
                where('fromUserId', '==', userId),
                where('status', '==', 'pending')
            ),
            (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FriendRequest));
                callback(requests);
            }
        );
    },

    // Get all friends (one-time)
    async getFriends(userId: string): Promise<FriendConnection[]> {
        const snapshot = await getDocs(collection(db, 'users', userId, 'friends'));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FriendConnection));
    },

    // Get friend's public profile
    async getFriendProfile(friendId: string): Promise<PublicProfile | null> {
        const [settingsSnap, userSnap] = await Promise.all([
            getDoc(doc(db, 'users', friendId, 'settings', 'publicProfile')),
            getDoc(doc(db, 'users', friendId))
        ]);

        if (!settingsSnap.exists() || !settingsSnap.data()?.shareStats) {
            return null;
        }

        const userData = userSnap.data();
        const locationsSnapshot = await getDocs(
            query(collection(db, 'users', friendId, 'locations'), where('isVisited', '==', true))
        );

        const locations = locationsSnapshot.docs.map(d => d.data());
        const countries = new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name));
        const states = new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name));

        // Get favorite destinations (most visited or highest rated)
        const favoriteDestinations = locations
            .filter(l => l.rating >= 4)
            .slice(0, 5)
            .map(l => l.name);

        return {
            userId: friendId,
            displayName: userData?.profile?.name || 'Anonymous',
            avatarUrl: userData?.profile?.avatarUrl,
            bio: settingsSnap.data()?.bio,
            shareStats: settingsSnap.data()?.shareStats,
            shareLocations: settingsSnap.data()?.shareLocations,
            totalCountries: countries.size,
            totalStates: states.size,
            favoriteDestinations,
        };
    },

    // Update public profile settings
    async updatePublicProfile(
        userId: string,
        settings: Partial<PublicProfile>
    ): Promise<void> {
        await setDoc(doc(db, 'users', userId, 'settings', 'publicProfile'), {
            ...settings,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
    },

    // Compare travel stats with friend
    async compareStats(userId: string, friendId: string): Promise<StatComparison> {
        const [userLocationsSnap, friendLocationsSnap] = await Promise.all([
            getDocs(collection(db, 'users', userId, 'locations')),
            getDocs(collection(db, 'users', friendId, 'locations')),
        ]);

        const userLocations = userLocationsSnap.docs.map(d => d.data());
        const friendLocations = friendLocationsSnap.docs.map(d => d.data());

        const userNames = new Set(userLocations.map(l => l.name.toLowerCase()));
        const friendNames = new Set(friendLocations.map(l => l.name.toLowerCase()));

        // Find mutual destinations
        const mutualDestinations: string[] = [];
        userNames.forEach(name => {
            if (friendNames.has(name)) {
                mutualDestinations.push(name);
            }
        });

        // Find unique destinations
        const userUnique: string[] = [];
        userNames.forEach(name => {
            if (!friendNames.has(name)) {
                userUnique.push(name);
            }
        });

        const friendUnique: string[] = [];
        friendNames.forEach(name => {
            if (!userNames.has(name)) {
                friendUnique.push(name);
            }
        });

        // Calculate scores (simple version)
        const calculateScore = (locations: any[]) => {
            return locations.reduce((score, loc) => {
                const typeMultiplier = loc.type === LocationType.COUNTRY ? 3 :
                    loc.type === LocationType.STATE ? 2 : 1;
                return score + (loc.rating || 0) * typeMultiplier;
            }, 0);
        };

        return {
            mutualDestinations,
            userUnique,
            friendUnique,
            userScore: calculateScore(userLocations),
            friendScore: calculateScore(friendLocations),
        };
    },

    // Search for users by name (basic implementation)
    async searchUsers(searchTerm: string, currentUserId: string): Promise<{ id: string; name: string; avatar?: string }[]> {
        // Note: In production, you'd want to use Algolia or similar for user search
        // This is a simplified version that searches through existing connections
        const snapshot = await getDocs(collection(db, 'users'));
        const users: { id: string; name: string; avatar?: string }[] = [];

        const lowerTerm = searchTerm.toLowerCase();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (
                doc.id !== currentUserId &&
                data.profile?.name?.toLowerCase().includes(lowerTerm)
            ) {
                users.push({
                    id: doc.id,
                    name: data.profile.name,
                    avatar: data.profile?.avatarUrl,
                });
            }
        });

        return users.slice(0, 10);
    },

    // Check if two users are friends
    async areFriends(userId: string, otherUserId: string): Promise<boolean> {
        const friendDoc = await getDoc(doc(db, 'users', userId, 'friends', otherUserId));
        return friendDoc.exists();
    },

    // Get friend count
    async getFriendCount(userId: string): Promise<number> {
        const snapshot = await getDocs(collection(db, 'users', userId, 'friends'));
        return snapshot.size;
    },
};
