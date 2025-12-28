import React, { useState } from 'react';
import {
    FileText, ShieldCheck, Activity, Scale, AlertTriangle,
    Phone, MessageSquare, Clock, ChevronRight, Bell, HelpCircle,
    Mic, FileQuestion, MapPin
} from 'lucide-react';
import { User } from '../../../main/types';

// Lazy-load citizen modules with error boundaries
import VoiceFilingInterface from './VoiceFilingInterface';
import { NyayaPath } from './NyayaPath';
import { EmergencySOS } from './EmergencySOS';
import { RightsAssistant } from './RightsAssistant';

// ============================================
// TYPES
// ============================================
interface CitizenDashboardProps {
    currentUser: User;
    t: (key: string) => string;
    theme: 'light' | 'dark';
}

interface QuickAction {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;  // CSS color value
    textColor: string; // CSS color value
    onClick?: () => void;
}

// ============================================
// ERROR BOUNDARY FOR CHILD MODULES
// ============================================
class ModuleErrorBoundary extends React.Component<
    { fallback: React.ReactNode; children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// ============================================
// FALLBACK COMPONENTS
// ============================================
const VoiceFilingFallback: React.FC = () => (
    <div className="p-6 text-center">
        <FileQuestion className="w-12 h-12 mx-auto mb-4 text-[var(--low)]" />
        <h3 className="font-semibold text-[var(--hi)] mb-2">Voice Filing Unavailable</h3>
        <p className="text-sm text-[var(--low)] mb-4">
            Microphone access or speech recognition is not available.
        </p>
        <button
            className="btn btn-primary px-6 py-2 rounded-xl text-sm"
            onClick={() => window.location.reload()}
        >
            Try Again
        </button>
    </div>
);

const NyayaPathFallback: React.FC = () => (
    <div className="p-4">
        <h3 className="font-semibold text-[var(--hi)] mb-3 text-sm">Your Case Journey</h3>
        <ol className="space-y-2 text-sm text-[var(--mid)]">
            <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ns-success/20 text-ns-success flex items-center justify-center text-xs">✓</span>
                FIR Filed
            </li>
            <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ns-primary-500/20 text-ns-primary-500 flex items-center justify-center text-xs animate-pulse">●</span>
                Police Verification (In Progress)
            </li>
            <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--surface1)] text-[var(--faint)] flex items-center justify-center text-xs">○</span>
                Charge Sheet
            </li>
            <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--surface1)] text-[var(--faint)] flex items-center justify-center text-xs">○</span>
                Court Hearing
            </li>
        </ol>
    </div>
);

const SOSFallback: React.FC = () => (
    <a
        href="tel:100"
        className="block w-full p-6 bg-ns-danger-600/20 border border-ns-danger-600/30 rounded-2xl text-center hover:bg-ns-danger-600/30 transition-colors"
        aria-label="Emergency SOS - Call Police"
    >
        <Phone className="w-10 h-10 mx-auto mb-2 text-ns-danger-600" />
        <span className="font-bold text-ns-danger-600 text-lg">EMERGENCY: Call 100</span>
    </a>
);

