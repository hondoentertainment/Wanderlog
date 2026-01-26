import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
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
        <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 ${colors[type]} px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 z-50`}>
            <i className={`fas ${icons[type]}`}></i>
            <span className="font-semibold text-sm">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
                <i className="fas fa-times text-xs"></i>
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>;
    removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );
};

// Hook for managing toasts
export const useToast = () => {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, showToast, removeToast };
};
