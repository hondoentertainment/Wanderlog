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

import { Type } from "@google/genai";
import { geminiGenerate, geminiGenerateJson, geminiGenerateJsonWithImage } from "./geminiRunner";
import { TravelLocation, AIRecommendation, UserProfile, GroundingLink, LocationType, ItineraryDay, TravelDNA, VibeType, TravelMuseInsight, SquadTrip } from "../types";

// Simple In-Memory Cache for AI Responses
const AI_CACHE = new Map<string, { result: any; timestamp: number }>();

const getCachedResponse = <T>(key: string, ttlMinutes = 60): T | null => {
  const cached = AI_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMinutes * 60 * 1000) {
    return cached.result as T;
  }
  return null;
};

const cacheResponse = (key: string, result: any) => {
  AI_CACHE.set(key, { result, timestamp: Date.now() });
};

export const getAIRecommendations = async (
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number },
  vibe?: VibeType
): Promise<AIRecommendation[]> => {
  if (visitedLocations.length === 0 && profile.bucketList.length === 0 && !vibe) {
    return [];
  }

  const historyText = visitedLocations.map(loc =>
    `- ${loc.name} (${loc.type}): Rating ${loc.rating}/5. Likes: ${loc.likes.join(', ')}.`
  ).join('\n');

  const vibePrompt = vibe ? `Current User Vibe: ${vibe}. Prioritize recommendations that fit this mood.` : '';

  const cacheKey = `recs_${JSON.stringify(profile.travelStyle)}_${vibe}_${historyText.length}_${coords?.latitude}_${coords?.longitude}`;
  const cached = getCachedResponse<AIRecommendation[]>(cacheKey);
  if (cached) return cached;

  const prompt = `Based on my travel profile and history, recommend exactly 3 new states or countries I should visit.
  
  User Styles: ${profile.travelStyle.join(', ')}
  ${vibePrompt}

  My History:
  ${historyText}

  Use Google Maps and Search to find real, interesting places.`;

  try {
    const recs = await geminiGenerateJson<any[]>(prompt, {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['state', 'country'] },
          suggestedRatingMatch: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ['name', 'type', 'suggestedRatingMatch', 'reason'],
      },
    }, {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: coords
        ? { retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } } }
        : undefined,
    });
    const finalRecs = recs.map((r: any) => ({
      ...r,
      type: r.type === 'state' ? LocationType.STATE : LocationType.COUNTRY
    })).slice(0, 3);

    cacheResponse(cacheKey, finalRecs);
    return finalRecs;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};

export const getSquadActivitySuggestions = async (squad: SquadTrip): Promise<string[]> => {
  const memberContext = squad.members.map(m => `${m.name} (${m.style})`).join(', ');
  const prompt = `Suggest 3 specific group activities or hidden gems in ${squad.destination} that would satisfy this squad: ${memberContext}. 
  The squad already has these items: ${squad.items.join(', ') || 'None'}.
  Focus on activities that blend different styles (e.g. food + history). Respond in a simple JSON array of strings.`;

  try {
    return await geminiGenerateJson<string[]>(prompt, {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    });
  } catch (error) {
    console.error("Squad activity suggestion failed", error);
    return [];
  }
};

export const getTravelMuseInsights = async (
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number }
): Promise<TravelMuseInsight[]> => {
  if (visitedLocations.length === 0) return [];

  const historyText = visitedLocations.map(loc =>
    `Location: ${loc.name}. Rating: ${loc.rating}/5. Likes: ${loc.likes.join(', ')}. Dislikes: ${loc.dislikes.join(', ')}.`
  ).join('\n');

  const cacheKey = `muse_${historyText.length}_${JSON.stringify(profile.travelStyle)}_${coords?.latitude}_${coords?.longitude}`;
  const cached = getCachedResponse<TravelMuseInsight[]>(cacheKey, 120); // 2 hour cache for insights
  if (cached) return cached;

  const prompt = `Analyze my travel history and profile to find 2 deep patterns and 1 'hidden gem' nearby (if location provided) or globally that matches my specific interests.
  
  My History:
  ${historyText}

  My Profile Styles: ${profile.travelStyle.join(', ')}
  Current Location: ${coords ? `${coords.latitude}, ${coords.longitude}` : 'Unknown'}`;

  try {
    const insights = await geminiGenerateJson<any[]>(prompt, {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['pattern', 'gem'] },
          description: { type: Type.STRING },
          relevanceScore: { type: Type.NUMBER },
        },
        required: ['title', 'type', 'description', 'relevanceScore'],
      },
    });
    const finalInsights = insights.map((ins: any) => ({
      ...ins,
      id: crypto.randomUUID()
    }));

    cacheResponse(cacheKey, finalInsights);
    return finalInsights;
  } catch (error) {
    console.error("Travel Muse analysis failed", error);
    return [];
  }
};

