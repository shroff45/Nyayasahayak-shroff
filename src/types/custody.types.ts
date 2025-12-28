// src/types/custody.types.ts
// NyayaSahayak v2.0.0 - Chain of Custody Types
// Implements evidence tracking from seizure to court with Akhand Ledger verification

/**
 * Chain of Custody - Visual Timeline Types
 * Tracks the complete lifecycle of evidence with blockchain verification
 */

export type CustodyEventType =
    | 'SEIZURE'           // Initial seizure at crime scene
    | 'HANDOVER'          // Transfer between custody holders
    | 'TRANSPORT'         // In transit (Police Station to FSL)
    | 'RECEIPT'           // Received at destination
    | 'ANALYSIS'          // Forensic analysis
    | 'STORAGE'           // Stored in Malkhana/FSL
    | 'COURT_SUBMISSION'  // Submitted to court
    | 'EXAMINATION'       // Court examination
    | 'RETURN'            // Returned after proceedings
    | 'DISPOSAL';         // Final disposal

export type IntegrityStatus =
    | 'VERIFIED'      // Hash matches, chain unbroken
    | 'PENDING'       // Awaiting verification
    | 'MISMATCH'      // Hash mismatch - potential tampering
    | 'GAP_DETECTED'  // Time gap in custody chain
    | 'UNKNOWN';      // Unable to verify

export type CustodianRole =
    | 'INVESTIGATING_OFFICER'
    | 'MALKHANA_INCHARGE'
    | 'ESCORT_OFFICER'
    | 'FSL_RECEIVING'
    | 'FORENSIC_EXPERT'
    | 'COURT_READER'
    | 'JUDGE'
    | 'EVIDENCE_OFFICER';

/**
 * Individual Custody Event
 * Represents a single node in the custody timeline
 */
export interface CustodyEvent {
    eventId: string;
    evidenceId: string;
    caseId: string;

    // Event details
    eventType: CustodyEventType;
    description: string;
    timestamp: Date;

    // Custodian (who held/transferred)
    custodian: {
        id: string;
        name: string;
        role: CustodianRole;
        designation: string;
        badgeNumber?: string;
        stationCode?: string;
        organization?: string; // e.g., 'Delhi Police', 'FSL Rohini'
    };

    // Location
    location: {
        name: string; // e.g., 'PS Saket', 'FSL Rohini'
        address?: string;
        gpsCoordinates?: {
            latitude: number;
            longitude: number;
        };
    };

    // For handovers
    previousCustodianId?: string;
    receiverId?: string;
    receiverSignature?: string;

    // Integrity
    evidenceHash: string; // Current hash at this point
    hashAlgorithm: 'SHA-256';
    ledgerBlockId?: string;
    ledgerTransactionHash?: string;

    // Verification
    integrityStatus: IntegrityStatus;
    verifiedAt?: Date;
    verifiedBy?: string;

    // Visual aids
    photoUrls?: string[]; // Photos of evidence at this stage
    videoUrl?: string;
    sealNumber?: string;

    // Digital signature
    digitalSignature?: string;
    signatureTimestamp?: Date;
}

/**
 * Complete Chain of Custody for an Evidence Item
 */
export interface CustodyChain {
    evidenceId: string;
    caseId: string;
    cnrNumber?: string;

    // Evidence description
    evidenceDescription: string;
    evidenceCategory: 'PHYSICAL' | 'DIGITAL' | 'BIOLOGICAL' | 'DOCUMENT' | 'WEAPON';

    // Timeline
    events: CustodyEvent[];
    currentCustodian: CustodyEvent['custodian'];
    currentLocation: CustodyEvent['location'];

    // Chain integrity
    overallIntegrity: IntegrityStatus;
    chainStartHash: string; // Hash at seizure
    chainCurrentHash: string; // Current hash
    isChainUnbroken: boolean;

