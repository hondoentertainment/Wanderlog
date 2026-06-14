import React, { useMemo, useState } from 'react';
import { CompanionType, TravelLocation } from '../types';
import { CompanionFilterChips } from './CompanionFilterChips';

const COMPANION_TYPES: CompanionType[] = ['solo', 'partner', 'family', 'friends', 'group'];

const LABELS: Record<CompanionType, string> = {
  solo: 'Solo',
  partner: 'Partner',
  family: 'Family',
  friends: 'Friends',
  group: 'Group',
};

interface CompanionsManagerProps {
  locations: TravelLocation[];
  selectedCompanion?: CompanionType | null;
  onFilterChange?: (companion: CompanionType | null) => void;
}

export const CompanionsManager: React.FC<CompanionsManagerProps> = ({
  locations,
  selectedCompanion: selectedProp,
  onFilterChange,
}) => {
  const [selectedLocal, setSelectedLocal] = useState<CompanionType | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : selectedLocal;

  const counts = useMemo(() => {
    const map: Record<CompanionType, number> = {
      solo: 0,
      partner: 0,
      family: 0,
      friends: 0,
      group: 0,
    };
    for (const loc of locations) {
      if (!loc.companions?.length) {
        map.solo += 1;
        continue;
      }
      for (const c of loc.companions) {
        if (c in map) map[c] += 1;
      }
    }
    return map;
  }, [locations]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    return locations.filter((loc) =>
      selected === 'solo'
        ? !loc.companions?.length
        : loc.companions?.includes(selected),
    );
  }, [locations, selected]);

  const select = (c: CompanionType | null) => {
    if (selectedProp === undefined) setSelectedLocal(c);
    onFilterChange?.(c);
  };

  return (
    <div className="space-y-4 border border-[#2c3440] rounded-lg p-6 bg-[#14181c]/50">
      <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Travel companions</h3>
      <CompanionFilterChips selected={selected} onChange={select} />
      <div className="flex flex-wrap gap-2 text-[10px] text-[#567] font-bold uppercase">
        {COMPANION_TYPES.map((c) => (
          <span key={c}>
            {LABELS[c]} ({counts[c]})
          </span>
        ))}
      </div>
      {selected && (
        <p className="text-[10px] text-[#567] font-bold uppercase tracking-widest">
          {filtered.length} log{filtered.length === 1 ? '' : 's'} with {LABELS[selected].toLowerCase()}
        </p>
      )}
      {!locations.some((l) => l.companions?.length) && (
        <p className="text-[10px] text-[#567]">Tag companions when logging trips to see breakdowns here.</p>
      )}
    </div>
  );
};
