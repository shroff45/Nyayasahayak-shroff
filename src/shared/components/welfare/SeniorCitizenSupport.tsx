// src/shared/components/welfare/SeniorCitizenSupport.tsx
// NyayaSahayak - Senior Citizen Support (Vriddhashram Sahayata)
// Comprehensive elder care, abuse reporting, pension help & legal aid

import React, { useState } from 'react';
import {
    X,
    Phone,
    AlertTriangle,
    Heart,
    Home,
    Wallet,
    MapPin,
    Shield,
    Users,
    Scale,
    ChevronRight,
    ExternalLink,
    Clock,
    CheckCircle,
    Info
} from 'lucide-react';

interface SeniorCitizenSupportProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'emergency' | 'abuse' | 'pension' | 'legal' | 'care';

const SeniorCitizenSupport: React.FC<SeniorCitizenSupportProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('emergency');
    const [abuseReportStep, setAbuseReportStep] = useState(0);
    const [selectedAbuseType, setSelectedAbuseType] = useState<string>('');

    if (!isOpen) return null;

    const tabs = [
        { id: 'emergency' as TabType, label: 'Emergency', icon: Phone, color: 'red' },
        { id: 'abuse' as TabType, label: 'Report Abuse', icon: AlertTriangle, color: 'orange' },
        { id: 'pension' as TabType, label: 'Pension Help', icon: Wallet, color: 'green' },
        { id: 'legal' as TabType, label: 'Legal Rights', icon: Scale, color: 'blue' },
        { id: 'care' as TabType, label: 'Care Homes', icon: Home, color: 'purple' },
    ];

    const abuseTypes = [
        { id: 'physical', label: 'Physical Abuse', icon: '🤕', desc: 'Hitting, pushing, restraining' },
        { id: 'emotional', label: 'Emotional Abuse', icon: '😢', desc: 'Verbal abuse, threats, isolation' },
        { id: 'financial', label: 'Financial Abuse', icon: '💰', desc: 'Property theft, pension fraud' },
        { id: 'neglect', label: 'Neglect', icon: '🏚️', desc: 'Denial of food, medicine, care' },
        { id: 'abandonment', label: 'Abandonment', icon: '🚶', desc: 'Left alone, thrown out of home' },
    ];

    const pensionSchemes = [
        { name: 'IGNOAPS', fullName: 'Indira Gandhi National Old Age Pension', amount: '₹200-500/month', eligibility: 'BPL, 60+ years' },
        { name: 'IGNWPS', fullName: 'Indira Gandhi National Widow Pension', amount: '₹300-500/month', eligibility: 'BPL widows, 40-79 years' },
        { name: 'EPF Pension', fullName: 'Employees Provident Fund Pension', amount: 'Based on service', eligibility: 'EPF members, 58+ years' },
        { name: 'NPS', fullName: 'National Pension System', amount: 'Based on contribution', eligibility: 'NPS subscribers' },
        { name: 'Atal Pension', fullName: 'Atal Pension Yojana', amount: '₹1000-5000/month', eligibility: '18-40 years enrollment' },
    ];

    const legalRights = [
        { title: 'Maintenance & Welfare of Parents Act, 2007', desc: 'Children must provide maintenance to parents. Tribunal can order ₹10,000/month.' },
        { title: 'Right to Property', desc: 'Senior citizens can evict children from self-acquired property if they fail to maintain.' },
        { title: 'Free Legal Aid', desc: 'All seniors above 60 are entitled to free legal aid under Legal Services Authority Act.' },
        { title: 'Priority Medical Care', desc: 'Separate queues and priority treatment in government hospitals.' },
        { title: 'Income Tax Benefits', desc: 'Higher basic exemption limit (₹3L for 60+, ₹5L for 80+), no advance tax if no business income.' },
    ];

    const handleCallElderline = () => {
        window.location.href = 'tel:14567';
    };

    const renderEmergency = () => (
        <div className="space-y-4">
            {/* Elderline */}
            <button
                onClick={handleCallElderline}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-2xl p-6 transition-all shadow-lg shadow-red-500/30"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full">
                            <Phone className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-black">ELDERLINE 14567</p>
                            <p className="text-sm opacity-90">24x7 National Helpline for Seniors</p>
                        </div>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                </div>
            </button>

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
                    href="tel:108"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <Heart className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Ambulance</p>
                        <p className="text-xs text-slate-400">Call 108</p>
                    </div>
                </a>
                <a
                    href="tel:1098"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Social Welfare</p>
                        <p className="text-xs text-slate-400">District Office</p>
                    </div>
                </a>
                <a
                    href="tel:15100"
                    className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Scale className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Legal Aid</p>
                        <p className="text-xs text-slate-400">NALSA 15100</p>
                    </div>
                </a>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-amber-200">
                            <strong>Elderline 14567</strong> provides free counseling, rescue, shelter,
                            pension help, and legal aid referrals. Available in 18 languages.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAbuseReport = () => (
        <div className="space-y-4">
            {abuseReportStep === 0 && (
                <>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <p className="text-sm text-orange-200">
                            <strong>🛡️ You are not alone.</strong> Elder abuse is punishable under law.
                            Report confidentially - your identity will be protected.
                        </p>
                    </div>

                    <p className="text-sm text-slate-400 font-medium">Select type of abuse:</p>
                    <div className="space-y-2">
                        {abuseTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedAbuseType(type.id);
                                    setAbuseReportStep(1);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                    ${selectedAbuseType === type.id
                                        ? 'bg-orange-500/20 border-orange-500/50'
                                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span className="text-2xl">{type.icon}</span>
                                <div>
                                    <p className="font-bold text-white">{type.label}</p>
                                    <p className="text-xs text-slate-400">{type.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                            </button>
                        ))}
                    </div>
                </>
            )}

            {abuseReportStep === 1 && (
                <div className="space-y-4">
                    <button
                        onClick={() => setAbuseReportStep(0)}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                    >
                        ← Back
                    </button>

                    <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
                        <p className="font-bold text-white mb-2">
                            Reporting: {abuseTypes.find(t => t.id === selectedAbuseType)?.label}
                        </p>
                        <p className="text-sm text-slate-300">
                            Choose how you want to report:
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCallElderline}
                            className="w-full flex items-center gap-4 p-4 bg-red-600 hover:bg-red-500 rounded-xl transition-all"
                        >
                            <Phone className="w-6 h-6 text-white" />
                            <div className="text-left">
                                <p className="font-bold text-white">Call Elderline 14567</p>
                                <p className="text-xs text-red-200">Immediate help, 24x7 available</p>
                            </div>
                        </button>

                        <a
                            href="https://elderline.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 rounded-xl transition-all"
                        >
                            <ExternalLink className="w-6 h-6 text-blue-400" />
                            <div className="text-left">
                                <p className="font-bold text-white">Online Complaint</p>
                                <p className="text-xs text-slate-400">elderline.in portal</p>
                            </div>
                        </a>

                        <a
                            href="tel:100"
                            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <Shield className="w-6 h-6 text-red-400" />
                            <div className="text-left">
                                <p className="font-bold text-white">Call Police 100</p>
                                <p className="text-xs text-slate-400">For immediate physical danger</p>
                            </div>
                        </a>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-200">
                                Under the <strong>Maintenance and Welfare of Parents Act</strong>,
                                elder abuse by family members is punishable with imprisonment up to 3 months
                                or fine up to ₹10,000.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPensionHelp = () => (
        <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-sm text-emerald-200">
                    <strong>💰 Know Your Pension Rights</strong><br />
                    Every senior citizen above 60 years is entitled to at least one pension scheme.
                </p>
            </div>

            <p className="text-sm text-slate-400 font-medium">Available Pension Schemes:</p>
            <div className="space-y-3">
                {pensionSchemes.map((scheme, idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-white">{scheme.name}</p>
                                <p className="text-xs text-slate-400">{scheme.fullName}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                                {scheme.amount}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            <strong>Eligibility:</strong> {scheme.eligibility}
                        </p>
                    </div>
                ))}
            </div>

            {/* Grievance Redressal */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="font-bold text-blue-300 mb-2">📋 Pension Grievance?</p>
                <div className="space-y-2">
                    <a
                        href="https://pgportal.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                        <ExternalLink className="w-4 h-4" />
                        PG Portal (Centralized Grievance)
                    </a>
                    <a
                        href="https://pensionersportal.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Pensioners Portal
                    </a>
                </div>
            </div>
        </div>
    );

    const renderLegalRights = () => (
        <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-200">
                    <strong>⚖️ Senior Citizens Have Special Legal Protections</strong><br />
                    Under Indian law, children MUST maintain their parents. Failure is punishable.
                </p>
            </div>

            <div className="space-y-3">
                {legalRights.map((right, idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Scale className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{right.title}</p>
                                <p className="text-xs text-slate-400 mt-1">{right.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Apply for Maintenance */}
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl">
                <p className="font-bold text-purple-300 mb-2">🏛️ How to Claim Maintenance</p>
                <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                    <li>File application at Maintenance Tribunal (SDM office)</li>
                    <li>Attach proof of relationship and need</li>
                    <li>Tribunal must decide within 90 days</li>
                    <li>Order up to ₹10,000/month per child</li>
                </ol>
                <button
                    onClick={() => window.location.href = 'tel:15100'}
                    className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all"
                >
                    📞 Call NALSA 15100 for Free Legal Help
                </button>
            </div>
        </div>
    );

    const renderCareHomes = () => (
        <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-sm text-purple-200">
                    <strong>🏠 Find Care & Support</strong><br />
                    Government and NGO-run old age homes provide free or subsidized care.
                </p>
            </div>

            {/* Search by Location */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <span className="font-bold text-white">Find Nearby Facilities</span>
                </div>
                <div className="space-y-2">
                    <a
                        href="https://elderline.in/old-age-homes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-all"
                    >
                        <span className="text-sm text-white">Old Age Homes Directory</span>
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                    </a>
                    <a
                        href="https://socialjustice.gov.in/schemes/10"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-all"
                    >
                        <span className="text-sm text-white">Govt. Integrated Program for Older Persons</span>
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                    </a>
                </div>
            </div>

            {/* Services Available */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                    <Home className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Day Care</p>
                    <p className="text-xs text-slate-400">Daily activities & meals</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                    <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Health Camps</p>
                    <p className="text-xs text-slate-400">Free medical checkups</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Respite Care</p>
                    <p className="text-xs text-slate-400">Short-term stay</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                    <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Senior Clubs</p>
                    <p className="text-xs text-slate-400">Social activities</p>
                </div>
            </div>

            {/* Helpline */}
            <button
                onClick={handleCallElderline}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-all"
            >
                <Phone className="w-5 h-5" />
                Call 14567 for Placement Help
            </button>
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
            <div className="relative w-full max-w-lg max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-xl p-4 border-b border-amber-400/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">वृद्धाश्रम सहायता</h2>
                                <p className="text-xs text-amber-200">Senior Citizen Support</p>
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
                                    setAbuseReportStep(0);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? tab.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : tab.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                : tab.color === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
                    {activeTab === 'abuse' && renderAbuseReport()}
                    {activeTab === 'pension' && renderPensionHelp()}
                    {activeTab === 'legal' && renderLegalRights()}
                    {activeTab === 'care' && renderCareHomes()}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3 text-center">
                    <p className="text-xs text-slate-500">
                        🙏 "वृद्धा सेवा, श्रेष्ठ सेवा" - Serving elders is the noblest service
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeniorCitizenSupport;
