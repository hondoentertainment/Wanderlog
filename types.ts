
export enum LocationType {
  STATE = 'state',
  COUNTRY = 'country',
  CITY = 'city',
  LANDMARK = 'landmark'
}

export type VibeType = 'adventurous' | 'tired' | 'cultural' | 'foodie' | 'nature-loving';

export type CompanionType = 'solo' | 'partner' | 'family' | 'friends' | 'group';

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface WishlistData {
  season?: string;
  priority?: 'high' | 'medium' | 'low';
  reason?: string;
  discoveryRationale?: string;
}

export interface TravelLocation {
  id: string;
  name: string;
  type: LocationType;
  rating: number;
  likes: string[];
  dislikes: string[];
  dateVisited: string;
  isVisited: boolean;
  dateEndVisited?: string;
  companions?: CompanionType[];
  coordinates?: { lat: number; lng: number; zoom?: number };
  wishlistData?: WishlistData;
  photoUrls?: string[];
}

/** Public discovery feed document (subset of TravelLocation + owner metadata). */
export interface PublicLocation {
  id: string;
  ownerId: string;
  name: string;
  type: LocationType;
  rating: number;
  likes: string[];
  dateVisited: string;
  isVisited: boolean;
  dateEndVisited?: string;
  companions?: CompanionType[];
  coordinates?: { lat: number; lng: number; zoom?: number };
  photoUrls?: string[];
  publishedAt: string;
}

export interface TravelDNA {
  nature: number;
  culture: number;
  adventure: number;
  relaxation: number;
  food: number;
  urban: number;
}

export interface TravelMuseInsight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'gem' | 'discovery';
  relevanceScore: number;
  links?: GroundingLink[];
}

export interface SquadMember {
  name: string;
  style: string;
}

export interface SquadPayment {
  totalAmount: number;
  splitAmount: number;
  membersPaid: string[];
  currency: string;
}

export interface SquadTrip {
  id: string;
  name: string;
  destination: string;
  members: SquadMember[];
  items: string[]; // List of activity names
  joinCode: string;
  createdAt: string;
  payments?: SquadPayment;
  /** Firebase Auth UIDs with access to squad chat */
  memberIds?: string[];
}

export interface UserProfile {
  name: string;
  bio: string;
  travelStyle: string[];
  bucketList: string[];
  customTravelStyles?: string[];
  dna?: TravelDNA;
  wanderlogCredits?: number;
  vault?: string[];
  /** Lowercase name prefix for friend search (set on save) */
  searchName?: string;
  /** Opt-in: publish photo logs to the discovery feed */
  publishToDiscoveryFeed?: boolean;
}

export interface AIRecommendation {
  name: string;
  type: LocationType;
  reason: string;
  suggestedRatingMatch: number;
  links?: GroundingLink[];
  description?: string;
  attractions?: string[];
  coordinates?: { lat: number; lng: number; zoom?: number };
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

export interface SavedRecommendation extends AIRecommendation {
  id: string;
  dateSaved: string;
  itinerary?: ItineraryDay[];
}

export interface StorageData {
  locations: TravelLocation[];
  profile: UserProfile;
  savedRecommendations: SavedRecommendation[];
  squadTrips: SquadTrip[];
}

// Achievement Badges
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: string;
}

// Ask Jules Chat
export interface JulesMessage {
  id: string;
  role: 'user' | 'jules';
  content: string;
  timestamp: string;
}

// ====================
// Trip Sharing & Collaborative Features
// ====================

// Shared trip visibility options
export type ShareScope = 'private' | 'friends' | 'public';

// Public-facing trip summary (minimal data for sharing)
export interface SharedTrip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  name: string;
  destination: string;
  type: LocationType;
  rating: number;
  highlights: string[]; // Top 3 likes
  photoUrls?: string[];
  visitDate: string;
  createdAt: string;
  shareScope: ShareScope;
  likeCount: number;
  commentCount: number;
}

// Collaborative bucket list
export interface SharedBucketList {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[]; // User IDs with access
  items: SharedBucketItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedBucketItem {
  id: string;
  addedBy: string; // User ID
  addedByName: string;
  destination: string;
  type: LocationType;
  notes?: string;
  votes: { [userId: string]: 'want' | 'pass' };
  priorityScore: number; // Calculated from votes
  status: 'pending' | 'planned' | 'visited';
  completedAt?: string;
  completedBy?: string;
}

// Friend connection
export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

// User profile extension for public sharing
export interface PublicProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  shareStats: boolean;
  shareLocations: boolean;
  totalCountries: number;
  totalStates: number;
  favoriteDestinations: string[];
  resumeUrl?: string;
}

// Enhanced SquadTrip with collaboration features
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

export interface TripBudget {
  total: number;
  spent: number;
  currency: string;
  contributions: { [userId: string]: number };
}

export interface ItineraryActivity {
  id: string;
  name: string;
  time?: string;
  location?: string;
  addedBy: string;
  status: 'proposed' | 'confirmed' | 'done';
}

export interface CollaborativeItinerary {
  day: number;
  title: string;
  activities: ItineraryActivity[];
  votes: { [userId: string]: string[] }; // User votes for activities
}

// Enhanced SquadTrip interface (extends existing SquadTrip)
export interface EnhancedSquadTrip extends SquadTrip {
  ownerId: string;
  isShared: boolean; // Can non-members view?
  chatMessages?: ChatMessage[];
  budget?: TripBudget;
  itinerary?: CollaborativeItinerary[];
}

// Stat comparison between friends
export interface StatComparison {
  mutualDestinations: string[];
  userUnique: string[];
  friendUnique: string[];
  userScore: number;
  friendScore: number;
}

// Friend request
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Shared trip comment
export interface SharedTripComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

// Shared trip like
export interface SharedTripLike {
  userId: string;
  timestamp: string;
}
