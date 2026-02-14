
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

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: coords ? {
          retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } }
        } : undefined
      },
    });

    const text = response.text || '';
    const recs: AIRecommendation[] = [];
    const sections = text.split('---').filter(s => s.trim().length > 0);

    for (const section of sections) {
      const nameMatch = section.match(/NAME:\s*(.*)/i);
      const typeMatch = section.match(/TYPE:\s*(.*)/i);
      const scoreMatch = section.match(/SCORE:\s*(\d+)/i);
      const reasonMatch = section.match(/REASON:\s*([\s\S]*)/i);

      if (nameMatch && typeMatch && scoreMatch) {
        recs.push({
          name: nameMatch[1].trim(),
          type: typeMatch[1].trim().toLowerCase().includes('state') ? LocationType.STATE : LocationType.COUNTRY,
          suggestedRatingMatch: parseInt(scoreMatch[1]),
          reason: reasonMatch ? reasonMatch[1].trim() : 'Perfect match for your travel style.'
        });
      }
    }

    return recs.slice(0, 3);
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

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: coords ? {
          retrievalConfig: { latLng: { latitude: coords.latitude, longitude: coords.longitude } }
        } : undefined
      },
    });

    const text = response.text || '';
    const insights: TravelMuseInsight[] = [];
    const sections = text.split('---').filter(s => s.trim().length > 0);

    for (const section of sections) {
      const titleMatch = section.match(/TITLE:\s*(.*)/i);
      const typeMatch = section.match(/TYPE:\s*(.*)/i);
      const descMatch = section.match(/DESCRIPTION:\s*([\s\S]*?)RELEVANCE:/i) || section.match(/DESCRIPTION:\s*([\s\S]*)/i);
      const relevanceMatch = section.match(/RELEVANCE:\s*(\d+)/i);

      if (titleMatch && typeMatch && descMatch) {
        insights.push({
          id: crypto.randomUUID(),
          title: titleMatch[1].trim(),
          type: typeMatch[1].trim().toLowerCase() as 'pattern' | 'gem',
          description: descMatch[1].trim(),
          relevanceScore: relevanceMatch ? parseInt(relevanceMatch[1]) : 80
        });
      }
    }

    return insights;
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
    return JSON.parse(response.text || '{"nature": 50, "culture": 50, "adventure": 50, "relaxation": 50, "food": 50, "urban": 50}');
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
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "I'm having trouble thinking right now. Give me a moment and try again!";
  } catch (error) {
    console.error("Error in askJules:", error);
    return "Oops! I seem to be having a connection issue. Please try again in a moment. ✈️";
  }
};
