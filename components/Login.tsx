import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
    const { signInWithGoogle, signInWithApple, signInWithEmail, registerWithEmail, loading } = useAuth();
    const appleSignInEnabled = import.meta.env.VITE_ENABLE_APPLE_SIGNIN === 'true';
    
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        try {
            if (isSignUp) {
                await registerWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error) {
            // Error handling is managed by AuthContext toasts, but we catch it here to stop the spinner
        } finally {
            setLocalLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLocalLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
        } finally {
            setLocalLoading(false);
        }
    };

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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3 relative text-left">
                            <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest pl-1">Email</label>
                            <div className="relative">
                                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#567]"></i>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#14181c] pl-10 pr-4 py-3 rounded-xl border border-[#2c3440] text-sm text-white outline-none focus:border-[#00e054] focus:ring-1 focus:ring-[#00e054] transition-all placeholder:text-[#456]"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3 relative text-left mb-6">
                            <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest pl-1">Password</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#567]"></i>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#14181c] pl-10 pr-4 py-3 rounded-xl border border-[#2c3440] text-sm text-white outline-none focus:border-[#40bcf4] focus:ring-1 focus:ring-[#40bcf4] transition-all placeholder:text-[#456]"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-full py-4 text-sm tracking-widest shadow-[0_0_15px_rgba(0,224,84,0.2)]"
                            isLoading={localLoading}
                        >
                            {isSignUp ? 'CREATE ACCOUNT' : 'LOGIN SECURELY'}
                        </Button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2c3440]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#1b2228] text-[#567] font-black tracking-widest text-[9px] uppercase">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleAuth}
                        disabled={localLoading}
                        className="w-full bg-white text-[#14181c] font-bold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    {appleSignInEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalLoading(true);
                          signInWithApple().finally(() => setLocalLoading(false));
                        }}
                        disabled={localLoading}
                        data-testid="sign-in-apple"
                        className="w-full bg-[#14181c] text-white font-bold py-3.5 px-6 rounded-xl border border-[#2c3440] hover:border-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <i className="fab fa-apple text-xl" />
                        Continue with Apple
                      </button>
                    )}

                    <div className="pt-4 mt-4 border-t border-[#2c3440]">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[#9ab] hover:text-white transition-colors text-xs font-bold"
                            type="button"
                        >
                            {isSignUp ? 'Already have an account? Log in' : `Don't have an account? Sign up`}
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-[#456] text-[9px] font-black uppercase tracking-widest">
                    Vite • Firebase • PWA Ready
                </p>
            </div>
        </div>
    );
};
