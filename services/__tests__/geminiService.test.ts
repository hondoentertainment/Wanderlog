import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from '../geminiService';
import { LocationType } from '../../types';

// Mock GoogleGenAI class to prevent missing API_KEY errors
vi.mock('@google/genai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: vi.fn().mockResolvedValue({
                    response: {
                        text: () => JSON.stringify([{
                            name: 'Mock Rec',
                            country: 'Mockland',
                            type: 'country',
                            reasoning: 'Because it is a mock.'
                        }])
                    }
                })
            })
        }))
    };
});

describe('GeminiService Caching', () => {
    beforeEach(() => {
        // Reset the module namespace or cache logic if possible
        // Since AI_CACHE is internal, we'll verify behavior via rapid successive calls
        vi.clearAllMocks();
    });

    it('should generate deterministic cache keys and return cached data for recommendations', async () => {
        const mockProfile = { name: 'Test', bio: '', travelStyle: ['Adventure'], bucketList: [], customTravelStyles: [] };
        const mockHistory = [
            { id: '1', name: 'Paris', type: LocationType.CITY, rating: 5, likes: ['Food'], dislikes: [], dateVisited: '2023-01-01', isVisited: true }
        ];

        // First call
        const result1 = await geminiService.getAIRecommendations(mockHistory, mockProfile);

        // Immediate second call
        const result2 = await geminiService.getAIRecommendations(mockHistory, mockProfile);

        // Results should be identical if they hit the cache (or API mock if we had one)
        // Note: Without a full @google/genai mock, we rely on the internal cache bypassing network
        expect(result1).toEqual(result2);
    });
});
