import { randomUUID } from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import {
  LocationType,
  type AIRecommendation,
  type ItineraryDay,
  type SquadTrip,
  type TravelDNA,
  type TravelLocation,
  type TravelMuseInsight,
  type UserProfile,
  type VibeType,
} from '../../types';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export type GeminiAction =
  | 'getAIRecommendations'
  | 'getSquadActivitySuggestions'
  | 'getTravelMuseInsights'
  | 'analyzeLogImage'
  | 'performSemanticSearch'
  | 'generateTravelDNA'
  | 'getLocationDetails'
  | 'generateItinerary'
  | 'geocodeLocation';

export async function runGeminiAction(action: GeminiAction, payload: unknown): Promise<unknown> {
  switch (action) {
    case 'getAIRecommendations': {
      const p = payload as {
        visitedLocations: TravelLocation[];
        profile: UserProfile;
        coords?: { latitude: number; longitude: number };
        vibe?: VibeType;
      };
      return getAIRecommendations(p.visitedLocations, p.profile, p.coords, p.vibe);
    }
    case 'getSquadActivitySuggestions':
      return getSquadActivitySuggestions((payload as { squad: SquadTrip }).squad);
    case 'getTravelMuseInsights': {
      const p = payload as {
        visitedLocations: TravelLocation[];
        profile: UserProfile;
        coords?: { latitude: number; longitude: number };
      };
      return getTravelMuseInsights(p.visitedLocations, p.profile, p.coords);
    }
    case 'analyzeLogImage':
      return analyzeLogImage((payload as { base64Image: string }).base64Image);
    case 'performSemanticSearch':
      return performSemanticSearch(
        (payload as { query: string; locations: TravelLocation[] }).query,
        (payload as { locations: TravelLocation[] }).locations
      );
    case 'generateTravelDNA':
      return generateTravelDNA(
        (payload as { visitedLocations: TravelLocation[] }).visitedLocations,
        (payload as { profile: UserProfile }).profile
      );
    case 'getLocationDetails': {
      const p = payload as { name: string; type: LocationType };
      return getLocationDetails(p.name, p.type);
    }
    case 'generateItinerary': {
      const p = payload as {
        name: string;
        type: LocationType;
        description: string;
        attractions: string[];
      };
      return generateItinerary(p.name, p.type, p.description, p.attractions);
    }
    case 'geocodeLocation': {
      const p = payload as { name: string; type: LocationType };
      return geocodeLocation(p.name, p.type);
    }
    default:
      throw new Error(`Unknown action: ${String(action)}`);
  }
}

async function getAIRecommendations(
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number },
  vibe?: VibeType
): Promise<AIRecommendation[]> {
  if (visitedLocations.length === 0 && profile.bucketList.length === 0 && !vibe) {
    return [];
  }

  const historyText = visitedLocations
    .map((loc) => `- ${loc.name} (${loc.type}): Rating ${loc.rating}/5. Likes: ${loc.likes.join(', ')}.`)
    .join('\n');

  const vibePrompt = vibe ? `Current User Vibe: ${vibe}. Prioritize recommendations that fit this mood.` : '';

  const prompt = `Based on my travel profile and history, recommend exactly 3 new states or countries I should visit.
  
  User Styles: ${profile.travelStyle.join(', ')}
  ${vibePrompt}

  My History:
  ${historyText}

  Use Google Maps and Search to find real, interesting places.
  
  For each recommendation, provide exactly these fields in order:
  NAME: [Location Name]
  TYPE: [state or country]
  SCORE: [number 0-100]
  REASON: [Short reason why I would like it]
  ---`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: coords
        ? {
            retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } },
          }
        : undefined,
    },
  });

  const text = response.text || '';
  const recs: AIRecommendation[] = [];
  const sections = text.split('---').filter((s) => s.trim().length > 0);

  for (const section of sections) {
    const nameMatch = section.match(/NAME:\s*(.*)/i);
    const typeMatch = section.match(/TYPE:\s*(.*)/i);
    const scoreMatch = section.match(/SCORE:\s*(\d+)/i);
    const reasonMatch = section.match(/REASON:\s*([\s\S]*)/i);

    if (nameMatch && typeMatch && scoreMatch) {
      recs.push({
        name: nameMatch[1].trim(),
        type: typeMatch[1].trim().toLowerCase().includes('state') ? LocationType.STATE : LocationType.COUNTRY,
        suggestedRatingMatch: parseInt(scoreMatch[1], 10),
        reason: reasonMatch ? reasonMatch[1].trim() : 'Perfect match for your travel style.',
      });
    }
  }

  return recs.slice(0, 3);
}

