// src/shared/components/welfare/FreeLegalAidFinder.tsx
// Free Legal Aid Finder - Connect citizens with NALSA services
// Eligibility check and DLSA locator

import React, { useState } from 'react';
import {
    Scale, Search, MapPin, Phone, ExternalLink,
    CheckCircle, XCircle, HelpCircle, Users, FileText
} from 'lucide-react';

interface FreeLegalAidFinderProps {
    isOpen: boolean;
    onClose: () => void;
}

const FreeLegalAidFinder: React.FC<FreeLegalAidFinderProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'eligibility' | 'result' | 'dlsa'>('eligibility');
    const [isEligible, setIsEligible] = useState(false);
    const [selectedState, setSelectedState] = useState('');

    const [eligibilityAnswers, setEligibilityAnswers] = useState({
        isWoman: false,
        isChild: false,
        isScSt: false,
        isDisabled: false,
        isTraffickingVictim: false,
        isCustody: false,
        isLowIncome: false,
    });

    const eligibilityCriteria = [
        { key: 'isWoman', label: 'Woman or Child', icon: '👩' },
        { key: 'isScSt', label: 'SC/ST Community', icon: '🏛️' },
        { key: 'isDisabled', label: 'Person with Disability', icon: '♿' },
        { key: 'isTraffickingVictim', label: 'Victim of Trafficking', icon: '🆘' },
        { key: 'isCustody', label: 'In Custody (Undertrial)', icon: '⚖️' },
        { key: 'isLowIncome', label: 'Annual Income < ₹3 Lakh', icon: '💰' },
    ];

    const states = [
        'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
        'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Kerala', 'Telangana'
    ];

    const dlsaContacts: Record<string, { name: string; phone: string; address: string }> = {
        'Delhi': { name: 'Delhi SLSA', phone: '011-23385224', address: 'Patiala House Courts, New Delhi' },
        'Maharashtra': { name: 'Maharashtra SLSA', phone: '022-22620698', address: 'High Court Building, Mumbai' },
        'Karnataka': { name: 'Karnataka SLSA', phone: '080-22864078', address: 'High Court Building, Bengaluru' },
        'Tamil Nadu': { name: 'Tamil Nadu SLSA', phone: '044-25363424', address: 'High Court Campus, Chennai' },
        'Gujarat': { name: 'Gujarat SLSA', phone: '079-27913160', address: 'High Court Premises, Ahmedabad' },
    };

    const checkEligibility = () => {
        const eligible = Object.values(eligibilityAnswers).some(v => v);
        setIsEligible(eligible);
        setStep('result');
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
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 rounded-3xl border border-blue-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                                <Scale className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                    Free Legal Aid Finder
                                </h2>
                                <p className="text-xs text-slate-400">NALSA - निःशुल्क कानूनी सहायता</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                </div>

                {/* Content */}
                {step === 'eligibility' && (
                    <div className="p-6">
                        <p className="text-sm text-slate-300 mb-4">
                            Check if you're eligible for <span className="text-blue-400 font-bold">FREE</span> legal aid under NALSA:
                        </p>

                        <div className="space-y-2">
                            {eligibilityCriteria.map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setEligibilityAnswers(prev => ({
                                        ...prev,
                                        [key]: !prev[key as keyof typeof prev]
                                    }))}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${eligibilityAnswers[key as keyof typeof eligibilityAnswers]
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-xl">{icon}</span>
                                    <span className="font-medium">{label}</span>
                                    {eligibilityAnswers[key as keyof typeof eligibilityAnswers] && (
                                        <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={checkEligibility}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all"
                        >
                            Check Eligibility
                        </button>
                    </div>
                )}

                {step === 'result' && (
                    <div className="p-6 text-center">
                        {isEligible ? (
                            <>
                                <div className="inline-flex p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-400 mb-2">
                                    You're Eligible! ✓
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    You qualify for FREE legal aid under the Legal Services Authorities Act, 1987.
                                </p>
                                <button
                                    onClick={() => setStep('dlsa')}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Find Nearest DLSA
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex p-4 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
                                    <HelpCircle className="w-12 h-12 text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-400 mb-2">
                                    Not Sure? Contact NALSA
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Based on your selection, you may not qualify automatically.
                                    However, you can still apply and NALSA will review your case.
                                </p>
                                <a
                                    href="tel:15100"
                                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call NALSA: 15100
                                </a>
                            </>
                        )}

                        <button
                            onClick={() => { setStep('eligibility'); setEligibilityAnswers({ isWoman: false, isChild: false, isScSt: false, isDisabled: false, isTraffickingVictim: false, isCustody: false, isLowIncome: false }); }}
                            className="mt-4 text-sm text-slate-400 hover:text-white"
                        >
                            ← Back to Eligibility Check
                        </button>
                    </div>
                )}

                {step === 'dlsa' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-blue-400 mb-4">Select Your State</h3>

                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-4"
                        >
                            <option value="">Choose State...</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>

                        {selectedState && dlsaContacts[selectedState] && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                <h4 className="font-bold text-blue-400 mb-2">
                                    {dlsaContacts[selectedState].name}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2 text-slate-300">
                                        <Phone className="w-4 h-4 text-blue-400" />
                                        {dlsaContacts[selectedState].phone}
                                    </p>
                                    <p className="flex items-center gap-2 text-slate-300">
                                        <MapPin className="w-4 h-4 text-blue-400" />
                                        {dlsaContacts[selectedState].address}
                                    </p>
                                </div>
                                <a
                                    href={`tel:${dlsaContacts[selectedState].phone.replace(/-/g, '')}`}
                                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call Now
                                </a>
                            </div>
                        )}

                        <a
                            href="https://nalsa.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full py-2 border border-blue-500/30 text-blue-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-blue-500/10"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Apply Online at NALSA.gov.in
                        </a>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <p className="text-xs text-center text-slate-500">
                        🏛️ Free Legal Aid is a fundamental right under Article 39A of the Constitution
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FreeLegalAidFinder;
