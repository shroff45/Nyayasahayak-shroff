// src/shared/hooks/useToast.tsx
// NyayaSahayak Hybrid - Global Toast Notification System
// PURPOSE: Provides three-state feedback (Loading/Success/Error) via toasts

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X, Loader2 } from 'lucide-react';

// Toast Types
export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => number;
    dismissToast: (id: number) => void;
    updateToast: (id: number, message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Component
const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
        loading: <Loader2 className="w-5 h-5 animate-spin" />
    };

    const colors = {
        success: 'bg-emerald-600 border-emerald-500',
        error: 'bg-red-600 border-red-500',
        info: 'bg-blue-600 border-blue-500',
        loading: 'bg-amber-600 border-amber-500'
    };

    return (
        <div
            className={`
                flex items-center gap-3 min-w-[320px] max-w-md p-4 rounded-xl border shadow-2xl
                text-white backdrop-blur-sm transform transition-all duration-300 ease-out
                animate-in slide-in-from-right-5 fade-in
                ${colors[toast.type]}
            `}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            {toast.type !== 'loading' && (
                <button
                    onClick={onDismiss}
                    className="shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType, duration: number = 3000): number => {
        const id = Date.now();

        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto-dismiss (except loading toasts)
        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateToast = useCallback((id: number, message: string, type: ToastType) => {
        setToasts(prev => prev.map(t =>
            t.id === id ? { ...t, message, type } : t
        ));

        // Auto-dismiss after update if not loading
        if (type !== 'loading') {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        }
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, updateToast }}>
            {children}

            {/* Toast Container - Fixed position bottom-right */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Hook
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
