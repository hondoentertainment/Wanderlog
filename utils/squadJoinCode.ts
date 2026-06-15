import { SquadTrip } from '../types';

export interface SquadJoinPayload {
  squadId: string;
  name: string;
  destination: string;
  members?: { name: string; style: string }[];
}

export function encodeSquadJoinCode(trip: Pick<SquadTrip, 'id' | 'name' | 'destination' | 'members'>): string {
  const payload: SquadJoinPayload = {
    squadId: trip.id,
    name: trip.name,
    destination: trip.destination,
    members: trip.members,
  };
  return btoa(JSON.stringify(payload));
}

export function parseSquadJoinCode(code: string): SquadJoinPayload | null {
  try {
    const parsed = JSON.parse(atob(code.trim())) as Partial<SquadJoinPayload>;
    if (!parsed.name || !parsed.destination) return null;
    return {
      squadId: parsed.squadId || '',
      name: parsed.name,
      destination: parsed.destination,
      members: parsed.members,
    };
  } catch {
    return null;
  }
}
