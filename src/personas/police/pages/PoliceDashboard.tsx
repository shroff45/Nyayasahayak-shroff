// src/personas/police/pages/PoliceDashboard.tsx
// NyayaSahayak Hybrid v3.0.0 - Premium 3D Police Dashboard (NyayaRakshak)
// Fully Functional: Export, Action Modals, Auto-Refresh + 3D Design
// सत्यमेव जयते - Truth Alone Triumphs

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import EvidenceLocker from './EvidenceLocker';
import PatrolMap from './PatrolMap';
import { SmartFIR } from './SmartFIR';
import {
    Shield, Users, FileText, Map, Database,
    Clock, AlertTriangle, CheckCircle, Timer, Scale,
    Download, RefreshCw, FileCheck, Send, X, Loader2,
    Search, TrendingUp, BarChart3, Zap
} from 'lucide-react';
import AnimatedBackground from '../../../shared/components/3d/AnimatedBackground';
import FloatingCard from '../../../shared/components/3d/FloatingCard';
import { useToast } from '../../../shared/hooks/useToast';

// BNSS 193 Investigation Limits
interface ActiveCase {
    id: string;
    firNumber: string;
    section: string;
    daysSinceFIR: number;
    maxDays: number;
    ioName: string;
    status: 'ON_TRACK' | 'WARNING' | 'CRITICAL';
    chargeSheetDue: string;
    chargeSheetFiled?: boolean;
}

const INITIAL_CASES: ActiveCase[] = [
    { id: '1', firNumber: 'FIR/2025/001', section: 'BNS 303', daysSinceFIR: 52, maxDays: 60, ioName: 'SI Rajesh Sharma', status: 'WARNING', chargeSheetDue: '2025-01-05' },
    { id: '2', firNumber: 'FIR/2025/002', section: 'BNS 64', daysSinceFIR: 58, maxDays: 60, ioName: 'SI Vikram Singh', status: 'CRITICAL', chargeSheetDue: '2024-12-30' },
    { id: '3', firNumber: 'FIR/2025/003', section: 'BNS 103', daysSinceFIR: 35, maxDays: 90, ioName: 'ASI Priya Verma', status: 'ON_TRACK', chargeSheetDue: '2025-02-15' },
    { id: '4', firNumber: 'FIR/2025/004', section: 'BNS 351', daysSinceFIR: 45, maxDays: 60, ioName: 'SI Amit Kumar', status: 'WARNING', chargeSheetDue: '2025-01-10' },
    { id: '5', firNumber: 'FIR/2025/005', section: 'BNS 115', daysSinceFIR: 20, maxDays: 90, ioName: 'SI Rajesh Sharma', status: 'ON_TRACK', chargeSheetDue: '2025-03-01' },
    { id: '6', firNumber: 'FIR/2025/006', section: 'BNS 121', daysSinceFIR: 55, maxDays: 60, ioName: 'SI Vikram Singh', status: 'CRITICAL', chargeSheetDue: '2024-12-31' },
    { id: '7', firNumber: 'FIR/2025/007', section: 'BNS 70', daysSinceFIR: 42, maxDays: 60, ioName: 'ASI Priya Verma', status: 'WARNING', chargeSheetDue: '2025-01-08' },
    { id: '8', firNumber: 'FIR/2025/008', section: 'BNS 302', daysSinceFIR: 10, maxDays: 90, ioName: 'SI Neha Gupta', status: 'ON_TRACK', chargeSheetDue: '2025-03-15' },
];

// IO Performance Data
const IO_PERFORMANCE = [
    { name: 'SI Rajesh Sharma', cases: 2, onTrack: 1, critical: 0, warning: 1, score: 78 },
    { name: 'SI Vikram Singh', cases: 2, onTrack: 0, critical: 2, warning: 0, score: 45 },
    { name: 'ASI Priya Verma', cases: 2, onTrack: 1, critical: 0, warning: 1, score: 72 },
    { name: 'SI Amit Kumar', cases: 1, onTrack: 0, critical: 0, warning: 1, score: 65 },
    { name: 'SI Neha Gupta', cases: 1, onTrack: 1, critical: 0, warning: 0, score: 95 },
];

const PoliceDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'FIR' | 'EVIDENCE' | 'MAP' | 'COMPLIANCE'>('COMPLIANCE');
    const [cases, setCases] = useState<ActiveCase[]>(INITIAL_CASES);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showActionModal, setShowActionModal] = useState<{ type: 'extension' | 'filed' | null, caseId: string | null }>({ type: null, caseId: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ON_TRACK'>('ALL');
    const [showIOMetrics, setShowIOMetrics] = useState(false);
    const { showToast } = useToast();

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            handleRefresh();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate stats
    const complianceStats = useMemo(() => {
        const activeCases = cases.filter(c => !c.chargeSheetFiled);
        const critical = activeCases.filter(c => c.status === 'CRITICAL').length;
        const warning = activeCases.filter(c => c.status === 'WARNING').length;
        const onTrack = activeCases.filter(c => c.status === 'ON_TRACK').length;
        const filed = cases.filter(c => c.chargeSheetFiled).length;
        return { critical, warning, onTrack, filed };
    }, [cases]);

    // Filtered cases based on search and status
    const filteredCases = useMemo(() => {
        let filtered = cases.filter(c => !c.chargeSheetFiled);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.firNumber.toLowerCase().includes(query) ||
                c.ioName.toLowerCase().includes(query) ||
                c.section.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Sort by priority: CRITICAL first, then WARNING, then ON_TRACK
        return filtered.sort((a, b) => {
            const priority = { CRITICAL: 0, WARNING: 1, ON_TRACK: 2 };
            return priority[a.status] - priority[b.status];
        });
    }, [cases, searchQuery, statusFilter]);

    const stats = [
        { label: 'Active FIRs', value: String(cases.filter(c => !c.chargeSheetFiled).length), color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: Shield },
        { label: 'Critical', value: String(complianceStats.critical), color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: AlertTriangle },
        { label: 'Filed', value: String(complianceStats.filed), color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: FileCheck },
        { label: 'Officers', value: '88', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', icon: Users },
    ];

    // Handle refresh
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastRefresh(new Date());
            setIsRefreshing(false);
            showToast('Data refreshed', 'success', 2000);
        }, 800);
    }, [showToast]);

    // Export to CSV
    const handleExport = useCallback(() => {
        const headers = ['FIR Number', 'Section', 'IO Name', 'Days Since FIR', 'Max Days', 'Status', 'Due Date', 'Filed'];
        const rows = cases.map(c => [
            c.firNumber, c.section, c.ioName, c.daysSinceFIR, c.maxDays, c.status, c.chargeSheetDue, c.chargeSheetFiled ? 'Yes' : 'No'
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BNSS_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Report exported successfully!', 'success', 3000);
    }, [cases, showToast]);

    // Mark chargesheet filed
    const handleMarkFiled = useCallback((caseId: string) => {
        setIsSubmitting(true);
        setTimeout(() => {
            setCases(prev => prev.map(c => c.id === caseId ? { ...c, chargeSheetFiled: true } : c));
            setShowActionModal({ type: null, caseId: null });
            setIsSubmitting(false);
            showToast('Chargesheet marked as filed!', 'success', 3000);
        }, 1000);
    }, [showToast]);

    // Request extension
    const handleRequestExtension = useCallback((caseId: string) => {
        setIsSubmitting(true);
        setTimeout(() => {
            setCases(prev => prev.map(c => c.id === caseId ? { ...c, maxDays: c.maxDays + 15, status: 'WARNING' } : c));
            setShowActionModal({ type: null, caseId: null });
            setIsSubmitting(false);
            showToast('Extension request submitted (15 days added)', 'success', 3000);
        }, 1000);
    }, [showToast]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/50';
            case 'WARNING': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
            case 'ON_TRACK': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const getProgressColor = (daysSinceFIR: number, maxDays: number) => {
        const percent = (daysSinceFIR / maxDays) * 100;
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const selectedCase = showActionModal.caseId ? cases.find(c => c.id === showActionModal.caseId) : null;

    return (
        <AnimatedBackground variant="aurora">
            <div className="space-y-6 h-full flex flex-col p-4">
                {/* BNSS Compliance Alert Banner */}
                {complianceStats.critical > 0 && (
                    <FloatingCard glowColor="red" intensity="high">
                        <div className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-500/30 rounded-xl animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-red-400">⚠️ BNSS 193 COMPLIANCE ALERT</h3>
                                <p className="text-sm text-red-300/80">
                                    {complianceStats.critical} case(s) approaching default bail deadline.
                                </p>
                            </div>
                            <button onClick={() => setActiveTab('COMPLIANCE')} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-400 transition-colors">
                                View Cases
                            </button>
                        </div>
                    </FloatingCard>
                )}

                {/* Stats Grid with FloatingCards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <FloatingCard key={i} glowColor={stat.color.includes('red') ? 'red' : stat.color.includes('emerald') ? 'green' : 'cyan'} intensity="low">
                            <div className="p-4 flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-lg`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{stat.label}</div>
                                </div>
                            </div>
                        </FloatingCard>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                    {/* Tabs with Actions */}
                    <div className="flex items-center justify-between p-2 border-b border-white/5 bg-black/20">
                        <div className="flex gap-1">
                            {[
                                { id: 'COMPLIANCE', label: 'BNSS Compliance', icon: Timer },
                                { id: 'FIR', label: 'Smart FIR', icon: FileText },
                                { id: 'EVIDENCE', label: 'Evidence', icon: Database },
                                { id: 'MAP', label: 'Patrol', icon: Map }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-black scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors">
                                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors">
                                <Download className="w-3 h-3" /> Export CSV
                            </button>
                            <span className="text-xs text-slate-500">Updated: {lastRefresh.toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'COMPLIANCE' && (
                            <div className="space-y-6">
                                {/* Search and Filter Bar */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search FIR, IO, or Section..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ALL">All Status</option>
                                        <option value="CRITICAL">🚨 Critical Only</option>
                                        <option value="WARNING">⚠️ Warning Only</option>
                                        <option value="ON_TRACK">✅ On Track Only</option>
                                    </select>
                                    <button
                                        onClick={() => setShowIOMetrics(!showIOMetrics)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showIOMetrics ? 'bg-purple-500 text-white' : 'bg-slate-800/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        <BarChart3 className="w-4 h-4" /> IO Metrics
                                    </button>
                                </div>

                                {/* IO Performance Metrics Panel */}
                                {showIOMetrics && (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="w-5 h-5 text-purple-400" />
                                            <h3 className="font-bold text-white">IO Performance Scorecard</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {IO_PERFORMANCE.map((io, idx) => (
                                                <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{io.name}</p>
                                                        <p className="text-xs text-slate-400">{io.cases} cases • {io.onTrack} on track</p>
                                                    </div>
                                                    <div className={`text-lg font-bold ${io.score >= 80 ? 'text-emerald-400' : io.score >= 60 ? 'text-amber-400' : 'text-red-400'
                                                        }`}>
                                                        {io.score}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chargesheet Tracker */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Timer className="w-5 h-5 text-amber-400" />
                                            <h2 className="text-lg font-bold text-white">Chargesheet Deadline Tracker</h2>
                                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{filteredCases.length} cases</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {filteredCases.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No cases match your filter criteria</p>
                                            </div>
                                        ) : filteredCases.map((case_) => (
                                            <div key={case_.id} className={`p-4 rounded-xl border ${getStatusColor(case_.status)}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="font-bold text-white">{case_.firNumber}</p>
                                                        <p className="text-xs text-slate-400">{case_.section} • IO: {case_.ioName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setShowActionModal({ type: 'extension', caseId: case_.id })}
                                                            className="px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-xs text-amber-400 hover:bg-amber-500/30"
                                                        >
                                                            Request Extension
                                                        </button>
                                                        <button
                                                            onClick={() => setShowActionModal({ type: 'filed', caseId: case_.id })}
                                                            className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded text-xs text-emerald-400 hover:bg-emerald-500/30"
                                                        >
                                                            Mark Filed
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-400">Day {case_.daysSinceFIR} of {case_.maxDays}</span>
                                                        <span className={case_.status === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                                            {case_.maxDays - case_.daysSinceFIR} days remaining
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${getProgressColor(case_.daysSinceFIR, case_.maxDays)} transition-all`} style={{ width: `${(case_.daysSinceFIR / case_.maxDays) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* IO Stats */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                                        <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-white">{complianceStats.onTrack}</p>
                                        <p className="text-xs text-emerald-400">On Track</p>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                                        <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-white">{complianceStats.warning}</p>
                                        <p className="text-xs text-amber-400">Warning</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-white">{complianceStats.critical}</p>
                                        <p className="text-xs text-red-400">Critical</p>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                                        <FileCheck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-white">{complianceStats.filed}</p>
                                        <p className="text-xs text-blue-400">Filed</p>
                                    </div>
                                </div>

                                {/* Legal Reminder */}
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Scale className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-blue-300">BNSS 193 Compliance</p>
                                            <p className="text-xs text-blue-300/80 mt-1">
                                                Accused entitled to <strong>default bail</strong> if chargesheet not filed within statutory period.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'FIR' && <SmartFIR />}
                        {activeTab === 'EVIDENCE' && <EvidenceLocker />}
                        {activeTab === 'MAP' && <PatrolMap />}
                    </div>
                </div>

                {/* Action Modal */}
                {showActionModal.type && selectedCase && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">
                                    {showActionModal.type === 'extension' ? '📝 Request Extension' : '✅ Mark Chargesheet Filed'}
                                </h2>
                                <button onClick={() => setShowActionModal({ type: null, caseId: null })} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                                <p className="text-white font-medium">{selectedCase.firNumber}</p>
                                <p className="text-sm text-slate-400">{selectedCase.section} • IO: {selectedCase.ioName}</p>
                                <p className="text-sm text-amber-400 mt-2">Due: {selectedCase.chargeSheetDue}</p>
                            </div>
                            {showActionModal.type === 'extension' && (
                                <p className="text-sm text-slate-300 mb-4">This will add 15 days to the investigation period as per court guidelines.</p>
                            )}
                            <div className="flex gap-2">
                                <button onClick={() => setShowActionModal({ type: null, caseId: null })} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Cancel</button>
                                <button
                                    onClick={() => showActionModal.type === 'extension' ? handleRequestExtension(selectedCase.id) : handleMarkFiled(selectedCase.id)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isSubmitting ? 'Submitting...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Satyamev Jayate Badge */}
                <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-full z-40">
                    <span className="text-emerald-400 font-bold text-sm">🛡️ न्याय रक्षक</span>
                    <span className="text-xs text-emerald-300/70">सत्यमेव जयते</span>
                </div>
            </div>
        </AnimatedBackground>
    );
};

export default PoliceDashboard;


