import { describe, it, expect } from 'vitest';
import { mergeSquadTrips } from '../squadTripService';
import { SquadTrip } from '../../types';

const base = (id: string, name: string): SquadTrip => ({
  id,
  name,
  destination: 'X',
  members: [],
  items: [],
  joinCode: '',
  createdAt: '',
});

describe('mergeSquadTrips', () => {
  it('merges cloud-only trips without duplicating embedded ids', () => {
    const embedded = [base('a', 'A')];
    const cloud = [base('a', 'A-old'), base('b', 'B')];
    const merged = mergeSquadTrips(embedded, cloud);
    expect(merged.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(merged.find((t) => t.id === 'a')?.name).toBe('A');
  });
});
