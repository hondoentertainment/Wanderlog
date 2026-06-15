import React, { useState, useEffect } from 'react';
import { PublicLocation } from '../types';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Button } from './Button';

export const DiscoveryFeed: React.FC = () => {
    const [locations, setLocations] = useState<PublicLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'public_locations'),
            orderBy('dateVisited', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: PublicLocation[] = [];
            snapshot.forEach((docSnap) => {
                fetched.push({ id: docSnap.id, ...docSnap.data() } as PublicLocation);
            });
            setLocations(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <i className="fas fa-globe-americas text-4xl text-[#2c3440] mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#567]">Scanning the Globe...</p>
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="space-y-12 animate-in fade-in duration-700">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Global <span className="text-[#00e054]">Expedition</span></h2>
                    <p className="text-[10px] text-[#567] font-bold uppercase tracking-widest">Real-time memories from the Wanderlog squad</p>
                </div>
                <div className="text-center py-20 border border-dashed border-[#2c3440] rounded-3xl">
                    <i className="fas fa-compass text-3xl text-[#2c3440] mb-4"></i>
                    <p className="text-[#567] text-[10px] font-black uppercase tracking-widest">No public memories yet</p>
                    <p className="text-[#456] text-[9px] font-bold uppercase tracking-tighter mt-2">Add a visit with photos or a 4+ rating to appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Global <span className="text-[#00e054]">Expedition</span></h2>
                <p className="text-[10px] text-[#567] font-bold uppercase tracking-widest">Real-time memories from the Wanderlog squad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {locations.map((loc, i) => (
                    <div key={loc.id} className={`stagger-item stagger-${(i % 5) + 1} glass-card rounded-2xl overflow-hidden group hover:scale-[1.02]`}>
                        {loc.photoUrls && loc.photoUrls.length > 0 ? (
                            <div className="h-64 relative overflow-hidden">
                                <img
                                    src={loc.photoUrls[0]}
                                    alt={loc.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-transparent opacity-60"></div>
                                <div className="absolute bottom-4 left-4 z-10">
                                    <span className="bg-[#00e054] text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                        {loc.type}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 bg-[#2c3440] flex items-center justify-center relative overflow-hidden">
                                <i className="fas fa-map-marker-alt text-4xl text-[#14181c]"></i>
                                <div className="absolute top-4 left-4">
                                    <span className="bg-[#456] text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                        {loc.type}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-white font-black uppercase text-lg tracking-tight group-hover:text-[#00e054] transition-colors">{loc.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex text-[8px] text-[#ff8000]">
                                        {[...Array(5)].map((_, starIdx) => (
                                            <i key={starIdx} className={`fas fa-star ${starIdx < (loc.rating || 0) ? 'text-[#ff8000]' : 'text-[#2c3440]'}`}></i>
                                        ))}
                                    </div>
                                    <span className="text-[9px] text-[#567] font-bold uppercase">{new Date(loc.dateVisited).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {loc.likes?.slice(0, 3).map((like, idx) => (
                                    <span key={idx} className="bg-[#14181c] text-[#9ab] border border-white/5 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                                        #{like.replace(/\s+/g, '')}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-[#2c3440] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#2c3440] border border-white/5"></div>
                                    <span className="text-[9px] font-black text-[#567] uppercase tracking-tighter">Explorer {loc.ownerId.slice(0, 4)}</span>
                                </div>
                                <Button variant="ghost" className="!py-1 !px-3 h-8 border border-[#2c3440]">
                                    <i className="far fa-heart mr-1"></i> 0
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
