import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Shield, X } from 'lucide-react';

export const EmergencySOS: React.FC = () => {
    const [active, setActive] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [dispatched, setDispatched] = useState(false);

    useEffect(() => {
        let timer: any;
        if (active && countdown > 0 && !dispatched) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && !dispatched) {
            setDispatched(true);
        }
        return () => clearInterval(timer);
    }, [active, countdown, dispatched]);

    const handleTrigger = () => {
        setActive(true);
        setCountdown(5);
        setDispatched(false);
    };

    const handleCancel = () => {
        setActive(false);
        setCountdown(5);
        setDispatched(false);
    };

    if (!active) {
        return (
            <div className="bg-ns-danger/10 border border-ns-danger/30 rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-ns-danger/5 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-ns-danger title">Emergency Assistance</h3>
                    <p className="text-sm text-ns-danger/80 font-medium">Immediate police dispatch to your location.</p>
                </div>
                <button onClick={handleTrigger} className="relative z-10 bg-ns-danger hover:bg-ns-danger/90 text-white p-4 rounded-xl font-bold shadow-lg shadow-ns-danger/30 transition-all active:scale-95 flex items-center gap-2 animate-pulse-slow">
                    <AlertTriangle size={20} />
                    <span>TAP FOR SOS</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-ns-neutral-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10 animate-scale-in">
                <div className={`p-6 text-center text-white transition-colors duration-500 ${dispatched ? 'bg-ns-neutral-800' : 'bg-ns-danger'}`}>
                    {dispatched ? (
                        <>
                            <Shield size={48} className="mx-auto mb-2 text-ns-success animate-bounce-small" />
                            <h2 className="text-2xl font-bold title">Help is on the way!</h2>
                            <p className="opacity-80 font-medium">Police Unit PCR-12 dispatched.</p>
                        </>
                    ) : (
                        <>
                            <div className="text-6xl font-black mb-2 animate-ping opacity-50 absolute top-10 left-1/2 -translate-x-1/2">{countdown}</div>
                            <h2 className="text-4xl font-black relative z-10 font-mono">{countdown}</h2>
                            <p className="font-bold mt-2 uppercase tracking-widest text-sm">Sending Distress Signal</p>
                        </>
                    )}
                </div>

                <div className="h-64 bg-ns-neutral-900 relative overflow-hidden group border-y border-white/5">
                    {/* Mock Map Background */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale invert"></div>

                    {/* User Location */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 bg-ns-primary-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse"></div>
                        <div className="w-16 h-16 bg-ns-primary-500/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                    </div>

                    {/* Police Unit Animation */}
                    {dispatched && (
                        <div className="absolute top-1/4 left-1/4 transition-all duration-[5000ms] translate-x-16 translate-y-16">
                            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                                <div className="w-2 h-2 bg-ns-danger rounded-full animate-pulse"></div>
                                <b>PCR-12</b> (2 mins away)
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-ns-neutral-900">
                    {!dispatched ? (
                        <button onClick={handleCancel} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <X size={20} /> CANCEL SOS
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 bg-ns-success/10 border border-ns-success/30 rounded-xl flex items-center gap-3">
                                <Phone className="text-ns-success w-5 h-5" />
                                <div className="text-sm">
                                    <p className="font-bold text-ns-success">Control Room Calling...</p>
                                    <p className="text-ns-success/80">Please keep your phone line open.</p>
                                </div>
                            </div>
                            <button onClick={handleCancel} className="w-full py-3 border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-bold rounded-xl text-sm transition-colors">
                                Close Overlay
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
