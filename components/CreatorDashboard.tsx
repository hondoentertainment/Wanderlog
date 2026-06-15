import React from 'react';

interface CreatorDashboardProps {
    onBack: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onBack }) => {
    return (
        <div className="bg-[#1b2228] border border-[#2c3440] rounded-xl overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#bc1888] to-[#f09433] p-1">
                <div className="bg-[#1b2228] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[#567] hover:text-white transition-colors">
                            <i className="fas fa-arrow-left text-xs" />
                        </button>
                        <div>
                            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                <i className="fas fa-crown text-[#FBD315]"></i> Curator Pro Hub
                            </h3>
                            <p className="text-[#567] text-[10px] font-bold uppercase tracking-widest mt-0.5">Monetize Your Travel DNA</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: '$1,240', trend: '+14%', color: 'text-[#00e054]' },
                        { label: 'Active Subscribers', value: '84', trend: '+5', color: 'text-[#40bcf4]' },
                        { label: 'Itineraries Sold', value: '112', trend: '+22', color: 'text-[#bc1888]' },
                        { label: 'Profile Views', value: '4.2k', trend: '+800', color: 'text-[#FBD315]' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#14181c] p-4 rounded-lg border border-[#2c3440]">
                            <span className="text-[9px] font-black text-[#567] uppercase tracking-widest block mb-2">{stat.label}</span>
                            <div className="flex items-end justify-between">
                                <span className={`text-2xl font-light ${stat.color}`}>{stat.value}</span>
                                <span className="text-[10px] font-bold text-[#00e054] bg-[#00e054]/10 px-1.5 py-0.5 rounded">{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Subscriptions CTA */}
                <div className="bg-gradient-to-br from-[#1b2228] to-[#14181c] border border-[#FBD315] rounded-xl p-6 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FBD315]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <i className="fas fa-gem text-4xl text-[#FBD315] mb-4 shadow-[0_0_20px_rgba(251,211,21,0.5)] rounded-full"></i>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Upgrade to Wanderlog Pro</h3>
                    <p className="text-[#9ab] text-sm mb-6 max-w-md mx-auto">Lock your best itineraries behind a subscription paywall, get access to advanced analytics, and keep 90% of all generated revenue.</p>
                    <button className="bg-[#FBD315] hover:bg-[#ffe340] text-black font-black uppercase tracking-widest text-xs py-3 px-8 rounded-full shadow-lg shadow-[#FBD315]/20 transition-all hover:scale-105">
                        Start 14-Day Free Trial ($15/mo)
                    </button>
                    <p className="text-[9px] text-[#567] mt-3">Cancel anytime. Billed annually at $180.</p>
                </div>
            </div>
        </div>
    );
};
