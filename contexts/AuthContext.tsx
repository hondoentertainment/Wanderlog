import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../services/firebaseConfig';
import { useToast } from '../components/Toast';
import { deleteAccountFully } from '../services/accountDeletionService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signInWithEmail: (e: string, p: string) => Promise<void>;
    registerWithEmail: (e: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
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

    const signInWithApple = async () => {
        try {
            await signInWithPopup(auth, appleProvider);
            showToast('Welcome back to Travel Muse!', 'success');
        } catch (error: any) {
            console.error('Error signing in with Apple:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                showToast('Sign-in cancelled', 'info');
            } else {
                showToast(`Apple sign-in failed: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    };

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

    const signInWithEmail = async (e: string, p: string) => {
        try {
            await signInWithEmailAndPassword(auth, e, p);
            showToast('Welcome back!', 'success');
        } catch (error: any) {
            console.error('Error signing in with email:', error);
            showToast(`Login failed: ${error.message || 'Unknown error'}`, 'error');
            throw error; // Rethrow to let the UI component handle the loading state
        }
    };

    const registerWithEmail = async (e: string, p: string) => {
        try {
            await createUserWithEmailAndPassword(auth, e, p);
            showToast('Account created successfully!', 'success');
        } catch (error: any) {
            console.error('Error registering with email:', error);
            showToast(`Registration failed: ${error.message || 'Unknown error'}`, 'error');
            throw error;
        }
    };

    const deleteAccount = async () => {
        try {
            await deleteAccountFully();
            showToast('Your account has been deleted.', 'info');
        } catch (error: any) {
            console.error('Error deleting account:', error);
            const msg =
                typeof error?.message === 'string' && error.message === 'Account deletion cancelled.'
                    ? 'Account deletion cancelled.'
                    : error?.message || 'Could not delete account. Try signing in again, then retry.';
            showToast(msg, 'error');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithApple, signInWithEmail, registerWithEmail, logout, deleteAccount }}>
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
