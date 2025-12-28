// src/personas/judge/pages/JudgeBoard.tsx
// NyayaSahayak Hybrid v2.0.0 - Judge Daily Board
// Enhanced with Constitutional Safeguards & सत्यमेव जयते

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    LayoutDashboard, Clock, AlertTriangle, CheckCircle,
    Scale, Calendar, Users, FileText, Shield,
    ChevronRight, Filter, SortAsc, Eye, Gavel,
    Timer, TrendingUp, AlertCircle, XCircle, Loader2, BookOpen, EyeOff,
    Keyboard, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useToast } from '../../../shared/hooks/useToast';
import { mockDelay } from '../../../shared/utils/mockApi';
import { ARTICLE_21 } from '../../../shared/utils/legalCompliance';
import {
    getBNSSPrecedentWarning,
    CONSTITUTIONAL_CHECKLIST,
    KEYBOARD_SHORTCUTS
} from '../utils/caseAnalysis';

// Mock case database with BNSS compliance data
interface BoardCase {
    id: string;
    cnrNumber: string;
    title: string;
    petitioner: string;
    respondent: string;
    caseType: 'BAIL' | 'REMAND' | 'HEARING' | 'ARGUMENTS' | 'JUDGMENT';
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    filingDate: string;
    nextHearing: string;
    hearingTime: string;
    courtRoom: string;
    advocate: string;
    investigationDays: number; // Days since FIR
    maxDays: number; // BNSS 193 limit
    evidenceStatus: 'COMPLETE' | 'PARTIAL' | 'PENDING';
    adjournmentCount: number;
    adjournmentRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    ioName: string;
    sections: string[];
}

const MOCK_CASES: BoardCase[] = [
    {
        id: 'CASE-001',
        cnrNumber: 'DLCT/2025/00123',
        title: 'State vs. Ramesh Kumar',
        petitioner: 'State of Delhi',
        respondent: 'Ramesh Kumar',
        caseType: 'BAIL',
        priority: 'URGENT',
        filingDate: '2025-09-15',
        nextHearing: '2025-10-22',
        hearingTime: '10:00 AM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Sharma',
        investigationDays: 37,
        maxDays: 60,
        evidenceStatus: 'COMPLETE',
        adjournmentCount: 0,
        adjournmentRisk: 'LOW',
        ioName: 'SI Rajesh Sharma',
        sections: ['BNS 303', 'BNS 351']
    },
    {
        id: 'CASE-002',
        cnrNumber: 'DLCT/2025/00089',
        title: 'State vs. Suresh Patel',
        petitioner: 'State of Delhi',
        respondent: 'Suresh Patel',
        caseType: 'REMAND',
        priority: 'URGENT',
        filingDate: '2025-08-20',
        nextHearing: '2025-10-22',
        hearingTime: '10:30 AM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Gupta',
        investigationDays: 55,
        maxDays: 60,
        evidenceStatus: 'PARTIAL',
        adjournmentCount: 2,
        adjournmentRisk: 'HIGH',
        ioName: 'SI Vikram Singh',
        sections: ['BNS 64', 'BNS 66']
    },
    {
        id: 'CASE-003',
        cnrNumber: 'DLCT/2025/00156',
        title: 'Priya Devi vs. Municipal Corp',
        petitioner: 'Priya Devi',
        respondent: 'Municipal Corporation',
        caseType: 'HEARING',
        priority: 'MEDIUM',
        filingDate: '2025-07-10',
        nextHearing: '2025-10-22',
        hearingTime: '11:00 AM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Mehta',
        investigationDays: 0,
        maxDays: 0,
        evidenceStatus: 'COMPLETE',
        adjournmentCount: 1,
        adjournmentRisk: 'MEDIUM',
        ioName: '-',
        sections: ['Civil']
    },
    {
        id: 'CASE-004',
        cnrNumber: 'DLCT/2025/00201',
        title: 'State vs. Anil Verma',
        petitioner: 'State of Delhi',
        respondent: 'Anil Verma',
        caseType: 'ARGUMENTS',
        priority: 'HIGH',
        filingDate: '2025-06-05',
        nextHearing: '2025-10-22',
        hearingTime: '02:00 PM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Kapoor',
        investigationDays: 45,
        maxDays: 90,
        evidenceStatus: 'COMPLETE',
        adjournmentCount: 3,
        adjournmentRisk: 'MEDIUM',
        ioName: 'SI Amit Kumar',
        sections: ['BNS 103', 'BNS 115']
    },
    {
        id: 'CASE-005',
        cnrNumber: 'DLCT/2025/00178',
        title: 'State vs. Mohan Lal',
        petitioner: 'State of Delhi',
        respondent: 'Mohan Lal',
        caseType: 'JUDGMENT',
        priority: 'HIGH',
        filingDate: '2025-04-15',
        nextHearing: '2025-10-22',
        hearingTime: '03:00 PM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Sinha',
        investigationDays: 0,
        maxDays: 0,
        evidenceStatus: 'COMPLETE',
        adjournmentCount: 0,
        adjournmentRisk: 'LOW',
        ioName: '-',
        sections: ['BNS 318', 'BNS 319']
    },
    {
        id: 'CASE-006',
        cnrNumber: 'DLCT/2025/00234',
        title: 'Rakesh vs. Insurance Co.',
        petitioner: 'Rakesh Sharma',
        respondent: 'LIC of India',
        caseType: 'HEARING',
        priority: 'LOW',
        filingDate: '2025-09-01',
        nextHearing: '2025-10-22',
        hearingTime: '04:00 PM',
        courtRoom: 'Court Hall 3',
        advocate: 'Adv. Joshi',
        investigationDays: 0,
        maxDays: 0,
        evidenceStatus: 'PENDING',
        adjournmentCount: 1,
        adjournmentRisk: 'HIGH',
        ioName: '-',
        sections: ['Civil']
    }
];

