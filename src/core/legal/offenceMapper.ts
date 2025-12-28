// src/core/legal/offenceMapper.ts
// NyayaSahayak Hybrid v2.0.0 - Hybrid Offence Engine
// Section 4 of Master Implementation Guide
// Handles IPC ↔ BNS switching based on incident date (Article 20 protection)

import type { OffenceType } from '@types/pilot';

// BNS Implementation Date: July 1, 2024
export const BNS_CUTOFF_DATE = new Date('2024-07-01');

export interface OffenceDetails {
    section: string;
    label: string;
    punishment: string;
    bailable: boolean;
    cognizable: boolean;
}

export interface DualSystemOffence {
    ipc: OffenceDetails;
    bns: OffenceDetails;
}

// Master Database of Offences (IPC/BNS mapping)
export const OFFENCE_DB: Record<OffenceType, DualSystemOffence> = {
    THEFT: {
        ipc: {
            section: "379",
            label: "Theft (IPC)",
            punishment: "3 Years",
            bailable: false,
            cognizable: true
        },
        bns: {
            section: "303(2)",
            label: "Theft (BNS)",
            punishment: "3 Years / Community Service",
            bailable: false,
            cognizable: true
        }
    },
    SNATCHING: {
        ipc: {
            section: "379",
            label: "Theft (IPC) - No specific section",
            punishment: "3 Years",
            bailable: false,
            cognizable: true
        },
        bns: {
            section: "304",
            label: "Snatching (BNS)",
            punishment: "3 Years + Fine",
            bailable: false,
            cognizable: true
        }
    },
    CHEATING: {
        ipc: {
            section: "420",
            label: "Cheating (IPC)",
            punishment: "7 Years",
            bailable: false,
            cognizable: true
        },
        bns: {
            section: "318(4)",
            label: "Cheating (BNS)",
            punishment: "7 Years",
            bailable: false,
            cognizable: true
        }
    },
    MURDER: {
        ipc: {
            section: "302",
            label: "Murder (IPC)",
            punishment: "Death/Life Imprisonment",
            bailable: false,
            cognizable: true
        },
        bns: {
            section: "103(1)",
            label: "Murder (BNS)",
            punishment: "Death/Life Imprisonment",
            bailable: false,
            cognizable: true
        }
    },
    RAPE: {
        ipc: {
            section: "375",
            label: "Rape (IPC)",
            punishment: "7 Years - Life",
            bailable: false,
            cognizable: true
        },
        bns: {
            section: "63",
            label: "Rape (BNS)",
            punishment: "10 Years - Life",
            bailable: false,
            cognizable: true
        }
    }
};

// Act names for display
export const ACT_NAMES = {
    IPC: 'Indian Penal Code, 1860',
    BNS: 'Bharatiya Nyaya Sanhita, 2023'
} as const;

/**
 * Determines which legal system applies based on the Incident Date.
 * Rule: Article 20 protection -> Crimes before July 1, 2024 use IPC.
 * @param incidentDate - ISO date string (YYYY-MM-DD)
 * @returns 'BNS' or 'IPC'
 */
export const getApplicableLaw = (incidentDate: string): 'BNS' | 'IPC' => {
    if (!incidentDate) return 'BNS'; // Default to modern law if undefined
    const date = new Date(incidentDate);
    return date >= BNS_CUTOFF_DATE ? 'BNS' : 'IPC';
};

/**
 * Returns the exact section details based on crime type and incident date.
 * @param crime - The type of offence
 * @param incidentDate - ISO date string (YYYY-MM-DD)
 * @returns OffenceDetails for the applicable legal system
 */
export const getSectionDetails = (
    crime: OffenceType,
    incidentDate: string
): OffenceDetails => {
    const system = getApplicableLaw(incidentDate);
    return OFFENCE_DB[crime][system.toLowerCase() as 'ipc' | 'bns'];
};

/**
 * Returns the full act name based on the legal system.
 * @param system - 'BNS' or 'IPC'
 * @returns Full name of the act
 */
export const getActName = (system: 'BNS' | 'IPC'): string => {
    return ACT_NAMES[system];
};

/**
 * Formats a section reference with full act citation.
 * @param crime - The type of offence
 * @param incidentDate - ISO date string (YYYY-MM-DD)
 * @returns Formatted string like "Section 304, Bharatiya Nyaya Sanhita, 2023"
 */
export const getFormattedCitation = (
    crime: OffenceType,
    incidentDate: string
): string => {
    const system = getApplicableLaw(incidentDate);
    const details = getSectionDetails(crime, incidentDate);
    return `Section ${details.section}, ${ACT_NAMES[system]}`;
};

/**
 * Detects likely crime type from text description (for voice filing).
 * @param description - Free text description of incident
 * @returns Detected OffenceType or null
 */
export const detectCrimeType = (description: string): OffenceType | null => {
    const text = description.toLowerCase();

    // Keywords for each crime type
    const keywords: Record<OffenceType, string[]> = {
        SNATCHING: ['snatch', 'snatched', 'snatching', 'grabbed', 'chain snatching'],
        THEFT: ['theft', 'stole', 'stolen', 'steal', 'burglary', 'robbed'],
        CHEATING: ['cheat', 'cheating', 'fraud', 'fraudulent', 'scam', 'deceived'],
        MURDER: ['murder', 'killed', 'homicide', 'death'],
        RAPE: ['rape', 'sexual assault', 'molested']
    };

    for (const [crime, words] of Object.entries(keywords)) {
        if (words.some(word => text.includes(word))) {
            return crime as OffenceType;
        }
    }

    return null;
};
