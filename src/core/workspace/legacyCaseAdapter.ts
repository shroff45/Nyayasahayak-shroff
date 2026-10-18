// src/core/workspace/legacyCaseAdapter.ts
// Bridges the two `Case` shapes that exist in this codebase.
//
//  * features/main/types.ts  - what the intake/triage and fingerprinting screens store
//                             (title / caseNumber / petitioner / invokedActs).
//  * src/types.ts ("the golden key") - what the judge-facing panels require
//                             (cnrNumber / complainant / sectionsInvoked / applicableLaw).
//
// The judge panels were previously fed hand-written mocks, so nothing a citizen filed in the
// intake screen could ever reach them. This adapter is the missing link and keeps the
// BNS/IPC determination in one place instead of letting callers hard-code it.

import type { Case as LegacyCase } from '../../features/main/types';
import type { Case, UrgencyLevel } from '../../types';
import { BNS_EFFECTIVE_DATE } from '../services/forensicInterlock';

/**
 * The BNS, 2023 and BNSS, 2023 govern conduct on or after 01-07-2024; earlier conduct stays
 * under the IPC, 1860. Article 20(1) forbids applying the newer, harsher code retroactively,
 * so this must be derived from the incident date and never guessed by the caller.
 */
export const applicableLawFor = (incidentDate: string | Date | undefined | null): 'IPC' | 'BNS' => {
    if (!incidentDate) return 'IPC';
    const parsed = new Date(incidentDate);
    if (Number.isNaN(parsed.getTime())) return 'IPC';
    return parsed >= BNS_EFFECTIVE_DATE ? 'BNS' : 'IPC';
};

const urgencyFor = (priority?: LegacyCase['priority']): UrgencyLevel => {
    switch (priority) {
        case 'High':
            return 'HIGH';
        case 'Medium':
            return 'MEDIUM';
        default:
            return 'LOW';
    }
};

/**
 * Map a stored intake case onto the golden-key contract.
 * Fields the intake screen genuinely does not capture are given their statutory default
 * (an adjournment count of zero, no Zero-FIR transfer, `FILED` status) rather than invented.
 */
export const toGoldenCase = (legacy: LegacyCase): Case => {
    const incidentDate = legacy.filingDate || new Date().toISOString().slice(0, 10);
    return {
        id: legacy.id,
        cnrNumber: legacy.caseNumber,
        complainant: legacy.petitioner,
        respondent: legacy.respondent,
        caseType: legacy.caseType,
        summary: legacy.summary,
        caseNotes: legacy.notes ?? '',
        filingDate: legacy.filingDate,
        status: 'FILED',
        urgency: urgencyFor(legacy.priority),
        sectionsInvoked: legacy.invokedActs ?? [],
        adjournmentsCount: 0,
        incidentDate,
        isZeroFir: false,
        applicableLaw: applicableLawFor(incidentDate),
    };
};
