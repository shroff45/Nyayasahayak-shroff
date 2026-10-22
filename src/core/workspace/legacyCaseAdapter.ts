// src/core/workspace/legacyCaseAdapter.ts
//
// Historical workspace records used the intake shape (`caseNumber` / `petitioner` / `invokedActs`)
// while the rest of the application reads the golden shape (`cnrNumber` / `complainant` /
// `sectionsInvoked`). The mutable workspace is migrated in place once; this file retains the
// conversion because old browser profiles exist and because a missing date is a refusal, never a
// licence for a caller to choose a criminal code.
//
// This adapter is deliberately *not* the journal reader. Ledger records are signed evidence: their
// read-time projection lives in `shared/utils/ledgerRecords.ts`, where it can preserve the bytes
// that were written while offering current screens a canonical view.

import type { Case as LegacyCase } from '../../features/main/types';
import type { Case, CaseStatus, UrgencyLevel } from '../../types';
import { BNS_EFFECTIVE_DATE } from '../services/forensicInterlock';

/** The one marker covers every per-user `nyaya:cases:<owner>` key. */
export const WORKSPACE_SCHEMA_KEY = 'nyaya:cases:schema';
export const GOLDEN_WORKSPACE_SCHEMA = 'golden-v1';
const WORKSPACE_CASES_PREFIX = 'nyaya:cases:';

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

/** The result a judge-facing or model-facing screen must handle before presenting a case. */
export type GoldenRefusal = {
    ok: false;
    /** The field that could not be derived. Named, so the UI can say what is missing. */
    missing: 'incidentDate';
    reason: string;
};

export type GoldenCaseResult = { ok: true; case: Case } | GoldenRefusal;

const missingIncidentDate = (): GoldenRefusal => ({
    ok: false,
    missing: 'incidentDate',
    reason:
        'No incident date or filing date is recorded for this case, so it cannot be determined whether the conduct ' +
        'falls under the BNS/BNSS (from 01-07-2024) or the IPC. The app will not choose: under Article 20(1) an ' +
        'assumed date could apply the newer code to older conduct. This case is not presentable until a date is recorded.',
});

/**
 * A TypeScript `string` may still be empty after JSON storage. Keep the result-union boundary even
 * after the workspace moves to golden: the migration preserves an undated record with
 * `incidentDate: ''`, and no consumer may turn that absence into an affirmative IPC/BNS answer.
 */
export const toPresentableGoldenCase = (caseData: Case): GoldenCaseResult =>
    caseData.incidentDate.trim() ? { ok: true, case: caseData } : missingIncidentDate();

/**
 * Map a historical intake case onto the golden-key contract, or refuse.
 *
 * The refusal is the point. The one field a judge panel cannot be given a guess for is
 * `incidentDate`, because it decides which criminal code applies (see `applicableLawFor`: an
 * unknown date answers IPC, since Article 20(1) forbids reaching for the newer, harsher code on
 * an assumption). This function used to answer a missing filing date with *today*, and today is
 * always after 01-07-2024 - so every undated record silently came out labelled BNS, defeating the
 * fail-safe below it. Records used to arrive here from an unchecked localStorage cast; the workspace
 * migration now preserves that absence as an empty golden date so `toPresentableGoldenCase` refuses it.
 *
 * What remains invented, and why it is safe: `adjournmentsCount: 0` and `isZeroFir: false` are
 * defaults, not measurements - the legacy store has no adjournment journal kind to read (D30), so
 * "nothing recorded" is the truth, and `tools/statute_tests.mjs` pins that no input can change it.
 * A screen may render them as defaults; it may not present 0 as a count the case was checked
 * against. `status` is no longer in that list: it is derived from `lastHearingDate`, which the
 * legacy model already required and this file simply never read.
 */
export const toGoldenCase = (legacy: LegacyCase): GoldenCaseResult => {
    const incidentDate = legacy.filingDate;
    const golden: Case = {
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
    };
    return toPresentableGoldenCase(golden);
};

type JsonRecord = Record<string, unknown>;
type WorkspaceStorage = Pick<Storage, 'getItem' | 'setItem' | 'key' | 'length'>;

const recordOf = (value: unknown): JsonRecord | null =>
    typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonRecord : null;

const stringField = (record: JsonRecord, key: string): string | undefined =>
    typeof record[key] === 'string' ? record[key] as string : undefined;

const stringsField = (record: JsonRecord, goldenKey: string, legacyKey: string): string[] | null => {
    const candidate = record[goldenKey] ?? record[legacyKey];
    return Array.isArray(candidate) && candidate.every((item) => typeof item === 'string')
        ? candidate as string[]
        : null;
};

const caseStatus = (value: unknown, legacyLastHearingDate: string | undefined): CaseStatus =>
    value === 'FILED' || value === 'HEARING' || value === 'DECIDED' || value === 'DISMISSED'
        ? value
        : legacyLastHearingDate ? 'HEARING' : 'FILED';