export const analyzeLogImage = async (base64Image: string): Promise<Partial<TravelLocation>> => {
  const prompt =
    "Extract the travel location name, date (YYYY-MM-DD), and 3 potential highlights/pros from this image. If it's a receipt or ticket, look for city/country names and business names. Respond in JSON.";

  const imageExtractSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      dateVisited: { type: Type.STRING },
      likes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  };

  try {
    return await geminiGenerateJsonWithImage<Partial<TravelLocation>>(
      prompt,
      base64Image,
      imageExtractSchema,
    );
  } catch (error) {
    console.error("Image analysis failed", error);
    return {};
  }
};

/**
 * Voice Command Analysis: Extracts travel intent from speech transcript
 */
export const analyzeVoiceCommand = async (transcript: string): Promise<Partial<TravelLocation>> => {
  const prompt = `Extract the travel location name, date (if mentioned), and highlights from this spoken sentence: "${transcript}"
  
  Instructions:
  - If no date mentioned, omit dateVisited.
  - Convert natural language dates (e.g. "last summer") to YYYY-MM-DD if possible, else omit.
  - Extract at least 2 likes/highlights.
  - Return in JSON.`;

  try {
    return await geminiGenerateJson<Partial<TravelLocation>>(prompt, {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        dateVisited: { type: Type.STRING },
        likes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });
  } catch (error) {
    console.error("Voice analysis failed", error);
    return {};
  }
};

/**
 * Semantic Search: Finds logs matching a natural language query
 */
export const performSemanticSearch = async (query: string, locations: TravelLocation[], squadTrips: SquadTrip[] = []): Promise<string[]> => {
  const context = {
    memories: locations.map(l => ({
      id: l.id,
      name: l.name,
      likes: l.likes,
      dislikes: l.dislikes,
      rating: l.rating,
      type: 'location'
    })),
    trips: squadTrips.map(t => ({
      id: t.id,
      name: t.name,
      destination: t.destination,
      activities: t.items,
      type: 'trip'
    }))
  };

  const cacheKey = `semantic_${query}_${locations.length}_${squadTrips.length}`;
  const cached = getCachedResponse<string[]>(cacheKey, 5); // 5 min cache for searches
  if (cached) return cached;

  const prompt = `Given the following travel data: ${JSON.stringify(context)}
  Find the IDs of the memories (locations) or collaborative trips that best match the user's natural language search query: "${query}"
  Return only a JSON array of the IDs.`;

  try {
    return await geminiGenerateJson<string[]>(prompt, {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    });
  } catch (error) {
    console.error("Semantic search failed", error);
    return [];
  }
};

/**
 * Discovery Rationale: Explains why an unvisited place matches Travel DNA
 */
export const getDiscoveryRationale = async (
  name: string,
  type: LocationType,
  visitedLocations: TravelLocation[],
  profile: UserProfile
): Promise<string> => {
  const historyText = visitedLocations.slice(0, 10).map(loc =>
    `- ${loc.name}: ${loc.rating}/5. Likes: ${loc.likes.join(', ')}`
  ).join('\n');

  const prompt = `Explain why I would like to visit ${name} (${type}) based on my travel history:
  ${historyText}
  
  And my styles: ${profile.travelStyle.join(', ')}
  
  Provide a one-sentence, highly personal rationale that builds trust by referencing specific past experiences or styles. Do not be generic. Respond as Jules.`;

  try {
    return (await geminiGenerate(prompt)) || "This matches your unique travel DNA perfectly.";
  } catch {
    return "A perfect match for your exploration style.";
  }
};

