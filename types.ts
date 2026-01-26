
export enum LocationType {
  STATE = 'state',
  COUNTRY = 'country'
}

export type VibeType = 'adventurous' | 'tired' | 'cultural' | 'foodie' | 'nature-loving';

export type CompanionType = 'solo' | 'partner' | 'family' | 'friends' | 'group';

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface TravelLocation {
  id: string;
  name: string;
  type: LocationType;
  rating: number;
  likes: string[];
  dislikes: string[];
  dateVisited: string;
  dateEndVisited?: string; // Optional end date for trip duration
  companions?: CompanionType[]; // Who you traveled with
  coordinates?: { lat: number; lng: number; zoom?: number };
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

export interface SquadTrip {
  id: string;
  name: string;
  destination: string;
  members: SquadMember[];
  items: string[]; // List of activity names
  joinCode: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  travelStyle: string[];
  bucketList: string[];
  customTravelStyles?: string[];
  dna?: TravelDNA;
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
