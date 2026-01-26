
import React from 'react';
import { TravelMuseInsight } from '../types';

interface TravelMuseProps {
  insights: TravelMuseInsight[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const TravelMuse: React.FC<TravelMuseProps> = ({ insights, isLoading, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2c3440] pb-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-sparkles text-[#00e054] text-xs"></i>
          <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest">Jules</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[9px] font-black uppercase text-[#00e054] hover:text-white transition-colors disabled:opacity-20 flex items-center gap-2"
        >
          {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-brain"></i>}
          ASK JULES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1b2228] p-6 rounded border border-[#2c3440] animate-pulse h-40">
              <div className="h-4 w-24 bg-[#2c3440] rounded mb-4"></div>
              <div className="h-3 w-full bg-[#2c3440] rounded mb-2"></div>
              <div className="h-3 w-2/3 bg-[#2c3440] rounded"></div>
            </div>
          ))
        ) : insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`bg-[#1b2228] p-6 rounded border transition-all hover:bg-[#202830] flex flex-col justify-between h-full ${insight.type === 'gem' ? 'border-[#ff8000]/30 border-l-4 border-l-[#ff8000]' : 'border-[#2c3440]'
                }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm ${insight.type === 'gem' ? 'bg-[#ff8000]/20 text-[#ff8000]' : 'bg-[#40bcf4]/20 text-[#40bcf4]'
                    }`}>
                    {insight.type === 'gem' ? 'Hidden Gem' : 'Pattern Found'}
                  </span>
                  <span className="text-[9px] font-black text-[#567]">{insight.relevanceScore}% match</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">{insight.title}</h3>
                <p className="text-[11px] text-[#9ab] leading-relaxed italic">
                  "{insight.description}"
                </p>
              </div>

              {insight.links && insight.links.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2c3440] flex gap-3">
                  {insight.links.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-[#00e054] hover:text-white flex items-center gap-1.5 transition-colors">
                      <i className="fas fa-link text-[7px]"></i> {link.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-[#2c3440] rounded opacity-30 text-center">
            <i className="fas fa-robot text-2xl mb-3"></i>
            <p className="text-[10px] font-black uppercase tracking-widest px-8">
              Jules is waiting. Log more trips to let Jules discover hidden patterns in your travel style.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
