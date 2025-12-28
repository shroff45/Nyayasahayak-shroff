// src/personas/police/components/ChargeSheetGate.tsx
// NyayaSahayak v2.0.0 - BNSS Section 176(3) Charge Sheet Interlock
// Blocks charge sheet submission unless forensic compliance is verified

import React, { useState, useEffect } from 'react';
import {
    Shield,
    ShieldCheck,
    ShieldX,
    Lock,
    Unlock,
    Video,
    UserCheck,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileText,
    Send,
    Clock
} from 'lucide-react';
import {
    validateForensicCompliance,
    canSubmitChargeSheet,
    requestComplianceOverride,
    getComplianceDisplayStatus,
    isForensicVideoMandatory
} from '../../../core/services/forensicInterlock';
import type {
    ForensicCompliance,
    ForensicVideoMetadata,
    ForensicVisitToken,
    OverrideReason
} from '../../../types/forensic.types';

interface ChargeSheetGateProps {
    caseId: string;
    cnrNumber?: string;
    sections: string[];
    lawCode: 'BNS' | 'IPC';
    forensicVideo?: ForensicVideoMetadata | null;
    expertVisitToken?: ForensicVisitToken | null;
    onSubmit: () => void;
    onUploadVideo: () => void;
    onRequestExpert: () => void;
}

