
import React, { useState } from 'react';
import { AIRecommendation, TravelLocation, UserProfile, VibeType } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { Button } from './Button';

interface RecommendationsProps {
  visitedLocations: TravelLocation[];
  profile: UserProfile;
  onSave: (rec: AIRecommendation) => void;
  savedNames: string[];
}

const VIBES: { id: VibeType; label: string; icon: string }[] = [
  { id: 'adventurous', label: 'Adventurous', icon: 'fa-hiking' },
  { id: 'tired', label: 'Tired / Lazy', icon: 'fa-bed' },
  { id: 'cultural', label: 'Cultural', icon: 'fa-monument' },
  { id: 'foodie', label: 'Foodie', icon: 'fa-utensils' },
  { id: 'nature-loving', label: 'Nature', icon: 'fa-leaf' },
];

export const Recommendations: React.FC<RecommendationsProps> = ({ 
  visitedLocations, 
  profile, 
  onSave,
  savedNames
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<VibeType | undefined>();

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
      const recs = await getAIRecommendations(visitedLocations, profile, coords, selectedVibe);
      setRecommendations(recs);
    } catch (err) {
      setError("AI generation failed. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#2c3440] pb-4 gap-4">
        <div>
          <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest flex items-center gap-2">
            Recommended for you
          </h2>
          <p className="text-[10px] text-[#567] font-bold mt-1 uppercase tracking-tighter">AI-Ranked based on your mood & profile</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <span className="text-[9px] font-black text-[#567] uppercase mr-2 hidden md:inline">Current Vibe:</span>
          {VIBES.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVibe(selectedVibe === v.id ? undefined : v.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                selectedVibe === v.id ? 'bg-[#00e054] border-[#00e054] text-black' : 'bg-transparent border-[#2c3440] text-[#567] hover:text-white'
              }`}
            >
              <i className={`fas ${v.icon}`}></i> {v.label}
            </button>
          ))}
        </div>

        <Button 
          onClick={fetchRecommendations} 
          isLoading={loading}
          variant="primary"
          className="!text-[10px] !px-4 !py-2 shrink-0"
        >
          {recommendations.length > 0 ? 'RERANK' : 'GET SUGGESTIONS'}
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
                    {rec.suggestedRatingMatch}% Match
                  </div>
                </div>
                
                <p className="text-[#9ab] text-[12px] leading-relaxed italic mb-6 flex-grow border-l border-[#2c3440] pl-3">
                  "{rec.reason}"
                </p>

                <Button 
                  variant={isAlreadySaved ? "ghost" : "primary"} 
                  className={`w-full !py-2 ${isAlreadySaved ? 'text-[#00e054] hover:!bg-transparent' : ''}`}
                  onClick={() => onSave(rec)}
                  disabled={isAlreadySaved}
                >
                  {isAlreadySaved ? <><i className="fas fa-check"></i> SAVED</> : <><i className="fas fa-plus"></i> WISHLIST</>}
                </Button>
              </div>
            );
          })}
        </div>
      ) : !loading && (
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[#2c3440] rounded opacity-30">
          <i className="fas fa-magic text-2xl mb-3"></i>
          <p className="text-[10px] font-black uppercase tracking-widest">Personalize with your Current Vibe</p>
        </div>
      )}
    </div>
  );
};
