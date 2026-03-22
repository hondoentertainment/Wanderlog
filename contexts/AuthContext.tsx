import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useToast } from '../components/Toast';

function prefersRedirectSignIn(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    showToast('Welcome back to Travel Muse!', 'success');
                }
            })
            .catch((err) => console.error('Redirect sign-in error', err));
    }, [showToast]);

    const signInWithGoogle = async () => {
        try {
            if (prefersRedirectSignIn()) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }
            await signInWithPopup(auth, googleProvider);
            showToast('Welcome back to Travel Muse!', 'success');
        } catch (error) {
            console.error('Error signing in:', error);
            showToast('Error signing in with Google', 'error');
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            showToast('Successfully logged out', 'info');
        } catch (error) {
            console.error('Error signing out:', error);
            showToast('Error signing out', 'error');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