    // Gap analysis
    hasTimeGaps: boolean;
    gaps: Array<{
        fromEvent: string;
        toEvent: string;
        gapDuration: number; // hours
        isAcceptable: boolean; // <24h is acceptable
        reason?: string;
    }>;

    // Akhand Ledger verification
    ledgerVerification: {
        isVerified: boolean;
        lastVerifiedAt?: Date;
        blockCount: number;
        genesisBlockId?: string;
    };

    // BSA Section 63 Certificate
    section63Certificate?: {
        certificateId: string;
        generatedAt: Date;
        pdfUrl?: string;
    };

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Timeline Node for UI Rendering
 */
export interface TimelineNode {
    id: string;
    event: CustodyEvent;

    // Visual properties
    icon: 'police' | 'transport' | 'lab' | 'court' | 'storage' | 'analysis';
    color: 'green' | 'amber' | 'red' | 'gray';
    status: IntegrityStatus;

    // Display text
    title: string;
    subtitle: string;
    timestamp: string; // Formatted

    // Connection to next node
    hasNextNode: boolean;
    connectionStatus: 'solid' | 'dashed' | 'broken'; // Based on integrity
    gapWarning?: string; // e.g., "36 hours between events"

    // Expandable details
    isExpanded: boolean;
    details: {
        custodianInfo: string;
        locationInfo: string;
        hashInfo: string;
        ledgerLink?: string;
    };
}

/**
 * Helper: Convert CustodyEvent to TimelineNode for rendering
 */
export const eventToTimelineNode = (event: CustodyEvent, nextEvent?: CustodyEvent): TimelineNode => {
    const getIcon = (type: CustodyEventType): TimelineNode['icon'] => {
        switch (type) {
            case 'SEIZURE':
            case 'HANDOVER':
                return 'police';
            case 'TRANSPORT':
                return 'transport';
            case 'ANALYSIS':
                return 'analysis';
            case 'STORAGE':
                return 'storage';
            case 'COURT_SUBMISSION':
            case 'EXAMINATION':
                return 'court';
            default:
                return 'storage';
        }
    };

    const getColor = (status: IntegrityStatus): TimelineNode['color'] => {
        switch (status) {
            case 'VERIFIED': return 'green';
            case 'PENDING': return 'gray';
            case 'GAP_DETECTED': return 'amber';
            case 'MISMATCH': return 'red';
            default: return 'gray';
        }
    };

    const getConnectionStatus = (current: CustodyEvent, next?: CustodyEvent): TimelineNode['connectionStatus'] => {
        if (!next) return 'solid';
        if (current.integrityStatus === 'MISMATCH' || next.integrityStatus === 'MISMATCH') return 'broken';

        // Check time gap
        const gapHours = (new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()) / (1000 * 60 * 60);
        if (gapHours > 24) return 'dashed';

        return 'solid';
    };

    let gapWarning: string | undefined;
    if (nextEvent) {
        const gapHours = (new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime()) / (1000 * 60 * 60);
        if (gapHours > 24) {
            gapWarning = `${Math.round(gapHours)} hours gap`;
        }
    }

    return {
        id: event.eventId,
        event,
        icon: getIcon(event.eventType),
        color: getColor(event.integrityStatus),
        status: event.integrityStatus,
        title: event.eventType.replace('_', ' '),
        subtitle: event.custodian.name,
        timestamp: new Date(event.timestamp).toLocaleString('en-IN'),
        hasNextNode: !!nextEvent,
        connectionStatus: getConnectionStatus(event, nextEvent),
        gapWarning,
        isExpanded: false,
        details: {
            custodianInfo: `${event.custodian.designation} - ${event.custodian.organization || event.location.name}`,
            locationInfo: event.location.address || event.location.name,
            hashInfo: `SHA-256: ${event.evidenceHash.substring(0, 16)}...`,
            ledgerLink: event.ledgerBlockId
        }
    };
};

export default {
    eventToTimelineNode
};
