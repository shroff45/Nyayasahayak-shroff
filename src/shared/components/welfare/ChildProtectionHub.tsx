// src/shared/components/welfare/ChildProtectionHub.tsx
// NyayaSahayak - Child Protection Hub (Bal Suraksha - बाल सुरक्षा)
// Comprehensive child safety: POCSO reporting, Childline, child labor, missing children

import React, { useState } from 'react';
import {
    X,
    Phone,
    AlertTriangle,
    Shield,
    Users,
    FileText,
    ExternalLink,
    ChevronRight,
    AlertCircle,
    Heart,
    Search,
    Clock,
    Eye,
    Lock
} from 'lucide-react';

interface ChildProtectionHubProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'emergency' | 'pocso' | 'labor' | 'missing' | 'rights';

const ChildProtectionHub: React.FC<ChildProtectionHubProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('emergency');
    const [reportStep, setReportStep] = useState(0);
    const [selectedAbuseType, setSelectedAbuseType] = useState<string>('');

    if (!isOpen) return null;

    const tabs = [
        { id: 'emergency' as TabType, label: 'Emergency', icon: Phone, color: 'red' },
        { id: 'pocso' as TabType, label: 'Report Abuse', icon: Shield, color: 'orange' },
        { id: 'labor' as TabType, label: 'Child Labor', icon: AlertTriangle, color: 'amber' },
        { id: 'missing' as TabType, label: 'Missing Child', icon: Search, color: 'blue' },
        { id: 'rights' as TabType, label: "Child's Rights", icon: Heart, color: 'purple' },
    ];

    const abuseTypes = [
        { id: 'sexual', label: 'Sexual Abuse', icon: '🚨', desc: 'Any sexual act with a child (POCSO Act)', urgent: true },
        { id: 'physical', label: 'Physical Abuse', icon: '🤕', desc: 'Beating, hitting, injury to child' },
        { id: 'emotional', label: 'Emotional Abuse', icon: '😢', desc: 'Threats, humiliation, isolation' },
        { id: 'neglect', label: 'Neglect', icon: '🏚️', desc: 'Denial of food, education, medical care' },
        { id: 'trafficking', label: 'Trafficking', icon: '⛓️', desc: 'Buying/selling children, forced begging' },
    ];

    const childRights = [
        { title: 'Right to Education (RTE Act)', desc: 'Free and compulsory education for ages 6-14. Private schools must reserve 25% seats for EWS.' },
        { title: 'Right to Protection (POCSO)', desc: 'Protection from sexual offenses. Special courts, child-friendly procedures, identity protection.' },
        { title: 'Right Against Child Labor', desc: 'Banned in hazardous industries. Ages 14-18 can only do non-hazardous family work.' },
        { title: 'Right to Identity (Birth Registration)', desc: 'Every child has right to name, nationality, and birth certificate within 21 days.' },
        { title: 'Juvenile Justice (Care & Protection)', desc: 'Children in need of care receive shelter, education, and rehabilitation through CWC.' },
    ];

    const handleCallChildline = () => {
        window.location.href = 'tel:1098';
    };

    const renderEmergency = () => (
        <div className="space-y-4">
            {/* Childline 1098 */}
            <button
                onClick={handleCallChildline}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-2xl p-6 transition-all shadow-lg shadow-red-500/30 animate-pulse"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full">
                            <Phone className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-black">CHILDLINE 1098</p>
                            <p className="text-sm opacity-90">24x7 Emergency Helpline for Children</p>
                        </div>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                </div>
            </button>

            {/* Critical Info */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-red-200 font-bold">
                            If a child is in immediate danger, call 1098 or 100 NOW!
                        </p>
                        <p className="text-xs text-red-300 mt-1">
                            Under POCSO Act, any person who suspects child abuse MUST report within 24 hours.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <a
                    href="tel:100"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Police</p>
                        <p className="text-xs text-slate-400">Call 100</p>
                    </div>
                </a>
                <a
                    href="tel:181"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Women Helpline</p>
                        <p className="text-xs text-slate-400">For girl child - 181</p>
                    </div>
                </a>
                <a
                    href="https://trackthemissingchild.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Search className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Track Missing</p>
                        <p className="text-xs text-slate-400">National Portal</p>
                    </div>
                </a>
                <a
                    href="tel:14417"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">NCPCR</p>
                        <p className="text-xs text-slate-400">Child Rights - 14417</p>
                    </div>
                </a>
            </div>

            {/* CWC Info */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="font-bold text-emerald-300 mb-2">🏛️ Child Welfare Committee (CWC)</p>
                <p className="text-sm text-slate-300">
                    Every district has a CWC that provides care and protection to children in need.
                    They can order placement in shelter homes, foster care, or adoption.
                </p>
                <a
                    href="https://ncpcr.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                >
                    <ExternalLink className="w-3 h-3" /> Find your District CWC
                </a>
            </div>
        </div>
    );

    const renderPocsoReport = () => (
        <div className="space-y-4">
            {reportStep === 0 && (
                <>
                    {/* POCSO Info */}
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <p className="text-sm text-orange-200">
                            <strong>🛡️ POCSO Act, 2012</strong> - Protection of Children from Sexual Offences
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-1 list-disc list-inside">
                            <li>Covers all children under 18 years</li>
                            <li>Gender-neutral protection</li>
                            <li>Identity of victim is protected</li>
                            <li>Special child-friendly courts</li>
                        </ul>
                    </div>

                    <p className="text-sm text-slate-400 font-medium">What happened to the child?</p>
                    <div className="space-y-2">
                        {abuseTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedAbuseType(type.id);
                                    setReportStep(1);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                    ${type.urgent
                                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span className="text-2xl">{type.icon}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-white">{type.label}</p>
                                    <p className="text-xs text-slate-400">{type.desc}</p>
                                </div>
                                {type.urgent && (
                                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                                        URGENT
                                    </span>
                                )}
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </button>
                        ))}
                    </div>
                </>
            )}

            {reportStep === 1 && (
                <div className="space-y-4">
                    <button
                        onClick={() => setReportStep(0)}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                    >
                        ← Back
                    </button>

                    <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
                        <p className="font-bold text-white mb-2">
                            Reporting: {abuseTypes.find(t => t.id === selectedAbuseType)?.label}
                        </p>
                        {selectedAbuseType === 'sexual' && (
                            <div className="flex items-start gap-2 text-red-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-xs">
                                    POCSO cases have maximum punishment of life imprisonment.
                                    Do NOT delay reporting - evidence is time-sensitive.
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-slate-400 font-medium">How to report:</p>
                    <div className="space-y-3">
                        <button
                            onClick={handleCallChildline}
                            className="w-full flex items-center gap-4 p-4 bg-red-600 hover:bg-red-500 rounded-xl transition-all"
                        >
                            <Phone className="w-6 h-6 text-white" />
                            <div className="text-left">
                                <p className="font-bold text-white">Call Childline 1098</p>
                                <p className="text-xs text-red-200">Trained counselors, 24x7</p>
                            </div>
                        </button>

                        <a
                            href="tel:100"
                            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <Shield className="w-6 h-6 text-red-400" />
                            <div className="text-left">
                                <p className="font-bold text-white">Call Police 100</p>
                                <p className="text-xs text-slate-400">FIR is mandatory for POCSO</p>
                            </div>
                        </a>

                        <a
                            href="https://ncpcr.gov.in/pocso.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 rounded-xl transition-all"
                        >
                            <ExternalLink className="w-6 h-6 text-blue-400" />
                            <div className="text-left">
                                <p className="font-bold text-white">e-Box (NCPCR)</p>
                                <p className="text-xs text-slate-400">Online complaint to NCPCR</p>
                            </div>
                        </a>
                    </div>

                    {/* Victim Protection */}
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-purple-400" />
                            <p className="font-bold text-purple-300">Victim Protection</p>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1">
                            <li>✓ Identity will be kept confidential</li>
                            <li>✓ Media cannot publish child's identity</li>
                            <li>✓ Child can testify via video conferencing</li>
                            <li>✓ Compensation from Victim Compensation Fund</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );

    const renderChildLabor = () => (
        <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-200">
                    <strong>🏭 Child Labour Act, 1986</strong> (Amended 2016)
                </p>
                <ul className="text-xs text-slate-300 mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Below 14:</strong> Complete ban on employment</li>
                    <li><strong>14-18:</strong> Banned in hazardous occupations</li>
                    <li>Family enterprises exempted (non-hazardous)</li>
                    <li>Penalty: ₹20,000 - ₹50,000 fine, 6 months - 2 years jail</li>
                </ul>
            </div>

            {/* Quick Report */}
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
                <p className="font-bold text-amber-300 mb-3">🚨 Report Child Labor</p>
                <div className="space-y-2">
                    <button
                        onClick={handleCallChildline}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg transition-all"
                    >
                        <Phone className="w-5 h-5 text-white" />
                        <span className="font-bold text-white">Childline 1098</span>
                    </button>
                    <a
                        href="https://pencil.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-all"
                    >
                        <ExternalLink className="w-5 h-5 text-amber-400" />
                        <div className="text-left">
                            <p className="font-bold text-white">PENCIL Portal</p>
                            <p className="text-[10px] text-slate-400">Platform for Effective Enforcement for No Child Labour</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Hazardous Work List */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <p className="font-bold text-white mb-2">⚠️ Hazardous Work (Banned for all under 18)</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>• Mining & Quarrying</span>
                    <span>• Firecrackers</span>
                    <span>• Chemical industries</span>
                    <span>• Brick kilns</span>
                    <span>• Rag picking</span>
                    <span>• Dhaba/Hotels</span>
                    <span>• Automobile workshops</span>
                    <span>• Domestic work</span>
                </div>
            </div>

            {/* Rehabilitation */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="font-bold text-emerald-300 mb-2">🎓 Rehabilitation Benefits</p>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li>✓ ₹15,000 deposited in child's bank account</li>
                    <li>✓ Admission to formal school (RTE)</li>
                    <li>✓ Rs 25,000 fine from employer contribution</li>
                    <li>✓ Skill training for adolescents (14-18)</li>
                </ul>
            </div>
        </div>
    );

    const renderMissingChild = () => (
        <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-200 font-bold">
                            First 24-48 hours are crucial!
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Police MUST register FIR immediately for missing child. No waiting period required.
                        </p>
                    </div>
                </div>
            </div>

            {/* Immediate Actions */}
            <div className="grid grid-cols-2 gap-3">
                <a
                    href="tel:100"
                    className="flex flex-col items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                >
                    <Shield className="w-8 h-8 text-red-400" />
                    <div className="text-center">
                        <p className="font-bold text-white">Police 100</p>
                        <p className="text-[10px] text-slate-400">Report immediately</p>
                    </div>
                </a>
                <button
                    onClick={handleCallChildline}
                    className="flex flex-col items-center gap-2 p-4 bg-pink-500/20 border border-pink-500/30 rounded-xl hover:bg-pink-500/30 transition-all"
                >
                    <Phone className="w-8 h-8 text-pink-400" />
                    <div className="text-center">
                        <p className="font-bold text-white">Childline 1098</p>
                        <p className="text-[10px] text-slate-400">Child helpline</p>
                    </div>
                </button>
            </div>

            {/* National Portals */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <p className="font-bold text-white mb-3">🔍 National Missing Child Portals</p>
                <div className="space-y-2">
                    <a
                        href="https://trackthemissingchild.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="font-semibold text-white">Track The Missing Child</p>
                                <p className="text-[10px] text-slate-400">Official Government Portal</p>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                    </a>
                    <a
                        href="https://khoyapaya.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-purple-400" />
                            <div>
                                <p className="font-semibold text-white">Khoya Paya Portal</p>
                                <p className="text-[10px] text-slate-400">Citizen-powered search</p>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                    </a>
                </div>
            </div>

            {/* What to provide to police */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="font-bold text-emerald-300 mb-2">📋 Information for Police</p>
                <ul className="text-xs text-slate-300 space-y-1">
                    <li>✓ Recent photograph of child</li>
                    <li>✓ Physical description (height, marks)</li>
                    <li>✓ Clothes worn when last seen</li>
                    <li>✓ Last known location & time</li>
                    <li>✓ Aadhaar / Birth certificate if available</li>
                </ul>
            </div>
        </div>
    );

    const renderChildRights = () => (
        <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-sm text-purple-200">
                    <strong>🏛️ Constitutional Rights of Children</strong>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Articles 14, 15, 21, 21A, 24, 39(e), 39(f), 45, 47 protect children's fundamental rights.
                </p>
            </div>

            <div className="space-y-3">
                {childRights.map((right, idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <FileText className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{right.title}</p>
                                <p className="text-xs text-slate-400 mt-1">{right.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Key Age Limits */}
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl">
                <p className="font-bold text-blue-300 mb-2">📊 Key Age Thresholds</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-slate-400">Work permitted</p>
                        <p className="text-white font-bold">14+ (non-hazardous)</p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-slate-400">Marriage (Girls)</p>
                        <p className="text-white font-bold">18+ years</p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-slate-400">Marriage (Boys)</p>
                        <p className="text-white font-bold">21+ years</p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-slate-400">Voting Age</p>
                        <p className="text-white font-bold">18+ years</p>
                    </div>
                </div>
            </div>

            {/* Report Rights Violation */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="font-bold text-red-300 mb-2">📢 Report Rights Violation</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.href = 'tel:14417'}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all"
                    >
                        📞 NCPCR 14417
                    </button>
                    <a
                        href="https://ncpcr.gov.in/index1.php?lang=1&level=1&sublinkid=1282&lid=1455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-all text-center"
                    >
                        📝 Online Complaint
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-pink-500/20 shadow-2xl shadow-pink-500/10 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-600/90 to-rose-600/90 backdrop-blur-xl p-4 border-b border-pink-400/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">बाल सुरक्षा</h2>
                                <p className="text-xs text-pink-200">Child Protection Hub</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-[88px] z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-2 overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setReportStep(0);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? tab.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : tab.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                : tab.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    : tab.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {activeTab === 'emergency' && renderEmergency()}
                    {activeTab === 'pocso' && renderPocsoReport()}
                    {activeTab === 'labor' && renderChildLabor()}
                    {activeTab === 'missing' && renderMissingChild()}
                    {activeTab === 'rights' && renderChildRights()}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500">
                        🧒 "बच्चे देश का भविष्य हैं" - Children are the nation's future
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChildProtectionHub;