const RightsAssistantFallback: React.FC = () => (
    <div className="p-4 text-center">
        <HelpCircle className="w-10 h-10 mx-auto mb-3 text-[var(--low)]" />
        <p className="text-sm text-[var(--low)] mb-3">Assistant unavailable. Try later.</p>
        <a
            href="https://india.gov.in/my-government/citizen-services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ns-primary-500 text-sm underline"
        >
            View Legal FAQ →
        </a>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ currentUser, t: _t, theme: _theme }) => {
    // activeWidget state for future widget panel switching (Phase 2)
    const [, setActiveWidget] = useState<'filing' | 'rights' | null>(null);

    // Defensive check per implementation plan
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="glass p-8 rounded-2xl text-center max-w-md">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-[var(--low)]" />
                    <h2 className="text-xl font-bold text-[var(--hi)] mb-2">Please Sign In</h2>
                    <p className="text-[var(--mid)]">Sign in to access your Citizen Dashboard and track your cases.</p>
                </div>
            </div>
        );
    }

    // Extract name from email (before @) since User type only has email
    const userName = currentUser.email?.split('@')[0]?.split('.')[0] || 'Citizen';

    // Quick action cards with explicit color values for Tailwind static extraction
    const quickActions: QuickAction[] = [
        {
            id: 'file-complaint',
            icon: <Mic className="w-6 h-6" />,
            title: 'File Complaint',
            description: 'Voice-enabled filing in your language',
            bgColor: 'rgba(43, 231, 184, 0.2)',  // ns-accent-500/20
            textColor: '#2BE7B8',                 // ns-accent-500
            onClick: () => setActiveWidget('filing')
        },
        {
            id: 'track-case',
            icon: <MapPin className="w-6 h-6" />,
            title: 'Track Case',
            description: 'Real-time status updates',
            bgColor: 'rgba(74, 163, 255, 0.2)',   // ns-primary-500/20
            textColor: '#4AA3FF'                   // ns-primary-500
        },
        {
            id: 'legal-help',
            icon: <MessageSquare className="w-6 h-6" />,
            title: 'Legal Help',
            description: 'AI-powered rights assistant',
            bgColor: 'rgba(192, 108, 255, 0.2)',  // ns-secondary-500/20
            textColor: '#C06CFF',                  // ns-secondary-500
            onClick: () => setActiveWidget('rights')
        },
        {
            id: 'documents',
            icon: <FileText className="w-6 h-6" />,
            title: 'Documents',
            description: 'View case documents',
            bgColor: 'rgba(245, 158, 11, 0.2)',   // ns-warning-600/20  
            textColor: '#F59E0B'                   // ns-warning-600
        }
    ];

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* ========================================
                HEADER SECTION
                ======================================== */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-1">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--hi)] tracking-tight title">
                        Namaste, {userName} 🙏
                    </h1>
                    <p className="text-[var(--mid)] mt-1 text-sm sm:text-base">
                        NyayaSahayak is ready to assist you with your legal journey.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-ns-success/20 text-ns-success border border-ns-success/30 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                        <ShieldCheck size={14} /> Verified Citizen
                    </span>
                    <button
                        className="p-2 rounded-full bg-[var(--surface0)] hover:bg-[var(--surface1)] transition-colors"
                        aria-label="Notifications"
                        tabIndex={0}
                    >
                        <Bell size={18} className="text-[var(--mid)]" />
                    </button>
                </div>
            </header>

            {/* ========================================
                MAIN CONTENT GRID
                3-column on lg, 2 on md, 1 on mobile
                ======================================== */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* ----------------------------------------
                    LEFT COLUMN (2/3 on desktop)
                    Case Journey + Quick Actions + Filing
                    ---------------------------------------- */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">

                    {/* Case Journey Tracker (NyayaPath) */}
                    <section
                        className="glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-[var(--stroke)] relative overflow-hidden"
                        aria-labelledby="case-journey-title"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true">
                            <Activity className="w-20 h-20 text-ns-primary-500" />
                        </div>
                        <ModuleErrorBoundary fallback={<NyayaPathFallback />}>
                            <NyayaPath />
                        </ModuleErrorBoundary>
                    </section>

                    {/* Quick Actions Grid */}
                    <section aria-labelledby="quick-actions-title">
                        <h2 id="quick-actions-title" className="sr-only">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={action.onClick}
                                    className={`glass-quiet p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-200 
                                        hover:translate-y-[-2px] hover:shadow-lg hover:bg-[var(--surface1)]
                                        focus-visible:ring-2 focus-visible:ring-ns-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg0)]
                                        group cursor-pointer`}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${action.title}: ${action.description}`}
                                >
                                    <div
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: action.bgColor, color: action.textColor }}
                                    >
                                        {action.icon}
                                    </div>
                                    <h3 className="font-semibold text-[var(--hi)] text-sm mb-0.5">{action.title}</h3>
                                    <p className="text-[var(--low)] text-xs hidden sm:block">{action.description}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Voice Filing Interface */}
                    <section
                        className="flex-1 glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-[var(--stroke)] relative overflow-hidden flex flex-col"
                        aria-labelledby="filing-title"
                    >
                        <div className="flex items-center gap-3 mb-4 sm:mb-6 relative z-10">
                            <div className="p-2.5 sm:p-3 bg-ns-accent-500/20 text-ns-accent-500 rounded-xl border border-ns-accent-500/30 shadow-lg shadow-ns-accent-500/10">
                                <FileText size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 id="filing-title" className="text-lg sm:text-xl font-bold text-[var(--hi)] title">
                                    File New Complaint
                                </h2>
                                <p className="text-[10px] sm:text-xs text-[var(--low)] uppercase tracking-wider">
                                    Voice-Enabled Filing System
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[200px]">
                            <ModuleErrorBoundary fallback={<VoiceFilingFallback />}>
                                <VoiceFilingInterface />
                            </ModuleErrorBoundary>
                        </div>
                    </section>
                </div>

                {/* ----------------------------------------
                    RIGHT COLUMN (1/3 on desktop)
                    SOS + Rights Assistant + Tips
                    ---------------------------------------- */}
                <div className="space-y-6 flex flex-col">

                    {/* Emergency SOS - High Priority */}
                    <section
                        className="glass p-1 rounded-2xl sm:rounded-3xl border border-ns-danger-600/30 shadow-[0_0_30px_rgba(255,61,90,0.1)]"
                        aria-label="Emergency SOS"
                    >
                        <ModuleErrorBoundary fallback={<SOSFallback />}>
                            <EmergencySOS />
                        </ModuleErrorBoundary>
                    </section>

                    {/* Rights Assistant */}
                    <section
                        className="flex-1 glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--stroke)] flex flex-col min-h-[300px]"
                        aria-labelledby="rights-assistant-title"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="w-5 h-5 text-ns-secondary-500" />
                            <h3 id="rights-assistant-title" className="font-bold text-[var(--hi)] text-sm uppercase tracking-wider">
                                Legal Rights Assistant
                            </h3>
                        </div>
                        <div className="flex-1">
                            <ModuleErrorBoundary fallback={<RightsAssistantFallback />}>
                                <RightsAssistant />
                            </ModuleErrorBoundary>
                        </div>
                    </section>

                    {/* Did You Know Card - Educational */}
                    <section
                        className="glass-quiet p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-ns-primary-500/20 bg-ns-primary-500/5 relative overflow-hidden"
                        aria-labelledby="tip-title"
                    >
                        <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-ns-primary-500/10 rounded-full blur-xl" aria-hidden="true" />
                        <h4 id="tip-title" className="font-bold text-ns-primary-500 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Did you know?
                        </h4>
                        <p className="text-sm text-[var(--mid)] leading-relaxed">
                            You can track your bail application status directly from this dashboard without visiting the court.
                        </p>
                    </section>

                    {/* Upcoming Hearing (Placeholder for Phase 2) */}
                    <section
                        className="glass-quiet p-4 rounded-xl border border-[var(--stroke)]"
                        aria-labelledby="hearing-title"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 id="hearing-title" className="font-semibold text-[var(--hi)] text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-ns-warning-600" /> Next Hearing
                            </h4>
                            <ChevronRight className="w-4 h-4 text-[var(--faint)]" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-ns-warning-600/20 flex items-center justify-center">
                                <span className="text-ns-warning-600 font-bold text-lg">15</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[var(--hi)]">December 15, 2024</p>
                                <p className="text-xs text-[var(--low)]">District Court, Room 4</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ========================================
                MOBILE STICKY SOS BUTTON
                Only visible on small screens
                ======================================== */}
            <div className="fixed bottom-4 left-4 right-4 sm:hidden z-50 safe-area-pb">
                <ModuleErrorBoundary fallback={<SOSFallback />}>
                    <button
                        className="w-full py-4 bg-ns-danger-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(255,61,90,0.4)] flex items-center justify-center gap-3"
                        aria-label="Emergency SOS - Call Police"
                        onClick={() => window.location.href = 'tel:100'}
                    >
                        <AlertTriangle className="w-6 h-6" />
                        EMERGENCY SOS
                    </button>
                </ModuleErrorBoundary>
            </div>
        </div>
    );
};

export default CitizenDashboard;