async function getSquadActivitySuggestions(squad: SquadTrip): Promise<string[]> {
  const memberContext = squad.members.map((m) => `${m.name} (${m.style})`).join(', ');
  const prompt = `Suggest 3 specific group activities or hidden gems in ${squad.destination} that would satisfy this squad: ${memberContext}. 
  The squad already has these items: ${squad.items.join(', ') || 'None'}.
  Focus on activities that blend different styles (e.g. food + history). Respond in a simple JSON array of strings.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });
  return JSON.parse(response.text || '[]') as string[];
}

async function getTravelMuseInsights(
  visitedLocations: TravelLocation[],
  profile: UserProfile,
  coords?: { latitude: number; longitude: number }
): Promise<TravelMuseInsight[]> {
  if (visitedLocations.length === 0) return [];

  const historyText = visitedLocations
    .map(
      (loc) =>
        `Location: ${loc.name}. Rating: ${loc.rating}/5. Likes: ${loc.likes.join(', ')}. Dislikes: ${loc.dislikes.join(', ')}.`
    )
    .join('\n');

  const prompt = `Analyze my travel history and profile to find 2 deep patterns and 1 'hidden gem' nearby (if location provided) or globally that matches my specific interests.
  
  My History:
  ${historyText}

  My Profile Styles: ${profile.travelStyle.join(', ')}
  Current Location: ${coords ? `${coords.latitude}, ${coords.longitude}` : 'Unknown'}

  For each insight, provide:
  TITLE: [Catchy title, e.g., 'Brutalist Enthusiast' or 'The Berlin Secret']
  TYPE: [pattern or gem]
  DESCRIPTION: [Deep insight into why I like this or what the hidden gem is. Be specific and conversational.]
  RELEVANCE: [0-100]
  ---`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: coords
        ? {
            retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } },
          }
        : undefined,
    },
  });

  const text = response.text || '';
  const insights: TravelMuseInsight[] = [];
  const sections = text.split('---').filter((s) => s.trim().length > 0);

  for (const section of sections) {
    const titleMatch = section.match(/TITLE:\s*(.*)/i);
    const typeMatch = section.match(/TYPE:\s*(.*)/i);
    const descMatch =
      section.match(/DESCRIPTION:\s*([\s\S]*?)RELEVANCE:/i) || section.match(/DESCRIPTION:\s*([\s\S]*)/i);
    const relevanceMatch = section.match(/RELEVANCE:\s*(\d+)/i);

    if (titleMatch && typeMatch && descMatch) {
      insights.push({
        id: randomUUID(),
        title: titleMatch[1].trim(),
        type: typeMatch[1].trim().toLowerCase() as 'pattern' | 'gem',
        description: descMatch[1].trim(),
        relevanceScore: relevanceMatch ? parseInt(relevanceMatch[1], 10) : 80,
      });
    }
  }

  return insights;
}

async function analyzeLogImage(base64Image: string): Promise<Partial<TravelLocation>> {
  const prompt =
    "Extract the travel location name, date (YYYY-MM-DD), and 3 potential highlights/pros from this image. If it's a receipt or ticket, look for city/country names and business names. Respond in JSON.";

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Image } }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dateVisited: { type: Type.STRING },
          likes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });
  return JSON.parse(response.text || '{}') as Partial<TravelLocation>;
}

async function performSemanticSearch(query: string, locations: TravelLocation[]): Promise<string[]> {
  const context = locations.map((l) => ({
    id: l.id,
    name: l.name,
    likes: l.likes,
    dislikes: l.dislikes,
    rating: l.rating,
  }));

  const prompt = `Given the following travel logs: ${JSON.stringify(context)}
  Find the IDs of the logs that best match the user's natural language search query: "${query}"
  Return only a JSON array of the IDs.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });
  return JSON.parse(response.text || '[]') as string[];
}

async function generateTravelDNA(visitedLocations: TravelLocation[], profile: UserProfile): Promise<TravelDNA> {
  const historyText = visitedLocations.map((loc) => `Loc: ${loc.name}. Likes: ${loc.likes.join(', ')}`).join('\n');
  const prompt = `Score Travel DNA (0-100) for axes: Nature, Culture, Adventure, Relaxation, Food, Urban based on history:\n${historyText}\nRespond in JSON.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
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
      },
    },
  });
  return JSON.parse(
    response.text || '{"nature": 50, "culture": 50, "adventure": 50, "relaxation": 50, "food": 50, "urban": 50}'
  ) as TravelDNA;
}

async function getLocationDetails(
  name: string,
  type: LocationType
): Promise<{ description: string; attractions: string[] }> {
  const prompt = `2-sentence description of ${name} and 4 key attractions. JSON format.`;
  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          attractions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['description', 'attractions'],
      },
    },
  });
  return JSON.parse(response.text || '{"description": "", "attractions": []}') as {
    description: string;
    attractions: string[];
  };
}

async function generateItinerary(
  name: string,
  type: LocationType,
  description: string,
  attractions: string[]
): Promise<ItineraryDay[]> {
  const prompt = `Generate a 3-day travel itinerary for ${name} using attractions: ${attractions.join(', ')}. JSON format with day, title, and activities.`;
  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
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
      },
    },
  });
  return JSON.parse(response.text || '[]') as ItineraryDay[];
}

async function geocodeLocation(name: string, type: LocationType): Promise<{ lat: number; lng: number } | null> {
  const prompt = `Lat/Lng for ${name} (${type}). JSON format.`;
  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
        required: ['lat', 'lng'],
      },
    },
  });
  return JSON.parse(response.text || 'null') as { lat: number; lng: number } | null;
}
