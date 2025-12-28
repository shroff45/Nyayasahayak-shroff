// src/personas/judge/utils/caseAnalysis.ts
// NyayaSahayak - Case Analysis Utilities for Judge Portal
// Extracted for better code organization and reusability

import { BNSS_193_LIMITS } from '../../../shared/utils/legalCompliance';

/**
 * Case priority levels
 */
export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceStatus = 'COMPLETE' | 'PARTIAL' | 'PENDING';
export type CaseType = 'BAIL' | 'REMAND' | 'HEARING' | 'ARGUMENTS' | 'JUDGMENT';

/**
 * Get color classes for priority badge
 */
export const getPriorityColor = (priority: Priority): string => {
    const colors: Record<Priority, string> = {
        URGENT: 'bg-red-500/20 text-red-400 border-red-500/50',
        HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
        MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    };
    return colors[priority] || colors.LOW;
};

/**
 * Get color classes for adjournment risk
 */
export const getRiskColor = (risk: RiskLevel): string => {
    const colors: Record<RiskLevel, string> = {
        HIGH: 'text-red-400',
        MEDIUM: 'text-amber-400',
        LOW: 'text-emerald-400',
    };
    return colors[risk] || 'text-slate-400';
};

/**
 * Get color classes for evidence status
 */
export const getEvidenceColor = (status: EvidenceStatus): string => {
    const colors: Record<EvidenceStatus, string> = {
        COMPLETE: 'text-emerald-400 bg-emerald-500/20',
        PARTIAL: 'text-amber-400 bg-amber-500/20',
        PENDING: 'text-red-400 bg-red-500/20',
    };
    return colors[status] || 'text-slate-400 bg-slate-500/20';
};

/**
 * Get BNSS compliance status for a case
 */
export const getBNSSStatus = (
    investigationDays: number,
    maxDays: number
): 'CRITICAL' | 'WARNING' | 'OK' | null => {
    if (maxDays === 0) return null; // Civil case
    const remaining = maxDays - investigationDays;
    if (remaining <= 5) return 'CRITICAL';
    if (remaining <= 15) return 'WARNING';
    return 'OK';
};

/**
 * Generate precedent warning for BNSS 193 breach
 */
export const getBNSSPrecedentWarning = (status: 'CRITICAL' | 'WARNING' | null): {
    show: boolean;
    title: string;
    citation: string;
    recommendation: string;
} | null => {
    if (!status) return null;

    const { precedent } = BNSS_193_LIMITS;

    if (status === 'CRITICAL') {
        return {
            show: true,
            title: '⚠️ STATUTORY BREACH - Default Bail Eligible',
            citation: `${precedent.case}\n${precedent.citation}`,
            recommendation: 'Accused is entitled to default bail as an indefeasible right.',
        };
    }

    return {
        show: true,
        title: '⚡ DEADLINE APPROACHING',
        citation: precedent.case,
        recommendation: 'Monitor investigation progress closely.',
    };
};

/**
 * Constitutional checklist items for pre-order verification
 * Based on Maneka Gandhi principles
 */
export const CONSTITUTIONAL_CHECKLIST = [
    {
        id: 'article21',
        label: 'Article 21 Compliance',
        description: 'Does the order affect life or liberty? Is procedure fair, just, and reasonable?',
        mandatory: true,
    },
    {
        id: 'article14',
        label: 'Article 14 - Equality Check',
        description: 'Is the treatment non-discriminatory and non-arbitrary?',
        mandatory: true,
    },
    {
        id: 'article22',
        label: 'Article 22 - Arrest Safeguards',
        description: 'Has the accused been informed of grounds? Access to legal counsel?',
        mandatory: false,
    },
    {
        id: 'naturalJustice',
        label: 'Audi Alteram Partem',
        description: 'Has the other side been heard?',
        mandatory: true,
    },
    {
        id: 'reasonedOrder',
        label: 'Reasoned Order',
        description: 'Does the order contain reasons that can withstand appellate scrutiny?',
        mandatory: true,
    },
];

/**
 * Keyboard shortcuts for Judge Portal
 */
export const KEYBOARD_SHORTCUTS = [
    { key: 'j', action: 'Next case', description: 'Move to next case in list' },
    { key: 'k', action: 'Previous case', description: 'Move to previous case' },
    { key: 'a', action: 'Analyze', description: 'Run AI analysis on selected case' },
    { key: 's', action: 'Sign Order', description: 'Open sign order dialog' },
    { key: 'b', action: 'Toggle Blind Mode', description: 'Toggle PII redaction' },
    { key: '/', action: 'Search', description: 'Focus case search' },
    { key: 'Escape', action: 'Close', description: 'Close any open modal' },
];
