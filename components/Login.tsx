import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export const Login: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#14181c] flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-circle-notch fa-spin text-3xl text-[#00e054] mb-4"></i>
                    <p className="text-[#567] text-xs font-bold uppercase tracking-widest">Loading Travel Muse...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#14181c] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80')] bg-cover bg-center opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-[#14181c]/80 to-transparent"></div>

            <div className="relative z-10 max-w-md w-full bg-[#1b2228]/80 backdrop-blur-xl p-8 rounded-2xl border border-[#2c3440] shadow-2xl text-center">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-[#2c3440] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#00e054] shadow-[0_0_20px_rgba(0,224,84,0.2)]">
                        <i className="fas fa-location-arrow text-2xl text-[#00e054]"></i>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">TRAVEL MUSE</h1>
                    <p className="text-[#9ab] font-medium text-sm">Your AI-Powered Travel Companion</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#2c3440]/50 p-4 rounded-lg border border-[#2c3440]">
                        <i className="fas fa-robot text-[#40bcf4] text-xl mb-3"></i>
                        <p className="text-white text-sm font-bold mb-1">"Bonjour! I am Jules."</p>
                        <p className="text-[#9ab] text-xs leading-relaxed">
                            "Sign in to start tracking your adventures and unlocking personalized travel insights."
                        </p>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-white text-[#14181c] font-bold py-3.5 px-6 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-8 text-[#567] text-[10px] font-bold uppercase tracking-widest">
                    Personal Travel Journal
                </p>
            </div>
        </div>
    );
};
