// src/personas/judge/components/CognizanceReview.tsx
// NyayaSahayak v2.0.0 - BNSS 176(3) Exception Review for Magistrates
// Allows Judges to review forensic videography exceptions at cognizance stage

import React, { useState } from 'react';
import {
    Gavel, Shield, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, FileWarning, User, Clock, ChevronDown, ChevronUp, Scale, MessageSquare } from 'lucide-react';
import type { ForensicCompliance, OverrideReason } from '../../../types/forensic.types';

interface CognizanceReviewProps {
    caseId: string;
    cnrNumber?: string;
    accusedName?: string;
    offenseSection: string;
    filingDate: Date;
    compliance: ForensicCompliance;
    onAccept: (remarks: string) => void;
    onReject: (reason: string) => void;
    onRequestClarification: (query: string) => void;
}

// Human-readable reason labels
const REASON_LABELS: Record<OverrideReason, string> = {
    'FORENSIC_TEAM_UNAVAILABLE': 'Forensic Team Unavailable at Location',
    'TECHNICAL_FAILURE': 'Technical/Equipment Failure',
    'EXTREME_TERRAIN': 'Geographical Inaccessibility',
    'INFRASTRUCTURE_LIMITATION': 'Infrastructure Limitation',
    'STATE_EXEMPTION': 'State Notification Exemption',
    'OTHER': 'Other Reason (See Details)'
};

