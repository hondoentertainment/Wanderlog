import { describe, it, expect } from 'vitest';
import { filterLocationsByCompanion } from '../filterByCompanion';
import { LocationType } from '../../types';

const base = {
  type: LocationType.COUNTRY,
  rating: 4,
  likes: [],
  dislikes: [],
  dateVisited: '2024-01-01',
  isVisited: true,
};

describe('filterLocationsByCompanion', () => {
  const locations = [
    { ...base, id: '1', name: 'A', companions: ['family' as const] },
    { ...base, id: '2', name: 'B' },
  ];

  it('returns all when filter is null', () => {
    expect(filterLocationsByCompanion(locations, null)).toHaveLength(2);
  });

  it('filters solo (no companions)', () => {
    expect(filterLocationsByCompanion(locations, 'solo').map((l) => l.id)).toEqual(['2']);
  });

  it('filters family', () => {
    expect(filterLocationsByCompanion(locations, 'family').map((l) => l.id)).toEqual(['1']);
  });
});
