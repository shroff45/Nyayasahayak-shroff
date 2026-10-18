// src/personas/citizen/pages/CaseTrack.tsx
// NyayaPath - 3D Visual Case Journey with Immersive Timeline
// Expert-Level Implementation with 3D Effects

import React, { useState, useEffect } from 'react';
import {
    Search, MapPin, Calendar, AlertCircle,
    CheckCircle, Clock, Shield, User, FileText,
    ExternalLink, Download, Bell, Loader2, Sparkles
} from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';
import { mockDelay } from '../../../shared/utils/mockApi';
import ParticleHeader from '../../../shared/components/3d/ParticleHeader';
import GlassCard from '../../../shared/components/3d/GlassCard';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';
import { SkeletonCard } from '../../../shared/components/common';

// Mock case database
const MOCK_CASES: Record<string, CaseData> = {
    'DLCT/2025/00123': {
        cnr: 'DLCT/2025/00123',
        firNumber: 'FIR/2025/0044',
        complainant: 'Ramesh Kumar',
        status: 'INVESTIGATION',
        ioName: 'Inspector Rajesh Sharma',
        ioStation: 'Saket Police Station',
        filedDate: '2025-10-20T10:30:00',
        signatureDeadline: '2025-10-23T10:30:00',
        isSigned: false,
        applicableLaw: 'BNS',
        sections: ['BNS 303', 'BNS 351'],
        events: [
            { title: 'e-FIR Lodged', description: 'Complaint registered via NyayaSahayak App', date: '2025-10-20T10:30:00', status: 'COMPLETE', icon: '📄' },
            { title: 'IO Assigned', description: 'Inspector Rajesh Sharma (Station ID: 442)', date: '2025-10-21T09:15:00', status: 'COMPLETE', icon: '👮' },
            { title: 'Evidence Collection', description: 'Forensic team visiting crime scene', date: '2025-10-22T14:00:00', status: 'CURRENT', icon: '🔍' },
            { title: 'Charge Sheet Filing', description: 'Expected within 60 days (BNSS Sec 193)', date: null, status: 'PENDING', icon: '⚖️' },
        ]
    }
};

interface TimelineEvent {
    title: string;
    description: string;
    date: string | null;
    status: 'COMPLETE' | 'CURRENT' | 'PENDING';
    icon?: string;
}

interface CaseData {
    cnr: string;
    firNumber: string;
    complainant: string;
    status: string;
    ioName: string;
    ioStation: string;
    filedDate: string;
    signatureDeadline: string;
    isSigned: boolean;
    applicableLaw: string;
    sections: string[];
    events: TimelineEvent[];
}

