import React, { useState, useEffect } from 'react';
import { TravelLocation, UserProfile } from '../types';
import { getDiscoveryContext, DiscoveryContext } from '../services/geminiService';
import { Button } from './Button';

interface DiscoveryIntelligenceProps {
    location: TravelLocation;
    visitedLocations: TravelLocation[];
    profile: UserProfile;
    onLogVisit: (loc: TravelLocation) => void;
    onSaveToWishlist: (name: string) => void;
}

export const DiscoveryIntelligence: React.FC<DiscoveryIntelligenceProps> = ({
    location,
    visitedLocations,
    profile,
    onLogVisit,
    onSaveToWishlist
}) => {
    const [context, setContext] = useState<DiscoveryContext | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true);
            const data = await getDiscoveryContext(location.name, visitedLocations, profile);
            setContext(data);
            setLoading(false);
        };
        fetchContext();
    }, [location.name]);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-[#1b2228] border border-[#2c3440]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b2228] via-[#2c3440] to-[#141d26] flex items-center justify-center">
                    <div className="text-[120px] opacity-10 blur-sm pointer-events-none">✨</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row items-end justify-between gap-6">
                    <div>
                        <span className="text-xs font-black text-[#40bcf4] uppercase tracking-widest mb-2 block">{location.type}</span>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{location.name}</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="bg-[#40bcf4]/20 border border-[#40bcf4]/30 text-[#40bcf4] hover:bg-[#40bcf4] hover:text-[#14181c] transition-all font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full" onClick={() => onSaveToWishlist(location.name)}>Save for Later</Button>
                        <Button variant="ghost" className="bg-[#00e054] text-[#14181c] hover:bg-white transition-all font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full" onClick={() => onLogVisit(location)}>Log Visit</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Why You'll Like This */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#1b2228]/40 border border-[#2c3440] p-8 rounded-3xl backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-[#40bcf4]/20 border border-[#40bcf4]/30 flex items-center justify-center text-[#40bcf4]">
                                <i className="fas fa-sparkles"></i>
                            </div>
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Why You'll Like This</h3>
                        </div>
                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-4 bg-[#2c3440] rounded w-3/4"></div>
                                <div className="h-4 bg-[#2c3440] rounded w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-[#9ab] text-lg leading-relaxed font-medium italic">
                                "{context?.rationale}"
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#1b2228]/40 border border-[#2c3440] p-8 rounded-3xl">
                            <h4 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-4">Best Time to Visit</h4>
                            <p className="text-xl font-black text-white uppercase italic">{context?.bestTime || 'Anytime'}</p>
                        </div>
                        <div className="bg-[#1b2228]/40 border border-[#2c3440] p-8 rounded-3xl">
                            <h4 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-4">Discovery Status</h4>
                            <p className="text-xl font-black text-[#40bcf4] uppercase italic">Strong Match</p>
                        </div>
                    </div>
                </div>

                {/* Similar To Sidebar */}
                <div className="space-y-8">
                    <div className="bg-[#1b2228]/60 border border-[#2c3440] p-8 rounded-3xl">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6">Similar to places you've loved</h3>
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-16 bg-[#2c3440] rounded-2xl animate-pulse"></div>)
                            ) : (
                                (context?.similarTo || []).map((name, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-[#2c3440]/30 rounded-2xl border border-[#2c3440]/50 group hover:border-[#40bcf4]/50 transition-all cursor-pointer">
                                        <span className="text-white font-black uppercase text-xs tracking-tighter">{name}</span>
                                        <i className="fas fa-chevron-right text-[#567] text-[10px] group-hover:text-[#40bcf4] transition-colors"></i>
                                    </div>
                                ))
                            )}
                            {(!loading && (!context?.similarTo || context.similarTo.length === 0)) && (
                                <p className="text-[10px] text-[#567] font-bold uppercase tracking-widest text-center py-4">A unique first step for you</p>
                            )}
                        </div>
                    </div>

                    <Button variant="ghost" className="w-full bg-[#00e054]/10 hover:bg-[#00e054] text-[#00e054] hover:text-black border border-[#00e054]/20 py-4 font-black uppercase tracking-widest text-xs rounded-2xl">
                        Plan a 3-Day Trip
                    </Button>
                </div>
            </div>
        </div>
    );
};
