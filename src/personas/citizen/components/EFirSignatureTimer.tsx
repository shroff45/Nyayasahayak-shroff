// src/personas/citizen/components/EFirSignatureTimer.tsx
// NyayaSahayak v2.0.0 - BNSS Section 173(1)(ii) Compliance
// 72-Hour e-FIR Signature Timer Component

import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    FileSignature,
    Phone,
    Mail,
    Bell
} from 'lucide-react';

interface EFirSignatureTimerProps {
    submissionTime: Date;
    onSign: () => void;
    onExpired?: () => void;
    informantName: string;
    informantMobile: string;
    tempFirId: string;
}

interface TimerState {
    hours: number;
    minutes: number;
    seconds: number;
    totalSecondsRemaining: number;
    alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
}

const EFirSignatureTimer: React.FC<EFirSignatureTimerProps> = ({
    submissionTime,
    onSign,
    onExpired,
    informantName,
    informantMobile,
    tempFirId
}) => {
    const TOTAL_HOURS = 72; // BNSS Section 173(1)(ii) - 3 days
    const expiryTime = new Date(submissionTime.getTime() + TOTAL_HOURS * 60 * 60 * 1000);

    const [timerState, setTimerState] = useState<TimerState>({
        hours: TOTAL_HOURS,
        minutes: 0,
        seconds: 0,
        totalSecondsRemaining: TOTAL_HOURS * 60 * 60,
        alertLevel: 'NORMAL'
    });

    const [showSignModal, setShowSignModal] = useState(false);
    const [signatureMethod, setSignatureMethod] = useState<'AADHAAR' | 'STYLUS' | null>(null);

    // Calculate remaining time
    const calculateTimeRemaining = useCallback(() => {
        const now = new Date();
        const diff = expiryTime.getTime() - now.getTime();

        if (diff <= 0) {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalSecondsRemaining: 0,
                alertLevel: 'EXPIRED' as const
            };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const totalSecondsRemaining = Math.floor(diff / 1000);

        let alertLevel: TimerState['alertLevel'] = 'NORMAL';
        if (hours <= 0) alertLevel = 'EXPIRED';
        else if (hours <= 12) alertLevel = 'CRITICAL';
        else if (hours <= 24) alertLevel = 'WARNING';

        return { hours, minutes, seconds, totalSecondsRemaining, alertLevel };
    }, [expiryTime]);

    // Update timer every second
    useEffect(() => {
        const interval = setInterval(() => {
            const newState = calculateTimeRemaining();
            setTimerState(newState);

            if (newState.alertLevel === 'EXPIRED' && onExpired) {
                onExpired();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateTimeRemaining, onExpired]);

    // Get color based on alert level
    const getAlertColors = () => {
        switch (timerState.alertLevel) {
            case 'EXPIRED':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    text: 'text-red-400',
                    pulse: ''
                };
            case 'CRITICAL':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    text: 'text-red-400',
                    pulse: 'animate-pulse'
                };
            case 'WARNING':
                return {
                    bg: 'bg-amber-500/20',
                    border: 'border-amber-500/50',
                    text: 'text-amber-400',
                    pulse: ''
                };
            default:
                return {
                    bg: 'bg-emerald-500/20',
                    border: 'border-emerald-500/50',
                    text: 'text-emerald-400',
                    pulse: ''
                };
        }
    };

    const colors = getAlertColors();

    // Format time display
    const formatTime = (value: number) => value.toString().padStart(2, '0');

    const handleSignClick = () => {
        setShowSignModal(true);
    };

    const handleSignComplete = () => {
        setShowSignModal(false);
        onSign();
    };

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 ${colors.pulse}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${colors.text}`} />
                    <h3 className="font-bold text-white">e-FIR Signature Deadline</h3>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        BNSS Sec 173(1)(ii)
                    </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{tempFirId}</span>
            </div>

            {/* Timer Display */}
            {timerState.alertLevel !== 'EXPIRED' ? (
                <div className="text-center mb-6">
                    <p className="text-sm text-slate-400 mb-2">Time remaining to sign:</p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="bg-slate-900/50 rounded-lg px-4 py-3">
                            <span className={`text-4xl font-mono font-bold ${colors.text}`}>
                                {formatTime(timerState.hours)}
                            </span>
                            <p className="text-xs text-slate-500">Hours</p>
                        </div>
                        <span className={`text-3xl font-bold ${colors.text}`}>:</span>
                        <div className="bg-slate-900/50 rounded-lg px-4 py-3">
                            <span className={`text-4xl font-mono font-bold ${colors.text}`}>
                                {formatTime(timerState.minutes)}
                            </span>
                            <p className="text-xs text-slate-500">Minutes</p>
                        </div>
                        <span className={`text-3xl font-bold ${colors.text}`}>:</span>
                        <div className="bg-slate-900/50 rounded-lg px-4 py-3">
                            <span className={`text-4xl font-mono font-bold ${colors.text}`}>
                                {formatTime(timerState.seconds)}
                            </span>
                            <p className="text-xs text-slate-500">Seconds</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 font-bold">SIGNATURE DEADLINE EXPIRED</p>
                    <p className="text-sm text-slate-400 mt-1">
                        e-FIR converted to General Diary Entry. Please visit the police station.
                    </p>
                </div>
            )}

            {/* Alert Messages */}
            {timerState.alertLevel === 'CRITICAL' && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                        <p className="text-sm font-bold text-red-400">CRITICAL: Less than 12 hours remaining!</p>
                        <p className="text-xs text-slate-400">Sign immediately to register your FIR.</p>
                    </div>
                </div>
            )}

            {timerState.alertLevel === 'WARNING' && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                        <p className="text-sm font-bold text-amber-400">Warning: Less than 24 hours remaining</p>
                        <p className="text-xs text-slate-400">Please sign your e-FIR soon.</p>
                    </div>
                </div>
            )}

            {/* Informant Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{informantMobile}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>SMS reminder sent</span>
                </div>
            </div>

            {/* Sign Button */}
            {timerState.alertLevel !== 'EXPIRED' && (
                <button
                    onClick={handleSignClick}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                >
                    <FileSignature className="w-5 h-5" />
                    Sign Now with Aadhaar e-Sign
                </button>
            )}

            {/* Sign Modal */}
            {showSignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-white mb-4">Sign e-FIR</h3>

                        <p className="text-sm text-slate-400 mb-4">
                            Your signature validates this e-FIR per BNSS Section 173(1)(ii).
                            Choose your signing method:
                        </p>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setSignatureMethod('AADHAAR')}
                                className={`w-full p-4 rounded-lg border text-left transition-all ${signatureMethod === 'AADHAAR'
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <p className="font-medium text-white">Aadhaar e-Sign (Recommended)</p>
                                <p className="text-xs text-slate-400">OTP-based digital signature</p>
                            </button>

                            <button
                                onClick={() => setSignatureMethod('STYLUS')}
                                className={`w-full p-4 rounded-lg border text-left transition-all ${signatureMethod === 'STYLUS'
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <p className="font-medium text-white">Manual Signature</p>
                                <p className="text-xs text-slate-400">Draw signature on screen</p>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSignModal(false)}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 hover:text-white rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignComplete}
                                disabled={!signatureMethod}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EFirSignatureTimer;