const JudgeBoard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast, updateToast } = useToast();
    const [selectedCase, setSelectedCase] = useState<BoardCase | null>(null);
    const [filterType, setFilterType] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'priority' | 'time' | 'risk'>('priority');

    // Three-State Button States (Antigravity)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedCaseId, setAnalyzedCaseId] = useState<string | null>(null);
    const [isDrafting, setIsDrafting] = useState(false);
    const [orderSigned, setOrderSigned] = useState<string | null>(null);

    // Blind Justice Protocol (PII Redaction for bias-free review)
    const [blindMode, setBlindMode] = useState(true);

    // Keyboard shortcuts modal
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

    // Constitutional compliance modal before signing
    const [showConstitutionalCheck, setShowConstitutionalCheck] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    // Sort cases intelligently - MUST be defined before handleKeyDown
    const sortedCases = useMemo(() => {
        let filtered = filterType === 'ALL'
            ? [...MOCK_CASES]
            : MOCK_CASES.filter(c => c.caseType === filterType);

        return filtered.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            if (sortBy === 'time') {
                return a.hearingTime.localeCompare(b.hearingTime);
            }
            if (sortBy === 'risk') {
                const riskOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
                return riskOrder[a.adjournmentRisk] - riskOrder[b.adjournmentRisk];
            }
            return 0;
        });
    }, [filterType, sortBy]);

    // Keyboard navigation - defined after sortedCases
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch (e.key.toLowerCase()) {
            case 'j': // Next case
                if (sortedCases.length > 0) {
                    const currentIdx = selectedCase ? sortedCases.findIndex(c => c.id === selectedCase.id) : -1;
                    const nextIdx = Math.min(currentIdx + 1, sortedCases.length - 1);
                    setSelectedCase(sortedCases[nextIdx]);
                }
                break;
            case 'k': // Previous case
                if (sortedCases.length > 0) {
                    const currentIdx = selectedCase ? sortedCases.findIndex(c => c.id === selectedCase.id) : sortedCases.length;
                    const prevIdx = Math.max(currentIdx - 1, 0);
                    setSelectedCase(sortedCases[prevIdx]);
                }
                break;
            case 'b': // Toggle blind mode
                setBlindMode(prev => !prev);
                break;
            case '?': // Show keyboard shortcuts
                setShowKeyboardHelp(true);
                break;
            case 'escape':
                setShowKeyboardHelp(false);
                setShowConstitutionalCheck(false);
                break;
        }
    }, [selectedCase, sortedCases]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Redact name for bias-free review
    const redactName = (name: string) => {
        if (!blindMode) return name;
        const initials = name.split(' ').map(n => n.charAt(0)).join('');
        return `Subject-${initials}`;
    };

    // Redact full case narrative
    const redactNarrative = (petitioner: string, respondent: string) => {
        if (!blindMode) return `${petitioner} vs. ${respondent}`;
        return `[PARTY A] vs. [PARTY B]`;
    };

    // Calculate BNSS compliance status
    const getBNSSStatus = (case_: BoardCase) => {
        if (case_.maxDays === 0) return null; // Civil case
        const remaining = case_.maxDays - case_.investigationDays;
        if (remaining <= 5) return 'CRITICAL';
        if (remaining <= 15) return 'WARNING';
        return 'OK';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'LOW': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getCaseTypeIcon = (type: string) => {
        switch (type) {
            case 'BAIL': return <Scale className="w-4 h-4" />;
            case 'REMAND': return <Timer className="w-4 h-4" />;
            case 'HEARING': return <Users className="w-4 h-4" />;
            case 'ARGUMENTS': return <FileText className="w-4 h-4" />;
            case 'JUDGMENT': return <Gavel className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'text-red-400';
            case 'MEDIUM': return 'text-amber-400';
            case 'LOW': return 'text-emerald-400';
            default: return 'text-slate-400';
        }
    };

    const getEvidenceColor = (status: string) => {
        switch (status) {
            case 'COMPLETE': return 'text-emerald-400 bg-emerald-500/20';
            case 'PARTIAL': return 'text-amber-400 bg-amber-500/20';
            case 'PENDING': return 'text-red-400 bg-red-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    // Stats
    const urgentCount = MOCK_CASES.filter(c => c.priority === 'URGENT').length;
    const highRiskCount = MOCK_CASES.filter(c => c.adjournmentRisk === 'HIGH').length;
    const bnssAlertCount = MOCK_CASES.filter(c => {
        const status = getBNSSStatus(c);
        return status === 'CRITICAL' || status === 'WARNING';
    }).length;

    // Three-State: Analyze Case (Legal Syllogism Engine)
    const handleAnalyzeCase = async (caseData: BoardCase) => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);

        const toastId = showToast('Legal Syllogism Engine: Analyzing facts...', 'loading');

        try {
            await mockDelay(1500); // Simulate AI analysis

            const bnssStatus = getBNSSStatus(caseData);
            setAnalyzedCaseId(caseData.id);

            if (bnssStatus === 'CRITICAL' || bnssStatus === 'WARNING') {
                // Use ERROR toast to highlight violation
                updateToast(toastId, `⚠️ PROCEDURAL VIOLATION: BNSS 193 Breach Detected`, 'error');
                setTimeout(() => {
                    showToast(`Recommendation: ${caseData.caseType === 'BAIL' ? 'Default bail eligible' : 'Review required'}`, 'info');
                }, 500);
            } else {
                updateToast(toastId, '✅ Case Analysis Complete: No Violations', 'success');
            }
        } catch {
            updateToast(toastId, '❌ Analysis failed', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Three-State: Draft & Sign Judicial Order
    const handleDraftOrder = async (verdict: 'PROCEED' | 'ADJOURN') => {
        if (!selectedCase || isDrafting) return;
        setIsDrafting(true);

        const actionText = verdict === 'PROCEED' ? 'Proceeding with Hearing' : 'Granting Adjournment';
        const toastId = showToast(`${actionText}: Applying Digital Signature...`, 'loading');

        try {
            await mockDelay(2000); // Simulate cryptographic signing

            setOrderSigned(selectedCase.id);
            updateToast(toastId, '✅ Judicial Order Signed & Uploaded to ICJS', 'success');
        } catch {
            updateToast(toastId, '❌ Signing failed', 'error');
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            {/* Main Panel - Case Queue */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <LayoutDashboard className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Daily Board - NyayaAdhikari</h1>
                                <p className="text-xs text-slate-400">
                                    Hon. {user?.name || 'Justice'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Stats & Blind Justice Toggle */}
                        <div className="flex items-center gap-3">
                            {/* Blind Justice Protocol Toggle */}
                            <button
                                onClick={() => setBlindMode(!blindMode)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${blindMode
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                    }`}
                                title="Blind Justice: Hide PII for bias-free review"
                            >
                                {blindMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {blindMode ? 'Blind Mode ON' : 'Blind Mode'}
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg">
                                <span className="text-xs text-slate-500">Listed:</span>
                                <span className="text-sm font-bold text-white">{MOCK_CASES.length}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/30">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-400">{urgentCount} Urgent</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-1 mr-4">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Filter:</span>
                        </div>
                        {['ALL', 'BAIL', 'REMAND', 'HEARING', 'ARGUMENTS', 'JUDGMENT'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${filterType === type
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}

                        <div className="flex-1" />

                        <div className="flex items-center gap-1">
                            <SortAsc className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Sort:</span>
                        </div>
                        {[
                            { key: 'priority', label: 'Priority' },
                            { key: 'time', label: 'Time' },
                            { key: 'risk', label: 'Risk' }
                        ].map(option => (
                            <button
                                key={option.key}
                                onClick={() => setSortBy(option.key as any)}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${sortBy === option.key
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Case List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {sortedCases.map(case_ => {
                        const bnssStatus = getBNSSStatus(case_);

                        return (
                            <div
                                key={case_.id}
                                onClick={() => setSelectedCase(case_)}
                                className={`bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/80 ${selectedCase?.id === case_.id
                                    ? 'border-purple-500 ring-1 ring-purple-500/50'
                                    : 'border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Case Header */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border ${getPriorityColor(case_.priority)}`}>
                                                {getCaseTypeIcon(case_.caseType)}
                                                {case_.caseType}
                                            </span>
                                            {bnssStatus === 'CRITICAL' && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse">
                                                    <AlertCircle className="w-3 h-3" />
                                                    BNSS 193 BREACH
                                                </span>
                                            )}
                                            {bnssStatus === 'WARNING' && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">
                                                    <Timer className="w-3 h-3" />
                                                    {case_.maxDays - case_.investigationDays}d remaining
                                                </span>
                                            )}
                                        </div>

                                        {/* Case Title (Redacted in Blind Mode) */}
                                        <h3 className="font-bold text-white mb-1">
                                            {blindMode ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-sm">
                                                        {redactNarrative(case_.petitioner, case_.respondent)}
                                                    </span>
                                                    {blindMode && <span className="text-[10px] text-purple-400/60">(PII Hidden)</span>}
                                                </span>
                                            ) : case_.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 mb-2">CNR: {case_.cnrNumber} • {blindMode ? '[Advocate Redacted]' : case_.advocate}</p>

                                        {/* Case Meta */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {case_.hearingTime}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {case_.courtRoom}
                                            </span>
                                            {case_.sections.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> {case_.sections.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side - Risk Indicators */}
                                    <div className="flex flex-col items-end gap-2">
                                        {/* Adjournment Risk */}
                                        <div className={`flex items-center gap-1 ${getRiskColor(case_.adjournmentRisk)}`}>
                                            {case_.adjournmentRisk === 'HIGH' && <XCircle className="w-4 h-4" />}
                                            {case_.adjournmentRisk === 'MEDIUM' && <AlertTriangle className="w-4 h-4" />}
                                            {case_.adjournmentRisk === 'LOW' && <CheckCircle className="w-4 h-4" />}
                                            <span className="text-xs font-bold">{case_.adjournmentRisk} RISK</span>
                                        </div>

                                        {/* Evidence Status */}
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getEvidenceColor(case_.evidenceStatus)}`}>
                                            Evidence: {case_.evidenceStatus}
                                        </span>

                                        {/* Adjournments */}
                                        {case_.adjournmentCount > 0 && (
                                            <span className="text-xs text-slate-500">
                                                {case_.adjournmentCount} prior adjournment{case_.adjournmentCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel - Case Details */}
            <div className="w-full lg:w-96 flex flex-col gap-4">
                {/* Alerts Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold">HIGH RISK</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{highRiskCount}</p>
                        <p className="text-xs text-red-400/70">Likely adjournment</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                            <Timer className="w-4 h-4" />
                            <span className="text-xs font-bold">BNSS ALERTS</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{bnssAlertCount}</p>
                        <p className="text-xs text-amber-400/70">Deadline approaching</p>
                    </div>
                </div>

                {/* Selected Case Details */}
                {selectedCase ? (
                    <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white">Case Details</h3>
                            <Link
                                to="/judge/verify"
                                className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors"
                            >
                                <Shield className="w-3 h-3" /> Verify Evidence
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Case Title</p>
                                <p className="font-medium text-white">
                                    {blindMode ? redactNarrative(selectedCase.petitioner, selectedCase.respondent) : selectedCase.title}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Petitioner</p>
                                    <p className={`text-sm ${blindMode ? 'bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded inline-block' : 'text-white'}`}>
                                        {redactName(selectedCase.petitioner)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Respondent</p>
                                    <p className={`text-sm ${blindMode ? 'bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded inline-block' : 'text-white'}`}>
                                        {redactName(selectedCase.respondent)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Advocate</p>
                                    <p className="text-sm text-white">{selectedCase.advocate}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Court Room</p>
                                    <p className="text-sm text-white">{selectedCase.courtRoom}</p>
                                </div>
                            </div>

                            {selectedCase.ioName !== '-' && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Investigating Officer</p>
                                    <p className="text-sm text-white">{selectedCase.ioName}</p>
                                </div>
                            )}

                            {/* BNSS Timeline */}
                            {selectedCase.maxDays > 0 && (
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-2">BNSS 193 Investigation Timeline</p>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-400">Day {selectedCase.investigationDays} of {selectedCase.maxDays}</span>
                                        <span className={`text-xs font-bold ${selectedCase.maxDays - selectedCase.investigationDays <= 5 ? 'text-red-400' :
                                            selectedCase.maxDays - selectedCase.investigationDays <= 15 ? 'text-amber-400' :
                                                'text-emerald-400'
                                            }`}>
                                            {selectedCase.maxDays - selectedCase.investigationDays} days remaining
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${selectedCase.maxDays - selectedCase.investigationDays <= 5 ? 'bg-red-500' :
                                                selectedCase.maxDays - selectedCase.investigationDays <= 15 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}
                                            style={{ width: `${(selectedCase.investigationDays / selectedCase.maxDays) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Sections */}
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Sections Invoked</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCase.sections.map((section, idx) => (
                                        <span key={idx} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                            {section}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Risk Analysis */}
                            <div className="bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-2">Adjournment Risk Analysis</p>
                                <div className="flex items-center justify-between">
                                    <div className={`flex items-center gap-2 ${getRiskColor(selectedCase.adjournmentRisk)}`}>
                                        {selectedCase.adjournmentRisk === 'HIGH' && <XCircle className="w-5 h-5" />}
                                        {selectedCase.adjournmentRisk === 'MEDIUM' && <AlertTriangle className="w-5 h-5" />}
                                        {selectedCase.adjournmentRisk === 'LOW' && <CheckCircle className="w-5 h-5" />}
                                        <span className="font-bold">{selectedCase.adjournmentRisk}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Evidence: <span className={getEvidenceColor(selectedCase.evidenceStatus).split(' ')[0]}>{selectedCase.evidenceStatus}</span></p>
                                        <p className="text-xs text-slate-400">{selectedCase.adjournmentCount} prior adjournments</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700">
                            <button
                                onClick={() => handleAnalyzeCase(selectedCase)}
                                disabled={isAnalyzing}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${isAnalyzing ? 'bg-purple-500/50 cursor-wait' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                {isAnalyzing ? 'Analyzing...' : analyzedCaseId === selectedCase.id ? 'Re-Analyze' : 'Analyze Case'}
                            </button>
                            {orderSigned === selectedCase.id ? (
                                <div className="flex items-center justify-center gap-2 py-2 bg-green-500/20 rounded-lg text-green-400 font-medium text-sm">
                                    <CheckCircle className="w-4 h-4" /> Order Signed
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleDraftOrder('PROCEED')}
                                    disabled={isDrafting}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${isDrafting ? 'bg-slate-600 cursor-wait' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
                                >
                                    {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                                    {isDrafting ? 'Signing...' : 'Sign Order'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500">
                        <Eye className="w-12 h-12 mb-3 opacity-30" />
                        <p>Select a case to view details</p>
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-2">
                    <Link
                        to="/judge/verify"
                        className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium text-sm transition-colors"
                    >
                        <Shield className="w-4 h-4" /> Hash Verifier
                    </Link>
                    <Link
                        to="/judge/draft"
                        className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium text-sm transition-colors"
                    >
                        <Gavel className="w-4 h-4" /> Draft Judgment
                    </Link>
                </div>

                {/* Keyboard Shortcuts Help Button */}
                <button
                    onClick={() => setShowKeyboardHelp(true)}
                    className="mt-2 w-full flex items-center justify-center gap-2 p-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    title="Press ? for keyboard shortcuts"
                >
                    <Keyboard className="w-3 h-3" /> Press ? for shortcuts
                </button>
            </div>

            {/* Keyboard Shortcuts Modal */}
            {showKeyboardHelp && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                            </div>
                            <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                                    <span className="text-slate-300 text-sm">{shortcut.description}</span>
                                    <kbd className="px-2 py-1 bg-slate-900 rounded text-xs text-purple-400 font-mono border border-slate-600">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Constitutional Compliance Modal */}
            {showConstitutionalCheck && selectedCase && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Scale className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Constitutional Compliance Check</h2>
                                <p className="text-xs text-amber-400">Maneka Gandhi Principles • Article 21</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-4">
                            {CONSTITUTIONAL_CHECKLIST.map((item) => (
                                <label key={item.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-amber-500/30 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={checkedItems.has(item.id)}
                                        onChange={() => {
                                            const newChecked = new Set(checkedItems);
                                            if (newChecked.has(item.id)) newChecked.delete(item.id);
                                            else newChecked.add(item.id);
                                            setCheckedItems(newChecked);
                                        }}
                                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="font-medium text-white text-sm">{item.label} {item.mandatory && <span className="text-red-400">*</span>}</p>
                                        <p className="text-xs text-slate-400">{item.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                            <p className="text-xs text-blue-300">
                                <strong>Article 21:</strong> "{ARTICLE_21.text.substring(0, 80)}..."
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowConstitutionalCheck(false)}
                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConstitutionalCheck(false);
                                    handleDraftOrder('PROCEED');
                                }}
                                disabled={CONSTITUTIONAL_CHECKLIST.filter(c => c.mandatory).some(c => !checkedItems.has(c.id))}
                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium text-sm transition-colors"
                            >
                                Confirm & Sign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Satyamev Jayate Badge - Fixed Position */}
            <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-full z-40">
                <span className="text-amber-400 font-bold text-sm">⚖️ सत्यमेव जयते</span>
                <span className="text-xs text-amber-300/70">Truth Alone Triumphs</span>
            </div>
        </div>
    );
};

export default JudgeBoard;
