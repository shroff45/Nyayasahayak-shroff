// src/core/services/forensicInterlock.ts
// NyayaSahayak v2.0.0 - BNSS Section 176(3) Forensic Interlock Service
// Validates forensic compliance before charge sheet submission

import type {
    ForensicCompliance,
    ForensicVideoMetadata,
    ForensicVisitToken,
    ComplianceCheckResult,
    InterlockStatus,
    OverrideReason,
    MANDATORY_FORENSIC_SECTIONS
} from '../../types/forensic.types';

/**
 * BNS Cutoff Date - July 1, 2024
 */
const BNS_EFFECTIVE_DATE = new Date('2024-07-01');

/**
 * Sections requiring mandatory forensic videography (≥7 years punishment)
 */
const MANDATORY_SECTIONS = {
    BNS: ['64', '65', '66', '100', '101', '103', '111', '113', '117', '140', '309'],
    IPC: ['302', '307', '376', '392', '395', '397', '364', '363A', '376A']
};

/**
 * Check if forensic videography is mandatory for given sections
 * Per BNSS Section 176(3): "offence punishable with imprisonment for seven years or more"
 */
export const isForensicVideoMandatory = (
    sections: string[],
    lawCode: 'BNS' | 'IPC'
): { isMandatory: boolean; matchedSections: string[]; reason?: string } => {
    const mandatoryList = MANDATORY_SECTIONS[lawCode];
    const matched = sections.filter(s => mandatoryList.includes(s));

    if (matched.length > 0) {
        return {
            isMandatory: true,
            matchedSections: matched,
            reason: `BNSS Section 176(3) - Offence(s) ${matched.join(', ')} attract imprisonment ≥7 years`
        };
    }

    return { isMandatory: false, matchedSections: [] };
};

/**
 * Validate forensic compliance for a case
 * Checks: Video exists + Expert token exists + Hash verified
 */
export const validateForensicCompliance = (
    caseId: string,
    forensicVideo: ForensicVideoMetadata | null,
    expertVisitToken: ForensicVisitToken | null,
    isMandatory: boolean
): ForensicCompliance => {
    const now = new Date();

    // If not mandatory, compliance is automatic
    if (!isMandatory) {
        return {
            caseId,
            isMandatory: false,
            interlockStatus: 'UNLOCKED',
            checkResult: 'EXEMPT',
            hasForensicVideo: !!forensicVideo,
            forensicVideo: forensicVideo || undefined,
            hasExpertVisitToken: !!expertVisitToken,
            expertVisitToken: expertVisitToken || undefined,
            isHashVerified: false,
            hasOverride: false,
            lastChecked: now,
            checkHistory: [{
                timestamp: now,
                result: 'EXEMPT',
                details: 'Forensic videography not mandatory for this offense'
            }]
        };
    }

    // Check 1: Video exists
    if (!forensicVideo || forensicVideo.uploadStatus !== 'UPLOADED') {
        return createLockedCompliance(caseId, 'FAIL_NO_VIDEO', 'Mandatory forensic video not uploaded', now);
    }

    // Check 2: Expert visit token exists
    if (!expertVisitToken || !expertVisitToken.isVerified) {
        return createLockedCompliance(caseId, 'FAIL_NO_EXPERT', 'Forensic expert visit token not verified', now);
    }

    // Check 3: Hash integrity
    if (forensicVideo.integrityStatus === 'MISMATCH') {
        return createLockedCompliance(caseId, 'FAIL_HASH_MISMATCH', 'Video hash mismatch - potential tampering detected', now);
    }

    // All checks passed
    return {
        caseId,
        isMandatory: true,
        interlockStatus: 'UNLOCKED',
        checkResult: 'PASS',
        hasForensicVideo: true,
        forensicVideo,
        hasExpertVisitToken: true,
        expertVisitToken,
        isHashVerified: forensicVideo.integrityStatus === 'VERIFIED',
        hashVerificationTimestamp: forensicVideo.integrityStatus === 'VERIFIED' ? now : undefined,
        hasOverride: false,
        lastChecked: now,
        checkHistory: [{
            timestamp: now,
            result: 'PASS',
            details: 'All forensic compliance requirements met'
        }]
    };
};

/**
 * Helper to create locked compliance result
 */
const createLockedCompliance = (
    caseId: string,
    result: ComplianceCheckResult,
    details: string,
    timestamp: Date
): ForensicCompliance => ({
    caseId,
    isMandatory: true,
    interlockStatus: 'LOCKED',
    checkResult: result,
    hasForensicVideo: false,
    hasExpertVisitToken: false,
    isHashVerified: false,
    hasOverride: false,
    lastChecked: timestamp,
    checkHistory: [{
        timestamp,
        result,
        details
    }]
});

