// src/types/forensic.types.ts
// NyayaSahayak v2.0.0 - BNSS Section 176(3) Forensic Compliance Types
// Implements mandatory videography requirements for offenses ≥7 years

/**
 * BNSS Section 176(3) - Mandatory forensic videography
 * "on receipt of information relating to the commission of an offence
 * punishable with imprisonment for seven years or more, shall cause
 * the forensic expert to visit the crime scene"
 */

export type InterlockStatus = 'LOCKED' | 'UNLOCKED' | 'OVERRIDE_PENDING' | 'OVERRIDE_APPROVED';

export type ComplianceCheckResult = 'PASS' | 'FAIL_NO_VIDEO' | 'FAIL_NO_EXPERT' | 'FAIL_HASH_MISMATCH' | 'EXEMPT';

export type OverrideReason =
    | 'FORENSIC_TEAM_UNAVAILABLE'
    | 'TECHNICAL_FAILURE'
    | 'EXTREME_TERRAIN'
    | 'INFRASTRUCTURE_LIMITATION'
    | 'STATE_EXEMPTION'
    | 'OTHER';

/**
 * Forensic Expert Visit Token
 * Generated via digital handshake between IO and Expert at crime scene
 */
export interface ForensicVisitToken {
    tokenId: string;
    caseId: string;
    investigatingOfficerId: string;
    investigatingOfficerName: string;
    forensicExpertId: string;
    forensicExpertName: string;
    forensicExpertDesignation: string;
    visitTimestamp: Date;
    geoLocation: {
        latitude: number;
        longitude: number;
        accuracy: number; // meters
        address?: string;
    };
    handshakeMethod: 'QR_CODE' | 'NFC' | 'MANUAL';
    digitalSignature: string;
    isVerified: boolean;
}

/**
 * Forensic Video Metadata
 * Captured during Section 176(3) compliance recording
 */
export interface ForensicVideoMetadata {
    videoId: string;
    caseId: string;
    fileName: string;
    fileSize: number;
    duration: number; // seconds
    mimeType: string;

    // Device information (from capture)
    captureDevice: {
        make: string;
        model: string;
        imei?: string;
        osVersion: string;
    };

    // Location & Time (NTP synced)
    captureTimestamp: Date;
    ntpSynced: boolean;
    geoLocation: {
        latitude: number;
        longitude: number;
    };

    // Integrity
    sourceHash: string; // SHA-256 computed on device
    serverHash?: string;
    ledgerBlockId?: string;
    hashAlgorithm: 'SHA-256';

    // Status
    uploadStatus: 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'VERIFIED';
    integrityStatus: 'UNVERIFIED' | 'VERIFIED' | 'MISMATCH';
}

/**
 * Forensic Compliance Status for a Case
 */
export interface ForensicCompliance {
    caseId: string;
    cnrNumber?: string;

    // Determination
    isMandatory: boolean;
    mandatoryReason?: string; // e.g., "BNS Section 103 - Murder (Life Imprisonment)"
    maxPunishment?: string; // e.g., "Life Imprisonment", "10 Years"

    // Compliance Status
    interlockStatus: InterlockStatus;
    checkResult: ComplianceCheckResult;

    // Components
    hasForensicVideo: boolean;
    forensicVideo?: ForensicVideoMetadata;
    hasExpertVisitToken: boolean;
    expertVisitToken?: ForensicVisitToken;

    // Hash Verification
    isHashVerified: boolean;
    hashVerificationTimestamp?: Date;

    // Override (if applicable)
    hasOverride: boolean;
    override?: {
        requestedBy: string;
        requestedAt: Date;
        reason: OverrideReason;
        reasonDetails: string;
        approvedBy?: string;
        approvedAt?: Date;
        isApproved: boolean;
        judicialReviewFlag: boolean; // Flagged red on Judge Dashboard
    };

    // Audit Trail
    lastChecked: Date;
    checkHistory: Array<{
        timestamp: Date;
        result: ComplianceCheckResult;
        details: string;
    }>;
}

/**
 * Charge Sheet Submission Request
 * Blocked unless forensic compliance is met
 */
export interface ChargeSheetSubmission {
    caseId: string;
    submissionAttemptId: string;
    attemptedBy: string;
    attemptedAt: Date;

    // Interlock Status
    forensicCompliance: ForensicCompliance;
    isBlocked: boolean;
    blockReason?: string;

    // If submission allowed
    submissionStatus?: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
    submittedAt?: Date;
    courtSubmissionId?: string;
}

/**
 * Sections that mandate forensic videography (≥7 years punishment)
 */
export const MANDATORY_FORENSIC_SECTIONS = {
    BNS: [
        { section: '64', description: 'Rape', punishment: 'Life Imprisonment' },
        { section: '65', description: 'Rape in certain cases', punishment: 'Life Imprisonment' },
        { section: '66', description: 'Punishment for causing death', punishment: 'Death/Life' },
        { section: '100', description: 'Culpable homicide', punishment: '10 Years' },
        { section: '101', description: 'Murder', punishment: 'Death/Life' },
        { section: '103', description: 'Murder attempt', punishment: 'Life/10 Years' },
        { section: '111', description: 'Organized crime', punishment: 'Life/Death' },
        { section: '113', description: 'Terrorist act', punishment: 'Life/Death' },
        { section: '117', description: 'Kidnapping', punishment: '7 Years' },
        { section: '140', description: 'Dacoity', punishment: 'Life/10 Years' },
        { section: '309', description: 'Robbery', punishment: '10 Years' },
    ],
    IPC: [
        { section: '302', description: 'Murder', punishment: 'Death/Life' },
        { section: '307', description: 'Attempt to murder', punishment: 'Life/10 Years' },
        { section: '376', description: 'Rape', punishment: 'Life Imprisonment' },
        { section: '392', description: 'Robbery', punishment: '10 Years' },
        { section: '395', description: 'Dacoity', punishment: 'Life/10 Years' },
        { section: '397', description: 'Robbery with attempt to cause death', punishment: '7 Years' },
        { section: '364', description: 'Kidnapping for murder', punishment: 'Death/Life' },
    ]
};

export default {
    MANDATORY_FORENSIC_SECTIONS
};