const CaseTrack: React.FC = () => {
    const { t } = useCitizenTranslation();
    const { showToast, updateToast } = useToast();
    const [cnr, setCnr] = useState('');
    const [searchedCase, setSearchedCase] = useState<CaseData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Recently Tracked CNRs (persisted to localStorage)
    const [recentlyTracked, setRecentlyTracked] = useState<string[]>([]);

    // Three-State Button States
    const [isSearching, setIsSearching] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Load recently tracked from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('nyaya_recently_tracked');
        if (stored) {
            try {
                setRecentlyTracked(JSON.parse(stored));
            } catch { /* ignore */ }
        }
    }, []);

    // Save a CNR to recently tracked
    const saveToRecentlyTracked = (cnrValue: string) => {
        const updated = [cnrValue, ...recentlyTracked.filter(c => c !== cnrValue)].slice(0, 5);
        setRecentlyTracked(updated);
        localStorage.setItem('nyaya_recently_tracked', JSON.stringify(updated));
    };

    // Calculate time remaining for signature
    useEffect(() => {
        if (!searchedCase || searchedCase.isSigned) return;

        const calculateTimeRemaining = () => {
            const deadline = new Date(searchedCase.signatureDeadline);
            const now = new Date();
            const diff = deadline.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining('EXPIRED');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000);

        return () => clearInterval(interval);
    }, [searchedCase]);

    // Three-State Search Handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSearching) return;

        setIsSearching(true);
        setNotFound(false);
        setSearchedCase(null);

        const toastId = showToast('🔍 Searching court records...', 'loading');

        try {
            await mockDelay(800);
            const normalized = cnr.toUpperCase().replace(/\s/g, '');
            const found = Object.values(MOCK_CASES).find(
                c => c.cnr.replace(/\//g, '') === normalized.replace(/\//g, '') ||
                    c.firNumber.replace(/\//g, '') === normalized.replace(/\//g, '')
            );

            if (found) {
                setSearchedCase(found);
                saveToRecentlyTracked(found.cnr);
                updateToast(toastId, '✅ Case found!', 'success');
            } else if (cnr.trim()) {
                const demoCase = MOCK_CASES['DLCT/2025/00123'];
                setSearchedCase(demoCase);
                saveToRecentlyTracked(demoCase.cnr);
                updateToast(toastId, '✅ Demo case loaded', 'info');
            } else {
                updateToast(toastId, '❌ Enter CNR or FIR number', 'error');
            }
        } catch {
            updateToast(toastId, '❌ Search failed', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    // Three-State Download Handler  
    const handleDownload = async () => {
        if (isDownloading || !searchedCase) return;
        setIsDownloading(true);
        const toastId = showToast('📥 Generating report...', 'loading');
        try {
            await mockDelay(1500);
            const data = `CNR: ${searchedCase.cnr}\nFIR: ${searchedCase.firNumber}\nComplainant: ${searchedCase.complainant}\nStatus: ${searchedCase.status}\nIO: ${searchedCase.ioName}\nStation: ${searchedCase.ioStation}`;
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `case_${searchedCase.cnr.replace(/\//g, '_')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            updateToast(toastId, '✅ Downloaded!', 'success');
        } catch {
            updateToast(toastId, '❌ Download failed', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    // Three-State Share Handler
    const handleShare = async () => {
        if (isSharing || !searchedCase) return;
        setIsSharing(true);
        try {
            await navigator.clipboard.writeText(`Case CNR: ${searchedCase.cnr}`);
            showToast('📋 Copied to clipboard!', 'success');
        } catch {
            showToast('❌ Copy failed', 'error');
        } finally {
            setTimeout(() => setIsSharing(false), 300);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 3D Header with Particles */}
            <ParticleHeader
                title={t('track_nyayapath')}
                subtitle={t('track_subtitle')}
                icon={<MapPin className="w-6 h-6 text-emerald-400" />}
                variant="emerald"
            />

            {/* Search Section */}
            <GlassCard className="p-6" variant="emerald">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter CNR or FIR Number (e.g., DLCT/2025/00123)"
                            className="w-full pl-12 pr-28 py-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-lg"
                            value={cnr}
                            onChange={(e) => setCnr(e.target.value)}
                        />
                        <Search className="absolute left-4 top-4.5 text-slate-500 w-5 h-5" />
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-2 top-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('track_searching')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {t('track_track')}
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 text-center">
                        💡 Demo: Try searching with any text to see a sample case
                    </p>
                </form>

                {/* Recently Tracked CNRs */}
                {recentlyTracked.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t('track_recently_tracked')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {recentlyTracked.map((trackedCnr, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCnr(trackedCnr);
                                        setTimeout(() => {
                                            handleSearch({ preventDefault: () => { } } as React.FormEvent);
                                        }, 100);
                                    }}
                                    className="text-xs bg-slate-800/50 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 group"
                                >
                                    <MapPin className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                                    {trackedCnr}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Not Found */}
            {notFound && (
                <GlassCard variant="red" glow className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-400">{t('track_case_not_found')}</h3>
                    <p className="text-red-300/70 text-sm mt-1">
                        {t('track_no_case_found')} "{cnr}"
                    </p>
                </GlassCard>
            )}

            {/* Skeleton Loading State */}
            {isSearching && (
                <div className="space-y-6 animate-pulse">
                    <SkeletonCard className="h-40" />
                    <SkeletonCard className="h-64" />
                    <SkeletonCard className="h-48" />
                </div>
            )}

            {/* Result Container */}
            {searchedCase && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* BNSS 173 Compliance Alert - Show if not signed */}
                    {!searchedCase.isSigned && !isSigned && (
                        <GlassCard variant="amber" glow className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shrink-0">
                                    <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-amber-400 font-bold flex items-center gap-2 text-lg">
                                        <Bell className="w-4 h-4" />
                                        {t('track_action_required')}
                                    </h3>
                                    <p className="text-amber-300/80 text-sm mt-1">
                                        Under <strong>BNSS Section 173(2)</strong>, you must physically or digitally sign your e-FIR within 3 days.
                                    </p>
                                    <div className="mt-3 flex items-center gap-4 text-xs font-bold">
                                        <span className="text-amber-400">⏰ Time Remaining:</span>
                                        <span className={`px-3 py-1 rounded-full ${timeRemaining === 'EXPIRED' ? 'bg-red-500/30 text-red-400' : 'bg-amber-500/30 text-amber-300'}`}>
                                            {timeRemaining}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsSigned(true);
                                        showToast('✅ e-FIR Digitally Signed!', 'success');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-black rounded-xl transition-all shrink-0 shadow-lg shadow-amber-500/20"
                                >
                                    ✍️ {t('track_sign_now')}
                                </button>
                            </div>
                        </GlassCard>
                    )}

                    {/* Case Summary Card - 3D Enhanced */}
                    <GlassCard variant="emerald" className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/30">
                                        {searchedCase.applicableLaw}
                                    </span>
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold border border-blue-500/30">
                                        🔍 {searchedCase.status}
                                    </span>
                                    {isSigned && (
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Signed
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                    CNR: {searchedCase.cnr}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">FIR: {searchedCase.firNumber}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all ${isDownloading ? 'bg-slate-700/50 cursor-wait' : 'bg-slate-800/80 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-slate-700/50'} text-white`}
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    {isDownloading ? t('track_generating') : t('track_download')}
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all ${isSharing ? 'bg-emerald-600' : 'bg-slate-800/80 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-slate-700/50'} text-white`}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {isSharing ? t('track_copied') : t('track_share')}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Complainant', value: searchedCase.complainant, icon: User },
                                { label: 'Filed On', value: formatDate(searchedCase.filedDate), icon: Calendar },
                                { label: 'IO', value: searchedCase.ioName, icon: Shield },
                                { label: 'Station', value: searchedCase.ioStation, icon: MapPin },
                            ].map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                    <p className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                                        <item.icon className="w-3 h-3" /> {item.label}
                                    </p>
                                    <p className="text-white font-medium text-sm truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <p className="text-slate-500 text-xs mb-2">⚖️ Sections Invoked</p>
                            <div className="flex flex-wrap gap-2">
                                {searchedCase.sections.map((section, idx) => (
                                    <span key={idx} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30 font-medium">
                                        {section}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </GlassCard>

                    {/* 3D Timeline */}
                    <GlassCard className="p-6" variant="default">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                    {t('track_case_journey')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Real-time status updates</p>
                            </div>
                            {(searchedCase.isSigned || isSigned) && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border border-emerald-500/30">
                                    <CheckCircle className="w-4 h-4" /> Signature Verified
                                </span>
                            )}
                        </div>

                        {/* 3D Perspective Timeline */}
                        <div className="relative">
                            {/* Animated gradient line */}
                            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-cyan-500 to-slate-700 rounded-full" />

                            <div className="space-y-6">
                                {searchedCase.events.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={`relative pl-16 transition-all duration-300 ${event.status === 'PENDING' ? 'opacity-50' : ''}`}
                                        style={{
                                            transform: `perspective(1000px) rotateX(${event.status === 'CURRENT' ? '2deg' : '0deg'})`,
                                        }}
                                    >
                                        {/* 3D Node */}
                                        <div
                                            className={`absolute left-3 top-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg ${event.status === 'COMPLETE' ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/30' :
                                                event.status === 'CURRENT' ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30 animate-pulse' :
                                                    'bg-slate-700 shadow-slate-500/10'
                                                }`}
                                        >
                                            {event.icon || '•'}
                                        </div>

                                        {/* Event Card */}
                                        <div className={`p-4 rounded-xl border transition-all ${event.status === 'CURRENT'
                                            ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
                                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                                            }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="font-bold text-white flex items-center gap-2">
                                                        {event.title}
                                                        {event.status === 'CURRENT' && (
                                                            <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                                                                🔄 In Progress
                                                            </span>
                                                        )}
                                                        {event.status === 'COMPLETE' && (
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                                                </div>
                                                {event.date && (
                                                    <div className="text-right shrink-0 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                                                        <p className="text-xs font-bold text-slate-300">{formatDate(event.date)}</p>
                                                        <p className="text-[10px] text-slate-500">{formatTime(event.date)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Evidence Integrity Notice */}
                    <GlassCard variant="emerald" glow className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="text-sm text-emerald-300">
                                <strong>🔗 Hash-chain secured:</strong> every exhibit in this case was hashed with
                                SHA-256 and appended to the Akhand Ledger <em>on this device</em>. Verify it
                                here, or hand the exported certificate to anyone - they can check it offline.
                                Nothing is published to a network, so this record does not travel.
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default CaseTrack;
