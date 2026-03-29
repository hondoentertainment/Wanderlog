import React, { createContext, useContext, useState, useEffect } from 'react';

// Toast Component
interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
    action?: { label: string; onClick: () => void };
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000, action }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const colors = {
        success: 'bg-[#00e054]/90 text-white',
        error: 'bg-red-500/90 text-white',
        info: 'bg-[#40bcf4]/90 text-white'
    };

    return (
        <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 ${colors[type]} px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 z-[100]`}>
            <i className={`fas ${icons[type]}`}></i>
            <span className="font-semibold text-sm mr-2">{message}</span>
            {action && (
                <button 
                  onClick={() => { action.onClick(); onClose(); }} 
                  className="px-2 py-1 rounded bg-black/20 hover:bg-black/40 font-black text-xs uppercase tracking-wider transition-colors border border-white/10"
                >
                  {action.label}
                </button>
            )}
            <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
                <i className="fas fa-times text-xs"></i>
            </button>
        </div>
    );
};

// Toast Container
interface ToastData {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
}

const ToastContainer: React.FC<{ toasts: ToastData[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );
};

// Context
interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info', action?: { label: string; onClick: () => void }) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', action?: { label: string; onClick: () => void }) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type, action }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
