// src/shared/components/welfare/CybercrimeReport.tsx
// Cybercrime Quick Report - Guide citizens through cyber fraud reporting
// Critical for India's growing digital crime problem

import React, { useState } from 'react';
import {
    Shield, AlertTriangle, Phone, ExternalLink,
    CreditCard, MessageSquare, Camera, Lock, X,
    ChevronRight, CheckCircle, Copy
} from 'lucide-react';

interface CybercrimeReportProps {
    isOpen: boolean;
    onClose: () => void;
}

const CYBERCRIME_TYPES = [
    { id: 'fraud', label: 'Financial Fraud / UPI Scam', icon: CreditCard, color: 'red' },
    { id: 'harassment', label: 'Online Harassment', icon: MessageSquare, color: 'orange' },
    { id: 'sextortion', label: 'Sextortion / Blackmail', icon: Camera, color: 'pink' },
    { id: 'hacking', label: 'Hacking / Data Breach', icon: Lock, color: 'purple' },
];

const CybercrimeReport: React.FC<CybercrimeReportProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'types' | 'guide' | 'report'>('types');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const selectedCrime = CYBERCRIME_TYPES.find(t => t.id === selectedType);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 rounded-3xl border border-orange-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                                <Shield className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                    Report Cybercrime
                                </h2>
                                <p className="text-xs text-slate-400">साइबर अपराध की रिपोर्ट करें</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex gap-3">
                    <a
                        href="tel:1930"
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm"
                    >
                        <Phone className="w-4 h-4" /> Call 1930
                    </a>
                    <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-sm"
                    >
                        <ExternalLink className="w-4 h-4" /> cybercrime.gov.in
                    </a>
                </div>

                {step === 'types' && (
                    <div className="p-4 space-y-3">
                        <p className="text-sm text-slate-400 mb-4">Select the type of cybercrime:</p>

                        {CYBERCRIME_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => { setSelectedType(type.id); setStep('guide'); }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${type.color === 'red' ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' :
                                        type.color === 'orange' ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20' :
                                            type.color === 'pink' ? 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20' :
                                                'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
                                    }`}
                            >
                                <type.icon className={`w-6 h-6 ${type.color === 'red' ? 'text-red-400' :
                                        type.color === 'orange' ? 'text-orange-400' :
                                            type.color === 'pink' ? 'text-pink-400' :
                                                'text-purple-400'
                                    }`} />
                                <span className="flex-1 font-medium text-white">{type.label}</span>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </button>
                        ))}
                    </div>
                )}

                {step === 'guide' && selectedCrime && (
                    <div className="p-4 space-y-4">
                        <button
                            onClick={() => setStep('types')}
                            className="text-sm text-slate-400 hover:text-white"
                        >
                            ← Back
                        </button>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Immediate Steps
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                {selectedType === 'fraud' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Call 1930 within 24 hours to freeze funds</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Take screenshots of UPI transactions</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Note scammer's UPI ID / phone number</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Report in banking app immediately</li>
                                    </>
                                )}
                                {selectedType === 'harassment' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Screenshot all offensive messages</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Do NOT delete the conversation</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Block the harasser after taking evidence</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Note the harasser's profile URL</li>
                                    </>
                                )}
                                {selectedType === 'sextortion' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> DO NOT pay any money</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Do NOT engage further with blackmailer</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Screenshot all threats (blur if needed)</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Report immediately - this is Section 384 BNS</li>
                                    </>
                                )}
                                {selectedType === 'hacking' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Change all passwords immediately</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Enable 2-Factor Authentication</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Check for unauthorized logins</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> Log out from all devices</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Report Button */}
                        <a
                            href="https://cybercrime.gov.in/Webform/Crime_Autho498498.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-5 h-5" />
                            File Official Complaint on NCRP
                        </a>

                        {/* Helpline */}
                        <div className="p-4 bg-slate-800/50 rounded-xl">
                            <p className="text-xs text-slate-400 mb-2">Cyber Crime Helpline</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-white">1930</span>
                                <button
                                    onClick={() => copyToClipboard('1930')}
                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white flex items-center gap-1"
                                >
                                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Available 24/7 • Toll Free</p>
                        </div>
                    </div>
                )}

                {/* Legal Info */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 text-center">
                        🔒 Cybercrimes are punishable under IT Act 2000 & BNS 2023
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CybercrimeReport;
