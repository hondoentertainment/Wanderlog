
import React, { useState } from 'react';
import { AIRecommendation, TravelLocation, UserProfile } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { Button } from './Button';
import { StarRating } from './StarRating';

interface RecommendationsProps {
  visitedLocations: TravelLocation[];
  profile: UserProfile;
  onSave: (rec: AIRecommendation) => void;
  savedNames: string[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ 
  visitedLocations, 
  profile, 
  onSave,
  savedNames
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    let coords: { latitude: number; longitude: number } | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.warn("Geolocation denied", e);
    }

    try {
      const recs = await getAIRecommendations(visitedLocations, profile, coords);
      setRecommendations(recs);
    } catch (err) {
      setError("AI generation failed. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2c3440] pb-2">
        <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest flex items-center gap-2">
          Recommended for you
        </h2>
        <Button 
          onClick={fetchRecommendations} 
          isLoading={loading}
          variant="ghost"
          className="!text-[10px] !px-2 !py-1"
        >
          {recommendations.length > 0 ? 'REFRESH' : 'GET SUGGESTIONS'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-500 p-4 rounded-sm text-[11px] font-bold uppercase tracking-tight">
          {error}
        </div>
      )}

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {recommendations.map((rec, idx) => {
            const isAlreadySaved = savedNames.includes(rec.name);
            return (
              <div key={idx} className="bg-[#1b2228] p-5 rounded border border-[#2c3440] flex flex-col h-full group transition-all hover:border-[#456]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#40bcf4] tracking-widest block mb-1">
                      {rec.type}
                    </span>
                    <h3 className="text-lg font-black text-white leading-none tracking-tight">
                      {rec.name}
                    </h3>
                  </div>
                  <div className="bg-[#00e054]/10 text-[#00e054] px-1.5 py-0.5 rounded-sm text-[10px] font-black tracking-tighter">
                    {rec.suggestedRatingMatch}%
                  </div>
                </div>
                
                <p className="text-[#9ab] text-[12px] leading-relaxed italic mb-6 flex-grow border-l border-[#2c3440] pl-3">
                  "{rec.reason}"
                </p>

                <div className="space-y-4">
                   {rec.links && rec.links.length > 0 && (
                     <div className="flex gap-2">
                        {rec.links.slice(0, 1).map((link, lidx) => (
                           <a key={lidx} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-[#567] hover:text-white transition-colors">
                             <i className="fas fa-map text-[8px] mr-1"></i> {link.title}
                           </a>
                        ))}
                     </div>
                   )}
                   <Button 
                    variant={isAlreadySaved ? "ghost" : "primary"} 
                    className={`w-full !py-2 ${isAlreadySaved ? 'text-[#00e054] hover:!bg-transparent' : ''}`}
                    onClick={() => onSave(rec)}
                    disabled={isAlreadySaved}
                  >
                    {isAlreadySaved ? <><i className="fas fa-check"></i> SAVED</> : <><i className="fas fa-plus"></i> WISHLIST</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && (
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[#2c3440] rounded opacity-30">
          <i className="fas fa-film text-2xl mb-3"></i>
          <p className="text-[10px] font-black uppercase tracking-widest">Get personalized travel picks</p>
        </div>
      )}
    </div>
  );
};
