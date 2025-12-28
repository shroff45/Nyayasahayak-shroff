// CitizenTimeline.tsx - Citizen-Friendly Case Timeline
// Allows citizens to view timeline of their cases

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    Calendar,
    FileText,
    Gavel,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Search,
    Filter,
    TrendingUp,
    Scale
} from 'lucide-react';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';
import { SkeletonCard } from '../../../shared/components/common';

interface TimelineEvent {
    id: string;
    date: Date;
    title: string;
    description: string;
    type: 'filing' | 'hearing' | 'order' | 'milestone' | 'projected';
    status: 'completed' | 'current' | 'upcoming';
}

interface CaseInfo {
    id: string;
    cnr: string;
    title: string;
    court: string;
    status: string;
    filingDate: string;
    nextHearing?: string;
    events: TimelineEvent[];
}

// Mock citizen cases data
const mockCitizenCases: CaseInfo[] = [
    {
        id: '1',
        cnr: 'DLCT/2024/001234',
        title: 'Property Dispute - Sharma vs. Estate',
        court: 'Delhi District Court',
        status: 'In Progress',
        filingDate: '2024-03-15',
        nextHearing: '2025-01-10',
        events: [
            { id: '1', date: new Date('2024-03-15'), title: 'Case Filed', description: 'Initial petition submitted to court', type: 'filing', status: 'completed' },
            { id: '2', date: new Date('2024-04-20'), title: 'First Hearing', description: 'Preliminary arguments presented', type: 'hearing', status: 'completed' },
            { id: '3', date: new Date('2024-06-10'), title: 'Evidence Submission', description: 'Documentary evidence submitted', type: 'milestone', status: 'completed' },
            { id: '4', date: new Date('2024-09-15'), title: 'Interim Order', description: 'Status quo maintained pending final decision', type: 'order', status: 'completed' },
            { id: '5', date: new Date('2024-12-20'), title: 'Arguments Concluded', description: 'Final arguments from both parties', type: 'hearing', status: 'current' },
            { id: '6', date: new Date('2025-01-10'), title: 'Next Hearing', description: 'Judgement expected', type: 'hearing', status: 'upcoming' },
            { id: '7', date: new Date('2025-03-15'), title: 'Projected Judgement', description: 'Based on average timeline for similar cases', type: 'projected', status: 'upcoming' },
        ]
    },
    {
        id: '2',
        cnr: 'MHMC/2024/005678',
        title: 'Consumer Complaint - Electronics Return',
        court: 'Mumbai Consumer Forum',
        status: 'Pending Decision',
        filingDate: '2024-08-10',
        nextHearing: '2025-01-05',
        events: [
            { id: '1', date: new Date('2024-08-10'), title: 'Complaint Filed', description: 'Consumer complaint registered', type: 'filing', status: 'completed' },
            { id: '2', date: new Date('2024-09-25'), title: 'Notice Issued', description: 'Notice sent to opposing party', type: 'milestone', status: 'completed' },
            { id: '3', date: new Date('2024-11-15'), title: 'Response Received', description: 'Company filed counter-response', type: 'milestone', status: 'completed' },
            { id: '4', date: new Date('2025-01-05'), title: 'Final Hearing', description: 'Decision expected', type: 'hearing', status: 'upcoming' },
        ]
    }
];

