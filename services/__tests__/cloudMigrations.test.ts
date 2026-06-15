import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPostLoginMigrations } from '../cloudMigrations';

vi.mock('../userDirectory', () => ({
  syncUserDirectory: vi.fn(),
}));

vi.mock('../squadJoinLookup', () => ({
  registerSquadJoinCode: vi.fn(),
}));

import { syncUserDirectory } from '../userDirectory';
import { registerSquadJoinCode } from '../squadJoinLookup';

describe('runPostLoginMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs directory and registers join codes for squads', async () => {
    await runPostLoginMigrations(
      'user-1',
      { name: 'Kyle', travelStyle: [], bucketList: [], customTravelStyles: [] },
      [
        {
          id: 't1',
          name: 'Trip',
          destination: 'X',
          members: [],
          items: [],
          joinCode: 'code-abc',
          createdAt: '',
        },
        {
          id: 't2',
          name: 'No code',
          destination: 'Y',
          members: [],
          items: [],
          joinCode: '',
          createdAt: '',
        },
      ],
    );

    expect(syncUserDirectory).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'Kyle' }));
    expect(registerSquadJoinCode).toHaveBeenCalledTimes(1);
    expect(registerSquadJoinCode).toHaveBeenCalledWith('t1', 'code-abc', 'user-1');
  });
});
