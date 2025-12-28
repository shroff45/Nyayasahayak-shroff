// src/shared/components/common/OfflineBanner.tsx
// NyayaSahayak - Offline Detection Banner for Rural India
// Critical for users with unstable internet connectivity

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';

interface OfflineBannerProps {
    className?: string;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOnline(navigator.onLine);
        setShowBanner(!navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                // Show "Back online" message briefly
                setShowBanner(true);
                setTimeout(() => setShowBanner(false), 3000);
            }
            setWasOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    const handleRetry = () => {
        window.location.reload();
    };

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-14 md:top-16 left-0 right-0 z-40 transition-all duration-300 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div
                className={`mx-auto max-w-7xl px-4 py-2 md:py-3 ${isOnline
                        ? 'bg-emerald-500/90 backdrop-blur-xl'
                        : 'bg-amber-500/90 backdrop-blur-xl'
                    }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {isOnline ? (
                            <Cloud className="w-5 h-5 text-white" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-white animate-pulse" />
                        )}
                        <div>
                            <p className="text-sm font-bold text-white">
                                {isOnline
                                    ? 'वापस ऑनलाइन! • Back Online!'
                                    : 'कोई इंटरनेट नहीं • No Internet Connection'}
                            </p>
                            {!isOnline && (
                                <p className="text-xs text-white/80">
                                    कुछ सुविधाएं उपलब्ध नहीं हो सकतीं • Some features may not be available
                                </p>
                            )}
                        </div>
                    </div>

                    {!isOnline && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-full transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">पुनः प्रयास करें</span>
                            <span className="sm:hidden">Retry</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfflineBanner;
