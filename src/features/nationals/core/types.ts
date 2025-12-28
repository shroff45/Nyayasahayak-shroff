// --- EXISTING CORE TYPES ---
export type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te';
export type CaseStatus = 'FILED' | 'HEARING' | 'DECIDED' | 'DISMISSED';
export type UrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type BailContractStatus = 'LOCKED' | 'ACTIVE' | 'REFUNDED' | 'FORFEITED';

// Case interface moved to end of file to avoid duplication

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
    creationDate: string; // Added
    releaseConditions: { // Added
        courtDates: string[];
        jurisdiction: string;
    };
    biometricHash: string; // Added
    verifiedAppearances: string[];
    complianceScore: number;
    refundEligible: boolean;
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

export interface GraphNode { id: string; label: string; type: 'CASE' | 'JUDGE' | 'STATUTE' | 'PRECEDENT'; }
export interface GraphLink { source: string; target: string; value: number; }

// --- DEEP TECH TYPES (SAM 3 + Observability) ---

export interface EvidenceAnalysis {
    id: string;
    caseId: string;
    type: 'PHOTO' | 'CCTV' | 'DOCUMENT';
    sourceUrl: string;
    detections: DetectionResult[];
    relevanceScore: number;
    analysisConfidence: number;
    keyFindings: string[];
}

export interface DetectionResult {
    concept: string; // e.g., "Stolen Laptop"
    bbox: { x: number; y: number; w: number; h: number }; // Percentages 0-100
    confidence: number;
}

export interface AIDecisionTrace {
    traceId: string;
    agent: 'JUDGE_ASSIST' | 'EVIDENCE_AI' | 'BLOCKCHAIN_WATCHDOG' | 'SYSTEM';
    action: string;
    confidence: number;
    timestamp: string;
}

export interface User {
    id?: string;
    name?: string;
    role?: 'judge' | 'police' | 'citizen';
    email: string;
    avatar?: string;
}

export interface ChatMessage {
    id?: string;
    text?: string;
    content: string;
    sender?: 'user' | 'bot';
    role: 'user' | 'model' | 'system';
    timestamp?: Date;
    isError?: boolean;
    sources?: any[];
    parts?: any[];
    serverContent?: any;
}

export interface HistoryItem {
    id?: string;
    action?: string;
    type?: string;
    timestamp: string | Date;
    details: string;
    user?: string;
}

export interface QuantumFingerprintResult {
    hash?: string;
    quantumHash?: string;
    timestamp?: string;
    method?: string;
    verified?: boolean;
}

export interface DocumentAnalysisResult {
    summary?: string;
    entities?: string[];
    sentiment?: string;
    riskScore?: number;
    severity?: 'High' | 'Medium' | 'Low';
    confidenceScore?: number;
    recommendedCourt?: string;
    keyLegalIssues?: string[];
    identifiedEntities?: { name: string; type: string; }[];
    potentialPrecedents?: string[];
}

export interface PredictionResult {
    outcome: string;
    confidence: number;
    reasoning: string[];
    priority?: 'High' | 'Medium' | 'Low';
    rationale?: string;
    contributingFactors?: string[];
    legalCitations?: string[];
}

export interface Case {
    id: string;
    cnrNumber?: string;
    caseNumber?: string;
    title?: string;
    complainant?: string;
    petitioner?: string;
    respondent: string;
    caseType: string;
    summary: string;
    caseNotes?: string;
    notes?: string;
    filingDate: string;
    status?: CaseStatus;
    urgency?: UrgencyLevel;
    priority?: string;
    sectionsInvoked?: string[];
    invokedActs?: string[];
    nextHearingDate?: string;
    lastHearingDate?: string;
    adjournmentsCount?: number;
    lawyerId?: string;
    judgeId?: string;
    complexityScore?: number;
    pii?: Record<string, string>;
    userId?: string; // Added
}
