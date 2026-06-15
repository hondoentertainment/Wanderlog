
import React from 'react';
import { TravelLocation, UserProfile, TravelDNA, LocationType } from '../types';
import { calculateAchievements } from '../services/achievementService';

interface TravelResumeProps {
    profile: UserProfile;
    locations: TravelLocation[];
    dna?: TravelDNA;
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
                <defs>
                    <linearGradient id="resumeDnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00e054" />
                        <stop offset="100%" stopColor="#00a044" />
                    </linearGradient>
                </defs>
                {gridLevels.map(level => (
                    <polygon
                        key={level}
                        points={axes.map((_, i) => {
                            const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
                            const x = center + radius * level * Math.cos(angle);
                            const y = center + radius * level * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(' ')}
                        className="fill-none stroke-[#eee] stroke-[1]"
                    />
                ))}
                {axes.map((_, i) => {
                    const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={center} y1={center}
                            x2={x} y2={y}
                            className="stroke-[#eee] stroke-[1]"
                        />
                    );
                })}
                {axes.map((axis, i) => {
                    const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
                    const x = center + (radius + 25) * Math.cos(angle);
                    const y = center + (radius + 25) * Math.sin(angle);
                    return (
                        <text
                            key={i}
                            x={x} y={y}
                            className="fill-[#333] text-[9px] font-bold uppercase tracking-widest text-center"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {axis.label}
                        </text>
                    );
                })}
                <polygon
                    points={points}
                    className="fill-[url(#resumeDnaGradient)] fill-opacity-40 stroke-[#00e054] stroke-2"
                />
            </svg>
        </div>
    );
};

export const TravelResume: React.FC<TravelResumeProps> = ({ profile, locations, dna }) => {
    const achievements = calculateAchievements(locations).filter(a => a.unlockedAt);
    const visitedStates = locations.filter(l => l.type === LocationType.STATE).length;
    const visitedCountries = locations.filter(l => l.type === LocationType.COUNTRY).length;

    const topLikes = [...new Set(locations.flatMap(l => l.likes))].slice(0, 10);

    return (
        <div id="resume-export-container" className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[20mm] mx-auto shadow-2xl font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">Travel Resume</h1>
                    <p className="text-2xl font-bold text-slate-600 uppercase tracking-widest">{profile.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Verified Explorer</p>
                    <p className="text-lg font-black text-[#00e054] uppercase tracking-tighter">Wanderlog Certified</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-12">
                {/* Sidebar */}
                <div className="col-span-4 space-y-10">
                    {/* Stats Bar */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-1">Global Coverage</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase">States</p>
                                <p className="text-3xl font-black text-slate-900">{visitedStates}<span className="text-sm text-slate-300">/50</span></p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase">Countries</p>
                                <p className="text-3xl font-black text-slate-900">{visitedCountries}</p>
                            </div>
                        </div>
                    </section>

                    {/* Travel DNA */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-1">Travel DNA</h3>
                        {dna ? (
                            <div className="bg-white p-2 rounded-xl flex items-center justify-center">
                                <DNARadarChart dna={dna} />
                            </div>
                        ) : (
                            <p className="text-sm italic text-slate-400">Analysis pending...</p>
                        )}
                    </section>

                    {/* Styles */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-1">Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.travelStyle.map(style => (
                                <span key={style} className="bg-slate-900 text-white px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-sm">
                                    {style}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Top Highs */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-1">Highlights</h3>
                        <ul className="space-y-2">
                            {topLikes.map((like, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <span className="w-1.5 h-1.5 bg-[#00e054] rounded-full"></span>
                                    {like}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* Main Content */}
                <div className="col-span-8 space-y-12">
                    {/* Biography */}
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-b pb-1">Manifesto</h3>
                        <p className="text-lg text-slate-700 leading-relaxed italic font-medium">"{profile.bio}"</p>
                    </section>

                    {/* Experience */}
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b pb-1">Expedition History</h3>
                        <div className="space-y-8">
                            {locations.slice(0, 5).map(loc => (
                                <div key={loc.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-slate-900 before:rounded-full before:z-10 group">
                                    <div className="absolute left-[3px] top-4 bottom-[-32px] w-[2px] bg-slate-100 group-last:hidden"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-900">{loc.name}</h4>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(loc.dateVisited).getFullYear()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00e054]">{loc.type}</span>
                                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`fas fa-star text-[8px] ${i < loc.rating ? 'text-yellow-400' : 'text-slate-200'}`}></i>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        Featured Highs: {loc.likes.join(', ') || 'Exploration and Discovery'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Badges */}
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b pb-1">Verified Achievements</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {achievements.slice(0, 6).map(ach => (
                                <div key={ach.id} className="text-center group">
                                    <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-2 border-2 border-slate-100 group-hover:border-[#00e054] transition-colors">
                                        <i className={`fas ${ach.icon} text-xl text-slate-800`}></i>
                                    </div>
                                    <h5 className="text-[10px] font-black uppercase tracking-tighter text-slate-900 mb-1">{ach.name}</h5>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{new Date(ach.unlockedAt!).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {achievements.length === 0 && (
                                <p className="text-xs italic text-slate-400 col-span-3">No achievements unlocked yet. The journey continues.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-30 group">
                <div className="flex items-center gap-2">
                    <i className="fas fa-location-arrow text-slate-900"></i>
                    <span className="text-xs font-black uppercase tracking-tighter">Wanderlog Travel Intelligence v1.7</span>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-[0.5em]">This document is a certified record of exploration</p>
            </div>
        </div>
    );
};
