// src/shared/components/common/Toast.tsx
// NyayaSahayak Toast Notifications System
// Premium notifications for user feedback

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Wifi, WifiOff } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'online';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    messageHindi?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, messageHindi?: string, duration?: number) => void;
    showSuccess: (message: string, messageHindi?: string) => void;
    showError: (message: string, messageHindi?: string) => void;
    showWarning: (message: string, messageHindi?: string) => void;
    showInfo: (message: string, messageHindi?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    offline: WifiOff,
    online: Wifi,
};

const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    offline: 'bg-red-500/20 border-red-500/50 text-red-400',
    online: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, messageHindi?: string, duration = 4000) => {
        const id = Date.now().toString();
        const toast: Toast = { id, type, message, messageHindi, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const showSuccess = useCallback((message: string, messageHindi?: string) => {
        showToast('success', message, messageHindi);
    }, [showToast]);

    const showError = useCallback((message: string, messageHindi?: string) => {
        showToast('error', message, messageHindi, 6000);
    }, [showToast]);

    const showWarning = useCallback((message: string, messageHindi?: string) => {
        showToast('warning', message, messageHindi);
    }, [showToast]);

    const showInfo = useCallback((message: string, messageHindi?: string) => {
        showToast('info', message, messageHindi);
    }, [showToast]);

    // Monitor online/offline status
    React.useEffect(() => {
        const handleOnline = () => showToast('online', 'Back online!', 'वापस ऑनलाइन!', 3000);
        const handleOffline = () => showToast('offline', 'You are offline', 'आप ऑफलाइन हैं', 0); // Persists

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        if (!navigator.onLine) {
            showToast('offline', 'You are offline', 'आप ऑफलाइन हैं', 0);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast, index) => {
                    const Icon = icons[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`
                                pointer-events-auto
                                flex items-center gap-3 px-5 py-4 
                                rounded-xl border backdrop-blur-xl shadow-2xl
                                transform transition-all duration-300
                                animate-slide-in-right
                                ${colors[toast.type]}
                            `}
                            style={{
                                animationDelay: `${index * 100}ms`,
                            }}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{toast.message}</p>
                                {toast.messageHindi && (
                                    <p className="text-xs opacity-70 mt-0.5">{toast.messageHindi}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