const CognizanceReview: React.FC<CognizanceReviewProps> = ({
    caseId,
    cnrNumber,
    accusedName,
    offenseSection,
    filingDate,
    compliance,
    onAccept,
    onReject,
    onRequestClarification
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showActionModal, setShowActionModal] = useState<'accept' | 'reject' | 'clarify' | null>(null);
    const [remarks, setRemarks] = useState('');
    const [judicialDecision, setJudicialDecision] = useState<'pending' | 'accepted' | 'rejected' | 'clarification'>('pending');

    const hasException = compliance.hasOverride && compliance.override;
    const isApprovedOverride = compliance.interlockStatus === 'OVERRIDE_APPROVED';

    // Handle action submission
    const handleAction = () => {
        if (!remarks.trim()) return;

        switch (showActionModal) {
            case 'accept':
                onAccept(remarks);
                setJudicialDecision('accepted');
                break;
            case 'reject':
                onReject(remarks);
                setJudicialDecision('rejected');
                break;
            case 'clarify':
                onRequestClarification(remarks);
                setJudicialDecision('clarification');
                break;
        }
        setShowActionModal(null);
        setRemarks('');
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className={`p-4 cursor-pointer transition-colors ${hasException
                        ? 'bg-purple-500/10 border-b border-purple-500/30 hover:bg-purple-500/15'
                        : 'bg-emerald-500/10 border-b border-emerald-500/30 hover:bg-emerald-500/15'
                    }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasException ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                            }`}>
                            {hasException ? (
                                <ShieldAlert className="w-5 h-5 text-purple-400" />
                            ) : (
                                <Shield className="w-5 h-5 text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">BNSS 176(3) Compliance Review</h3>
                                {hasException && (
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded animate-pulse">
                                        EXCEPTION FILED
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400">
                                {cnrNumber || caseId} • {offenseSection}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {judicialDecision !== 'pending' && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${judicialDecision === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                                    judicialDecision === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-amber-500/20 text-amber-400'
                                }`}>
                                {judicialDecision === 'accepted' ? 'EXCEPTION NOTED' :
                                    judicialDecision === 'rejected' ? 'RE-INVESTIGATION ORDERED' :
                                        'CLARIFICATION PENDING'}
                            </span>
                        )}
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Case Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Accused</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-white">{accusedName || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Offense</p>
                            <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-white">{offenseSection}</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Filed On</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-white">{filingDate.toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Videography Status</p>
                            <div className="flex items-center gap-2">
                                {hasException ? (
                                    <AlertTriangle className="w-4 h-4 text-purple-400" />
                                ) : compliance.hasForensicVideo ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className={`text-sm ${hasException ? 'text-purple-400' :
                                        compliance.hasForensicVideo ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {hasException ? 'Exception Filed' :
                                        compliance.hasForensicVideo ? 'Uploaded' : 'Missing'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Exception Details */}
                    {hasException && compliance.override && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FileWarning className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-purple-400 mb-2">
                                        BNSS 176(3) Exception - Mandatory Review Required
                                    </h4>

                                    <div className="space-y-3">
                                        {/* Reason */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Statutory Reason</p>
                                            <p className="text-sm text-white font-medium bg-slate-900/50 px-3 py-2 rounded">
                                                {REASON_LABELS[compliance.override.reason] || compliance.override.reason}
                                            </p>
                                        </div>

                                        {/* Justification */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">IO's Justification</p>
                                            <blockquote className="text-sm text-slate-300 italic bg-slate-900/50 px-3 py-2 rounded border-l-4 border-purple-500">
                                                "{compliance.override.reasonDetails}"
                                            </blockquote>
                                        </div>

                                        {/* Approval Details */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500">Requested By</p>
                                                <p className="text-slate-300">{compliance.override.requestedBy}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Request Date</p>
                                                <p className="text-slate-300">
                                                    {compliance.override.requestedAt?.toLocaleString?.('en-IN') || 'N/A'}
                                                </p>
                                            </div>
                                            {isApprovedOverride && (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Approved By</p>
                                                        <p className="text-slate-300">{compliance.override.approvedBy || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Approval Date</p>
                                                        <p className="text-slate-300">
                                                            {compliance.override.approvedAt?.toLocaleString?.('en-IN') || 'N/A'}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Judicial Warning */}
                    {hasException && judicialDecision === 'pending' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-300">
                                    <strong>Judicial Note:</strong> This charge sheet was filed under BNSS 176(3) exception.
                                    As per the proviso, the Court must independently evaluate if the IO's justification
                                    is satisfactory before taking cognizance.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {hasException && judicialDecision === 'pending' && (
                        <div className="flex flex-col md:flex-row gap-3">
                            <button
                                onClick={() => setShowActionModal('accept')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Accept Explanation
                            </button>
                            <button
                                onClick={() => setShowActionModal('clarify')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <MessageSquare className="w-5 h-5" />
                                Request Clarification
                            </button>
                            <button
                                onClick={() => setShowActionModal('reject')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                                Order Re-investigation
                            </button>
                        </div>
                    )}

                    {/* Decision Result */}
                    {judicialDecision !== 'pending' && (
                        <div className={`p-4 rounded-lg border ${judicialDecision === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                judicialDecision === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                                    'bg-amber-500/10 border-amber-500/30'
                            }`}>
                            <div className="flex items-center gap-3">
                                <Gavel className={`w-6 h-6 ${judicialDecision === 'accepted' ? 'text-emerald-400' :
                                        judicialDecision === 'rejected' ? 'text-red-400' :
                                            'text-amber-400'
                                    }`} />
                                <div>
                                    <p className={`font-bold ${judicialDecision === 'accepted' ? 'text-emerald-400' :
                                            judicialDecision === 'rejected' ? 'text-red-400' :
                                                'text-amber-400'
                                        }`}>
                                        {judicialDecision === 'accepted' ? 'Exception Noted - Cognizance Taken' :
                                            judicialDecision === 'rejected' ? 'Exception Rejected - Re-investigation Ordered' :
                                                'Clarification Requested from IO'}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        Judicial decision recorded on {new Date().toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Exception - Compliant */}
                    {!hasException && compliance.checkResult === 'PASS' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <p className="font-bold text-emerald-400">Full BNSS 176(3) Compliance</p>
                                    <p className="text-sm text-slate-400">
                                        Forensic videography uploaded and verified. No exception review required.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Gavel className={`w-5 h-5 ${showActionModal === 'accept' ? 'text-emerald-400' :
                                    showActionModal === 'reject' ? 'text-red-400' :
                                        'text-amber-400'
                                }`} />
                            <h3 className="text-lg font-bold text-white">
                                {showActionModal === 'accept' ? 'Accept Exception' :
                                    showActionModal === 'reject' ? 'Order Re-investigation' :
                                        'Request Clarification'}
                            </h3>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {showActionModal === 'accept' ? 'Judicial Remarks (for record)' :
                                    showActionModal === 'reject' ? 'Reason for Rejection' :
                                        'Query for IO'}
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={
                                    showActionModal === 'accept'
                                        ? 'E.g., "IO\'s explanation found satisfactory given the remote terrain. Exception noted for trial record."'
                                        : showActionModal === 'reject'
                                            ? 'E.g., "Justification insufficient. FSL team was available as per records. IO to conduct fresh videography."'
                                            : 'E.g., "Why was FSL not contacted via satellite phone available at PS?"'
                                }
                                rows={4}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowActionModal(null); setRemarks(''); }}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={!remarks.trim()}
                                className={`flex-1 py-2 font-bold rounded-lg disabled:bg-slate-700 ${showActionModal === 'accept' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                                        showActionModal === 'reject' ? 'bg-red-600 hover:bg-red-500 text-white' :
                                            'bg-amber-600 hover:bg-amber-500 text-white'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CognizanceReview;
