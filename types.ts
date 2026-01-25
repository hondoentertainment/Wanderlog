
export enum LocationType {
  STATE = 'state',
  COUNTRY = 'country'
}

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
  coordinates?: { lat: number; lng: number; zoom?: number };
}

export interface UserProfile {
  name: string;
  bio: string;
  travelStyle: string[];
  bucketList: string[];
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

export interface SavedRecommendation extends AIRecommendation {
  id: string;
  dateSaved: string;
}

export interface StorageData {
  locations: TravelLocation[];
  profile: UserProfile;
  savedRecommendations: SavedRecommendation[];
}
