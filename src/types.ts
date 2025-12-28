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

export interface BlockchainBlock {
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
