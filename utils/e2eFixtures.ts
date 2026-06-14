import { LocationType, type TravelLocation } from '../types';

/** Injected when VITE_E2E_FIXTURES=true (Playwright webServer env). */
export const E2E_MOCK_LOCATIONS: TravelLocation[] = [
  {
    id: 'e2e-solo',
    name: 'Paris',
    type: LocationType.CITY,
    rating: 5,
    likes: ['cafes'],
    dislikes: [],
    dateVisited: '2024-06-01',
    isVisited: true,
    companions: [],
  },
  {
    id: 'e2e-family',
    name: 'Orlando',
    type: LocationType.CITY,
    rating: 4,
    likes: ['parks'],
    dislikes: [],
    dateVisited: '2024-07-01',
    isVisited: true,
    companions: ['family'],
  },
];
