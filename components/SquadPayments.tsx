import React, { useState } from 'react';
import { SquadTrip } from '../types';

interface SquadPaymentsProps {
    trip: SquadTrip;
    currentUserName: string;
}

export const SquadPayments: React.FC<SquadPaymentsProps> = ({ trip, currentUserName }) => {
    // Default mock data if empty
    const totalAmount = trip.payments?.totalAmount || 2450;
    const numMembers = trip.members.length > 0 ? trip.members.length : 1;
    const splitAmount = trip.payments?.splitAmount || (totalAmount / numMembers);

    // Manage local UI state for members who paid (simulated DB)
    const [membersPaid, setMembersPaid] = useState<string[]>(trip.payments?.membersPaid || []);
    const [isProcessing, setIsProcessing] = useState(false);

    const hasUserPaid = membersPaid.includes(currentUserName);
    const progressPercentage = (membersPaid.length / numMembers) * 100;

    const handlePayShare = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setMembersPaid((prev) => [...prev, currentUserName]);
            setIsProcessing(false);
            (window as any).posthog?.capture('squad_payment_split_settled', { tripId: trip.id, amount: splitAmount });
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 p-5">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-br from-[#1b2228] to-[#14181c] border border-[#2c3440] rounded-xl p-5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#40bcf4]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <h4 className="text-[10px] font-black uppercase text-[#567] tracking-widest mb-1 relative z-10">Trip Balance</h4>
                <div className="flex justify-between items-end relative z-10">
                    <span className="text-3xl font-light text-white">${totalAmount.toLocaleString()}</span>
                    <div className="text-right">
                        <span className="text-xs text-[#9ab] block mb-1 font-bold">Your Share</span>
                        <span className="text-lg font-black text-[#40bcf4]">${splitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-5 relative z-10">
                    <div className="flex justify-between text-[10px] text-[#567] font-bold uppercase tracking-widest mb-1.5 flex-row-reverse">
                        <span>Settled: {membersPaid.length}/{numMembers}</span>
                        <span className="text-[#40bcf4]">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#14181c] rounded-full overflow-hidden border border-[#2c3440]">
                        <div
                            className="h-full bg-[#40bcf4] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(64,188,244,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Member Settlement List */}
            <div>
                <h4 className="text-[10px] font-black uppercase text-[#567] tracking-widest mb-3 border-b border-[#2c3440] pb-2">Squad Settlement</h4>
                <div className="space-y-2">
                    {trip.members.map((member, i) => {
                        const isSettled = membersPaid.includes(member.name);
                        return (
                            <div key={i} className="flex items-center justify-between p-3 bg-[#14181c] border border-[#2c3440] rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSettled ? 'bg-[#00e054]/10 text-[#00e054]' : 'bg-[#2c3440] text-[#9ab]'}`}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-[#def]">{member.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#9ab] font-mono">${splitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    {isSettled ? (
                                        <span className="text-[9px] text-[#00e054] font-black uppercase tracking-widest bg-[#00e054]/10 px-2 py-1 rounded border border-[#00e054]/20 w-20 text-center"><i className="fas fa-check mr-1"></i> Paid</span>
                                    ) : (
                                        <span className="text-[9px] text-[#ff8000] font-black uppercase tracking-widest bg-[#ff8000]/10 px-2 py-1 rounded border border-[#ff8000]/20 w-20 text-center"><i className="fas fa-clock mr-1"></i> Pending</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payer Action */}
            {!hasUserPaid && (
                <button
                    onClick={handlePayShare}
                    disabled={isProcessing}
                    className="w-full mt-6 bg-[#40bcf4] hover:bg-[#32a4d8] text-[#14181c] font-black py-4 rounded-lg shadow-lg shadow-[#40bcf4]/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 uppercase tracking-widest text-xs disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {isProcessing ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Processing via Stripe...</>
                    ) : (
                        <><i className="fab fa-stripe-s"></i> Settle Balance (${splitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })})</>
                    )}
                </button>
            )}
        </div>
    );
};
