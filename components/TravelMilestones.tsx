import React from 'react';
import { TravelLocation, LocationType } from '../types';

interface TravelMilestonesProps {
    locations: TravelLocation[];
}

interface Milestone {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    achieved: boolean;
    progress?: number;
    target?: number;
}

const getMilestones = (locations: TravelLocation[]): Milestone[] => {
    const countries = new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name));
    const states = new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name));
    const totalTrips = locations.length;

    // Calculate years of travel
    const years = new Set(locations.map(l => new Date(l.dateVisited).getFullYear()));

    return [
        // Country milestones
        {
            id: 'first-trip',
            name: 'First Steps',
            description: 'Log your first trip',
            icon: 'fa-shoe-prints',
            color: '#00e054',
            achieved: totalTrips >= 1,
            progress: Math.min(totalTrips, 1),
            target: 1
        },
        {
            id: 'explorer',
            name: 'Explorer',
            description: 'Visit 5+ countries',
            icon: 'fa-compass',
            color: '#40bcf4',
            achieved: countries.size >= 5,
            progress: Math.min(countries.size, 5),
            target: 5
        },
        {
            id: 'globetrotter',
            name: 'Globetrotter',
            description: 'Visit 10+ countries',
            icon: 'fa-earth-americas',
            color: '#ff8000',
            achieved: countries.size >= 10,
            progress: Math.min(countries.size, 10),
            target: 10
        },
        {
            id: 'world-traveler',
            name: 'World Traveler',
            description: 'Visit 25+ countries',
            icon: 'fa-globe',
            color: '#e040fb',
            achieved: countries.size >= 25,
            progress: Math.min(countries.size, 25),
            target: 25
        },
        // State milestones
        {
            id: 'state-hopper',
            name: 'State Hopper',
            description: 'Visit 10+ US states',
            icon: 'fa-flag-usa',
            color: '#00e054',
            achieved: states.size >= 10,
            progress: Math.min(states.size, 10),
            target: 10
        },
        {
            id: 'half-way',
            name: 'Half Way There',
            description: 'Visit 25 US states',
            icon: 'fa-star-half-stroke',
            color: '#ffd700',
            achieved: states.size >= 25,
            progress: Math.min(states.size, 25),
            target: 25
        },
        {
            id: 'all-states',
            name: 'All 50 States',
            description: 'Complete the US map',
            icon: 'fa-trophy',
            color: '#ffd700',
            achieved: states.size >= 50,
            progress: Math.min(states.size, 50),
            target: 50
        },
        // Experience milestones
        {
            id: 'seasoned',
            name: 'Seasoned Traveler',
            description: 'Log 20+ trips',
            icon: 'fa-suitcase-rolling',
            color: '#40bcf4',
            achieved: totalTrips >= 20,
            progress: Math.min(totalTrips, 20),
            target: 20
        },
        {
            id: 'veteran',
            name: 'Travel Veteran',
            description: '5+ years of logged travel',
            icon: 'fa-calendar-check',
            color: '#e040fb',
            achieved: years.size >= 5,
            progress: Math.min(years.size, 5),
            target: 5
        },
    ];
};

export const TravelMilestones: React.FC<TravelMilestonesProps> = ({ locations }) => {
    const milestones = getMilestones(locations);
    const achieved = milestones.filter(m => m.achieved);
    const inProgress = milestones.filter(m => !m.achieved && (m.progress || 0) > 0);

    return (
        <div className="bg-[#1b2228] border border-[#2c3440] p-6 rounded-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-[#567] uppercase tracking-wider">Travel Milestones</h3>
                <span className="text-xs font-bold text-[#00e054]">{achieved.length}/{milestones.length} achieved</span>
            </div>

            {/* Achieved badges */}
            {achieved.length > 0 && (
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-[#567] uppercase tracking-wider mb-3">Unlocked</p>
                    <div className="flex flex-wrap gap-3">
                        {achieved.map(m => (
                            <div
                                key={m.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all hover:scale-105"
                                style={{ borderColor: m.color, backgroundColor: `${m.color}15` }}
                                title={m.description}
                            >
                                <i className={`fas ${m.icon} text-lg`} style={{ color: m.color }}></i>
                                <span className="text-xs font-bold text-white">{m.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* In progress */}
            {inProgress.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-[#567] uppercase tracking-wider mb-3">In Progress</p>
                    <div className="space-y-2">
                        {inProgress.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-3">
                                <i className={`fas ${m.icon} text-sm text-[#567]`}></i>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-[#9ab]">{m.name}</span>
                                        <span className="text-[10px] font-bold text-[#567]">{m.progress}/{m.target}</span>
                                    </div>
                                    <div className="h-1 bg-[#2c3440] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${((m.progress || 0) / (m.target || 1)) * 100}%`,
                                                backgroundColor: m.color
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {achieved.length === 0 && inProgress.length === 0 && (
                <div className="text-center py-6 text-[#567]">
                    <i className="fas fa-medal text-2xl mb-2 opacity-30"></i>
                    <p className="text-xs font-bold">Start logging trips to earn badges!</p>
                </div>
            )}
        </div>
    );
};
