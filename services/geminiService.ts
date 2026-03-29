
import { GoogleGenAI, Type } from "@google/genai";
import { TravelLocation, AIRecommendation, UserProfile, GroundingLink, LocationType, ItineraryDay, TravelDNA, VibeType, TravelMuseInsight, SquadTrip } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '';

// Lazy initialization to prevent crashes if API key is missing
let aiInstance: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    if (!API_KEY) {
      console.warn('GEMINI_API_KEY is not set. AI features will not work.');
    }
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiInstance;
};

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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: coords ? {
          retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } }
        } : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['state', 'country'] },
              suggestedRatingMatch: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["name", "type", "suggestedRatingMatch", "reason"]
          }
        }
      },
    });

    const recs = JSON.parse(response.text || '[]');
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

/**
 * Squad Activity Consultant: Suggests activities for a group
 */
export const getSquadActivitySuggestions = async (squad: SquadTrip): Promise<string[]> => {
  const memberContext = squad.members.map(m => `${m.name} (${m.style})`).join(', ');
  const prompt = `Suggest 3 specific group activities or hidden gems in ${squad.destination} that would satisfy this squad: ${memberContext}. 
  The squad already has these items: ${squad.items.join(', ') || 'None'}.
  Focus on activities that blend different styles (e.g. food + history). Respond in a simple JSON array of strings.`;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Squad activity suggestion failed", error);
    return [];
  }
};

/**
 * Travel Muse: Proactive Pattern Analysis & Hidden Gems
 */
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: coords ? {
          retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } }
        } : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['pattern', 'gem'] },
              description: { type: Type.STRING },
              relevanceScore: { type: Type.NUMBER }
            },
            required: ["title", "type", "description", "relevanceScore"]
          }
        }
      },
    });

    const insights = JSON.parse(response.text || '[]');
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

/**
 * AI-Assisted Logging: Extracts info from a photo (receipt, ticket, etc.)
 */
export const analyzeLogImage = async (base64Image: string): Promise<Partial<TravelLocation>> => {
  const prompt = "Extract the travel location name, date (YYYY-MM-DD), and 3 potential highlights/pros from this image. If it's a receipt or ticket, look for city/country names and business names. Respond in JSON.";

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dateVisited: { type: Type.STRING },
            likes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dateVisited: { type: Type.STRING },
            likes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    return response.text || "This matches your unique travel DNA perfectly.";
  } catch (e) {
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rationale: { type: Type.STRING },
            bestTime: { type: Type.STRING },
            similarTo: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["rationale", "bestTime", "similarTo"]
        }
      }
    });
    return JSON.parse(response.text || '{"rationale": "Matches your style.", "bestTime": "Anytime", "similarTo": []}');
  } catch (e) {
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nature: { type: Type.NUMBER },
            culture: { type: Type.NUMBER },
            adventure: { type: Type.NUMBER },
            relaxation: { type: Type.NUMBER },
            food: { type: Type.NUMBER },
            urban: { type: Type.NUMBER }
          },
          required: ["nature", "culture", "adventure", "relaxation", "food", "urban"]
        }
      },
    });
    const result = JSON.parse(response.text || '{"nature": 50, "culture": 50, "adventure": 50, "relaxation": 50, "food": 50, "urban": 50}');
    cacheResponse(cacheKey, result);
    return result;
  } catch (error) {
    return { nature: 50, culture: 50, adventure: 50, relaxation: 50, food: 50, urban: 50 };
  }
};

export const getLocationDetails = async (name: string, type: LocationType): Promise<{ description: string; attractions: string[] }> => {
  const prompt = `2-sentence description of ${name} and 4 key attractions. JSON format.`;
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            attractions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["description", "attractions"]
        }
      },
    });
    return JSON.parse(response.text || '{"description": "", "attractions": []}');
  } catch (error) {
    return { description: "Great destination.", attractions: ["Local Culture"] };
  }
};

export const generateItinerary = async (name: string, type: LocationType, description: string, attractions: string[]): Promise<ItineraryDay[]> => {
  const prompt = `Generate a 3-day travel itinerary for ${name} using attractions: ${attractions.join(', ')}. JSON format with day, title, and activities.`;
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.NUMBER },
              title: { type: Type.STRING },
              activities: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["day", "title", "activities"]
          }
        }
      },
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

export const geocodeLocation = async (name: string, type: LocationType): Promise<{ lat: number; lng: number } | null> => {
  const prompt = `Lat/Lng for ${name} (${type}). JSON format.`;
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
          required: ["lat", "lng"]
        }
      }
    });
    return JSON.parse(response.text || 'null');
  } catch (error) {
    return null;
  }
};

/**
 * Generates an .ics content string for a 3-day itinerary
 */
export const exportItineraryToICS = (recName: string, days: ItineraryDay[]): string => {
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Travel Muse//Travel Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  const now = new Date();

  days.forEach((day, i) => {
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i);
    const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

    ics.push("BEGIN:VEVENT");
    ics.push(`SUMMARY:${recName} Day ${day.day}: ${day.title}`);
    ics.push(`DTSTART;VALUE=DATE:${dateStr}`);
    ics.push(`DESCRIPTION:${day.activities.join('\\n')}`);
    ics.push("END:VEVENT");
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
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
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['country', 'state', 'city', 'landmark'] },
            rating: { type: Type.NUMBER },
            likes: { type: Type.ARRAY, items: { type: Type.STRING } },
            dislikes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "type", "rating", "likes", "dislikes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
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
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];

    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['country', 'state', 'city', 'landmark'] },
            likes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "type", "likes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
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
