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
 * Map a stored intake case onto the golden-key contract, or refuse.
 *
 * The refusal is the point. The one field a judge panel cannot be given a guess for is
 * `incidentDate`, because it decides which criminal code applies (see `applicableLawFor`: an
 * unknown date answers IPC, since Article 20(1) forbids reaching for the newer, harsher code on
 * an assumption). This function used to answer a missing filing date with *today*, and today is
 * always after 01-07-2024 - so every undated record silently came out labelled BNS, defeating the
 * fail-safe three lines below it. Records arrive here from `localStorage` through an unchecked
 * cast (`WorkspaceContext.tsx:42`), so "undated" is a state the running app can be in.
 *
 * What remains invented, and why it is safe: `adjournmentsCount: 0` and `isZeroFir: false` are
 * defaults, not measurements - the legacy store has no adjournment journal kind to read (D30), so
 * "nothing recorded" is the truth, and `tools/statute_tests.mjs` pins that no input can change it.
 * A screen may render them as defaults; it may not present 0 as a count the case was checked
 * against. `status` is no longer in that list: it is derived from `lastHearingDate`, which the
 * legacy model already required and this file simply never read.
 */
export type GoldenRefusal = {
    ok: false;
    /** The field that could not be derived. Named, so the UI can say what is missing. */
    missing: 'incidentDate';
    reason: string;
};

export type GoldenCaseResult = { ok: true; case: Case } | GoldenRefusal;

export const toGoldenCase = (legacy: LegacyCase): GoldenCaseResult => {
    // No `|| today` here, and none should come back: `applicableLawFor` owns the unknown case,
    // and it owns it by refusing to upgrade the code. Substituting a date would bypass it.
    const incidentDate = legacy.filingDate;
    if (!incidentDate) {
        return {
            ok: false,
            missing: 'incidentDate',
            reason:
                'No incident date or filing date is recorded for this case, so it cannot be determined whether the conduct ' +
                'falls under the BNS/BNSS (from 01-07-2024) or the IPC. The app will not choose: under Article 20(1) an ' +
                'assumed date could apply the newer code to older conduct. This case is not presentable until a date is recorded.',
        };
    }
    return {
        ok: true,
        case: {
        id: legacy.id,
        cnrNumber: legacy.caseNumber,
        complainant: legacy.petitioner,
        respondent: legacy.respondent,
        caseType: legacy.caseType,
        summary: legacy.summary,
        caseNotes: legacy.notes ?? '',
        filingDate: legacy.filingDate,
        status: legacy.lastHearingDate ? 'HEARING' : 'FILED',
        urgency: urgencyFor(legacy.priority),
        sectionsInvoked: legacy.invokedActs ?? [],
        adjournmentsCount: 0,
        incidentDate,
        isZeroFir: false,
        applicableLaw: applicableLawFor(incidentDate),
        },
    };
};
