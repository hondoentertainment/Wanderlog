import { describe, it, expect } from 'vitest';
import { getVisitedLocations, getLocationsFromUserData } from '../userLocations';
import { LocationType } from '../../types';

describe('userLocations', () => {
  it('returns empty array when data is undefined', () => {
    expect(getLocationsFromUserData(undefined)).toEqual([]);
    expect(getVisitedLocations(undefined)).toEqual([]);
  });

  it('filters out locations with isVisited false', () => {
    const data = {
      locations: [
        { id: '1', name: 'Paris', type: LocationType.COUNTRY, rating: 5, likes: [], dislikes: [], dateVisited: '2024-01-01', isVisited: true },
        { id: '2', name: 'Wish', type: LocationType.CITY, rating: 0, likes: [], dislikes: [], dateVisited: '2024-01-01', isVisited: false },
        { id: '3', name: 'Tokyo', type: LocationType.COUNTRY, rating: 4, likes: [], dislikes: [], dateVisited: '2024-02-01' },
      ],
    };
    const visited = getVisitedLocations(data);
    expect(visited.map((l) => l.name)).toEqual(['Paris', 'Tokyo']);
  });
});
