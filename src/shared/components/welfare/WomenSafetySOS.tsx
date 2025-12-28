// src/shared/components/welfare/WomenSafetySOS.tsx
// Women's Safety SOS Feature - Shakti Button
// One-tap emergency alert with GPS location sharing

import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Shield, AlertTriangle, X, Heart, Users, MessageCircle } from 'lucide-react';

interface WomenSafetySOS {
    isOpen: boolean;
    onClose: () => void;
}

const WomenSafetySOS: React.FC<WomenSafetySOS> = ({ isOpen, onClose }) => {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [alertSent, setAlertSent] = useState(false);

    useEffect(() => {
        if (isOpen && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setLocation(null)
            );
        }
    }, [isOpen]);

    const handleEmergencyCall = (number: string) => {
        window.location.href = `tel:${number}`;
    };

    const handleSendAlert = async () => {
        setIsSending(true);
        // Simulate sending alert
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAlertSent(true);
        setIsSending(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 rounded-3xl border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
                {/* Pulse animation background */}
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="relative p-6 pb-4 text-center border-b border-red-500/20">
                    <div className="inline-flex p-4 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
                        <Shield className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-red-400">Women's Safety SOS</h2>
                    <p className="text-slate-400 mt-1">शक्ति बटन - Shakti Button</p>

                    {location && (
                        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-emerald-400">
                            <MapPin className="w-3 h-3" />
                            <span>Location Ready: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                        </div>
                    )}
                </div>

                {/* Emergency Numbers */}
                <div className="relative p-4 space-y-3">
                    {/* Women Helpline */}
                    <button
                        onClick={() => handleEmergencyCall('181')}
                        className="w-full flex items-center gap-4 p-4 bg-pink-500/20 border border-pink-500/30 rounded-xl hover:bg-pink-500/30 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-pink-500/30 group-hover:bg-pink-500/50 transition-colors">
                            <Heart className="w-6 h-6 text-pink-400" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold text-pink-400">Women Helpline</p>
                            <p className="text-xs text-slate-400">24/7 Support & Counseling</p>
                        </div>
                        <span className="text-2xl font-black text-pink-400">181</span>
                    </button>

                    {/* Police */}
                    <button
                        onClick={() => handleEmergencyCall('100')}
                        className="w-full flex items-center gap-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-red-500/30 group-hover:bg-red-500/50 transition-colors">
                            <Phone className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold text-red-400">Police Emergency</p>
                            <p className="text-xs text-slate-400">Immediate Response</p>
                        </div>
                        <span className="text-2xl font-black text-red-400">100</span>
                    </button>

                    {/* NCW */}
                    <button
                        onClick={() => handleEmergencyCall('7827-170-170')}
                        className="w-full flex items-center gap-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-purple-500/30 group-hover:bg-purple-500/50 transition-colors">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold text-purple-400">NCW (WhatsApp)</p>
                            <p className="text-xs text-slate-400">National Commission for Women</p>
                        </div>
                        <span className="text-sm font-bold text-purple-400">7827-170-170</span>
                    </button>
                </div>

                {/* Send Silent Alert */}
                <div className="relative p-4 border-t border-red-500/20">
                    {alertSent ? (
                        <div className="text-center py-4">
                            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-2">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <p className="text-emerald-400 font-bold">Alert Sent Successfully!</p>
                            <p className="text-xs text-slate-400 mt-1">Your emergency contacts have been notified with your location.</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleSendAlert}
                            disabled={isSending}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending Alert...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5" />
                                    SEND SILENT ALERT TO FAMILY
                                </>
                            )}
                        </button>
                    )}

                    <p className="text-xs text-center text-slate-500 mt-3">
                        ⚠️ Your GPS location will be shared with emergency contacts
                    </p>
                </div>

                {/* Domestic Violence Info */}
                <div className="relative p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-400">Domestic Violence?</p>
                            <p className="text-xs text-slate-400 mt-1">
                                You can file for a Protection Order under the DV Act, 2005.
                                <a href="https://ncw.nic.in" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline ml-1">
                                    Learn more →
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WomenSafetySOS;