const ChargeSheetGate: React.FC<ChargeSheetGateProps> = ({
    caseId,
    cnrNumber,
    sections,
    lawCode,
    forensicVideo = null,
    expertVisitToken = null,
    onSubmit,
    onUploadVideo,
    onRequestExpert
}) => {
    const [compliance, setCompliance] = useState<ForensicCompliance | null>(null);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideReason, setOverrideReason] = useState<OverrideReason | ''>('');
    const [overrideDetails, setOverrideDetails] = useState('');

    // Check if forensic video is mandatory
    const mandatoryCheck = isForensicVideoMandatory(sections, lawCode);

    // Validate compliance on mount and when dependencies change
    useEffect(() => {
        const result = validateForensicCompliance(
            caseId,
            forensicVideo,
            expertVisitToken,
            mandatoryCheck.isMandatory
        );
        setCompliance(result);
    }, [caseId, forensicVideo, expertVisitToken, mandatoryCheck.isMandatory]);

    if (!compliance) return null;

    const displayStatus = getComplianceDisplayStatus(compliance);
    const submissionCheck = canSubmitChargeSheet(compliance);

    // Get status colors
    const getStatusColors = () => {
        switch (displayStatus.color) {
            case 'green': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
            case 'amber': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
            case 'red': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
            case 'purple': return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' };
            default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
        }
    };

    const colors = getStatusColors();

    const handleOverrideSubmit = () => {
        if (!overrideReason || !overrideDetails.trim()) return;

        const updated = requestComplianceOverride(
            compliance,
            'current_user', // Would come from auth
            overrideReason,
            overrideDetails
        );
        setCompliance(updated);
        setShowOverrideModal(false);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold text-white">Charge Sheet Submission</h2>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        BNSS Sec 176(3)
                    </span>
                </div>
                {cnrNumber && (
                    <span className="text-xs text-slate-400 font-mono">{cnrNumber}</span>
                )}
            </div>

            {/* Mandatory Status Banner */}
            {mandatoryCheck.isMandatory && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-400">Forensic Videography Mandatory</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {mandatoryCheck.reason}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Sections: {mandatoryCheck.matchedSections.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Compliance Checklist */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Compliance Checklist</h3>
                <div className="space-y-3">
                    {/* Video Check */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${compliance.hasForensicVideo ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3">
                            <Video className={`w-5 h-5 ${compliance.hasForensicVideo ? 'text-emerald-400' : 'text-red-400'}`} />
                            <div>
                                <p className="text-sm font-medium text-white">Forensic Scene Video</p>
                                <p className="text-xs text-slate-400">Crime scene videography</p>
                            </div>
                        </div>
                        {compliance.hasForensicVideo ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <button
                                onClick={onUploadVideo}
                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded"
                            >
                                Upload
                            </button>
                        )}
                    </div>

                    {/* Expert Token Check */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${compliance.hasExpertVisitToken ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3">
                            <UserCheck className={`w-5 h-5 ${compliance.hasExpertVisitToken ? 'text-emerald-400' : 'text-red-400'}`} />
                            <div>
                                <p className="text-sm font-medium text-white">Expert Visit Token</p>
                                <p className="text-xs text-slate-400">Forensic expert verification</p>
                            </div>
                        </div>
                        {compliance.hasExpertVisitToken ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <button
                                onClick={onRequestExpert}
                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded"
                            >
                                Request
                            </button>
                        )}
                    </div>

                    {/* Hash Verification */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${compliance.isHashVerified ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-700/50 border border-slate-600'
                        }`}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={`w-5 h-5 ${compliance.isHashVerified ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <div>
                                <p className="text-sm font-medium text-white">Hash Integrity</p>
                                <p className="text-xs text-slate-400">SHA-256 verification</p>
                            </div>
                        </div>
                        {compliance.isHashVerified ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <Clock className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Interlock Status */}
            <div className={`mb-6 p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center gap-3">
                    {compliance.interlockStatus === 'UNLOCKED' ? (
                        <Unlock className={`w-8 h-8 ${colors.text}`} />
                    ) : compliance.interlockStatus === 'OVERRIDE_PENDING' ? (
                        <AlertTriangle className={`w-8 h-8 ${colors.text}`} />
                    ) : compliance.interlockStatus === 'OVERRIDE_APPROVED' ? (
                        <ShieldCheck className={`w-8 h-8 ${colors.text}`} />
                    ) : (
                        <Lock className={`w-8 h-8 ${colors.text}`} />
                    )}
                    <div className="flex-1">
                        <p className={`text-lg font-bold ${colors.text}`}>{displayStatus.label}</p>
                        <p className="text-sm text-slate-400">{displayStatus.description}</p>
                    </div>
                    {/* Override Badge */}
                    {compliance.interlockStatus === 'OVERRIDE_PENDING' && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full animate-pulse">
                            JUDICIAL REVIEW REQUIRED
                        </span>
                    )}
                    {compliance.interlockStatus === 'OVERRIDE_APPROVED' && (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                            EXCEPTION APPROVED
                        </span>
                    )}
                </div>

                {/* Override Details (when pending) */}
                {compliance.interlockStatus === 'OVERRIDE_PENDING' && compliance.override && (
                    <div className="mt-4 p-3 bg-amber-500/10 border-t border-amber-500/30 rounded-b-lg">
                        <p className="text-xs text-slate-400 mb-1">Override Reason:</p>
                        <p className="text-sm text-amber-300 font-medium mb-2">
                            {compliance.override.reason?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400 mb-1">Justification:</p>
                        <p className="text-sm text-slate-300 italic">
                            "{compliance.override.reasonDetails}"
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Requested by: {compliance.override.requestedBy} on {compliance.override.requestedAt?.toLocaleString?.() || 'N/A'}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* CASE 1: Submission allowed (either compliant or override approved) */}
                {submissionCheck.allowed ? (
                    <button
                        onClick={onSubmit}
                        className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-lg transition-colors ${submissionCheck.isOverride
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                        {submissionCheck.isOverride ? (
                            <>
                                Submit with Exception
                                <span className="text-xs bg-amber-400/30 px-2 py-0.5 rounded ml-2">
                                    ⚠️ Flagged for Court
                                </span>
                            </>
                        ) : (
                            'Submit Charge Sheet to Court'
                        )}
                    </button>
                ) : (
                    <>
                        {/* CASE 2: Override Pending - show waiting state */}
                        {compliance.interlockStatus === 'OVERRIDE_PENDING' ? (
                            <div className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg">
                                <Clock className="w-5 h-5 animate-pulse" />
                                Override Request Pending Approval
                            </div>
                        ) : (
                            /* CASE 3: Locked - show lock and override button */
                            <button
                                disabled
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 text-slate-400 font-bold rounded-lg cursor-not-allowed"
                            >
                                <Lock className="w-5 h-5" />
                                Submission Locked
                            </button>
                        )}

                        {/* Override Request Button - only show when LOCKED */}
                        {compliance.interlockStatus === 'LOCKED' && (
                            <button
                                onClick={() => setShowOverrideModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-medium rounded-lg transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Request Override (Justification Required)
                            </button>
                        )}

                        {/* Simulate Approval Button - for sandbox testing */}
                        {compliance.interlockStatus === 'OVERRIDE_PENDING' && (
                            <button
                                onClick={() => {
                                    if (compliance.override) {
                                        const approved: ForensicCompliance = {
                                            ...compliance,
                                            interlockStatus: 'OVERRIDE_APPROVED',
                                            override: {
                                                ...compliance.override,
                                                approvedBy: 'SP_TestUser',
                                                approvedAt: new Date(),
                                                isApproved: true
                                            }
                                        };
                                        setCompliance(approved);
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-medium rounded-lg transition-colors"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                [Sandbox] Simulate SP Approval
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Override Modal */}
            {showOverrideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <h3 className="text-lg font-bold text-white">Override Request</h3>
                        </div>

                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-sm text-amber-400">
                                This override will be flagged for judicial review. The court will scrutinize the reasons during cognizance stage.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Reason *</label>
                            <select
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value as OverrideReason)}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="">Select reason...</option>
                                <option value="FORENSIC_TEAM_UNAVAILABLE">Forensic Team Unavailable</option>
                                <option value="TECHNICAL_FAILURE">Technical Failure</option>
                                <option value="EXTREME_TERRAIN">Extreme Terrain/Accessibility</option>
                                <option value="INFRASTRUCTURE_LIMITATION">Infrastructure Limitation</option>
                                <option value="STATE_EXEMPTION">State Notification Exemption</option>
                                <option value="OTHER">Other (Specify)</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Detailed Justification *</label>
                            <textarea
                                value={overrideDetails}
                                onChange={(e) => setOverrideDetails(e.target.value)}
                                placeholder="Provide detailed explanation for non-compliance..."
                                rows={4}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOverrideSubmit}
                                disabled={!overrideReason || !overrideDetails.trim()}
                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold rounded-lg"
                            >
                                Submit Override Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChargeSheetGate;