/**
 * Discovery Context: Detailed insights for the unvisited location page
 */
export interface DiscoveryContext {
  rationale: string;
  bestTime: string;
  similarTo: string[];
}

export const getDiscoveryContext = async (
  name: string,
  visitedLocations: TravelLocation[],
  profile: UserProfile
): Promise<DiscoveryContext> => {
  const historyNames = visitedLocations.map(l => l.name).join(', ');
  const prompt = `Provide discovery context for ${name}:
  1. Personal Rationale (based on experience with ${historyNames})
  2. Best Time to Visit (Short phrase)
  3. 2 places exactly from this list that are most similar: ${historyNames || 'None'}
  
  Respond in JSON.`;

  try {
    return await geminiGenerateJson<DiscoveryContext>(prompt, {
      type: Type.OBJECT,
      properties: {
        rationale: { type: Type.STRING },
        bestTime: { type: Type.STRING },
        similarTo: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['rationale', 'bestTime', 'similarTo'],
    });
  } catch {
    return { rationale: "Matches your style.", bestTime: "Anytime", similarTo: [] };
  }
};

export const generateTravelDNA = async (visitedLocations: TravelLocation[], profile: UserProfile): Promise<TravelDNA> => {
  const historyText = visitedLocations.map(loc => `Loc: ${loc.name}. Likes: ${loc.likes.join(', ')}`).join('\n');
  const cacheKey = `dna_${historyText.length}_${JSON.stringify(profile.travelStyle)}`;
  const cached = getCachedResponse<TravelDNA>(cacheKey, 24 * 60); // 24 hour cache
  if (cached) return cached;

  const prompt = `Score Travel DNA (0-100) for axes: Nature, Culture, Adventure, Relaxation, Food, Urban based on history:\n${historyText}\nRespond in JSON.`;

  try {
    const result = await geminiGenerateJson<TravelDNA>(prompt, {
      type: Type.OBJECT,
      properties: {
        nature: { type: Type.NUMBER },
        culture: { type: Type.NUMBER },
        adventure: { type: Type.NUMBER },
        relaxation: { type: Type.NUMBER },
        food: { type: Type.NUMBER },
        urban: { type: Type.NUMBER },
      },
      required: ['nature', 'culture', 'adventure', 'relaxation', 'food', 'urban'],
    });
    cacheResponse(cacheKey, result);
    return result;
  } catch {
    return { nature: 50, culture: 50, adventure: 50, relaxation: 50, food: 50, urban: 50 };
  }
};

export const getLocationDetails = async (name: string, type: LocationType): Promise<{ description: string; attractions: string[] }> => {
  const prompt = `2-sentence description of ${name} and 4 key attractions. JSON format.`;
  try {
    return await geminiGenerateJson<{ description: string; attractions: string[] }>(prompt, {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        attractions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['description', 'attractions'],
    });
  } catch {
    return { description: "Great destination.", attractions: ["Local Culture"] };
  }
};

export const generateItinerary = async (name: string, type: LocationType, description: string, attractions: string[]): Promise<ItineraryDay[]> => {
  const prompt = `Generate a 3-day travel itinerary for ${name} using attractions: ${attractions.join(', ')}. JSON format with day, title, and activities.`;
  try {
    return await geminiGenerateJson<ItineraryDay[]>(prompt, {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          title: { type: Type.STRING },
          activities: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['day', 'title', 'activities'],
      },
    });
  } catch {
    return [];
  }
};

export const geocodeLocation = async (name: string, type: LocationType): Promise<{ lat: number; lng: number } | null> => {
  const prompt = `Lat/Lng for ${name} (${type}). JSON format.`;
  try {
    return await geminiGenerateJson<{ lat: number; lng: number } | null>(prompt, {
      type: Type.OBJECT,
      properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
      required: ['lat', 'lng'],
    });
  } catch {
    return null;
  }
};

/**
 * Ask Jules - Conversational AI Travel Coach
 */
