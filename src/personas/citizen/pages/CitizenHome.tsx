// src/personas/citizen/pages/CitizenHome.tsx
// NyayaSahayak Hybrid v3.0.0 - Premium 3D Citizen Portal
// Enhanced with Accessibility, Legal Compliance & Error Boundaries
// सत्यमेव जयते - Truth Alone Triumphs

import React, { useState, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import {
    FileText, Shield, Bell,
    ArrowRight, Phone, Calendar, Clock,
    Mic, MapPin, MessageSquare, HelpCircle, Loader2,
    Volume2, Square, Sparkles, Scale, Eye, Info, AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useToast } from '../../../shared/hooks/useToast';
import { mockDelay } from '../../../shared/utils/mockApi';
import FloatingCard from '../../../shared/components/3d/FloatingCard';
import AnimatedBackground from '../../../shared/components/3d/AnimatedBackground';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';
import SkipLink from '../../../shared/components/accessibility/SkipLink';
import { BNSS_173_RIGHTS } from '../../../shared/utils/legalCompliance';

// Error Boundary for 3D Components - Graceful degradation for citizen welfare
class JusticeOrbErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('JusticeOrb Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                        <Scale className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <p className="text-emerald-300 font-medium">न्याय सहायक</p>
                        <p className="text-slate-400 text-sm mt-2">AI-Powered Justice</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Lazy load the 3D orb for performance
const JusticeOrb = React.lazy(() => import('../../../shared/components/3d/JusticeOrb'));

const CitizenHome: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast, updateToast } = useToast();
    const { t } = useCitizenTranslation(); // Translation hook

    // Three-State Button States
    const [isSOSLoading, setIsSOSLoading] = useState(false);

    // Voice-to-Justice States
    const [isRecording, setIsRecording] = useState(false);
    const [voiceReportData, setVoiceReportData] = useState<{
        description: string;
        category: string;
        timestamp: string;
    } | null>(null);

    // Audio Read-Back State
    const [isPlaying, setIsPlaying] = useState(false);

    // Audio Read-Back Handler
    const handleReadAloud = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        showToast('🔊 Reading FIR in Hindi...', 'info');

        const textToRead = voiceReportData?.description
            ? `Aapki shikayat darj kar li gayi hai. ${voiceReportData.description.substring(0, 100)}...`
            : 'Aapki shikayat darj kar li gayi hai. Do aadmi kaale pulsar par chain chheenke bhage.';

        const utterance = new SpeechSynthesisUtterance(textToRead);
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;

        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
            setIsPlaying(false);
            showToast('❌ Audio playback failed', 'error');
        };

        window.speechSynthesis.speak(utterance);
    };

    const firstName = user?.name?.split(' ')[0] || 'Citizen';

    // SOS Handler
    const handleSOS = async () => {
        if (isSOSLoading) return;
        setIsSOSLoading(true);
        const toastId = showToast('Contacting Emergency Services...', 'loading');

        try {
            await mockDelay(1500);
            updateToast(toastId, '✅ Emergency Services Notified! Help is on the way.', 'success');
            setTimeout(() => {
                showToast('📍 Your location has been shared with authorities', 'info');
            }, 500);
        } catch {
            updateToast(toastId, '❌ Connection failed. Please call 100 directly!', 'error');
        } finally {
            setIsSOSLoading(false);
        }
    };

    // Voice-to-Justice Handler
    const handleVoiceReport = async () => {
        if (isRecording) return;
        setIsRecording(true);
        const toastId = showToast('🎤 Listening (Hindi)... Speak now', 'loading');

        try {
            await mockDelay(3000);
            updateToast(toastId, '⚙️ Transcribing & Translating to English...', 'loading');
            await mockDelay(2000);

            setVoiceReportData({
                description: "Two men on a black Pulsar motorcycle snatched my gold chain near MG Road junction at approximately 7:30 PM. I was walking home from work when they approached from behind.",
                category: "Snatching (BNS 304)",
                timestamp: new Date().toISOString()
            });

            updateToast(toastId, '✅ FIR Drafted from Voice Input!', 'success');
            setTimeout(() => {
                showToast('📝 Review and submit your e-FIR below', 'info');
            }, 500);
        } catch {
            updateToast(toastId, '❌ Transcription failed. Please try again.', 'error');
        } finally {
            setIsRecording(false);
        }
    };

    return (
        <AnimatedBackground variant="aurora">
            {/* Accessibility: Skip to main content */}
            <SkipLink targetId="main-content" label="Skip to main content" />

            <div className="min-h-screen">
                {/* FIR RIGHTS AWARENESS BANNER - BNSS 173 Compliance */}
                <section className="px-6 pt-4">
                    <div className="max-w-6xl mx-auto">
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/30 rounded-xl cursor-pointer hover:border-blue-400 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Info className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">📜 {t('know_your_rights') || 'Know Your FIR Rights'}</h3>
                                        <p className="text-xs text-blue-300/80">BNSS Section 173 • Zero FIR • Free Copy within 24hrs</p>
                                    </div>
                                </div>
                                <span className="text-blue-400 text-xs font-medium group-open:hidden">Click to expand →</span>
                                <span className="text-blue-400 text-xs font-medium hidden group-open:inline">↑ Collapse</span>
                            </summary>
                            <div className="mt-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
                                <h4 className="font-bold text-blue-400 text-sm">{BNSS_173_RIGHTS.title}</h4>
                                <ul className="space-y-2">
                                    {BNSS_173_RIGHTS.rights.map((right, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-emerald-400 mt-0.5">✓</span>
                                            {right}
                                        </li>
                                    ))}
                                </ul>
                                {/* Zero FIR Tooltip */}
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-amber-300 font-medium">Zero FIR - Important!</p>
                                            <p className="text-xs text-amber-300/80 mt-1">
                                                You can file an FIR at ANY police station in India, regardless of where the incident occurred.
                                                The police cannot refuse to register your complaint.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 italic">{BNSS_173_RIGHTS.citation}</p>
                            </div>
                        </details>
                    </div>
                </section>

                {/* HERO SECTION - 3D Immersive */}
                <section id="main-content" className="relative py-8 px-6 overflow-hidden" tabIndex={-1}>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Left: Welcome Text */}
                            <div className="space-y-6 z-10">
                                {/* Greeting with glow effect */}
                                <div className="relative">
                                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 leading-tight">
                                        {t('namaste')}, {firstName} 🙏
                                    </h1>
                                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-2xl -z-10 rounded-full" />
                                </div>

                                <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                                    {t('hero_tagline')} <span className="text-emerald-400 font-semibold">AI</span>.
                                </p>

                                {/* Quick Action Buttons */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        onClick={handleVoiceReport}
                                        disabled={isRecording}
                                        className={`
                                            group flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                                            ${isRecording
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                                                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        <Mic className={`w-4 h-4 ${isRecording ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
                                        {isRecording ? t('listening') : t('voice_fir')}
                                        <Sparkles className="w-3 h-3 opacity-60" />
                                    </button>

                                    <button
                                        onClick={handleSOS}
                                        disabled={isSOSLoading}
                                        className={`
                                            flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                                            ${isSOSLoading
                                                ? 'bg-red-500/40 text-red-200 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border border-red-500/30 hover:border-red-400 hover:bg-red-500/30 hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        {isSOSLoading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {t('alerting')}</>
                                        ) : (
                                            <><Phone className="w-4 h-4 animate-pulse" /> {t('sos_emergency')}</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Right: 3D Justice Orb */}
                            <div className="relative h-[300px] lg:h-[400px] hidden md:block">
                                <JusticeOrbErrorBoundary>
                                    <Suspense fallback={
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 animate-pulse" />
                                        </div>
                                    }>
                                        <JusticeOrb />
                                    </Suspense>
                                </JusticeOrbErrorBoundary>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Voice FIR Result Card */}
                {voiceReportData && (
                    <section className="px-6 pb-4">
                        <div className="max-w-6xl mx-auto">
                            <FloatingCard glowColor="blue" intensity="medium">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <Mic className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">AI-Transcribed e-FIR Draft</h3>
                                                <p className="text-xs text-blue-400">Hindi → English Translation Complete</p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
                                            ✓ Auto-filled
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Category Detected</p>
                                            <p className="text-sm text-amber-400 font-medium">{voiceReportData.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Transcribed Complaint</p>
                                            <p className="text-sm text-white/90 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                                "{voiceReportData.description}"
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => navigate('/citizen/file')}
                                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
                                            >
                                                Submit as e-FIR
                                            </button>
                                            <button
                                                onClick={handleReadAloud}
                                                className={`p-3 rounded-xl transition-all ${isPlaying
                                                    ? 'bg-amber-500 shadow-lg shadow-amber-500/30 animate-pulse'
                                                    : 'bg-slate-700 hover:bg-slate-600'
                                                    }`}
                                                title={isPlaying ? 'Stop Reading' : 'Read Aloud in Hindi'}
                                            >
                                                {isPlaying ? <Square size={20} className="fill-current text-white" /> : <Volume2 size={20} className="text-white" />}
                                            </button>
                                            <button
                                                onClick={() => setVoiceReportData(null)}
                                                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </FloatingCard>
                        </div>
                    </section>
                )}

                {/* PRIMARY ACTIONS - 3D Floating Cards */}
                <section className="px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-400" />
                            {t('quick_actions')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 1: File e-FIR */}
                            <FloatingCard glowColor="emerald" intensity="high">
                                <Link to="/citizen/file" className="block p-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                            <Mic className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{t('file_efir')}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{t('file_efir_desc')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                        {t('start_now')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </FloatingCard>

                            {/* Card 2: Track Case */}
                            <FloatingCard glowColor="blue" intensity="medium">
                                <Link to="/citizen/track" className="block p-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                            <MapPin className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{t('track_case')}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{t('track_case_desc')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-bold">
                                        {t('enter_cnr')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </FloatingCard>

                            {/* Card 3: Know Your Rights */}
                            <FloatingCard glowColor="purple" intensity="medium">
                                <Link to="/citizen/bot" className="block p-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                            <Shield className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{t('legal_aid_rights')}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{t('legal_aid_desc')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm font-bold">
                                        {t('ask_ai')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </FloatingCard>
                        </div>
                    </div>
                </section>

                {/* SECONDARY ACTIONS */}
                <section className="px-6 py-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Calendar, label: 'Timeline', path: '/citizen/timeline', gradient: 'from-cyan-500 to-blue-500' },
                                { icon: Eye, label: 'Visual Justice', path: '/citizen/visuals', gradient: 'from-pink-500 to-rose-500' },
                                { icon: HelpCircle, label: 'Legal Hub', path: '/citizen/legal-hub', gradient: 'from-amber-500 to-orange-500' },
                                { icon: MessageSquare, label: 'Feedback', path: '/citizen/feedback', gradient: 'from-green-500 to-emerald-500' },
                            ].map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    className="group flex items-center gap-3 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/10 transition-all hover:-translate-y-1"
                                >
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-semibold text-white/90 group-hover:text-white">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* MY ACTIVE CASES */}
                <section className="px-6 py-6">
                    <div className="max-w-6xl mx-auto">
                        <FloatingCard glowColor="emerald" intensity="low">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-emerald-400" />
                                        {t('my_active_cases')}
                                    </h3>
                                    <Link to="/citizen/track" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                                        {t('view_all')} →
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {/* Case 1 */}
                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-xl flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-amber-400 transition-colors">FIR #2024/001</p>
                                                <p className="text-xs text-slate-400">CNR: DLCT/2024/00123</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-2 text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full font-bold">
                                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                                🔍 Under Investigation
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1.5">Next: Oct 24, 2025</p>
                                        </div>
                                    </div>

                                    {/* Case 2 */}
                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-xl flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-blue-400 transition-colors">Case #44/2023</p>
                                                <p className="text-xs text-slate-400">CNR: DLCT/2023/00789</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-2 text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full font-bold">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                                📅 Hearing Scheduled
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1.5">Next: Oct 24, 2025</p>
                                        </div>
                                    </div>

                                    {/* Case 3 - Disposed */}
                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer group opacity-75">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-green-500/30 rounded-xl flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">Case #12/2022</p>
                                                <p className="text-xs text-slate-400">CNR: DLCT/2022/00456</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-2 text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-bold">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                                ✓ Disposed
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1.5">Closed: Aug 15, 2024</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FloatingCard>
                    </div>
                </section>

                {/* RECENT UPDATES & NEXT HEARING */}
                <section className="px-6 py-6 pb-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Activity Feed */}
                            <div className="lg:col-span-2">
                                <FloatingCard glowColor="cyan" intensity="low">
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-cyan-400" />
                                            Recent Updates
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { title: 'FIR #2024/001 Registered', time: '2 hours ago', status: 'Pending Signature', gradient: 'from-amber-500 to-orange-500' },
                                                { title: 'Hearing Scheduled: Case 44/2023', time: 'Yesterday', status: 'Oct 24, 2025', gradient: 'from-blue-500 to-indigo-500' },
                                                { title: 'Evidence Uploaded by IO', time: '2 days ago', status: 'Verified', gradient: 'from-emerald-500 to-green-500' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient}`} />
                                                        <div>
                                                            <p className="font-medium text-white text-sm">{item.title}</p>
                                                            <p className="text-xs text-slate-500">{item.time}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${item.gradient} text-white/90`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => navigate('/citizen/timeline')}
                                            className="w-full mt-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors border-t border-slate-700/50 pt-4"
                                        >
                                            View All Activity →
                                        </button>
                                    </div>
                                </FloatingCard>
                            </div>

                            {/* Next Hearing */}
                            <FloatingCard glowColor="amber" intensity="medium">
                                <div className="p-6 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-400 mb-4 text-xs uppercase tracking-wider font-bold">
                                            <Calendar className="w-4 h-4" /> Upcoming Hearing
                                        </div>
                                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-1">24 Oct</h2>
                                        <p className="text-slate-300 text-lg">Friday, 10:00 AM</p>
                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <p className="font-medium text-white">State vs. {firstName}</p>
                                            <p className="text-sm text-slate-400">District Court, Vellore (Court Hall 3)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/citizen/track')}
                                        className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 hover:-translate-y-0.5"
                                    >
                                        View Case Details
                                    </button>
                                </div>
                            </FloatingCard>
                        </div>
                    </div>
                </section>

                {/* BNSS 173 Compliance Notice */}
                <section className="px-6 pb-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-amber-400 font-bold">e-FIR Signature Reminder</h4>
                                <p className="text-amber-300/80 text-sm mt-1">
                                    Under <strong>BNSS Section 173(2)</strong>, e-FIRs must be signed within 3 days. Check your pending signatures in Case Tracker.
                                </p>
                            </div>
                            <Link to="/citizen/track" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:-translate-y-0.5">
                                Check Now
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </AnimatedBackground>
    );
};

export default CitizenHome;
