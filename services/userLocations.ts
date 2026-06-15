import { TravelLocation } from '../types';

/** Locations are stored on the user document (`locations` array), not a subcollection. */
export function getLocationsFromUserData(
  data: { locations?: TravelLocation[] } | undefined,
): TravelLocation[] {
  return data?.locations ?? [];
}

export function getVisitedLocations(
  data: { locations?: TravelLocation[] } | undefined,
): TravelLocation[] {
  return getLocationsFromUserData(data).filter((loc) => loc.isVisited !== false);
}

/** Alias for friendService / stats consumers. */
export const getVisitedLocationsFromUserDoc = getVisitedLocations;
