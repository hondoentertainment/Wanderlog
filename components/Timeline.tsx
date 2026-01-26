
import React from 'react';
import { TravelLocation } from '../types';

interface TimelineProps {
  locations: TravelLocation[];
  onTravel: (loc: TravelLocation) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ locations, onTravel }) => {
  const sorted = [...locations].sort((a, b) => new Date(a.dateVisited).getTime() - new Date(b.dateVisited).getTime());

  if (locations.length === 0) return null;

  return (
    <div className="relative pt-4 pb-8 overflow-x-auto">
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#2c3440] -translate-y-1/2"></div>
      <div className="flex items-center gap-12 px-8 min-w-max relative z-10">
        {sorted.map((loc, i) => (
          <div 
            key={loc.id} 
            className="flex flex-col items-center group cursor-pointer"
            onClick={() => onTravel(loc)}
          >
            <div className="text-[9px] font-black text-[#567] uppercase tracking-tighter mb-4 transition-colors group-hover:text-white">
              {new Date(loc.dateVisited).getFullYear()}
            </div>
            <div className="w-4 h-4 rounded-full bg-[#14181c] border-2 border-[#2c3440] group-hover:border-[#00e054] group-hover:scale-125 transition-all mb-4 relative flex items-center justify-center">
               <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#00e054] transition-colors"></div>
               {/* Vertical line indicator */}
               <div className={`absolute top-1/2 -translate-y-1/2 w-[2px] h-12 bg-[#2c3440] -z-10 ${i % 2 === 0 ? '-bottom-12 top-auto' : '-top-12'}`}></div>
            </div>
            <div className={`absolute whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${i % 2 === 0 ? 'mt-24 text-[#9ab] group-hover:text-white' : '-mt-24 text-[#def] group-hover:text-[#00e054]'}`}>
              {loc.name}
              <div className="text-[8px] font-bold opacity-40 mt-0.5">{new Date(loc.dateVisited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
