import React, { useState, useEffect } from 'react';
import { TravelLocation, UserProfile } from '../types';
import { getDiscoveryContext, DiscoveryContext, generateItinerary, exportItineraryToICS } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './Toast';

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
    const [itinerary, setItinerary] = useState<any[] | null>(null);
    const [isPlanning, setIsPlanning] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true);
            try {
                const data = await getDiscoveryContext(location.name, visitedLocations, profile);
                setContext(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchContext();
    }, [location.name]);

    const handlePlanTrip = async () => {
        setIsPlanning(true);
        showToast(`Jules is crafting an itinerary for ${location.name}...`, 'info');
        try {
            const data = await generateItinerary(location.name, profile);
            setItinerary(data);
            showToast("Trip planned! See below.", 'success');
        } catch (e) {
            showToast("AI planning failed.", "error");
        } finally {
            setIsPlanning(false);
        }
    };

    const handleExportToCalendar = () => {
        if (!itinerary) return;
        try {
            exportItineraryToICS(location.name, itinerary);
            showToast("Itinerary exported to Calendar (.ics)", "success");
        } catch (e) {
            showToast("Export failed.", "error");
        }
    };

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

                    {itinerary ? (
                        <div className="space-y-4">
                            <Button variant="primary" className="w-full !py-4" onClick={handleExportToCalendar}>
                                <i className="fas fa-calendar-plus mr-2"></i> Add to Calendar
                            </Button>
                            <div className="bg-[#1b2228]/80 border border-[#2c3440] p-6 rounded-2xl max-h-96 overflow-y-auto custom-scrollbar">
                                {itinerary.map((day, idx) => (
                                    <div key={idx} className="mb-6 last:mb-0">
                                        <h5 className="text-[10px] font-black text-[#00e054] uppercase mb-2">Day {day.day}: {day.title}</h5>
                                        <ul className="space-y-2">
                                            {day.activities.map((act: string, aIdx: number) => (
                                                <li key={aIdx} className="text-[11px] text-[#def] flex items-start gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-[#456] mt-1.5 shrink-0"></span>
                                                    {act}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full bg-[#00e054]/10 hover:bg-[#00e054] text-[#00e054] hover:text-black border border-[#00e054]/20 py-4 font-black uppercase tracking-widest text-xs rounded-2xl"
                            onClick={handlePlanTrip}
                            isLoading={isPlanning}
                        >
                            {isPlanning ? 'Analyzing...' : 'Plan a 3-Day Trip'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
