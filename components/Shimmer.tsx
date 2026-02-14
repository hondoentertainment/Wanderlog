import React from 'react';

export const Shimmer: React.FC<{ type?: 'card' | 'list' | 'hero' }> = ({ type = 'card' }) => {
    return (
        <div className="animate-pulse space-y-4 w-full">
            {type === 'hero' && (
                <div className="h-64 bg-[#1b2228] rounded-xl border border-[#2c3440] shadow-xl"></div>
            )}

            {type === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-[#1b2228] rounded-xl border border-[#2c3440] p-6 space-y-4">
                            <div className="h-4 w-3/4 bg-[#2c3440] rounded-full"></div>
                            <div className="h-3 w-full bg-[#2c3440]/50 rounded-full"></div>
                            <div className="h-3 w-5/6 bg-[#2c3440]/50 rounded-full"></div>
                            <div className="pt-4 flex gap-2">
                                <div className="h-8 w-16 bg-[#2c3440] rounded-full"></div>
                                <div className="h-8 w-16 bg-[#2c3440] rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {type === 'list' && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-[#1b2228] rounded-lg border border-[#2c3440]/50 flex items-center px-4 gap-4">
                            <div className="w-10 h-10 bg-[#2c3440] rounded-full shrink-0"></div>
                            <div className="flex-grow space-y-2">
                                <div className="h-3 w-1/4 bg-[#2c3440] rounded-full"></div>
                                <div className="h-2 w-1/2 bg-[#2c3440]/50 rounded-full"></div>
                            </div>
                            <div className="w-8 h-8 bg-[#2c3440] rounded-full shrink-0"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const DashboardShimmer: React.FC = () => (
    <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[#1b2228] rounded-lg border border-[#2c3440]"></div>)}
        </div>
        <Shimmer type="hero" />
        <Shimmer type="list" />
    </div>
);
