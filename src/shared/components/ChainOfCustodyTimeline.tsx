// src/shared/components/ChainOfCustodyTimeline.tsx
// NyayaSahayak v2.0.0 - Chain of Custody Visual Timeline
// Implements vertical stepper with Akhand Ledger verification and gap analysis

import React, { useState, useMemo } from 'react';
import {
    Shield,
    ShieldCheck,
    ShieldX,
    Clock,
    MapPin,
    User,
    Truck,
    Building2,
    Microscope,
    Gavel,
    Package,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Hash
} from 'lucide-react';
import type { CustodyChain, CustodyEvent, TimelineNode, IntegrityStatus } from '../../types/custody.types';
import { eventToTimelineNode } from '../../types/custody.types';

interface ChainOfCustodyTimelineProps {
    chain: CustodyChain;
    language?: 'en' | 'hi';
    onNodeClick?: (event: CustodyEvent) => void;
    onVerifyHash?: (event: CustodyEvent) => void;
}

// Translations for Bhashini support
const translations = {
    en: {
        SEIZURE: 'Seizure',
        HANDOVER: 'Handover',
        TRANSPORT: 'Transport',
        RECEIPT: 'Receipt',
        ANALYSIS: 'Analysis',
        STORAGE: 'Storage',
        COURT_SUBMISSION: 'Court Submission',
        EXAMINATION: 'Examination',
        RETURN: 'Return',
        DISPOSAL: 'Disposal',
        verified: 'Verified',
        pending: 'Pending',
        mismatch: 'Tamper Alert',
        gapWarning: 'Time Gap',
        viewDetails: 'View Details',
        verifyHash: 'Verify Hash',
        chainIntegrity: 'Chain Integrity',
        evidenceId: 'Evidence ID',
        totalEvents: 'Total Events',
        currentCustodian: 'Current Custodian'
    },
    hi: {
        SEIZURE: 'जब्ती',
        HANDOVER: 'हस्तांतरण',
        TRANSPORT: 'परिवहन',
        RECEIPT: 'प्राप्ति',
        ANALYSIS: 'विश्लेषण',
        STORAGE: 'भंडारण',
        COURT_SUBMISSION: 'न्यायालय प्रस्तुति',
        EXAMINATION: 'परीक्षण',
        RETURN: 'वापसी',
        DISPOSAL: 'निपटान',
        verified: 'सत्यापित',
        pending: 'लंबित',
        mismatch: 'छेड़छाड़ चेतावनी',
        gapWarning: 'समय अंतराल',
        viewDetails: 'विवरण देखें',
        verifyHash: 'हैश सत्यापित करें',
        chainIntegrity: 'श्रृंखला अखंडता',
        evidenceId: 'साक्ष्य आईडी',
        totalEvents: 'कुल घटनाएं',
        currentCustodian: 'वर्तमान संरक्षक'
    }
};