const urgency = (value: unknown, priority: unknown): UrgencyLevel =>
    value === 'HIGH' || value === 'MEDIUM' || value === 'LOW'
        ? value
        : urgencyFor(priority === 'High' || priority === 'Medium' || priority === 'Low' ? priority : undefined);

/**
 * Convert exactly the historical workspace record shape into the persisted golden schema.
 *
 * `title`, `pii` and `userId` are intentionally not copied: they were UI chrome/a redaction map/a
 * raw email on the legacy object, never facts the shared case record may retain. `lastHearingDate`
 * does not become `nextHearingDate` — last and next are not synonyms — but it still supplies the
 * old status derivation. If no filing or incident date exists, the migration writes `incidentDate:''`
 * and the result-union boundary above refuses the case. That preserves the fact of absence rather
 * than inventing a statutory date.
 */
const migrateOneWorkspaceCase = (value: unknown): Case | null => {
    const record = recordOf(value);
    if (!record) return null;

    const id = stringField(record, 'id');
    const cnrNumber = stringField(record, 'cnrNumber') ?? stringField(record, 'caseNumber');
    const complainant = stringField(record, 'complainant') ?? stringField(record, 'petitioner');
    const respondent = stringField(record, 'respondent');
    const caseType = stringField(record, 'caseType');
    const summary = stringField(record, 'summary');
    const filingDate = stringField(record, 'filingDate') ?? '';
    const sectionsInvoked = stringsField(record, 'sectionsInvoked', 'invokedActs');
    if (!id || cnrNumber === undefined || complainant === undefined || respondent === undefined ||
        caseType === undefined || summary === undefined || sectionsInvoked === null) {
        return null;
    }

    const incidentDate = stringField(record, 'incidentDate')?.trim() || filingDate;
    const nextHearingDate = stringField(record, 'nextHearingDate');
    return {
        id,
        cnrNumber,
        complainant,
        respondent,
        caseType,
        summary,
        caseNotes: stringField(record, 'caseNotes') ?? stringField(record, 'notes') ?? '',
        filingDate,
        status: caseStatus(record.status, stringField(record, 'lastHearingDate')),
        urgency: urgency(record.urgency, record.priority),
        sectionsInvoked: [...sectionsInvoked],
        ...(nextHearingDate ? { nextHearingDate } : {}),
        adjournmentsCount: typeof record.adjournmentsCount === 'number' && Number.isFinite(record.adjournmentsCount)
            ? record.adjournmentsCount : 0,
        ...(typeof record.lawyerId === 'string' ? { lawyerId: record.lawyerId } : {}),
        ...(typeof record.judgeId === 'string' ? { judgeId: record.judgeId } : {}),
        incidentDate,
        isZeroFir: typeof record.isZeroFir === 'boolean' ? record.isZeroFir : false,
        ...(record.zeroFirTransferStatus === 'PENDING' || record.zeroFirTransferStatus === 'TRANSFERRED'
            ? { zeroFirTransferStatus: record.zeroFirTransferStatus } : {}),
        applicableLaw: applicableLawFor(incidentDate),
    };
};

/** A pure, idempotent migration used by the storage pass and pinned by the statute suite. */
export const migrateWorkspaceCases = (value: unknown): Case[] | null => {
    if (!Array.isArray(value)) return null;
    const migrated = value.map(migrateOneWorkspaceCase);
    return migrated.every((entry): entry is Case => entry !== null) ? migrated : null;
};

/**
 * Upgrade every owner-scoped workspace key before writing one global marker. The marker must be
 * global (the requested `nyaya:cases:schema` key), so migrating only the current user before
 * setting it would strand another account's legacy cache forever. Journal keys are intentionally
 * outside this prefix and are never read or written here.
 *
 * A malformed workspace payload aborts without setting the marker and without overwriting that
 * payload. A later, repaired load can retry; silently replacing a user's cache with `[]` would be
 * a data-loss migration, not a safe one. Partial write failure is also safe to retry because
 * `migrateWorkspaceCases` is idempotent for both legacy and already-golden records.
 */
export const migrateWorkspaceStorage = (storage: WorkspaceStorage): boolean => {
    if (storage.getItem(WORKSPACE_SCHEMA_KEY) === GOLDEN_WORKSPACE_SCHEMA) return true;

    const rewrites: { key: string; payload: string }[] = [];
    for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (!key || key === WORKSPACE_SCHEMA_KEY || !key.startsWith(WORKSPACE_CASES_PREFIX)) continue;
        const raw = storage.getItem(key);
        if (raw === null) continue;
        try {
            const migrated = migrateWorkspaceCases(JSON.parse(raw));
            if (!migrated) return false;
            rewrites.push({ key, payload: JSON.stringify(migrated) });
        } catch {
            return false;
        }
    }

    try {
        for (const rewrite of rewrites) storage.setItem(rewrite.key, rewrite.payload);
        storage.setItem(WORKSPACE_SCHEMA_KEY, GOLDEN_WORKSPACE_SCHEMA);
        return true;
    } catch {
        return false;
    }
};
