// src/types/fir.types.ts
// NyayaSahayak v2.0.0 - BNSS Section 173 Compliant FIR Types
// Implements e-FIR 72-hour signature timer requirements

/**
 * BNSS Section 173 - Information in cognizable cases
 * Sub-section (1)(ii): e-FIR must be signed within 3 days
 */

export enum FIRStatus {
    DRAFT = 'DRAFT',
    SUBMITTED_ELECTRONICALLY = 'SUBMITTED_ELECTRONICALLY',  // e-FIR received
    PENDING_SIGNATURE = 'PENDING_SIGNATURE',                // 72-hour timer running
    SIGNED = 'SIGNED',                                      // Informant signed
    REGISTERED = 'REGISTERED',                              // Officially recorded
    TRANSFERRED = 'TRANSFERRED',                            // Zero FIR transferred
    EXPIRED = 'EXPIRED',                                    // 72-hour timer exceeded
    CONVERTED_TO_GD = 'CONVERTED_TO_GD',                    // Converted to GD Entry
    QUASHED = 'QUASHED'
}

export enum FIRJurisdictionType {
    JURISDICTIONAL = 'JURISDICTIONAL',
    ZERO = 'ZERO'   // BNSS Sec 173(1) - Can file anywhere
}

export type SignatureMethod = 'AADHAAR_ESIGN' | 'PHYSICAL_SIGNATURE' | 'STYLUS_SIGNATURE' | 'VOICE_CONSENT';

/**
 * Timer state for 72-hour countdown
 */
export interface SignatureTimer {
    submissionTime: Date;           // When e-FIR was submitted (server time)
    expiryTime: Date;               // submissionTime + 72 hours
    remainingHours: number;         // Calculated field
    remainingMinutes: number;
    remainingSeconds: number;
    alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
    notificationsSent: Array<{
        type: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH';
        sentAt: Date;
        hoursRemaining: number;
    }>;
}

/**
 * Informant (complainant) details
 */
export interface Informant {
    name: string;
    aadhaarHash?: string;           // Privacy-preserving hashed Aadhaar
    fatherOrSpouseName?: string;
    address: string;
    mobile: string;
    email?: string;
    isVulnerable: boolean;          // Women, children, disabled persons
    vulnerableCategory?: 'WOMAN' | 'CHILD' | 'DISABLED' | 'SENIOR_CITIZEN';
    contactVerified: boolean;
}

/**
 * Incident details for FIR
 */
export interface IncidentDetails {
    gpsCoordinates?: {
        latitude: number;
        longitude: number;
    };
    address: string;
    district: string;
    state: string;
    policeStation: string;
    description: string;
    occurrenceDate: Date;
    occurrenceTime?: string;
    reportingDate: Date;
}

/**
 * Act/Section invoked
 */
export interface InvokedSection {
    code: 'IPC' | 'BNS';
    section: string;
    description: string;
    category: 'COGNIZABLE' | 'NON_COGNIZABLE';
    maxPunishment: string;
    isBailable: boolean;
}

/**
 * Provisional FIR - Before signature (72-hour window)
 */
export interface ProvisionalFIR {
    tempId: string;                         // Temporary ID before registration
    submissionTime: Date;                   // Server time (UTC)
    expiryTime: Date;                       // submissionTime + 72 hours
    status: FIRStatus;

    // Timer tracking
    signatureTimer: SignatureTimer;

    // Informant details
    informant: Informant;

    // Incident
    incidentDetails: IncidentDetails;

    // Sections (auto-detected via OffenceMapper)
    sectionsInvoked: InvokedSection[];

    // Filing method
    filingMethod: 'VOICE' | 'TEXT' | 'WALK_IN';
    languageUsed: string;

    // Jurisdiction
    jurisdictionType: FIRJurisdictionType;
    filingStationCode: string;
    correctJurisdictionStationCode?: string; // For Zero FIR

    // Vulnerable victim override (bypasses 72-hour for physical visit)
    requiresPhysicalVisit: boolean;
    physicalVisitScheduled?: Date;

    // Signature
    signatureMethod?: SignatureMethod;
    signatureTimestamp?: Date;
    signatureReference?: string;            // Aadhaar e-Sign transaction ID

    // If expired
    gdEntryNumber?: string;                 // If converted to GD
    expirationReason?: string;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Registered FIR (after signature)
 */
export interface RegisteredFIR extends Omit<ProvisionalFIR, 'tempId'> {
    firNumber: string;              // Official FIR number
    cctnsNumber?: string;           // CCTNS integration ID
    cnrNumber?: string;             // Court reference
    registrationTimestamp: Date;
    registeredBy: string;           // SHO/Officer ID

    // Investigation
    investigatingOfficerId?: string;
    investigationStatus: 'PENDING' | 'IN_PROGRESS' | 'CHARGE_SHEET_FILED' | 'CLOSED';

    // Timelines
    chargeSheetDeadline?: Date;     // 60/90 days per offense

    // Evidence
    evidenceIds: string[];

    // BSA Section 63 - FIR itself is digital evidence
    firCertificate?: {
        certificateId: string;
        issuedAt: Date;
    };
}

/**
 * Timer calculation helper
 */
export const calculateRemainingTime = (expiryTime: Date): SignatureTimer['remainingHours'] => {
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();

    if (diff <= 0) return 0;

    return Math.floor(diff / (1000 * 60 * 60));
};

/**
 * Determine alert level based on remaining time
 */
export const getAlertLevel = (remainingHours: number): SignatureTimer['alertLevel'] => {
    if (remainingHours <= 0) return 'EXPIRED';
    if (remainingHours <= 12) return 'CRITICAL';
    if (remainingHours <= 24) return 'WARNING';
    return 'NORMAL';
};

/**
 * Check if FIR requires physical visit (vulnerable victims)
 */
export const requiresPhysicalVisit = (informant: Informant, description: string): boolean => {
    // Keywords that trigger physical visit requirement
    const sensitiveKeywords = [
        'rape', 'sexual assault', 'molestation', 'pocso', 'child abuse',
        'domestic violence', 'acid attack', 'trafficking'
    ];

    const descLower = description.toLowerCase();
    const hasSensitiveContent = sensitiveKeywords.some(kw => descLower.includes(kw));

    return informant.isVulnerable || hasSensitiveContent;
};

export default {
    FIRStatus,
    FIRJurisdictionType,
    calculateRemainingTime,
    getAlertLevel,
    requiresPhysicalVisit
};
