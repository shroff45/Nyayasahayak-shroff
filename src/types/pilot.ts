// src/types/pilot.ts
// NyayaSahayak Hybrid v2.0.0 - BNS/BNSS Pilot Types
// Section 3 of Master Implementation Guide

export type LawSystem = 'IPC' | 'BNS';

// Critical for mapping offence logic
export type OffenceType = 'THEFT' | 'SNATCHING' | 'MURDER' | 'CHEATING' | 'RAPE';

export interface PilotCase {
    id: string;
    cnrNumber: string;

    // Timeline Data (Critical for BNS Transition Logic)
    incidentDate: string; // ISO Format YYYY-MM-DD
    filingDate: string;   // ISO Format YYYY-MM-DD

    // BNSS Procedural Flags
    isZeroFir: boolean;
    zeroFirTransferStatus?: 'PENDING' | 'TRANSFERRED';
    transferDeadline?: string; // ISO timestamp (Filing + 24hrs)

    // Judicial Controls (BNSS Sec 346)
    adjournmentsCount: number; // Max 2 limit

    // Legal Details
    offenceType: OffenceType;
    applicableSection: string;    // e.g., "BNS 304" or "IPC 379"
    actName: string;              // "Bharatiya Nyaya Sanhita" or "Indian Penal Code"

    // Evidence (BSA Sec 63)
    evidenceHash?: string;        // SHA-256 Hash

    // Case Metadata
    complainant?: string;
    respondent?: string;
    caseType?: string;
    summary?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'FILED' | 'INVESTIGATION' | 'HEARING' | 'DECIDED';
}

// Role types for authentication
export type UserRole = 'CITIZEN' | 'POLICE' | 'JUDGE' | 'ADMIN';

export interface PilotUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    verified: boolean;
    aadhaarToken?: string; // DigiLocker token, not raw Aadhaar
}

// Zero FIR Transfer tracking
export interface ZeroFirRecord {
    firId: string;
    createdAt: string;        // ISO timestamp
    transferDeadline: string; // createdAt + 24 hours
    originStation: string;
    targetStation?: string;
    status: 'PENDING' | 'TRANSFERRED' | 'EXPIRED';
}

// Evidence with hash for BSA Sec 63 compliance
export interface Evidence {
    id: string;
    caseId: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    uploadedBy: string;
    sha256Hash: string;      // BSA Sec 63 compliance
    chainOfCustody: CustodyEntry[];
}

export interface CustodyEntry {
    timestamp: string;
    action: 'UPLOADED' | 'ACCESSED' | 'TRANSFERRED' | 'VERIFIED';
    officerId: string;
    officerName: string;
    notes?: string;
}

// Admin Dashboard types
export interface PendencyStats {
    zone: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    caseCount: number;
}

export interface TransitionStats {
    totalCases: number;
    ipcCases: number;
    bnsCases: number;
    transitionRate: number; // percentage
}
