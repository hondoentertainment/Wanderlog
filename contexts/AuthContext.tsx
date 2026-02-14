import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useToast } from '../components/Toast';

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

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showToast('Welcome back to Travel Muse!', 'success');
        } catch (error: any) {
            console.error('Error signing in:', error);
            // Show more detailed error for debugging
            if (error.code === 'auth/unauthorized-domain') {
                showToast('Domain not authorized in Firebase Console', 'error');
            } else if (error.code === 'auth/popup-closed-by-user') {
                showToast('Sign-in cancelled', 'info');
            } else {
                showToast(`Login failed: ${error.message || 'Unknown error'}`, 'error');
            }
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