export const askJules = async (
  question: string,
  locations: TravelLocation[],
  profile: UserProfile,
  chatHistory: { role: 'user' | 'jules'; content: string }[] = []
): Promise<string> => {
  const historyText = locations.slice(0, 20).map(loc =>
    `- ${loc.name} (${loc.type}): ${loc.rating}/5 stars. Liked: ${loc.likes.slice(0, 3).join(', ')}`
  ).join('\n');

  const recentMessages = chatHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'User' : 'Jules'}: ${m.content}`
  ).join('\n');

  const prompt = `You are Jules, a friendly and knowledgeable AI travel coach for the Travel Muse app. You have a warm, encouraging personality and deep expertise in travel planning.

Your user's profile:
- Name: ${profile.name}
- Travel Styles: ${profile.travelStyle.join(', ')}
- Bucket List: ${profile.bucketList.join(', ') || 'Not set'}

Their travel history (${locations.length} total trips):
${historyText || 'No trips logged yet'}

${recentMessages ? `Recent conversation:\n${recentMessages}\n` : ''}

User's question: ${question}

Instructions:
- Be conversational, helpful, and enthusiastic about travel
- Give specific, actionable advice based on their history and preferences
- If they ask for recommendations, suggest places that match their travel DNA
- Keep responses concise but informative (2-3 paragraphs max)
- Use emojis sparingly for warmth
- If you don't know something specific, be honest and suggest alternatives
- Reference their past trips when relevant to make it personal

Respond as Jules:`;

  try {
    // VC Pitch: Serverless API Architecture (Protects API Key)
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
      })
    });

    if (!res.ok) {
      throw new Error("Failed to connect to AI Service");
    }

    const data = await res.json();
    return data.response || "I'm having trouble thinking right now. Give me a moment and try again!";
  } catch (error) {
    console.error("Error in askJules (Serverless):", error);
    return "Oops! I seem to be having a connection issue. Please try again in a moment. ✈️";
  }
};

export const extractLocationFromText = async (transcript: string): Promise<Partial<TravelLocation>> => {
  const prompt = `Extract a structured travel log from this raw audio transcript: "${transcript}"
  
  Determine the name of the place, its type (country, state, city, or landmark), an estimated rating out of 5 based on the user's tone, what they liked, and what they disliked.`;

  try {
    const parsed = await geminiGenerateJson<{
      name: string;
      type: string;
      rating: number;
      likes: string[];
      dislikes: string[];
    }>(prompt, {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['country', 'state', 'city', 'landmark'] },
        rating: { type: Type.NUMBER },
        likes: { type: Type.ARRAY, items: { type: Type.STRING } },
        dislikes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['name', 'type', 'rating', 'likes', 'dislikes'],
    });
    return {
      name: parsed.name || 'Unknown Location',
      type: (parsed.type || 'landmark') as LocationType,
      rating: parsed.rating || 5,
      likes: parsed.likes || [],
      dislikes: parsed.dislikes || [],
      dateVisited: new Date().toISOString(),
      isVisited: true,
      wishlistData: { discoveryRationale: "Transcribed from Walkman Mode ambient audio." }
    };
  } catch (error) {
    console.error("Error extracting from text:", error);
    throw error;
  }
};

export const extractDataFromImage = async (base64Image: string): Promise<Partial<TravelLocation>> => {
  const prompt = `Analyze this image (likely a receipt, boarding pass, or ticket). 
  Extract the location it corresponds to (name and type: country, state, city, or landmark).
  Infer what the user liked about it based on the item (e.g. if it's a restaurant receipt, mention the food).`;

  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeType = base64Image.includes(';')
      ? base64Image.split(';')[0].split(':')[1]
      : 'image/jpeg';

    const parsed = await geminiGenerateJsonWithImage<{
      name: string;
      type: string;
      likes: string[];
    }>(prompt, base64Data, {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['country', 'state', 'city', 'landmark'] },
        likes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['name', 'type', 'likes'],
    }, mimeType);
    return {
      name: parsed.name || 'Extracted Location',
      type: (parsed.type || 'landmark') as LocationType,
      rating: 5,
      likes: parsed.likes || [],
      dislikes: [],
      dateVisited: new Date().toISOString(),
      isVisited: true,
      wishlistData: { discoveryRationale: "Extracted via Omni-Receipt Scanner." }
    };
  } catch (error) {
    console.error("Error extracting from image:", error);
    throw error;
  }
};
