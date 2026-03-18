import React, { useState, useEffect } from 'react';

export const AutoExecutor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(s => (s < 5 ? s + 1 : s));
        }, 1800);
        return () => clearInterval(timer);
    }, []);

    const steps = [
        "⚠️  CRITICAL: Flight DL482 canceled by carrier.",
        "🤖  Jules intercepted cancellation. Analyzing live O&D availability...",
        "⚡️  Identified AA128 (Departs in 2 hours). Same cabin class match.",
        "💳  Securing AA128 using Wanderlog wallet...",
        "📞  Auto-notifying Tokyo Park Hyatt of late arrival (ETA +3.5h)...",
        "✅  Autonomous resolution complete. Boarding pass updated."
    ];

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#14181c] border border-[#2c3440] rounded-xl max-w-lg w-full overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col">
                <div className="bg-[#1b2228] p-4 flex justify-between items-center border-b border-[#2c3440]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#bc1888]/20 flex items-center justify-center border border-[#bc1888]/40 shadow-[0_0_15px_rgba(188,24,136,0.3)]">
                            <i className="fas fa-bolt text-[#bc1888] animate-pulse"></i>
                        </div>
                        <div>
                            <span className="text-white font-black uppercase text-xs tracking-widest block">Jules Auto-Exec</span>
                            <span className="text-[9px] text-[#567] font-mono">Process ID: WL-X-8419</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#567] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-[#2c3440]">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 font-mono text-[11px] sm:text-xs min-h-[250px] relative bg-[#0a0a0b] custom-scrollbar">
                    {/* Simulated code matrix background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden text-[8px] leading-tight text-[#00e054] p-4 font-mono break-all line-clamp-[20]">
                        {Array(30).fill("01011001 01101111 01110101 00100000 01100001 01110010 01100101 00100000 01110011 01100001 01100110 01100101 ").join('')}
                    </div>

                    <div className="relative z-10 space-y-4">
                        {steps.slice(0, step + 1).map((s, i) => (
                            <div key={i} className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${i === steps.length - 1 && step === 5 ? 'text-[#00e054] font-bold text-sm bg-[#00e054]/10 p-2 rounded -mx-2' :
                                    i === 0 ? 'text-red-400 bg-red-500/10 p-2 rounded -mx-2' :
                                        'text-[#def]'
                                }`}>
                                <span>{s.substring(0, 2)}</span>
                                <span className={i > 0 && i < 5 ? 'opacity-80' : ''}>{s.substring(3)}</span>
                            </div>
                        ))}

                        {step < 5 && (
                            <div className="flex items-center gap-2 text-[#bc1888] pl-8 pt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#bc1888] animate-bounce"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#bc1888] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#bc1888] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1b2228] border-t border-[#2c3440] p-4 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-[#567]">
                    <span>Status: {step < 5 ? 'Executing...' : 'Resolved'}</span>
                    <span className={step < 5 ? 'rotate-180 transition-transform duration-1000 inline-block text-[#bc1888]' : 'text-[#00e054]'}>
                        <i className={`fas ${step < 5 ? 'fa-spinner' : 'fa-check-circle'}`}></i>
                    </span>
                </div>
            </div>
        </div>
    );
};
