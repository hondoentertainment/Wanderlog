import { auth } from './firebaseConfig';
import type {
  AIRecommendation,
  ItineraryDay,
  LocationType,
  SquadTrip,
  TravelDNA,
  TravelLocation,
  TravelMuseInsight,
  UserProfile,
  VibeType,
} from '../types';
export { exportItineraryToICS } from './itineraryIcs';

export class GeminiApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export function getGeminiErrorMessage(err: unknown): string {
  if (err instanceof GeminiApiError) {
    if (err.code === 'UNAUTHENTICATED') return 'Sign in to use AI features.';
    if (err.code === 'RATE_LIMITED') return 'Too many AI requests. Try again in a minute.';
    return err.message;
  }
  return 'Something went wrong with AI. Try again.';
}

async function geminiFetch<T>(action: string, payload: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new GeminiApiError('UNAUTHENTICATED', 'Sign in to use AI features.');
  }
  const token = await user.getIdToken();
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string; code?: string };
  if (!res.ok) {
    throw new GeminiApiError(data.code || 'API_ERROR', data.error || `Request failed (${res.status})`);
  }
  return data.result as T;
}

export const getAIRecommendations = async (
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number },
  vibe?: VibeType
): Promise<AIRecommendation[]> => {
  if (visitedLocations.length === 0 && profile.bucketList.length === 0 && !vibe) {
    return [];
  }
  return geminiFetch<AIRecommendation[]>('getAIRecommendations', {
    visitedLocations,
    profile,
    coords,
    vibe,
  });
};

export const getSquadActivitySuggestions = async (squad: SquadTrip): Promise<string[]> => {
  return geminiFetch<string[]>('getSquadActivitySuggestions', { squad });
};

export const getTravelMuseInsights = async (
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number }
): Promise<TravelMuseInsight[]> => {
  if (visitedLocations.length === 0) return [];
  return geminiFetch<TravelMuseInsight[]>('getTravelMuseInsights', {
    visitedLocations,
    profile,
    coords,
  });
};

export const analyzeLogImage = async (base64Image: string): Promise<Partial<TravelLocation>> => {
  return geminiFetch<Partial<TravelLocation>>('analyzeLogImage', { base64Image });
};

export const performSemanticSearch = async (query: string, locations: TravelLocation[]): Promise<string[]> => {
  return geminiFetch<string[]>('performSemanticSearch', { query, locations });
};

export const generateTravelDNA = async (visitedLocations: TravelLocation[], profile: UserProfile): Promise<TravelDNA> => {
  return geminiFetch<TravelDNA>('generateTravelDNA', { visitedLocations, profile });
};

export const getLocationDetails = async (
  name: string,
  type: LocationType
): Promise<{ description: string; attractions: string[] }> => {
  return geminiFetch<{ description: string; attractions: string[] }>('getLocationDetails', { name, type });
};

export const generateItinerary = async (
  name: string,
  type: LocationType,
  description: string,
  attractions: string[]
): Promise<ItineraryDay[]> => {
  return geminiFetch<ItineraryDay[]>('generateItinerary', { name, type, description, attractions });
};

export const geocodeLocation = async (name: string, type: LocationType): Promise<{ lat: number; lng: number } | null> => {
  return geminiFetch<{ lat: number; lng: number } | null>('geocodeLocation', { name, type });
};
