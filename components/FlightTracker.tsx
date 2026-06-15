import React from 'react';

interface FlightTrackerProps {
    destination?: string;
}

export const FlightTracker: React.FC<FlightTrackerProps> = ({ destination }) => {
    // Generate pseudo-random realistic price data stable for the given destination
    const generatePrices = (dest: string) => {
        const seed = dest.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const base = 300 + (seed % 500);
        return Array.from({ length: 10 }).map((_, i) => Math.floor(base + Math.sin(seed + i) * 150));
    };

    const targetDest = destination ? `Seattle (SEA) → ${destination}` : "Seattle (SEA) → Tokyo (NRT)";
    const pricePoints = destination ? generatePrices(destination) : [650, 620, 580, 500, 480, 410, 390, 420, 450, 510];
    const minPrice = Math.min(...pricePoints);

    return (
        <div className="bg-gradient-to-br from-[#1b2228] to-[#14181c] border border-[#2c3440] rounded-xl p-4 mb-4 relative overflow-hidden group/tracker glass-card">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e054]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-colors duration-700 group-hover/tracker:bg-[#00e054]/10"></div>

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                    <h4 className="text-white text-sm font-bold flex items-center gap-2">
                        <i className="fas fa-chart-line text-[#00e054]"></i>
                        Price Tracker
                    </h4>
                    <p className="text-xs text-[#9ab] mt-1 truncate max-w-[200px]" title={targetDest}>{targetDest}</p>
                </div>
                <div className="text-right">
                    <span className="text-[#00e054] font-bold text-lg">${minPrice}</span>
                    <p className="text-[10px] text-[#14181c] font-bold uppercase tracking-wide bg-[#00e054] rounded px-1.5 py-0.5 inline-block ml-2 shadow-[0_0_10px_rgba(0,224,84,0.3)] animate-pulse">Buy Now</p>
                </div>
            </div>

            {/* Micro Sparkline Graph */}
            <div className="h-12 flex items-end justify-between gap-1 mt-4 relative z-10">
                {pricePoints.map((price, idx) => {
                    const height = `${(price / 700) * 100}%`;
                    const isLowest = price === minPrice;
                    return (
                        <div key={idx} className="w-full relative group flex flex-col justify-end h-full">
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 ease-out ${isLowest ? 'bg-[#00e054] shadow-[0_0_8px_rgba(0,224,84,0.4)]' : 'bg-[#2c3440] group-hover:bg-[#3d4856]'}`}
                                style={{ height }}
                            ></div>
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-0.5 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-[#2c3440] z-20">
                                ${price}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between text-[9px] text-[#567] mt-2 border-t border-[#2c3440] pt-2">
                <span>90 Days Ago</span>
                <span>Today</span>
            </div>

            {/* Quick action overlay on hover */}
            <button className="absolute inset-x-0 bottom-0 bg-[#00e054]/10 backdrop-blur-md text-[#00e054] border-t border-[#00e054]/20 py-1.5 text-xs font-bold opacity-0 group-hover/tracker:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                <i className="fas fa-bolt"></i> Book Lowest Rate
            </button>
        </div>
    );
};
