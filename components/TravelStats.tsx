import React, { useMemo } from 'react';
import { TravelLocation, LocationType, UserProfile } from '../types';

interface TravelStatsProps {
  locations: TravelLocation[];
  profile: UserProfile;
}

export const TravelStats: React.FC<TravelStatsProps> = ({ locations }) => {
  const stats = useMemo(() => {
    const visited = locations.filter(l => l.isVisited);
    const uniqueCountries = new Set(visited.filter(l => l.type === LocationType.COUNTRY).map(l => l.name)).size;
    const uniqueStates = new Set(visited.filter(l => l.type === LocationType.STATE).map(l => l.name)).size;
    
    // There are 195 universally recognized countries
    const worldPercentage = ((uniqueCountries / 195) * 100).toFixed(1);

    return {
      countries: uniqueCountries,
      states: uniqueStates,
      worldExplored: worldPercentage,
      totalTrips: visited.length,
    };
  }, [locations]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
      <StatBox icon="fa-globe-americas" label="World Explored" value={`${stats.worldExplored}%`} color="text-blue-400" bgColor="bg-blue-400/10" />
      <StatBox icon="fa-flag" label="Countries" value={stats.countries} color="text-yellow-400" bgColor="bg-yellow-400/10" />
      <StatBox icon="fa-map" label="States" value={stats.states} color="text-purple-400" bgColor="bg-purple-400/10" />
      <StatBox icon="fa-bookmark" label="Memories Logged" value={stats.totalTrips} color="text-[#00e054]" bgColor="bg-[#00e054]/10" />
    </div>
  );
};

const StatBox = ({ icon, label, value, color, bgColor }: { icon: string, label: string, value: string | number, color: string, bgColor: string }) => (
  <div className="bg-[#14181c] border border-[#2c3440] p-5 rounded-xl flex flex-col gap-3 hover:border-[#40bcf4]/50 transition-all group overflow-hidden relative">
    {/* Decorative glow */}
    <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    
    <div className={`w-10 h-10 rounded-lg bg-[#2c3440] flex items-center justify-center group-hover:scale-110 transition-transform`}>
      <i className={`fas ${icon} text-lg text-[#567] group-hover:${color} transition-colors`}></i>
    </div>
    <div>
      <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-[9px] font-black text-[#9ab] uppercase tracking-widest mt-1">{label}</div>
    </div>
  </div>
);