/**
 * Request override for forensic compliance
 * Used when compliance is impossible (terrain, infrastructure)
 */
export const requestComplianceOverride = (
    compliance: ForensicCompliance,
    requestedBy: string,
    reason: OverrideReason,
    reasonDetails: string
): ForensicCompliance => {
    return {
        ...compliance,
        interlockStatus: 'OVERRIDE_PENDING',
        hasOverride: true,
        override: {
            requestedBy,
            requestedAt: new Date(),
            reason,
            reasonDetails,
            isApproved: false,
            judicialReviewFlag: true // Flagged red on Judge Dashboard
        }
    };
};

/**
 * Approve override request (by SP or higher authority)
 */
export const approveOverride = (
    compliance: ForensicCompliance,
    approvedBy: string
): ForensicCompliance => {
    if (!compliance.override) return compliance;

    return {
        ...compliance,
        interlockStatus: 'OVERRIDE_APPROVED',
        override: {
            ...compliance.override,
            approvedBy,
            approvedAt: new Date(),
            isApproved: true
        }
    };
};

/**
 * Check if charge sheet submission is allowed
 */
export const canSubmitChargeSheet = (compliance: ForensicCompliance): {
    allowed: boolean;
    reason: string;
    isOverride: boolean;
} => {
    // Not mandatory - always allowed
    if (!compliance.isMandatory) {
        return { allowed: true, reason: 'Forensic videography not required', isOverride: false };
    }

    // Fully compliant
    if (compliance.interlockStatus === 'UNLOCKED' && compliance.checkResult === 'PASS') {
        return { allowed: true, reason: 'Full BNSS 176(3) compliance', isOverride: false };
    }

    // Override approved
    if (compliance.interlockStatus === 'OVERRIDE_APPROVED') {
        return { allowed: true, reason: 'Override approved - judicial review flagged', isOverride: true };
    }

    // Override pending
    if (compliance.interlockStatus === 'OVERRIDE_PENDING') {
        return { allowed: false, reason: 'Override request pending approval', isOverride: true };
    }

    // Locked - not allowed
    return {
        allowed: false,
        reason: getBlockReason(compliance.checkResult),
        isOverride: false
    };
};

/**
 * Get human-readable block reason
 */
const getBlockReason = (result: ComplianceCheckResult): string => {
    switch (result) {
        case 'FAIL_NO_VIDEO':
            return 'Mandatory forensic scene videography not uploaded. Upload video or request override.';
        case 'FAIL_NO_EXPERT':
            return 'Forensic expert visit token not found. Expert must verify presence at scene.';
        case 'FAIL_HASH_MISMATCH':
            return 'Video integrity compromised. Re-upload original recording.';
        default:
            return 'Forensic compliance check failed.';
    }
};

/**
 * Generate compliance status for UI display
 */
export const getComplianceDisplayStatus = (compliance: ForensicCompliance): {
    status: 'complete' | 'pending' | 'blocked' | 'override';
    color: 'green' | 'amber' | 'red' | 'purple';
    label: string;
    description: string;
} => {
    if (!compliance.isMandatory) {
        return {
            status: 'complete',
            color: 'green',
            label: 'Not Required',
            description: 'Forensic videography not mandatory for this case'
        };
    }

    if (compliance.interlockStatus === 'UNLOCKED' && compliance.checkResult === 'PASS') {
        return {
            status: 'complete',
            color: 'green',
            label: 'Compliant',
            description: 'BNSS 176(3) requirements fully met'
        };
    }

    if (compliance.interlockStatus === 'OVERRIDE_APPROVED') {
        return {
            status: 'override',
            color: 'purple',
            label: 'Override Active',
            description: 'Judicial review required for non-compliance'
        };
    }

    if (compliance.interlockStatus === 'OVERRIDE_PENDING') {
        return {
            status: 'pending',
            color: 'amber',
            label: 'Override Pending',
            description: 'Awaiting approval from SP/higher authority'
        };
    }

    return {
        status: 'blocked',
        color: 'red',
        label: 'Non-Compliant',
        description: getBlockReason(compliance.checkResult)
    };
};

export default {
    isForensicVideoMandatory,
    validateForensicCompliance,
    requestComplianceOverride,
    approveOverride,
    canSubmitChargeSheet,
    getComplianceDisplayStatus
};
