import {
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, addDoc, getDocs, query, where,
    increment, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ShareScope, SharedTrip, SharedTripComment, TravelLocation } from '../types';

const SHARED_TRIPS_COLLECTION = 'sharedTrips';

export const shareService = {
    // Create a shared trip from a private location
    async createSharedTrip(
        location: TravelLocation,
        userId: string,
        userName: string,
        userAvatar: string | null,
        options: { scope: ShareScope; highlights?: string[] }
    ): Promise<string> {
        const tripData: Omit<SharedTrip, 'id'> = {
            ownerId: userId,
            ownerName: userName,
            ownerAvatar: userAvatar || undefined,
            name: location.name,
            destination: location.name,
            type: location.type,
            rating: location.rating || 0,
            highlights: options.highlights || location.likes?.slice(0, 3) || [],
            photoUrls: (location as any).photoUrls || [],
            visitDate: location.dateVisited,
            createdAt: new Date().toISOString(),
            shareScope: options.scope,
            likeCount: 0,
            commentCount: 0,
        };

        const docRef = await addDoc(collection(db, SHARED_TRIPS_COLLECTION), tripData);

        // Store allowed users for friends-only sharing
        if (options.scope === 'friends') {
            await setDoc(doc(db, SHARED_TRIPS_COLLECTION, docRef.id, 'allowedUsers', 'list'), {
                userIds: []
            });
        }

        return docRef.id;
    },

    // Get shared trip by ID
    async getSharedTrip(tripId: string): Promise<SharedTrip | null> {
        const docSnap = await getDoc(doc(db, SHARED_TRIPS_COLLECTION, tripId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as SharedTrip;
    },

    // Update share scope
    async updateShareScope(tripId: string, scope: ShareScope): Promise<void> {
        await updateDoc(doc(db, SHARED_TRIPS_COLLECTION, tripId), {
            shareScope: scope,
        });
    },

    // Like/unlike a shared trip
    async toggleLike(tripId: string, userId: string): Promise<boolean> {
        const tripRef = doc(db, SHARED_TRIPS_COLLECTION, tripId);
        const likeRef = doc(db, SHARED_TRIPS_COLLECTION, tripId, 'likes', userId);

        const likeDoc = await getDoc(likeRef);

        if (likeDoc.exists()) {
            // Unlike
            await deleteDoc(likeRef);
            await updateDoc(tripRef, { likeCount: increment(-1) });
            return false;
        } else {
            // Like
            await setDoc(likeRef, {
                userId,
                timestamp: new Date().toISOString()
            });
            await updateDoc(tripRef, { likeCount: increment(1) });
            return true;
        }
    },

    // Check if user has liked a trip
    async hasLiked(tripId: string, userId: string): Promise<boolean> {
        const likeDoc = await getDoc(doc(db, SHARED_TRIPS_COLLECTION, tripId, 'likes', userId));
        return likeDoc.exists();
    },

    // Add comment to shared trip
    async addComment(
        tripId: string,
        userId: string,
        userName: string,
        userAvatar: string | null,
        content: string
    ): Promise<string> {
        const commentsRef = collection(db, SHARED_TRIPS_COLLECTION, tripId, 'comments');
        const comment = {
            userId,
            userName,
            userAvatar: userAvatar || null,
            content,
            createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(commentsRef, comment);

        await updateDoc(doc(db, SHARED_TRIPS_COLLECTION, tripId), {
            commentCount: increment(1)
        });

        return docRef.id;
    },

    // Get comments for a shared trip
    async getComments(tripId: string): Promise<SharedTripComment[]> {
        const snapshot = await getDocs(
            collection(db, SHARED_TRIPS_COLLECTION, tripId, 'comments')
        );
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as SharedTripComment))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    // Subscribe to comments in real-time
    subscribeToComments(
        tripId: string,
        callback: (comments: SharedTripComment[]) => void
    ): () => void {
        return onSnapshot(
            collection(db, SHARED_TRIPS_COLLECTION, tripId, 'comments'),
            (snapshot) => {
                const comments = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as SharedTripComment))
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                callback(comments);
            }
        );
    },

    // Get all public trips
    async getPublicTrips(limit: number = 20): Promise<SharedTrip[]> {
        const q = query(
            collection(db, SHARED_TRIPS_COLLECTION),
            where('shareScope', '==', 'public')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as SharedTrip))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    },

    // Get trips shared by a specific user
    async getUserSharedTrips(userId: string): Promise<SharedTrip[]> {
        const q = query(
            collection(db, SHARED_TRIPS_COLLECTION),
            where('ownerId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as SharedTrip))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    // Delete a shared trip
    async deleteSharedTrip(tripId: string, userId: string): Promise<void> {
        const trip = await this.getSharedTrip(tripId);
        if (!trip || trip.ownerId !== userId) {
            throw new Error('Unauthorized: Only the owner can delete this trip');
        }

        // Delete all subcollections first
        const commentsSnapshot = await getDocs(
            collection(db, SHARED_TRIPS_COLLECTION, tripId, 'comments')
        );
        const likesSnapshot = await getDocs(
            collection(db, SHARED_TRIPS_COLLECTION, tripId, 'likes')
        );

        const batchDeletes = [
            ...commentsSnapshot.docs.map(d => deleteDoc(d.ref)),
            ...likesSnapshot.docs.map(d => deleteDoc(d.ref)),
        ];

        await Promise.all(batchDeletes);
        await deleteDoc(doc(db, SHARED_TRIPS_COLLECTION, tripId));
    },

    // Generate shareable URL
    generateShareUrl(tripId: string): string {
        return `${window.location.origin}/shared/${tripId}`;
    },

    // Generate social share text
    generateSocialShareText(trip: SharedTrip): string {
        const highlights = trip.highlights.slice(0, 2).join(' • ');
        return `Check out my trip to ${trip.destination}! ${highlights ? `Highlights: ${highlights}` : ''} #Wanderlog #Travel`;
    },

    // Get share stats for a trip
    async getShareStats(tripId: string): Promise<{ likes: number; comments: number; views: number }> {
        const trip = await this.getSharedTrip(tripId);
        if (!trip) return { likes: 0, comments: 0, views: 0 };

        const likesSnapshot = await getDocs(
            collection(db, SHARED_TRIPS_COLLECTION, tripId, 'likes')
        );

        return {
            likes: likesSnapshot.size,
            comments: trip.commentCount,
            views: 0, // Would require analytics tracking
        };
    },
};
