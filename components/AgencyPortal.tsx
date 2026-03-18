import React from 'react';

interface AgencyPortalProps {
    onBack: () => void;
}

export const AgencyPortal: React.FC<AgencyPortalProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-[#def] absolute inset-0 z-[100] border-t-4 border-[#40bcf4] flex flex-col animate-in fade-in duration-500">
            <header className="bg-[#14181c] border-b border-[#2c3440] px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-[#567] hover:text-white transition-colors flex items-center gap-2 group">
                        <i className="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i>
                        <span className="text-xs font-bold uppercase tracking-widest">Exit CRM</span>
                    </button>
                    <div className="w-px h-6 bg-[#2c3440]"></div>
                    <div className="flex items-center gap-3">
                        <i className="fas fa-building text-[#40bcf4] text-xl"></i>
                        <span className="font-black text-white uppercase tracking-widest text-lg">Wanderlog for Agencies</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs font-bold text-white uppercase tracking-wider">Luxury Escapes LLC</span>
                        <span className="block text-[9px] text-[#00e054] font-black uppercase tracking-widest mt-0.5">Enterprise License Active</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#40bcf4] to-[#bc1888] rounded-lg shadow-[0_0_15px_rgba(64,188,244,0.3)] shadow-[#40bcf4]/20 border border-[#2c3440] flex items-center justify-center">
                        <i className="fas fa-briefcase text-white"></i>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 md:p-12 max-w-[90rem] mx-auto w-full space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#14181c] border border-[#2c3440] p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#40bcf4]"></div>
                        <h4 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-1">Active Client Trips</h4>
                        <span className="text-4xl font-light text-white">14</span>
                    </div>
                    <div className="bg-[#14181c] border border-[#2c3440] p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00e054]"></div>
                        <h4 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-1">Jules Automations Active</h4>
                        <span className="text-4xl font-light text-white">1,402</span>
                    </div>
                    <div className="bg-[#14181c] border border-[#2c3440] p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#FBD315]"></div>
                        <h4 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-1">Total Client Spend (MTD)</h4>
                        <span className="text-4xl font-light text-white">$142k</span>
                    </div>
                </div>

                <div className="flex justify-between items-end pt-6">
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fas fa-users text-[#567]"></i> Live Deployments
                        </h1>
                    </div>
                    <button className="bg-[#40bcf4] hover:bg-[#32a4d8] text-black px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(64,188,244,0.3)] transition-all flex items-center gap-2 hover:scale-105">
                        <i className="fas fa-plus"></i> New Journey
                    </button>
                </div>

                <div className="bg-[#14181c] border border-[#2c3440] rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#1b2228] text-[10px] uppercase font-black tracking-widest text-[#567]">
                                    <th className="p-4 border-b border-[#2c3440]">Client Focus</th>
                                    <th className="p-4 border-b border-[#2c3440]">Destination</th>
                                    <th className="p-4 border-b border-[#2c3440]">Flight Status</th>
                                    <th className="p-4 border-b border-[#2c3440]">Jules AI Engine</th>
                                    <th className="p-4 border-b border-[#2c3440] text-right">Budget Auth</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { client: "The Smith Family", dest: "Amalfi Coast, Italy", flight: "On Time (DL 482)", ai: "Active (Concierge)", budget: "$14,500" },
                                    { client: "Sarah J. (Honeymoon)", dest: "Kyoto, Japan", flight: "Delayed 2h (JL 069)", ai: "Active (Rerouting)", budget: "$12,200", isDelayed: true },
                                    { client: "Executive Retreat", dest: "Aspen, CO", flight: "Landed (AA 2341)", ai: "Passive (Listening)", budget: "$32,000" },
                                    { client: "Dr. Chen's Sabbatical", dest: "Machu Picchu, Peru", flight: "Boarding", ai: "Active (Trekking Guide)", budget: "$8,900" },
                                    { client: "Startup Accelerator", dest: "Austin, TX", flight: "Scheduled", ai: "Setup Phase", budget: "$45,000" },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-[#1b2228]/50 transition-colors group cursor-pointer border-b border-[#2c3440] last:border-0">
                                        <td className="p-4">
                                            <span className="font-bold text-white text-sm block group-hover:text-[#40bcf4] transition-colors">{row.client}</span>
                                            <span className="text-[10px] text-[#567]">ID: WL-AGT-{Math.floor(Math.random() * 9000) + 1000}</span>
                                        </td>
                                        <td className="p-4 font-bold text-[#def] text-xs uppercase tracking-wide">
                                            <i className="fas fa-map-marker-alt text-[#567] mr-2"></i>{row.dest}
                                        </td>
                                        <td className="p-4 text-xs font-bold">
                                            {row.isDelayed ? (
                                                <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                                                    <i className="fas fa-exclamation-triangle mr-1"></i> {row.flight}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-[#00e054]/10 text-[#00e054] border border-[#00e054]/20">
                                                    {row.flight}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs">
                                            {row.ai.includes('Rerouting') ? (
                                                <span className="text-[#bc1888] font-bold">
                                                    <i className="fas fa-robot mr-2 animate-bounce"></i>{row.ai}
                                                </span>
                                            ) : (
                                                <span className="text-[#9ab]">
                                                    <i className="fas fa-robot text-[#00e054] mr-2"></i>{row.ai}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-mono text-[#FBD315] font-bold text-sm tracking-widest">{row.budget}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
