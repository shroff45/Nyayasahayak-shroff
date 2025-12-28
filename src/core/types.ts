export type UserRole = 'CITIZEN' | 'POLICE' | 'JUDGE' | 'ADMIN';
export type UrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus = 'FILED' | 'HEARING' | 'DECIDED' | 'DISMISSED';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
}

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
    lawyerId?: string;
    nextHearingDate?: string;
}

// --- DEEP TECH TYPES (Nationals) ---
export interface EvidenceAnalysis {
    id: string;
    caseId: string;
    type: 'PHOTO' | 'CCTV' | 'DOCUMENT';
    sourceUrl: string;
    detections: { concept: string; confidence: number; bbox: any }[];
    keyFindings: string[];
}

export interface AIDecisionTrace {
    traceId: string;
    agent: string;
    action: string;
    confidence: number;
    timestamp: string;
}

export interface AdjournmentRisk {
    lawyerId: string;
    lawyerName: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    historicalRate: number;
    predictedDelayMonths: number;
}
