
import React from 'react';
import { TravelLocation, LocationType, TravelDNA } from '../types';

interface DashboardProps {
  locations: TravelLocation[];
  dna?: TravelDNA;
  onRefreshDNA?: () => void;
  isDNAlOading?: boolean;
}

const DNARadarChart: React.FC<{ dna: TravelDNA }> = ({ dna }) => {
  const axes = [
    { label: 'Nature', value: dna.nature },
    { label: 'Culture', value: dna.culture },
    { label: 'Adventure', value: dna.adventure },
    { label: 'Relaxation', value: dna.relaxation },
    { label: 'Food', value: dna.food },
    { label: 'Urban', value: dna.urban },
  ];

  const size = 180;
  const center = size / 2;
  const radius = (size / 2) * 0.7;

  const points = axes.map((axis, i) => {
    const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
    const factor = axis.value / 100;
    const x = center + radius * factor * Math.cos(angle);
    const y = center + radius * factor * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid lines */}
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={axes.map((_, i) => {
              const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
              const x = center + radius * level * Math.cos(angle);
              const y = center + radius * level * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            className="fill-none stroke-[#2c3440] stroke-[0.5]"
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={x} y2={y}
              className="stroke-[#2c3440] stroke-[0.5]"
            />
          );
        })}

        {/* Labels */}
        {axes.map((axis, i) => {
          const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
          const x = center + (radius + 20) * Math.cos(angle);
          const y = center + (radius + 20) * Math.sin(angle);
          return (
            <text
              key={i}
              x={x} y={y}
              className="fill-[#567] text-[7px] font-black uppercase tracking-widest text-center"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
          );
        })}

        {/* Data area */}
        <polygon
          points={points}
          className="fill-[#00e054]/20 stroke-[#00e054] stroke-2"
        />
      </svg>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ locations, dna, onRefreshDNA, isDNAlOading }) => {
  const visitedStates = new Set(
    locations
      .filter(l => l.type === LocationType.STATE)
      .map(l => l.name)
  );
  
  const visitedCountries = new Set(
    locations
      .filter(l => l.type === LocationType.COUNTRY)
      .map(l => l.name)
  );

  const statesCount = visitedStates.size;
  const countriesCount = visitedCountries.size;
  
  const totalStates = 50;
  const totalCountriesEstimate = 195; 

  const statesPercentage = Math.min(Math.round((statesCount / totalStates) * 100), 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      {/* States Card */}
      <div className="bg-[#1b2228] border border-[#2c3440] p-6 rounded-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <i className="fas fa-map text-6xl text-white"></i>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-1">States Visited</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{statesCount}</span>
              <span className="text-sm font-bold text-[#567]">/ {totalStates}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-[#00e054] uppercase tracking-tighter mb-1">{statesPercentage}% Complete</div>
            <div className="text-[10px] font-black text-[#567] uppercase tracking-widest">{totalStates - statesCount} REMAINING</div>
          </div>
        </div>

        <div className="w-full h-1.5 bg-[#2c3440] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#00e054] transition-all duration-1000 ease-out" 
            style={{ width: `${statesPercentage}%` }}
          />
        </div>
      </div>

      {/* DNA Card */}
      <div className="bg-[#1b2228] border border-[#2c3440] p-6 rounded-sm relative flex flex-col items-center justify-center group row-span-1 md:row-span-1">
        <div className="w-full flex justify-between items-center mb-4 absolute top-4 left-0 px-6">
           <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest">Travel DNA</h3>
           <button 
            onClick={onRefreshDNA} 
            disabled={isDNAlOading || locations.length === 0}
            className="text-[9px] font-black uppercase text-[#00e054] hover:text-white transition-colors disabled:opacity-20"
           >
             {isDNAlOading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
           </button>
        </div>
        
        {dna ? (
          <div className="mt-4">
            <DNARadarChart dna={dna} />
          </div>
        ) : (
          <div className="text-center py-8 opacity-20">
             <i className="fas fa-dna text-3xl mb-2 block"></i>
             <p className="text-[8px] font-black uppercase tracking-widest">Analyze history to generate DNA</p>
          </div>
        )}
      </div>

      {/* Countries Card */}
      <div className="bg-[#1b2228] border border-[#2c3440] p-6 rounded-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <i className="fas fa-globe-americas text-6xl text-white"></i>
        </div>

        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-1">Countries Visited</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{countriesCount}</span>
              <span className="text-sm font-bold text-[#567]">/ {totalCountriesEstimate}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-[#40bcf4] uppercase tracking-tighter mb-1">World Explorer</div>
            <div className="text-[10px] font-black text-[#567] uppercase tracking-widest">Global Footprint</div>
          </div>
        </div>

        <div className="w-full h-1.5 bg-[#2c3440] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#40bcf4] transition-all duration-1000 ease-out" 
            style={{ width: `${Math.max(5, (countriesCount / 20) * 100)}%` }} // Visual feedback even for low counts
          />
        </div>
      </div>
    </div>
  );
};
