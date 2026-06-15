import { describe, it, expect } from 'vitest';
import { encodeSquadJoinCode, parseSquadJoinCode } from '../squadJoinCode';

describe('squadJoinCode', () => {
  it('round-trips squad id in join code', () => {
    const code = encodeSquadJoinCode({
      id: 'trip-abc',
      name: 'Tokyo',
      destination: 'Japan',
      members: [{ name: 'K', style: 'Foodie' }],
    });
    const parsed = parseSquadJoinCode(code);
    expect(parsed?.squadId).toBe('trip-abc');
    expect(parsed?.name).toBe('Tokyo');
  });

  it('returns null for invalid code', () => {
    expect(parseSquadJoinCode('not-valid')).toBeNull();
  });
});
