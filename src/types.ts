// types.ts - THE GOLDEN KEY DATA CONTRACT
export type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te';
export type CaseStatus = 'FILED' | 'HEARING' | 'DECIDED' | 'DISMISSED';
export type UrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type BailContractStatus = 'LOCKED' | 'ACTIVE' | 'REFUNDED' | 'FORFEITED';

export interface Case {
    id: string;
    cnrNumber: string;
    complainant: string;
    respondent: string;
    caseType: string;
    summary: string;
    caseNotes: string;
    filingDate: string;
    status: CaseStatus;
    urgency: UrgencyLevel;
    sectionsInvoked: string[];
    nextHearingDate?: string;
    adjournmentsCount: number;
    lawyerId?: string;
    judgeId?: string;
    // BNS/BNSS ADR Fields
    incidentDate: string; // ISO Date - determines BNS vs IPC
    isZeroFir: boolean;
    zeroFirTransferStatus?: 'PENDING' | 'TRANSFERRED';
    applicableLaw: 'IPC' | 'BNS'; // Derived from incidentDate
}

export interface VisualCard {
    icon: string;
    heading: string;
    description: string;
    color: 'green' | 'red' | 'blue' | 'gray' | 'purple' | 'orange';
    audioText: string;
}

export interface AdjournmentRisk {
    lawyerId: string;
    lawyerName: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    historicalRate: number;
    casesHandled: number;
    predictedDelayMonths: number;
}

/**
 * One journal entry as a screen renders it. Called `BlockchainBlock` until 4(e): the name was the
 * last thing in the type layer that implied a chain of blocks agreed on by several machines, when
 * this is a projection of a local, hash-chained, Merkle-batched log.
 */
export interface LedgerEntry {
    index: number;
    timestamp: string;
    data: any;
    hash: string;
    previousHash: string;
    merkleRoot: string;
    nonce: number;
}

export interface VerificationResult {
    isAuthentic: boolean;
    originalHash: string;
    currentHash: string;
    tampered: boolean;
    timestamp: string;
    /** Added with the real trust layer; every field below is optional so older screens keep working. */
    anchored?: boolean;
    anchorIndex?: number;
    signerFingerprint?: string;
    verificationReason?: string;
}

export interface SmartBailContract {
    transactionId: string;
    caseId: string;
    accusedId: string;
    amount: number;
    currency: 'INR';
    status: BailContractStatus;
    courtDates: string[];
    verifiedAppearances: string[];
    complianceScore: number;
    refundEligible: boolean;
    /**
     * The three fields below existed only in a duplicate model under `features/nationals`, which is
     * why two screens could not agree on what a contract is. That duplicate is gone now - deleted
     * with the subtree in the nationals purge, without this type being touched - and these three
     * fields stay, because they are part of the single shape the ledger writes and no cast is needed
     * at either boundary. If you are here from `docs/PLAN_4a.md`: this comment is the whole residue
     * of the fourth shape, and deleting it is not part of 4(a).
     */
    creationDate: string;
    releaseConditions: { courtDates: string[]; jurisdiction: string };
    biometricHash: string;
}

export interface GraphNode {
    id: string;
    label: string;
    type: 'CASE' | 'JUDGE' | 'STATUTE' | 'PRECEDENT';
}

export interface GraphLink {
    source: string;
    target: string;
    value: number;
}

export interface LegalPrecedent {
    id: string;
    caseName: string;
    citation: string;
    summary: string;
    court: string;
    year: number;
    fullTextUrl: string;
    relevanceScore: number;
    graphData?: {
        nodes: GraphNode[];
        links: GraphLink[];
    };
}