const ChainOfCustodyTimeline: React.FC<ChainOfCustodyTimelineProps> = ({
    chain,
    language = 'en',
    onNodeClick,
    onVerifyHash
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const t = translations[language];

    // Convert events to timeline nodes
    const timelineNodes = useMemo(() => {
        return chain.events.map((event, idx) =>
            eventToTimelineNode(event, chain.events[idx + 1])
        );
    }, [chain.events]);

    // Toggle node expansion
    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    // Get icon for event type
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'SEIZURE': return <Package className="w-5 h-5" />;
            case 'HANDOVER': return <User className="w-5 h-5" />;
            case 'TRANSPORT': return <Truck className="w-5 h-5" />;
            case 'RECEIPT': return <Building2 className="w-5 h-5" />;
            case 'ANALYSIS': return <Microscope className="w-5 h-5" />;
            case 'STORAGE': return <Package className="w-5 h-5" />;
            case 'COURT_SUBMISSION':
            case 'EXAMINATION': return <Gavel className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    // Get status colors
    const getStatusColors = (status: IntegrityStatus) => {
        switch (status) {
            case 'VERIFIED':
                return { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' };
            case 'PENDING':
                return { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400' };
            case 'GAP_DETECTED':
                return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400' };
            case 'MISMATCH':
                return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400' };
            default:
                return { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400' };
        }
    };

    // Get connection line style
    const getConnectionStyle = (status: TimelineNode['connectionStatus']) => {
        switch (status) {
            case 'solid': return 'border-l-2 border-solid border-emerald-500';
            case 'dashed': return 'border-l-2 border-dashed border-amber-500';
            case 'broken': return 'border-l-2 border-dotted border-red-500';
            default: return 'border-l-2 border-solid border-slate-600';
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold text-white">Chain of Custody</h2>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        Akhand Ledger
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{t.evidenceId}</p>
                    <p className="text-sm font-mono text-white">{chain.evidenceId}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{t.totalEvents}</p>
                    <p className="text-2xl font-bold text-white">{chain.events.length}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${chain.overallIntegrity === 'VERIFIED'
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : chain.overallIntegrity === 'MISMATCH'
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <p className="text-xs text-slate-400 mb-1">{t.chainIntegrity}</p>
                    <div className="flex items-center justify-center gap-1">
                        {chain.overallIntegrity === 'VERIFIED' ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        ) : chain.overallIntegrity === 'MISMATCH' ? (
                            <ShieldX className="w-5 h-5 text-red-400" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                        <span className={`text-sm font-bold ${chain.overallIntegrity === 'VERIFIED'
                                ? 'text-emerald-400'
                                : chain.overallIntegrity === 'MISMATCH'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                            }`}>
                            {chain.overallIntegrity === 'VERIFIED'
                                ? t.verified
                                : chain.overallIntegrity === 'MISMATCH'
                                    ? t.mismatch
                                    : t.pending
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Current Custodian */}
            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">{t.currentCustodian}</p>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">{chain.currentCustodian.name}</span>
                    <span className="text-xs text-slate-400">({chain.currentCustodian.designation})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">{chain.currentLocation.name}</span>
                </div>
            </div>

            {/* Gap Warnings */}
            {chain.hasTimeGaps && (
                <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-amber-400">{t.gapWarning}</span>
                    </div>
                    <div className="space-y-1">
                        {chain.gaps.filter(g => !g.isAcceptable).map((gap, idx) => (
                            <p key={idx} className="text-xs text-slate-400">
                                {gap.gapDuration}h gap between events
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative pl-8">
                {timelineNodes.map((node, idx) => {
                    const colors = getStatusColors(node.status);
                    const isExpanded = expandedNodes.has(node.id);
                    const isLast = idx === timelineNodes.length - 1;

                    return (
                        <div key={node.id} className="relative">
                            {/* Connection Line */}
                            {!isLast && (
                                <div className={`absolute left-[-18px] top-8 h-full ${getConnectionStyle(node.connectionStatus)}`} />
                            )}

                            {/* Node Icon */}
                            <div
                                className={`absolute left-[-28px] top-2 w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-white`}
                            >
                                {getEventIcon(node.event.eventType)}
                            </div>

                            {/* Node Content */}
                            <div
                                className={`mb-4 p-4 rounded-lg border cursor-pointer transition-all ${isExpanded ? 'bg-slate-900/70' : 'bg-slate-900/50'
                                    } ${colors.border} hover:bg-slate-900/70`}
                                onClick={() => toggleNode(node.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white">
                                                {t[node.event.eventType as keyof typeof t] || node.title}
                                            </h4>
                                            {node.status === 'VERIFIED' && (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            )}
                                            {node.status === 'MISMATCH' && (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400">{node.subtitle}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {node.timestamp}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {node.gapWarning && (
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                                                {node.gapWarning}
                                            </span>
                                        )}
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500">Custodian</p>
                                                <p className="text-slate-300">{node.details.custodianInfo}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Location</p>
                                                <p className="text-slate-300">{node.details.locationInfo}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 rounded p-2">
                                            <div className="flex items-center gap-2">
                                                <Hash className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-mono text-slate-400">
                                                    {node.details.hashInfo}
                                                </span>
                                            </div>
                                            {node.details.ledgerLink && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <ExternalLink className="w-3 h-3 text-blue-400" />
                                                    <span className="text-xs text-blue-400">
                                                        Block: {node.details.ledgerLink}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNodeClick?.(node.event);
                                                }}
                                                className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                            >
                                                {t.viewDetails}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onVerifyHash?.(node.event);
                                                }}
                                                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded"
                                            >
                                                {t.verifyHash}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChainOfCustodyTimeline;
