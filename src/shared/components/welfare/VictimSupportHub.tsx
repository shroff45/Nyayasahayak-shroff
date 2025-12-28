// src/shared/components/welfare/VictimSupportHub.tsx
// Victim Support Hub - Comprehensive resources for crime victims
// Counseling, Compensation, Rights Information

import React, { useState } from 'react';
import {
    Heart, Phone, FileText, DollarSign, Shield,
    ExternalLink, ChevronDown, ChevronUp, BookOpen,
    Users, Scale, HelpCircle
} from 'lucide-react';

interface VictimSupportHubProps {
    isOpen: boolean;
    onClose: () => void;
}

const VictimSupportHub: React.FC<VictimSupportHubProps> = ({ isOpen, onClose }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('rights');

    if (!isOpen) return null;

    const sections = [
        {
            id: 'rights',
            title: 'Your Rights as a Victim',
            icon: Scale,
            color: 'emerald',
            content: [
                { title: 'Right to File FIR (Zero FIR)', desc: 'File at ANY police station, regardless of jurisdiction' },
                { title: 'Right to Free Copy of FIR', desc: 'Police MUST provide free copy within 24 hours' },
                { title: 'Right to Privacy', desc: 'Identity protection in sensitive cases' },
                { title: 'Right to Legal Aid', desc: 'Free lawyer if unable to afford one' },
                { title: 'Right to Compensation', desc: 'Under Victim Compensation Scheme' },
            ]
        },
        {
            id: 'counseling',
            title: 'Counseling & Mental Health',
            icon: Heart,
            color: 'pink',
            content: [
                { title: 'NIMHANS Helpline', desc: '080-46110007 (24/7 Mental Health Support)' },
                { title: 'iCall (TISS)', desc: '9152987821 (Free Counseling)' },
                { title: 'Vandrevala Foundation', desc: '1860-2662-345 (24/7 Helpline)' },
                { title: 'One Stop Centres', desc: 'Medical, Legal, Counseling under one roof' },
            ]
        },
        {
            id: 'compensation',
            title: 'Victim Compensation Scheme',
            icon: DollarSign,
            color: 'amber',
            content: [
                { title: 'Who is Eligible?', desc: 'Victims of violent crimes, acid attacks, sexual offenses, trafficking' },
                { title: 'Amount', desc: '₹3-10 Lakhs depending on case type and state' },
                { title: 'How to Apply?', desc: 'Through DLSA (District Legal Services Authority)' },
                { title: 'Timeline', desc: 'Interim relief within 2 months, final within 6 months' },
            ]
        },
        {
            id: 'legal-aid',
            title: 'Free Legal Aid (NALSA)',
            icon: BookOpen,
            color: 'blue',
            content: [
                { title: 'Who is Eligible?', desc: 'Women, children, SC/ST, disabled, victims of trafficking' },
                { title: 'Annual Income Limit', desc: '₹3 Lakh (Supreme Court), varies by state for lower courts' },
                { title: 'How to Apply?', desc: 'Visit nearest DLSA or apply online at nalsa.gov.in' },
                { title: 'NALSA Helpline', desc: '15100 (Toll-Free Legal Aid)' },
            ]
        },
        {
            id: 'witness',
            title: 'Witness Protection',
            icon: Shield,
            color: 'purple',
            content: [
                { title: 'What is it?', desc: 'Protection for witnesses threatened due to testimony' },
                { title: 'Types of Protection', desc: 'Identity change, relocation, police escort, in-camera trial' },
                { title: 'How to Apply?', desc: 'Application to the concerned Court during trial' },
                { title: '2018 Scheme', desc: 'Comprehensive Witness Protection Scheme by SC' },
            ]
        }
    ];

    const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
        emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
        pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'text-pink-400' },
        amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
        blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
        purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' },
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl my-8 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 rounded-3xl border border-emerald-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 bg-slate-900/95 backdrop-blur-xl border-b border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                                <Users className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                    Victim Support Hub
                                </h2>
                                <p className="text-sm text-slate-400">पीड़ित सहायता केंद्र</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 flex gap-3 overflow-x-auto border-b border-slate-700/50">
                    <a
                        href="tel:15100"
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 hover:bg-blue-500/30 transition-all"
                    >
                        <Phone className="w-4 h-4" />
                        <span className="font-bold">15100</span>
                        <span className="text-xs">NALSA</span>
                    </a>
                    <a
                        href="https://nalsa.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 hover:bg-emerald-500/30 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-xs">Apply for Legal Aid</span>
                    </a>
                    <a
                        href="https://nlsa.gov.in/victim-compensation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 hover:bg-amber-500/30 transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Compensation Form</span>
                    </a>
                </div>

                {/* Accordion Sections */}
                <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                    {sections.map((section) => {
                        const colors = colorClasses[section.color];
                        const isExpanded = expandedSection === section.id;

                        return (
                            <div
                                key={section.id}
                                className={`rounded-xl border ${colors.border} overflow-hidden transition-all`}
                            >
                                <button
                                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                    className={`w-full flex items-center gap-4 p-4 ${colors.bg} hover:brightness-110 transition-all`}
                                >
                                    <section.icon className={`w-5 h-5 ${colors.icon}`} />
                                    <span className={`font-bold ${colors.text} flex-1 text-left`}>
                                        {section.title}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="p-4 bg-slate-800/30 space-y-3">
                                        {section.content.map((item, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${colors.bg} mt-2 flex-shrink-0`} />
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.title}</p>
                                                    <p className="text-xs text-slate-400">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <HelpCircle className="w-4 h-4" />
                        <p>
                            For immediate danger, call <span className="text-red-400 font-bold">100</span>.
                            All services are <span className="text-emerald-400 font-bold">FREE</span> for eligible victims.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VictimSupportHub;
