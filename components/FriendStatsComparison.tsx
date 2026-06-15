import React from 'react';
import type { StatComparison } from '../types';

interface FriendStatsComparisonProps {
  friendName: string;
  comparison: StatComparison;
  onClose: () => void;
}

export const FriendStatsComparison: React.FC<FriendStatsComparisonProps> = ({
  friendName,
  comparison,
  onClose,
}) => (
  <div
    data-testid="friend-stats-comparison"
    className="border border-[#40bcf4]/40 rounded-xl p-6 bg-[#14181c] space-y-4 animate-in fade-in duration-300"
  >
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-black text-white uppercase tracking-widest italic">
        You vs {friendName}
      </h4>
      <button
        type="button"
        onClick={onClose}
        className="text-[10px] font-bold text-[#567] hover:text-white uppercase"
      >
        Close
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#1b2228] p-4 rounded-lg border border-[#2c3440] text-center">
        <p className="text-[9px] font-black text-[#567] uppercase tracking-widest mb-1">Your score</p>
        <p className="text-2xl font-black text-[#00e054]">{comparison.userScore}</p>
      </div>
      <div className="bg-[#1b2228] p-4 rounded-lg border border-[#2c3440] text-center">
        <p className="text-[9px] font-black text-[#567] uppercase tracking-widest mb-1">{friendName}</p>
        <p className="text-2xl font-black text-[#40bcf4]">{comparison.friendScore}</p>
      </div>
    </div>

    {comparison.mutualDestinations.length > 0 && (
      <div>
        <p className="text-[10px] font-black text-[#9ab] uppercase tracking-widest mb-2">
          Mutual ({comparison.mutualDestinations.length})
        </p>
        <p className="text-xs text-[#def]">{comparison.mutualDestinations.slice(0, 8).join(', ')}</p>
      </div>
    )}

    {comparison.userUnique.length > 0 && (
      <div>
        <p className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-2">Only you</p>
        <p className="text-xs text-[#9ab]">{comparison.userUnique.slice(0, 5).join(', ')}</p>
      </div>
    )}

    {comparison.friendUnique.length > 0 && (
      <div>
        <p className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-2">Only {friendName}</p>
        <p className="text-xs text-[#9ab]">{comparison.friendUnique.slice(0, 5).join(', ')}</p>
      </div>
    )}
  </div>
);
