import React, { useEffect, useRef, useState } from 'react';
import { SpatialBreadcrumbs } from './SpatialBreadcrumbs';
import { useToast } from './Toast';

interface ARViewfinderProps {
    onClose: () => void;
}

export const ARViewfinder: React.FC<ARViewfinderProps> = ({ onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDropModal, setShowDropModal] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                const constraints = { video: { facingMode: 'environment' } };
                activeStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(activeStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = activeStream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Camera access denied or unavailable. MOCKING FEED...");
            }
        };
        startCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const handleDropNote = (note: string) => {
        setShowDropModal(false);
        showToast("Spatial Note anchored successfully. Deploying to Squad mesh network.", "success");
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-sans animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1b2228]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,224,84,0.3)] border border-[#00e054]">
                        <i className="fas fa-eye text-xl text-[#00e054]"></i>
                    </div>
                    <div>
                        <h1 className="text-white font-black uppercase tracking-widest text-sm">Spatial Discovery</h1>
                        <p className="text-[#00e054] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00e054] animate-pulse"></span> AR Engine Active
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-[#1b2228]/80 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg border border-[#2c3440] hover:scale-105">
                    <i className="fas fa-times text-lg"></i>
                </button>
            </div>

            {error && !stream && (
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-[#14181c] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1b2228] to-[#0a0a0b]">
                        <i className="fas fa-satellite-dish text-6xl text-[#2c3440] mb-6 animate-pulse"></i>
                        <h3 className="text-[#567] font-black uppercase tracking-widest text-sm">Simulating Spatial Feed</h3>
                        <p className="text-[#344] text-[10px] mt-2">({error})</p>
                    </div>
                </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover z-0 ${error ? 'hidden' : ''}`}></video>

            {/* Filter Overlay to make HUD pop */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>

            {/* Simulated AR Overlay Target Reticle */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-72 border border-dashed border-[#00e054]/30 rounded-full animate-spin-slow"></div>
                <div className="absolute w-48 h-48 border border-[#00e054]/10 rounded-full"></div>
                <div className="absolute w-1.5 h-1.5 bg-[#00e054] rounded-full shadow-[0_0_20px_rgba(0,224,84,1)] ring-4 ring-[#00e054]/20"></div>
            </div>

            {/* Simulated Floating Spatial Nodes */}
            <div className="absolute inset-0 z-10 pointer-events-none perspective-1000">
                {/* Node 1: AI Recommendation */}
                <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 hover:-translate-y-4 transition-transform rotate-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-[#1b2228]/80 backdrop-blur-xl border border-[#00e054] p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,224,84,0.15)] w-56 pointer-events-auto cursor-pointer group hover:bg-[#1b2228] transition-colors">
                        <span className="text-[8px] bg-[#00e054] text-black font-black uppercase px-2 py-1 rounded tracking-widest mb-3 inline-block shadow-[0_0_10px_rgba(0,224,84,0.3)]">92% Match</span>
                        <h4 className="text-white text-base font-black uppercase tracking-tight">Kyoto Matcha Bar</h4>
                        <div className="flex gap-1 text-[#ff8000] text-[8px] mt-1 mb-2">
                            <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star-half-alt"></i>
                        </div>
                        <p className="text-[#9ab] text-[10px] font-medium leading-relaxed italic">"Perfectly aligns with your Aesthetic Coffee shop DNA. Quiet corner available now."</p>
                    </div>
                    <div className="w-px h-32 bg-gradient-to-b from-[#00e054] to-transparent mx-auto mt-2 opacity-50"></div>
                    <div className="w-4 h-4 rounded-full border-2 border-[#00e054] mx-auto -mt-2 bg-black flex items-center justify-center shadow-[0_0_15px_rgba(0,224,84,0.8)]">
                        <div className="w-1.5 h-1.5 bg-[#00e054] rounded-full"></div>
                    </div>
                </div>

                {/* Node 2: Squad Breadcrumb */}
                <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 hover:-translate-y-4 transition-transform -rotate-y-12 scale-90 opacity-90 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <div className="bg-[#14181c]/80 backdrop-blur-xl border border-[#40bcf4] p-4 rounded-2xl shadow-[0_20px_40px_rgba(64,188,244,0.15)] w-48 pointer-events-auto cursor-pointer group hover:bg-[#14181c]">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[8px] border border-[#40bcf4] text-[#40bcf4] font-black uppercase px-2 py-0.5 rounded tracking-widest">Squad Drop</span>
                            <div className="w-4 h-4 rounded-full bg-white text-black text-[8px] flex items-center justify-center font-bold">S</div>
                        </div>
                        <h4 className="text-white text-xs font-black uppercase tracking-tight">Hidden Entrance</h4>
                        <p className="text-[#9ab] text-[10px] mt-1 italic">"Behind the second bookshelf. Knock twice."</p>
                        <span className="text-[8px] text-[#567] block mt-2 uppercase tracking-widest font-bold">2 Days Ago</span>
                    </div>
                    <div className="w-px h-24 bg-gradient-to-b from-[#40bcf4] to-transparent mx-auto mt-2 opacity-50"></div>
                    <div className="w-3 h-3 rounded-full border-2 border-[#40bcf4] mx-auto -mt-1.5 bg-black"></div>
                </div>
            </div>

            {/* Bottom AR Menu HUD */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 bg-[#1b2228]/80 backdrop-blur-xl border border-[#2c3440] rounded-full px-8 py-4 flex gap-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <button className="text-[#00e054] flex flex-col items-center gap-1.5 hover:scale-110 transition-transform group">
                    <i className="fas fa-radar text-xl group-hover:animate-spin-slow"></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">Radar</span>
                </button>
                <button
                    onClick={() => setShowDropModal(true)}
                    className="text-[#567] hover:text-[#40bcf4] flex flex-col items-center gap-1.5 hover:scale-110 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-[#2c3440] group-hover:bg-[#40bcf4]/20 flex items-center justify-center -mt-2 transition-colors">
                        <i className="fas fa-map-pin text-lg group-hover:text-[#40bcf4]"></i>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest group-hover:text-[#40bcf4]">Drop</span>
                </button>
                <button className="text-[#567] hover:text-white flex flex-col items-center gap-1.5 hover:scale-110 transition-transform group">
                    <i className="fas fa-layer-group text-xl group-hover:animate-pulse"></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">Layers</span>
                </button>
            </div>

            {showDropModal && (
                <SpatialBreadcrumbs
                    onClose={() => setShowDropModal(false)}
                    onDrop={handleDropNote}
                />
            )}
        </div>
    );
};
