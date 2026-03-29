import React, { useState } from 'react';
import { Button } from './Button';
import { TravelLocation } from '../types';

import { useToast } from './Toast';

interface RwaHotelInvestProps {
    location?: TravelLocation;
    userCredits?: number;
    onPurchaseComplete: (cost: number, assetName: string) => void;
    onClose: () => void;
}

export const RwaHotelInvest: React.FC<RwaHotelInvestProps> = ({ location, userCredits = 0, onPurchaseComplete, onClose }) => {
    // Determine target asset data
    const propertyName = location?.name || "Villa Treville";
    const propertyDest = location?.parentRegion || location?.tags?.join(', ') || "Amalfi Coast, Italy";
    const [tokens, setTokens] = useState(1);
    const tokenPrice = 500; // $500 per fractional stake
    const apy = 11.2; // 11.2% APY in credits
    const totalCost = tokens * tokenPrice;

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const { showToast } = useToast();

    const handlePurchase = () => {
        if (userCredits < totalCost) {
            showToast(`Insufficient Wanderlog Credits. (Balance: $${userCredits}, Cost: $${totalCost})`, 'error');
            return;
        }

        setIsPurchasing(true);
        setTimeout(() => {
            setIsPurchasing(false);
            setPurchaseComplete(true);
            onPurchaseComplete(totalCost, propertyName);
        }, 3500); // Simulate transaction validation
    };

    if (purchaseComplete) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#0a0a0b]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
                <div className="bg-[#1b2228] border border-[#00e054] p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_80px_rgba(0,224,84,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00e054] to-transparent"></div>
                    <div className="w-20 h-20 mx-auto bg-[#00e054]/10 rounded-full flex items-center justify-center mb-6 border border-[#00e054]/50 shadow-[0_0_30px_rgba(0,224,84,0.4)]">
                        <i className="fas fa-check text-4xl text-[#00e054] drop-shadow-[0_0_10px_rgba(0,224,84,1)]"></i>
                    </div>
                    <h3 className="text-white font-black text-xl uppercase mb-2 tracking-tighter">Asset Secured</h3>
                    <p className="text-[#9ab] text-sm mb-6 leading-relaxed">
                        You successfully acquired <span className="text-white font-bold">{tokens} fractional share{tokens > 1 ? 's' : ''}</span> of <strong>{propertyName}</strong>. RWA protocol minted to your Vault.
                    </p>

                    <div className="bg-[#14181c] border border-[#2c3440] rounded-xl p-5 mb-8 text-left shadow-inner">
                        <div className="flex justify-between text-xs mb-3 border-b border-[#2c3440] pb-2">
                            <span className="text-[#567] uppercase font-black tracking-widest">Projected Yield</span>
                            <span className="text-[#00e054] font-mono font-bold">${(tokens * tokenPrice * (apy / 100)).toFixed(2)} / yr</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-[#567] uppercase font-black tracking-widest">Dividend Payout</span>
                            <span className="text-white font-bold">Wanderlog Credits</span>
                        </div>
                    </div>

                    <Button variant="primary" className="w-full text-xs tracking-widest h-12" onClick={onClose}>RETURN TO TIMELINE</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0b]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto">
            <div className="w-full max-w-4xl bg-[#14181c] border border-[#2c3440] rounded-3xl overflow-hidden shadow-2xl mt-8 mb-8 relative">

                {/* Hero Header */}
                <div className="relative h-72 bg-slate-800 flex items-end">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#14181c]/60 to-transparent z-10"></div>
                    {/* Simulated Hotel Image bg */}
                    <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>

                    <button onClick={onClose} className="absolute top-6 right-6 z-20 w-12 h-12 bg-[#1b2228]/60 backdrop-blur-md rounded-full text-white border border-[#2c3440] flex items-center justify-center hover:bg-[#ffbb00] hover:text-[#14181c] transition-colors shadow-lg group">
                        <i className="fas fa-times group-hover:scale-110 transition-transform"></i>
                    </button>

                    <div className="relative z-20 p-8 w-full flex justify-between items-end">
                        <div>
                            <div className="bg-[#ffbb00] text-[#14181c] text-[10px] font-black uppercase px-3 py-1.5 rounded-sm inline-block mb-4 tracking-widest shadow-[0_0_15px_rgba(255,187,0,0.4)]">
                                Institutional Grade RWA
                            </div>
                            <h2 className="text-white text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2 drop-shadow-lg">{propertyName}</h2>
                            <p className="text-[#40bcf4] font-black text-xs md:text-sm tracking-widest uppercase items-center flex drop-shadow-md">
                                <i className="fas fa-map-marker-alt mr-2"></i>{propertyDest}
                            </p>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <div className="bg-[#1b2228]/80 backdrop-blur border border-[#2c3440] px-4 py-2 rounded-lg flex gap-4 text-center">
                                <div>
                                    <span className="block text-[9px] text-[#567] uppercase font-black tracking-widest">Asset Class</span>
                                    <span className="block text-white text-xs font-bold uppercase">Hospitality</span>
                                </div>
                                <div className="w-px bg-[#2c3440]"></div>
                                <div>
                                    <span className="block text-[9px] text-[#567] uppercase font-black tracking-widest">Your Rating</span>
                                    <span className="block text-[#ffbb00] text-xs font-bold uppercase"><i className="fas fa-star mr-1"></i>5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 bg-[#0a0a0b]">
                    {/* Left Column: Asset Details */}
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-[11px] text-[#567] flex items-center gap-2 uppercase font-black tracking-widest mb-4 border-b border-[#2c3440] pb-3">
                                <i className="fas fa-chart-pie text-[#00e054]"></i> Asset Thesis
                            </h4>
                            <p className="text-[#9ab] text-sm leading-relaxed mb-4">
                                You previously stayed at <strong>{propertyName}</strong> and rated it a perfect 5 stars. Institutional demand for boutique hospitality is surging. Transition from a guest to an owner by acquiring fractional smart-contract stakes on the Wanderlog network.
                            </p>
                            <p className="text-[#567] text-xs leading-relaxed italic border-l-2 border-[#2c3440] pl-3">
                                Dividends are auto-liquidated and deposited quarterly into your Wanderlog Travel Wallet to fund your next adventure.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-[#14181c] p-5 rounded-xl border border-[#2c3440] shadow-inner">
                                <span className="text-[#567] text-[10px] uppercase font-black tracking-widest block mb-2">Target Yield</span>
                                <span className="text-[#00e054] text-3xl font-black drop-shadow-[0_0_10px_rgba(0,224,84,0.3)]">{apy}% <span className="text-[10px] text-[#567] uppercase tracking-widest align-middle">APY</span></span>
                            </div>
                            <div className="bg-[#14181c] p-5 rounded-xl border border-[#2c3440] shadow-inner">
                                <span className="text-[#567] text-[10px] uppercase font-black tracking-widest block mb-2">Token Price</span>
                                <span className="text-white text-3xl font-light font-mono">${tokenPrice}</span>
                            </div>
                            <div className="bg-[#14181c] p-5 rounded-xl border border-[#2c3440] shadow-inner col-span-2 md:col-span-1">
                                <span className="text-[#567] text-[10px] uppercase font-black tracking-widest block mb-2">Lockup Period</span>
                                <span className="text-white text-xl font-black uppercase">12 Months</span>
                            </div>
                        </div>

                        <div className="bg-[#14181c] border border-[#2c3440] p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#00e054]/5 to-transparent pointer-events-none"></div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[11px] text-[#9ab] uppercase font-black tracking-widest">Syndicate Funding</span>
                                <div className="text-right">
                                    <span className="text-white text-sm font-bold font-mono block">$4,250,500</span>
                                    <span className="text-[#567] text-[9px] uppercase tracking-widest">of $5M Goal</span>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-[#0a0a0b] rounded-full overflow-hidden shadow-inner border border-[#2c3440]">
                                <div className="h-full bg-gradient-to-r from-[#40bcf4] via-[#00e054] to-[#00e054] w-[85%] relative">
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)50%,rgba(255,255,255,0.2)75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-shimmer"></div>
                                </div>
                            </div>
                            <p className="text-[#00e054] text-[9px] font-black uppercase tracking-widest mt-3 text-right">Closing in 4 days</p>
                        </div>
                    </div>

                    {/* Right Column: Checkout */}
                    <div className="bg-[#14181c] border border-[#2c3440] rounded-2xl p-8 relative flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00e054] opacity-[0.03] rounded-bl-full pointer-events-none"></div>

                        <div>
                            <h4 className="text-white font-black text-xl uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <i className="fas fa-wallet text-[#40bcf4]"></i> Execute Order
                            </h4>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-[#567] uppercase font-black tracking-widest block mb-3">Quantity Selection</label>
                                    <div className="flex items-center justify-between bg-[#0a0a0b] border border-[#2c3440] rounded-xl p-2 shadow-inner">
                                        <button
                                            className="w-12 h-12 flex items-center justify-center text-[#567] hover:text-white bg-[#14181c] rounded-lg hover:bg-[#2c3440] transition-colors"
                                            onClick={() => setTokens(Math.max(1, tokens - 1))}
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                        <div className="text-center">
                                            <span className="text-white font-mono text-3xl font-light">{tokens}</span>
                                            <span className="block text-[#567] text-[8px] uppercase tracking-widest font-black">Tokens</span>
                                        </div>
                                        <button
                                            className="w-12 h-12 flex items-center justify-center text-[#567] hover:text-white bg-[#14181c] rounded-lg hover:bg-[#2c3440] transition-colors"
                                            onClick={() => setTokens(tokens + 1)}
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0b] p-5 rounded-xl border border-[#2c3440] space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center pb-4 border-b border-[#2c3440] border-dashed">
                                        <span className="text-[#567] text-[10px] font-black tracking-widest uppercase">Per Token (USD)</span>
                                        <span className="text-white font-mono text-sm">${tokenPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#14181c] p-2 mt-2 -mx-2 rounded-lg">
                                        <span className="text-[#567] text-[10px] font-black tracking-widest uppercase">Wallet</span>
                                        <span className={`font-mono text-[10px] ${userCredits >= totalCost ? 'text-white' : 'text-red-500'}`}>${userCredits.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-[#9ab] text-xs font-black uppercase tracking-widest">Gross Capital</span>
                                        <span className="text-[#00e054] font-mono text-3xl font-black drop-shadow-[0_0_10px_rgba(0,224,84,0.3)]">${totalCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button
                                variant="primary"
                                className="w-full h-14 text-sm tracking-widest group"
                                onClick={handlePurchase}
                                isLoading={isPurchasing}
                            >
                                <i className="fab fa-ethereum mr-2 group-hover:animate-pulse"></i>
                                MINT FRACTIONAL STAKE
                            </Button>
                            <div className="flex items-center justify-center gap-4 mt-5 text-[9px] text-[#567] uppercase tracking-widest font-black">
                                <span className="flex items-center gap-1"><i className="fas fa-shield-alt text-[#40bcf4]"></i> Audited</span>
                                <span className="flex items-center gap-1"><i className="fas fa-link text-[#ffbb00]"></i> On-Chain</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
