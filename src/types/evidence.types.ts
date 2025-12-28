// src/types/evidence.types.ts
// NyayaSahayak v2.0.0 - BSA Section 63 Compliant Evidence Types
// Implements digital evidence certification requirements

/**
 * BSA Section 63 - Admissibility of Electronic Records
 * Requires: Hash value, device metadata, dual certification
 */

export type HashAlgorithm = 'SHA-256' | 'SHA-512';

export type DeviceType = 'mobile' | 'computer' | 'server' | 'cloud' | 'dvr' | 'cctv' | 'storage_media';

export type CertificationStatus = 'PENDING' | 'PART_A_COMPLETE' | 'FULLY_CERTIFIED' | 'REJECTED';

/**
 * Device metadata as required by BSA Schedule Part A
 */
export interface DeviceMetadata {
    type: DeviceType;
    make: string;           // e.g., "Samsung", "Apple"
    model: string;          // e.g., "Galaxy S23", "iPhone 15"
    serialNumber?: string;
    uniqueId: string;       // IMEI, MAC, or Cloud Account ID (hashed for privacy)
    osVersion?: string;
    color?: string;         // Per BSA Schedule requirement
}

/**
 * Hash integrity tracking for chain of custody
 */
export interface HashIntegrity {
    algorithm: HashAlgorithm;
    sourceHash: string;         // Hash at time of capture/upload
    serverVerifyHash?: string;  // Hash verified on server receipt
    ledgerBlockId?: string;     // Akhand Ledger block reference
    timestamp: Date;
    isVerified: boolean;
}

/**
 * Operational status as required by BSA Section 63(2)
 */
export interface OperationalCertification {
    isDeviceWorkingProperly: boolean;
    malfunctionDetails?: string;    // Required if isDeviceWorkingProperly is false
    periodOfControl: string;        // e.g., "2024-01-01 to 2024-12-14"
    controlAffirmation: boolean;    // "I certify device was under my lawful control"
}

/**
 * BSA Section 63 Certificate - Part A (User/Uploader)
 */
export interface Section63PartA {
    deponentName: string;
    designation: string;
    badgeNumber?: string;       // For police officers
    aadhaarHash?: string;       // Privacy-preserving ID
    deviceSource: DeviceType;
    deviceMetadata: DeviceMetadata;
    operationalCertification: OperationalCertification;
    hashValue: string;
    hashAlgorithm: HashAlgorithm;
    signatureTimestamp: Date;
    digitalSignature?: string;  // Aadhaar e-Sign reference
}

/**
 * BSA Section 63 Certificate - Part B (Expert)
 */
export interface Section63PartB {
    expertName: string;
    expertDesignation: string;
    expertOrganization: string; // e.g., "Forensic Science Laboratory"
    verificationMethod: string; // e.g., "Hash comparison with Akhand Ledger"
    hashMatch: boolean;
    verificationTimestamp: Date;
    remarks?: string;
    digitalSignature?: string;
}

/**
 * Complete BSA Section 63 Certificate
 */
export interface Section63Certificate {
    id: string;
    evidenceId: string;
    caseId: string;
    status: CertificationStatus;
    partA: Section63PartA;
    partB?: Section63PartB;
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Digital Evidence Record with BSA Compliance
 */
export interface DigitalEvidence {
    id: string;
    caseId: string;
    uploaderId: string;
    uploaderRole: 'CITIZEN' | 'POLICE' | 'FORENSIC' | 'ADMIN';

    // File metadata
    fileName: string;
    fileType: 'document' | 'audio' | 'video' | 'image' | 'archive';
    fileSize: number;       // bytes
    mimeType: string;
    storagePath: string;

    // BSA Section 63 compliance
    deviceMetadata: DeviceMetadata;
    hashIntegrity: HashIntegrity;
    operationalCertification: OperationalCertification;

    // Certification status
    certificate?: Section63Certificate;

    // Chain of custody
    chainOfCustody: Array<{
        action: 'UPLOAD' | 'VIEW' | 'DOWNLOAD' | 'HASH_VERIFY' | 'CERTIFY' | 'TRANSFER';
        userId: string;
        userRole: string;
        timestamp: Date;
        ipAddress?: string;
        verificationStatus?: 'SUCCESS' | 'FAILURE';
        remarks?: string;
    }>;

    // Metadata
    captureTimestamp?: Date;
    locationMetadata?: {
        latitude: number;
        longitude: number;
        address?: string;
    };

    // Forensic requirements (Section 176(3) BNSS)
    isForensicCapture: boolean;
    forensicReportId?: string;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Evidence upload request with required BSA fields
 */
export interface EvidenceUploadRequest {
    caseId: string;
    file: File;
    deviceMetadata: Partial<DeviceMetadata>;
    isForensicCapture: boolean;
    captureTimestamp?: Date;
    locationMetadata?: {
        latitude: number;
        longitude: number;
    };
}

/**
 * Certificate generation request
 */
export interface CertificateGenerationRequest {
    evidenceId: string;
    operationalCertification: OperationalCertification;
    deponentDetails: {
        name: string;
        designation: string;
        badgeNumber?: string;
    };
}

export default {
    // Type exports for runtime use if needed
};
