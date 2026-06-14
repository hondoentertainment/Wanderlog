import React from 'react';
import { CompanionType } from '../types';

const COMPANION_TYPES: CompanionType[] = ['solo', 'partner', 'family', 'friends', 'group'];

const LABELS: Record<CompanionType, string> = {
  solo: 'Solo',
  partner: 'Partner',
  family: 'Family',
  friends: 'Friends',
  group: 'Group',
};

interface CompanionFilterChipsProps {
  selected: CompanionType | null;
  onChange: (companion: CompanionType | null) => void;
  className?: string;
}

export const CompanionFilterChips: React.FC<CompanionFilterChipsProps> = ({
  selected,
  onChange,
  className = '',
}) => (
  <div
    data-testid="companion-filter-bar"
    className={`flex flex-wrap gap-2 ${className}`}
    role="group"
    aria-label="Filter memories by travel companion"
  >
    {COMPANION_TYPES.map((c) => (
      <button
        key={c}
        type="button"
        data-testid={`companion-filter-${c}`}
        onClick={() => onChange(selected === c ? null : c)}
        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
          selected === c
            ? 'bg-[#00e054] text-[#14181c]'
            : 'bg-[#2c3440] text-[#9ab] hover:text-white'
        }`}
      >
        {LABELS[c]}
      </button>
    ))}
  </div>
);
