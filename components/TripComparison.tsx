import React, { useState } from 'react';
import { TravelLocation } from '../types';
import { StarRating } from './StarRating';

interface TripComparisonProps {
    locations: TravelLocation[];
}

export const TripComparison: React.FC<TripComparisonProps> = ({ locations }) => {
    const [tripA, setTripA] = useState<TravelLocation | null>(null);
    const [tripB, setTripB] = useState<TravelLocation | null>(null);

    const getTripDuration = (loc: TravelLocation): number | null => {
        if (!loc.dateEndVisited) return null;
        return Math.ceil((new Date(loc.dateEndVisited).getTime() - new Date(loc.dateVisited).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const ComparisonCard: React.FC<{ trip: TravelLocation | null; label: string; onSelect: (trip: TravelLocation | null) => void }> = ({ trip, label, onSelect }) => (
        <div className="flex-1 bg-[#1b2228] border border-[#2c3440] rounded-lg p-6">
            <label className="text-xs font-bold text-[#567] uppercase tracking-wider block mb-3">{label}</label>

            {!trip ? (
                <select
                    onChange={(e) => {
                        const selected = locations.find(l => l.id === e.target.value);
                        if (selected) onSelect(selected);
                    }}
                    className="w-full bg-[#2c3440] px-4 py-3 rounded-sm text-sm font-medium text-white outline-none focus:ring-2 focus:ring-[#00e054]/50"
                    defaultValue=""
                >
                    <option value="" disabled>Select a trip...</option>
                    {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white">{trip.name}</h3>
                        <button
                            onClick={() => onSelect(null)}
                            className="text-xs text-[#567] hover:text-white"
                        >
                            Change
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-[#2c3440]">
                            <span className="text-sm text-[#9ab]">Rating</span>
                            <StarRating rating={trip.rating} showNumber />
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-[#2c3440]">
                            <span className="text-sm text-[#9ab]">Type</span>
                            <span className="text-sm font-bold text-white capitalize">{trip.type}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-[#2c3440]">
                            <span className="text-sm text-[#9ab]">Date</span>
                            <span className="text-sm font-bold text-white">{formatDate(trip.dateVisited)}</span>
                        </div>

                        {getTripDuration(trip) && (
                            <div className="flex justify-between items-center py-2 border-b border-[#2c3440]">
                                <span className="text-sm text-[#9ab]">Duration</span>
                                <span className="text-sm font-bold text-[#00e054]">{getTripDuration(trip)} days</span>
                            </div>
                        )}

                        {trip.companions && trip.companions.length > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#2c3440]">
                                <span className="text-sm text-[#9ab]">Traveled with</span>
                                <span className="text-sm font-bold text-white capitalize">{trip.companions.join(', ')}</span>
                            </div>
                        )}

                        {trip.likes.length > 0 && (
                            <div className="py-2">
                                <span className="text-xs font-bold text-[#00e054] uppercase block mb-2">Highlights</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {trip.likes.map((like, i) => (
                                        <span key={i} className="text-xs bg-[#00e054]/10 text-[#00e054] px-2 py-1 rounded">{like}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {trip.dislikes.length > 0 && (
                            <div className="py-2">
                                <span className="text-xs font-bold text-red-500 uppercase block mb-2">Lows</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {trip.dislikes.map((dislike, i) => (
                                        <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">{dislike}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Winner calculation
    const getWinner = () => {
        if (!tripA || !tripB) return null;
        if (tripA.rating > tripB.rating) return 'A';
        if (tripB.rating > tripA.rating) return 'B';
        return 'tie';
    };

    const winner = getWinner();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-3">
                    <i className="fas fa-scale-balanced text-[#40bcf4]"></i> Trip Comparison
                </h2>
            </div>

            {locations.length < 2 ? (
                <div className="py-16 text-center border border-dashed border-[#2c3440] rounded-lg">
                    <i className="fas fa-scale-balanced text-[#2c3440] text-5xl mb-4"></i>
                    <p className="text-[#567] text-sm font-semibold mb-2">Need at least 2 trips to compare</p>
                    <p className="text-[#456] text-xs">Log more trips to use this feature!</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-4 items-stretch">
                        <ComparisonCard trip={tripA} label="Trip A" onSelect={setTripA} />

                        <div className="flex flex-col items-center justify-center px-4">
                            <div className="text-2xl font-black text-[#567]">VS</div>
                            {winner && (
                                <div className={`mt-2 text-xs font-bold uppercase ${winner === 'tie' ? 'text-[#ff8000]' : 'text-[#00e054]'}`}>
                                    {winner === 'tie' ? 'Tie!' : winner === 'A' ? '← Winner' : 'Winner →'}
                                </div>
                            )}
                        </div>

                        <ComparisonCard trip={tripB} label="Trip B" onSelect={setTripB} />
                    </div>

                    {tripA && tripB && (
                        <div className="bg-[#1b2228] border border-[#2c3440] rounded-lg p-6">
                            <h3 className="text-sm font-bold text-[#567] uppercase tracking-wider mb-4">Quick Stats</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className={`text-2xl font-black ${tripA.rating >= tripB.rating ? 'text-[#00e054]' : 'text-[#567]'}`}>
                                        {tripA.rating}
                                    </div>
                                    <div className="text-xs text-[#567] uppercase">Rating A</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-[#ff8000]">
                                        {Math.abs(tripA.rating - tripB.rating).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-[#567] uppercase">Difference</div>
                                </div>
                                <div>
                                    <div className={`text-2xl font-black ${tripB.rating >= tripA.rating ? 'text-[#00e054]' : 'text-[#567]'}`}>
                                        {tripB.rating}
                                    </div>
                                    <div className="text-xs text-[#567] uppercase">Rating B</div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
