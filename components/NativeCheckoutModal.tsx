import React, { useState } from 'react';

interface NativeCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    destinationName?: string;
    estimatedPrice?: number;
}

export const NativeCheckoutModal: React.FC<NativeCheckoutModalProps> = ({
    isOpen, onClose, destinationName = "Custom Travel Itinerary", estimatedPrice = 1250
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleMockCheckout = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            (window as any).posthog?.capture('expedia_checkout_completed', { revenue: estimatedPrice });

            // Auto close after success
            setTimeout(() => {
                onClose();
                setIsSuccess(false); // reset for next time
            }, 2500);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1b2228] border border-[#2c3440] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl shadow-[#00e054]/10 transform transition-all">
                {/* Header */}
                <div className="bg-[#FBD315]/10 p-4 border-b border-[#FBD315]/20 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#FBD315]">
                        <i className="fas fa-plane-departure"></i>
                        <span className="font-bold text-sm tracking-wide">Expedia Secure Booking</span>
                    </div>
                    <button onClick={onClose} className="text-[#9ab] hover:text-white transition-colors w-6 h-6 flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-5">
                    {isSuccess ? (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-[#00e054]/20 text-[#00e054] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3 className="text-white text-lg font-bold mb-1">Booking Confirmed!</h3>
                            <p className="text-[#9ab] text-sm">Your confirmation has been added to your timeline.</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            <div className="mb-6">
                                <h3 className="text-white font-bold text-lg">{destinationName}</h3>
                                <div className="text-2xl font-light text-white mt-1">
                                    ${estimatedPrice.toLocaleString()} <span className="text-sm text-[#567]">USD</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-[#567] uppercase tracking-wide mb-1">Card Number</label>
                                    <div className="flex items-center bg-[#14181c] border border-[#2c3440] rounded p-3 text-white">
                                        <i className="fab fa-cc-visa text-[#9ab] mr-3"></i>
                                        <input type="text" placeholder="•••• •••• •••• 4242" className="bg-transparent w-full outline-none text-sm font-mono" readOnly onFocus={(e) => e.target.blur()} value="•••• •••• •••• 4242" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-[#567] uppercase tracking-wide mb-1">Expiry</label>
                                        <input type="text" placeholder="12/28" className="w-full bg-[#14181c] border border-[#2c3440] rounded p-3 text-white text-sm outline-none" readOnly value="12/28" onFocus={(e) => e.target.blur()} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#567] uppercase tracking-wide mb-1">CVC</label>
                                        <input type="text" placeholder="•••" className="w-full bg-[#14181c] border border-[#2c3440] rounded p-3 text-white text-sm outline-none" readOnly value="123" onFocus={(e) => e.target.blur()} />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleMockCheckout}
                                disabled={isProcessing}
                                className="w-full mt-6 bg-[#00e054] hover:bg-[#00c048] text-[#14181c] font-bold py-3 rounded-lg shadow-lg shadow-[#00e054]/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {isProcessing ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                                ) : (
                                    <><i className="fas fa-lock"></i> Pay ${estimatedPrice.toLocaleString()}</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
