import React from 'react';
import { Achievement } from '../types';
import { calculateAchievements, getAchievementProgress } from '../services/achievementService';
import { TravelLocation } from '../types';

interface AchievementBadgesProps {
    locations: TravelLocation[];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ locations }) => {
    const achievements = calculateAchievements(locations);
    const unlockedCount = achievements.filter(a => a.unlockedAt).length;
    const { next, progress, total } = getAchievementProgress(locations);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-3">
                        <i className="fas fa-trophy text-[#ff8000]"></i>
                        Achievement Badges
                    </h2>
                    <p className="text-[#567] text-xs mt-1">
                        {unlockedCount} of {achievements.length} unlocked
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-[#00e054]">{unlockedCount}</div>
                    <div className="text-[10px] font-bold text-[#567] uppercase tracking-widest">Badges</div>
                </div>
            </div>

            {/* Next Achievement Progress */}
            {next && (
                <div className="bg-[#1b2228] p-4 rounded-lg border border-[#2c3440]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#2c3440] rounded-full flex items-center justify-center">
                            <i className={`fas ${next.icon} text-[#567] text-lg`}></i>
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-[#ff8000] uppercase tracking-widest mb-1">Next Achievement</div>
                            <div className="text-white font-bold">{next.name}</div>
                            <div className="text-[#567] text-xs">{next.description}</div>
                            <div className="mt-2 bg-[#14181c] rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#ff8000] to-[#00e054] transition-all duration-500"
                                    style={{ width: `${(progress / total) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-[#567] mt-1">{progress} / {total}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievement Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {achievements.map(achievement => (
                    <div
                        key={achievement.id}
                        className={`relative p-4 rounded-lg border transition-all ${achievement.unlockedAt
                                ? 'bg-[#1b2228] border-[#00e054]/30 hover:border-[#00e054]'
                                : 'bg-[#14181c] border-[#2c3440] opacity-50'
                            }`}
                    >
                        {/* Badge Icon */}
                        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${achievement.unlockedAt
                                ? 'bg-gradient-to-br from-[#ff8000] to-[#00e054] shadow-lg shadow-[#00e054]/20'
                                : 'bg-[#2c3440]'
                            }`}>
                            <i className={`fas ${achievement.icon} text-xl ${achievement.unlockedAt ? 'text-white' : 'text-[#567]'
                                }`}></i>
                        </div>

                        {/* Badge Info */}
                        <div className="text-center">
                            <h3 className={`font-bold text-sm ${achievement.unlockedAt ? 'text-white' : 'text-[#567]'}`}>
                                {achievement.name}
                            </h3>
                            <p className="text-[#567] text-[10px] mt-1">{achievement.description}</p>
                            <p className="text-[#456] text-[9px] mt-2 uppercase tracking-wider">{achievement.condition}</p>
                        </div>

                        {/* Unlocked indicator */}
                        {achievement.unlockedAt && (
                            <div className="absolute top-2 right-2">
                                <i className="fas fa-check-circle text-[#00e054] text-sm"></i>
                            </div>
                        )}

                        {/* Lock indicator */}
                        {!achievement.unlockedAt && (
                            <div className="absolute top-2 right-2">
                                <i className="fas fa-lock text-[#456] text-xs"></i>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
