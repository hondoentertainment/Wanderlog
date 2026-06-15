import { CompanionType, TravelLocation } from '../types';

export function filterLocationsByCompanion(
  locations: TravelLocation[],
  companion: CompanionType | null,
): TravelLocation[] {
  if (!companion) return locations;
  return locations.filter((loc) =>
    companion === 'solo'
      ? !loc.companions?.length
      : loc.companions?.includes(companion),
  );
}
