
import React from 'react';
import { SquadTrip } from '../types';

interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    target: number;
    current: number;
    unit: string;
}

interface SquadChallengesProps {
    trip: SquadTrip;
}

export const SquadChallenges: React.FC<SquadChallengesProps> = ({ trip }) => {
    const memberStyles = new Set(trip.members.map(m => m.style.toLowerCase())).size;

    const challenges: Challenge[] = [
        {
            id: 'activity-stacker',
            name: 'Activity Stacker',
            description: 'Collect planned activities for the crew',
            icon: 'fa-list-check',
            target: 5,
            current: trip.items.length,
            unit: 'Activities'
        },
        {
            id: 'diverse-vibes',
            name: 'Vibe Harmony',
            description: 'Collaborate with different travel styles',
            icon: 'fa-masks-theater',
            target: 3,
            current: memberStyles,
            unit: 'Styles'
        },
        {
            id: 'squad-goals',
            name: 'Full House',
            description: 'Build a diverse expedition team',
            icon: 'fa-users-viewfind',
            target: 4,
            current: trip.members.length,
            unit: 'Members'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-2">
                <h3 className="text-[10px] font-black uppercase text-[#567] tracking-widest">Squad Challenges</h3>
                <span className="text-[8px] font-bold text-[#00e054] bg-[#00e054]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Gamified</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {challenges.map(challenge => {
                    const isComplete = challenge.current >= challenge.target;
                    const progress = Math.min((challenge.current / challenge.target) * 100, 100);

                    return (
                        <div key={challenge.id} className={`p-4 rounded-lg border transition-all ${isComplete ? 'bg-[#00e054]/5 border-[#00e054]/20' : 'bg-[#14181c] border-[#2c3440]'}`}>
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-[#00e054] text-black shadow-[0_0_15px_rgba(0,224,84,0.3)]' : 'bg-[#2c3440] text-[#567]'}`}>
                                    <i className={`fas ${challenge.icon} text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-xs font-black uppercase tracking-tight ${isComplete ? 'text-white' : 'text-[#9ab]'}`}>{challenge.name}</h4>
                                        {isComplete && <i className="fas fa-check-circle text-[#00e054] text-xs"></i>}
                                    </div>
                                    <p className="text-[9px] text-[#567] uppercase font-bold tracking-tighter">{challenge.description}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                    <span className={isComplete ? 'text-[#00e054]' : 'text-[#567]'}>{challenge.current} / {challenge.target} {challenge.unit}</span>
                                    <span className={isComplete ? 'text-[#00e054]' : 'text-[#567]'}>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-1 bg-[#2c3440] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${isComplete ? 'bg-[#00e054]' : 'bg-[#40bcf4]'}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
