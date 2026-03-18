
import React from 'react';
import { TravelLocation } from '../types';
import { FlightTracker } from './FlightTracker';

interface TimelineProps {
  locations: TravelLocation[];
  onTravel: (loc: TravelLocation) => void;
  onShare?: (loc: TravelLocation) => void;
  onSimulateSync?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ locations, onTravel, onShare, onSimulateSync }) => {
  const sorted = [...locations].sort((a, b) => new Date(a.dateVisited).getTime() - new Date(b.dateVisited).getTime());

  if (locations.length === 0) return null;

  return (
    <div className="flex flex-col mb-12">
      {/* Flight Pricing Heatmap */}
      <div className="px-8 max-w-sm mb-2">
        <FlightTracker />
      </div>

      {/* Data Ingestion Demo (VC Pitch) */}
      {onSimulateSync && (
        <div className="w-full max-w-sm ml-8 mb-8">
          <button
            onClick={onSimulateSync}
            className="w-full flex items-center justify-center gap-3 bg-[#1b2228] border border-[#2c3440] hover:border-[#00e054] text-[#def] hover:text-[#00e054] px-4 py-3 rounded-xl shadow-lg transition-all group"
          >
            <i className="fas fa-envelope-open-text text-[#567] group-hover:text-[#00e054] transition-colors"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Auto-Sync Flight Confirmations</span>
          </button>
        </div>
      )}

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
              <div className={`absolute whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${i % 2 === 0 ? 'mt-32 text-[#9ab] group-hover:text-white' : '-mt-32 text-[#def] group-hover:text-[#00e054]'}`}>
                {loc.name}
                <div className="text-[8px] font-bold opacity-40 mt-0.5">{new Date(loc.dateVisited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>

                {/* Photo Preview in Timeline */}
                {loc.photoUrls && loc.photoUrls.length > 0 && (
                  <div className={`mt-2 flex gap-1 ${i % 2 === 0 ? 'mb-4' : 'mt-4'}`}>
                    {loc.photoUrls.slice(0, 3).map((url, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-md overflow-hidden border border-[#2c3440] shadow-xl transform transition-transform group-hover:scale-110">
                        <img src={url} alt="Visit" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {loc.photoUrls.length > 3 && (
                      <div className="w-8 h-8 rounded-md bg-[#2c3440] flex items-center justify-center text-[8px] font-black text-[#567]">
                        +{loc.photoUrls.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Share Icon Overlay */}
                {onShare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShare(loc); }}
                    className="mt-3 text-[#567] hover:text-[#00e054] transition-colors"
                    title="Share Trip"
                  >
                    <i className="fas fa-share-alt text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
