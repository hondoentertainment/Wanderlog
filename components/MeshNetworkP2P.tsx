import React, { useState, useEffect } from 'react';
import { SquadTrip } from '../types';

interface MeshNetworkP2PProps {
    squad: SquadTrip;
    onClose: () => void;
}

export const MeshNetworkP2P: React.FC<MeshNetworkP2PProps> = ({ squad, onClose }) => {
    const [scannedNodes, setScannedNodes] = useState<{ id: string; name: string; style: string; distance: number; connected: boolean; angle: number }[]>([]);
    const [syncProgress, setSyncProgress] = useState(0);

    useEffect(() => {
        // Simulate peer discovery around the center node
        const nodes = squad.members.map((m, i) => ({
            id: m.uid,
            name: m.name.split(' ')[0], // First name only
            style: m.style,
            distance: Math.random() * 80 + 30, // 30 to 110 radius
            angle: (360 / squad.members.length) * i + (Math.random() * 30 - 15),
            connected: false
        }));

        const discoveryTimer = setTimeout(() => {
            setScannedNodes(nodes);
        }, 1500);

        // Simulate establishing connections sequentially
        const connectionTimers = nodes.map((_, i) =>
            setTimeout(() => {
                setScannedNodes(prev => {
                    const next = [...prev];
                    if (next[i]) next[i].connected = true;
                    return next;
                });
            }, 3000 + i * 800)
        );

        // Simulate local data sync blocks progress
        const syncTimer = setInterval(() => {
            setSyncProgress(prev => {
                if (prev >= 100) {
                    clearInterval(syncTimer);
                    return 100;
                }
                return prev + 5;
            });
        }, 400);

        return () => {
            clearTimeout(discoveryTimer);
            connectionTimers.forEach(clearTimeout);
            clearInterval(syncTimer);
        };
    }, [squad.members]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0b]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-hidden">
            {/* Header / Top Nav */}
            <div className="absolute top-8 w-full px-8 flex justify-between items-center z-20">
                <div>
                    <h2 className="text-white font-black uppercase text-xl tracking-tighter flex items-center gap-3">
                        <i className="fas fa-network-wired text-[#00e054]"></i>
                        Off-Grid Mesh
                    </h2>
                    <p className="text-[#00e054] text-xs font-mono uppercase tracking-widest mt-1 animate-pulse">
                        Wanderlog P2P Protocol Active
                    </p>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-[#1b2228] border border-[#2c3440] text-[#567] hover:text-[#00e054] transition-colors flex items-center justify-center">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Radar UI Container */}
            <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center mt-12">
                {/* Sonar Rings */}
                <div className="absolute inset-0 border-[3px] border-[#00e054]/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-8 border border-[#00e054]/30 rounded-full"></div>
                <div className="absolute inset-24 border border-[#00e054]/40 rounded-full"></div>
                <div className="absolute inset-40 border border-[#00e054]/50 rounded-full bg-[#00e054]/5"></div>

                {/* Sweeper Arm */}
                <div className="absolute inset-0 rounded-full border-r-[2px] border-[#00e054] animate-spin" style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}>
                    <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-[#00e054]/30 rounded-r-full origin-left rotate-180"></div>
                </div>

                {/* Center Node (Host) */}
                <div className="absolute w-6 h-6 bg-white rounded-full shadow-[0_0_20px_#fff] z-10 flex items-center justify-center border-4 border-[#00e054]">
                    <div className="absolute top-full mt-3 bg-[#1b2228] px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest text-white border border-[#2c3440] shadow-xl whitespace-nowrap">
                        You (Host)
                    </div>
                </div>

                {/* Peer Nodes */}
                {scannedNodes.map((node) => {
                    const radius = node.distance * 2; // scale for visual spacing
                    const radian = (node.angle * Math.PI) / 180;
                    const x = Math.cos(radian) * radius;
                    const y = Math.sin(radian) * radius;

                    return (
                        <div
                            key={node.id}
                            className="absolute transition-all duration-1000 ease-out z-20"
                            style={{
                                transform: `translate(${x}px, ${y}px)`,
                                opacity: node.connected ? 1 : 0.5
                            }}
                        >
                            <div className="relative group">
                                <div className={`w-4 h-4 rounded-full shadow-lg border-2 ${node.connected ? 'bg-[#00e054] border-white shadow-[0_0_20px_rgba(0,224,84,0.8)]' : 'bg-[#1b2228] border-[#567] animate-pulse'}`}></div>

                                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#0a0a0b] border border-[#2c3440] px-3 py-1.5 rounded shadow-2xl text-center min-w-[80px]">
                                    <p className={`text-[10px] font-black uppercase tracking-tight ${node.connected ? 'text-white' : 'text-[#567]'}`}>{node.name}</p>
                                    <p className="text-[8px] text-[#00e054] uppercase font-mono mt-0.5 tracking-widest">{node.connected ? '✓ SYNCED' : 'AWAITING...'}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sync Progress Timeline */}
            <div className="absolute bottom-12 w-full max-w-lg px-8 flex flex-col items-center">
                <div className="w-full flex justify-between tracking-widest uppercase mb-3 text-xs font-black">
                    <span className="text-[#567]">Mesh Data Ledger</span>
                    <span className="text-[#00e054] drop-shadow-[0_0_8px_rgba(0,224,84,0.5)]">{syncProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#2c3440] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-[#00e054] via-[#40bcf4] to-[#00e054] bg-[length:200%_auto] animate-shimmer transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                </div>
                <div className="flex gap-4">
                    {syncProgress < 100 ? (
                        <span className="text-[#567] text-[10px] uppercase tracking-widest font-black animate-pulse flex items-center gap-2">
                            <i className="fas fa-spinner fa-spin text-[#00e054]"></i>
                            Negotiating WebRTC Tunnels...
                        </span>
                    ) : (
                        <span className="text-[#00e054] text-[10px] uppercase tracking-widest font-black flex items-center gap-2">
                            <i className="fas fa-check-double drop-shadow-[0_0_5px_rgba(0,224,84,0.5)]"></i>
                            Decentralized Ledger Verified. Safe to roam.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
