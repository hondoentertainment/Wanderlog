import type { SquadTrip, UserProfile } from '../types';
import { syncUserDirectory } from './userDirectory';
import { registerSquadJoinCode } from './squadJoinLookup';

/**
 * Idempotent post-login fixes: directory entry for friend search and join-code lookups.
 */
export async function runPostLoginMigrations(
  userId: string,
  profile: UserProfile,
  squadTrips: SquadTrip[],
): Promise<void> {
  await syncUserDirectory(userId, profile);

  const ownerId = userId;
  await Promise.all(
    squadTrips
      .filter((t) => t.joinCode?.trim())
      .map((t) => registerSquadJoinCode(t.id, t.joinCode, ownerId)),
  );
}