const CitizenTimeline: React.FC = () => {
    const { t } = useCitizenTranslation();
    const [selectedCase, setSelectedCase] = useState<CaseInfo | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const filteredCases = mockCitizenCases.filter(c =>
        c.cnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!selectedCase || !timelineRef.current) return;

        const events = timelineRef.current.querySelectorAll('.timeline-event');
        const line = timelineRef.current.querySelector('.timeline-line');

        gsap.set(events, { opacity: 0, x: -30 });
        if (line) {
            gsap.set(line, { scaleY: 0, transformOrigin: 'top' });
        }

        const tl = gsap.timeline();
        if (line) {
            tl.to(line, { scaleY: 1, duration: 0.8, ease: 'power2.inOut' });
        }
        tl.to(events, { opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: 'power3.out' }, "-=0.3");
    }, [selectedCase]);

    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'filing': return <FileText className="w-4 h-4" />;
            case 'hearing': return <Gavel className="w-4 h-4" />;
            case 'order': return <Scale className="w-4 h-4" />;
            case 'milestone': return <CheckCircle className="w-4 h-4" />;
            case 'projected': return <TrendingUp className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: TimelineEvent['status']) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500';
            case 'current': return 'bg-blue-500 animate-pulse';
            case 'upcoming': return 'bg-slate-600';
        }
    };

    const calculateDuration = (caseInfo: CaseInfo) => {
        const filing = new Date(caseInfo.filingDate);
        const today = new Date();
        const days = Math.floor((today.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Calendar className="w-8 h-8 text-cyan-400" />
                        <h1 className="text-3xl font-bold text-white">{t('timeline_case_timeline')}</h1>
                    </div>
                    <p className="text-slate-400">{t('timeline_subtitle')}</p>
                </div>

                {/* Case Selection */}
                {!selectedCase ? (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by CNR number or case title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Cases Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredCases.map((caseInfo) => (
                                <button
                                    key={caseInfo.id}
                                    onClick={() => {
                                        setIsLoading(true);
                                        setTimeout(() => {
                                            setSelectedCase(caseInfo);
                                            setIsLoading(false);
                                        }, 500);
                                    }}
                                    className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl text-left hover:border-cyan-500/50 hover:bg-slate-800 transition-all group"
                                    aria-label={`View timeline for case ${caseInfo.cnr}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                            {caseInfo.cnr}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{caseInfo.title}</h3>
                                    <p className="text-sm text-slate-400 mb-4">{caseInfo.court}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {calculateDuration(caseInfo)} days
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {caseInfo.events.length} events
                                        </span>
                                        {caseInfo.nextHearing && (
                                            <span className="flex items-center gap-1 text-amber-400">
                                                <AlertCircle className="w-3 h-3" />
                                                Next: {new Date(caseInfo.nextHearing).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filteredCases.length === 0 && (
                            <div className="text-center py-12" role="status" aria-live="polite">
                                <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
                                <p className="text-slate-400">No cases found matching your search</p>
                            </div>
                        )}

                        {/* Skeleton Loading State */}
                        {isLoading && (
                            <div className="space-y-6 animate-pulse" role="status" aria-label="Loading case timeline">
                                <SkeletonCard className="h-40" />
                                <SkeletonCard className="h-64" />
                                <SkeletonCard className="h-32" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Back Button */}
                        <button
                            onClick={() => setSelectedCase(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            {t('timeline_back_to_cases')}
                        </button>

                        {/* Case Info Header */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded mb-2 inline-block">
                                        {selectedCase.cnr}
                                    </span>
                                    <h2 className="text-2xl font-bold text-white">{selectedCase.title}</h2>
                                    <p className="text-slate-400">{selectedCase.court}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-cyan-400">{calculateDuration(selectedCase)}</div>
                                    <div className="text-sm text-slate-500">days since filing</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('timeline_filed_on')}</p>
                                    <p className="text-white font-medium">{new Date(selectedCase.filingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('timeline_status')}</p>
                                    <p className="text-amber-400 font-medium">{selectedCase.status}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('timeline_next_hearing')}</p>
                                    <p className="text-emerald-400 font-medium">
                                        {selectedCase.nextHearing ? new Date(selectedCase.nextHearing).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div ref={timelineRef} className="relative pl-8">
                            {/* Vertical Line */}
                            <div className="timeline-line absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-slate-600"></div>

                            {/* Events */}
                            <div className="space-y-6">
                                {selectedCase.events.map((event) => (
                                    <div key={event.id} className="timeline-event relative">
                                        {/* Dot */}
                                        <div className={`absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(event.status)} text-white shadow-lg`}>
                                            {getEventIcon(event.type)}
                                        </div>

                                        {/* Card */}
                                        <div className={`ml-4 p-5 rounded-xl border transition-all ${event.status === 'current' ? 'bg-blue-500/10 border-blue-500/50' :
                                            event.status === 'upcoming' ? 'bg-slate-800/30 border-slate-700 opacity-75' :
                                                'bg-slate-800/50 border-slate-700'
                                            }`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white">{event.title}</h3>
                                                    {event.type === 'projected' && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                                                            🤖 AI
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${event.type === 'projected' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">{event.description}</p>
                                            {event.type === 'projected' && (
                                                <div className="mt-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        AI-Generated Estimate based on similar case timelines. Actual date may vary.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenTimeline;
