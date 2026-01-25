
import { GoogleGenAI, Type } from "@google/genai";
import { TravelLocation, AIRecommendation, UserProfile, GroundingLink, LocationType } from "../types";

export const getAIRecommendations = async (
  visitedLocations: TravelLocation[], 
  profile: UserProfile,
  coords?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> => {
  if (visitedLocations.length === 0 && profile.bucketList.length === 0) {
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const historyText = visitedLocations.map(loc => 
    `- ${loc.name} (${loc.type}): Rating ${loc.rating}/5. Likes: ${loc.likes.join(', ')}. Dislikes: ${loc.dislikes.join(', ')}.`
  ).join('\n');

  const profileText = `
    User Bio: ${profile.bio}
    Travel Style: ${profile.travelStyle.join(', ')}
    Bucket List Interests: ${profile.bucketList.join(', ')}
  `;

  const prompt = `Based on my travel profile and history, recommend exactly 3 new states or countries I should visit.
  
  My Profile:
  ${profileText}

  My History:
  ${historyText}

  Use Google Maps and Search to find real, interesting places. If I am currently near ${coords ? `${coords.latitude}, ${coords.longitude}` : 'unknown'}, consider nearby options as well.
  
  For each recommendation, provide exactly these fields in order:
  NAME: [Location Name]
  TYPE: [state or country]
  SCORE: [number 0-100]
  REASON: [Short reason why I would like it]
  ---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: coords ? {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        } : undefined
      },
    });

    const text = response.text || '';
    const candidates = response.candidates || [];
    const groundingMetadata = candidates[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    
    const links: GroundingLink[] = groundingChunks.map((chunk: any) => {
      if (chunk.maps) {
        return { title: chunk.maps.title || 'View on Maps', uri: chunk.maps.uri };
      }
      if (chunk.web) {
        return { title: chunk.web.title || 'Source', uri: chunk.web.uri };
      }
      return null;
    }).filter((l: any): l is GroundingLink => l !== null);

    const recs: AIRecommendation[] = [];
    const sections = text.split('---').filter(s => s.trim().length > 0);

    for (const section of sections) {
      const nameMatch = section.match(/NAME:\s*(.*)/i);
      const typeMatch = section.match(/TYPE:\s*(.*)/i);
      const scoreMatch = section.match(/SCORE:\s*(\d+)/i);
      const reasonMatch = section.match(/REASON:\s*([\s\S]*)/i);

      if (nameMatch && typeMatch && scoreMatch) {
        const name = nameMatch[1].trim();
        const typeStr = typeMatch[1].trim().toLowerCase();
        
        recs.push({
          name,
          type: typeStr.includes('state') ? LocationType.STATE : LocationType.COUNTRY,
          suggestedRatingMatch: parseInt(scoreMatch[1]),
          reason: reasonMatch ? reasonMatch[1].trim() : 'Perfect match for your travel style.',
          links: links.filter(l => l.title.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(l.title.toLowerCase()))
        });
      }
    }

    return recs.length > 0 ? recs.slice(0, 3) : [];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
};

/**
 * Fetches enriched details about a location using Google Search grounding.
 */
export const getLocationDetails = async (name: string, type: LocationType): Promise<{ description: string; attractions: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Provide a brief, enticing 2-sentence description of ${name} (${type}) and a list of 4 key attractions or things to do there. 
  Focus on unique cultural or natural highlights. Respond in a clean format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "A 2-sentence summary of the location." },
            attractions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 4 top attractions."
            }
          },
          required: ["description", "attractions"]
        }
      },
    });

    return JSON.parse(response.text || '{"description": "", "attractions": []}');
  } catch (error) {
    console.error("Error fetching location details:", error);
    return { 
      description: "No additional details found, but definitely worth exploring!", 
      attractions: ["Historical sites", "Local cuisine", "Nature walks", "Cultural landmarks"] 
    };
  }
};

/**
 * Geocodes a location name using Gemini.
 */
export const geocodeLocation = async (name: string, type: LocationType): Promise<{ lat: number; lng: number } | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Return the approximate latitude and longitude coordinates for the center of ${name} (${type}) as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["lat", "lng"]
        }
      }
    });

    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
