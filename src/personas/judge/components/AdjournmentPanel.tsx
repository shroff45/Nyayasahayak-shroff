// src/personas/judge/components/AdjournmentPanel.tsx
// NyayaSahayak Hybrid v2.0.0 - Adjournment Control Panel
// Implements BNSS Sec 346 - Maximum 2 adjournments limit

import React, { useState } from 'react';
import {
    AlertTriangle,
    Calendar,
    Clock,
    Gavel,
    X,
    CheckCircle2,
    FileWarning
} from 'lucide-react';
import type { PilotCase } from '../../../types/pilot';

interface AdjournmentPanelProps {
    caseData: PilotCase;
    onAdjournmentGranted?: (caseId: string, reason?: string) => void;
}

const AdjournmentPanel: React.FC<AdjournmentPanelProps> = ({ caseData, onAdjournmentGranted }) => {
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [specialReason, setSpecialReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MAX_ADJOURNMENTS = 2;
    const adjournmentCount = caseData.adjournmentsCount ?? 0;
    const isLimitReached = adjournmentCount >= MAX_ADJOURNMENTS;

    const handleGrantAdjournment = () => {
        if (isLimitReached) return;
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onAdjournmentGranted?.(caseData.id);
            setIsSubmitting(false);
        }, 500);
    };

    const handleOverrideSubmit = () => {
        if (!specialReason.trim()) return;
        setIsSubmitting(true);
        // Simulate API call with special reason logged
        setTimeout(() => {
            onAdjournmentGranted?.(caseData.id, specialReason);
            setShowOverrideModal(false);
            setSpecialReason('');
            setIsSubmitting(false);

            // Store override reason in localStorage for audit trail
            const auditLog = JSON.parse(localStorage.getItem('adjournment_overrides') || '[]');
            auditLog.push({
                caseId: caseData.id,
                cnrNumber: caseData.cnrNumber,
                timestamp: new Date().toISOString(),
                reason: specialReason,
                adjournmentNumber: adjournmentCount + 1
            });
            localStorage.setItem('adjournment_overrides', JSON.stringify(auditLog));
        }, 500);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Adjournment Control</h3>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        BNSS Sec 346
                    </span>
                </div>
            </div>

            {/* Adjournment Counter */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-white">{adjournmentCount}</p>
                    <p className="text-xs text-slate-400">Used</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-purple-400">{MAX_ADJOURNMENTS}</p>
                    <p className="text-xs text-slate-400">Maximum</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${isLimitReached
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-green-500/20 border border-green-500/30'
                    }`}>
                    <p className={`text-3xl font-bold ${isLimitReached ? 'text-red-400' : 'text-green-400'}`}>
                        {MAX_ADJOURNMENTS - adjournmentCount}
                    </p>
                    <p className="text-xs text-slate-400">Remaining</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Adjournment Usage</span>
                    <span>{adjournmentCount} / {MAX_ADJOURNMENTS}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${adjournmentCount === 0 ? 'bg-green-500' :
                                adjournmentCount === 1 ? 'bg-amber-500' :
                                    'bg-red-500'
                            }`}
                        style={{ width: `${(adjournmentCount / MAX_ADJOURNMENTS) * 100}%` }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            {adjournmentCount < MAX_ADJOURNMENTS ? (
                <button
                    onClick={handleGrantAdjournment}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold rounded-lg transition-colors"
                >
                    {isSubmitting ? (
                        <>
                            <Clock className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Gavel className="w-4 h-4" />
                            Grant Adjournment ({adjournmentCount + 1} of {MAX_ADJOURNMENTS})
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-3">
                    {/* Limit Reached Warning */}
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-400">Limit Reached (BNSS 346)</p>
                            <p className="text-xs text-slate-400">
                                Maximum {MAX_ADJOURNMENTS} adjournments allowed. Override requires special reason.
                            </p>
                        </div>
                    </div>

                    {/* Override Button */}
                    <button
                        onClick={() => setShowOverrideModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-bold rounded-lg transition-colors"
                    >
                        <FileWarning className="w-4 h-4" />
                        Record Special Reason (Override)
                    </button>
                </div>
            )}

            {/* Override Modal */}
            {showOverrideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <h3 className="font-bold text-white">Override Required</h3>
                            </div>
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                className="p-1 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-sm text-amber-400">
                                Per BNSS Section 346, granting more than {MAX_ADJOURNMENTS} adjournments requires
                                recording special reasons in the order sheet.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Special Reason *
                            </label>
                            <textarea
                                value={specialReason}
                                onChange={(e) => setSpecialReason(e.target.value)}
                                placeholder="Enter the exceptional circumstances justifying this override..."
                                rows={4}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOverrideSubmit}
                                disabled={!specialReason.trim() || isSubmitting}
                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                Confirm Override
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdjournmentPanel;
