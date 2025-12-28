// src/shared/utils/legalCompliance.ts
// NyayaSahayak - Legal Compliance Utilities
// Reference utilities for BNSS, BNS, and Constitutional provisions

/**
 * BNSS 173 - FIR Registration Rights
 * Citizens must be informed of their rights upon e-FIR filing
 */
export const BNSS_173_RIGHTS = {
    title: 'Your Rights Under BNSS Section 173',
    rights: [
        'Free copy of FIR within 24 hours',
        'Zero FIR - file at any police station in India',
        'e-FIR must be accepted without delay',
        'Written acknowledgment is mandatory',
        'Right to sign digitally within 3 days',
    ],
    citation: 'Bharatiya Nagarik Suraksha Sanhita, 2023 - Section 173',
};

/**
 * BNSS 193 - Investigation Timeline Limits
 * Detention limits for investigation completion
 */
export const BNSS_193_LIMITS = {
    maxDaysMinorOffence: 60,  // Up to 3 years imprisonment
    maxDaysMajorOffence: 90,  // Above 3 years imprisonment
    precedent: {
        case: 'Arnab Ranjan Goswami v. State of Maharashtra (2020)',
        citation: 'AIR 2020 SC 5009',
        principle: 'Default bail is an indefeasible right when investigation exceeds statutory limit',
    },
};

/**
 * Section 479 - Undertrial Release (equivalent to old CrPC 436A)
 * Undertrials detained beyond half the maximum sentence must be released
 */
export const SECTION_479_UNDERTRIAL = {
    rule: 'Release on personal bond after serving half of maximum sentence',
    exceptions: ['Death penalty', 'Life imprisonment'],
    citation: 'BNSS Section 479',
};

/**
 * Article 21 - Right to Life and Personal Liberty
 * Most invoked constitutional provision
 */
export const ARTICLE_21 = {
    text: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    landmark: {
        case: 'Maneka Gandhi v. Union of India (1978)',
        principle: 'Procedure must be fair, just, and reasonable - not merely legally valid',
    },
};

/**
 * Calculate days remaining for BNSS 193 compliance
 */
export const calculateBNSSDeadline = (
    investigationDays: number,
    maxSentenceYears: number
): { remaining: number; status: 'OK' | 'WARNING' | 'CRITICAL' } => {
    const maxDays = maxSentenceYears > 3 ? 90 : 60;
    const remaining = maxDays - investigationDays;

    if (remaining <= 5) return { remaining, status: 'CRITICAL' };
    if (remaining <= 15) return { remaining, status: 'WARNING' };
    return { remaining, status: 'OK' };
};

/**
 * Check if undertrial is eligible for release under Section 479
 */
export const checkUndertrialRelease = (
    daysDetained: number,
    maxSentenceYears: number,
    excludedOffence: boolean = false
): boolean => {
    if (excludedOffence) return false;
    const maxDays = maxSentenceYears * 365;
    return daysDetained >= maxDays / 2;
};

/**
 * Format legal citation
 */
export const formatCitation = (
    caseName: string,
    year: number,
    court: string,
    reportVolume?: string
): string => {
    if (reportVolume) {
        return `${caseName} (${year}) ${reportVolume}`;
    }
    return `${caseName} (${year}) ${court}`;
};
