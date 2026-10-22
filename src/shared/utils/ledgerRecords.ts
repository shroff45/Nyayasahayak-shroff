// src/shared/utils/ledgerRecords.ts
// Reading journal records — exhibits and cases — out of the Akhand Ledger, in one place.
//
// The locker writes evidence, the certificate page certifies it, the charge-sheet gate needs the
// scene video out of it, and the judge's custody timeline needs the same rows. Four readers of one
// store is exactly where a project grows four disagreeing definitions of "what this record says",
// so the parsing lives here.
//
// Two historical shapes are accepted on purpose:
//   * flat fields — what `EvidenceLocker` writes now (`{ id, fileName, sha256, ... }`);
//   * `caseNotes` holding a JSON string — what it wrote while evidence was being pushed through the
//     deprecated case-shaped `addBlock`. Exhibits filed that way still exist in journals on disk and
//     must still certify, so the fallback stays until there is no journal in the wild that needs it.

import type { LedgerRecord } from '../../core/trust/ledger.ts';

export interface LedgerExhibit {
    id: string;
    caseId?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    /** SHA-256 of the electronic record, as it was computed on the device. */
    fileDigest?: string;
    /** 'FORENSIC_SCENE_VIDEO' marks the recording BNSS s.176(3) asks for; anything else is ordinary evidence. */
    purpose?: string;
    captureTimestamp?: string;
    durationSeconds?: number;
    geo?: { latitude: number; longitude: number };
    device?: { make?: string; model?: string; osVersion?: string };
    /** Journal index of the record this exhibit was read from. */
    recordIndex: number;
    /** When that record was written. */
    loggedAt: string;
    raw: Record<string, unknown>;
}

const asRecord = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;

const num = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const isEvidenceRecord = (record: LedgerRecord): boolean =>
    asRecord(record.data).kind === 'EVIDENCE';

/** The `caseNotes`-as-JSON era, tolerated on read and never written. */
const legacyNotes = (data: Record<string, unknown>): Record<string, unknown> => {
    if (typeof data.caseNotes !== 'string') return {};
    try {
        return asRecord(JSON.parse(data.caseNotes));
    } catch {
        return {};
    }
};

const geoOf = (value: unknown): { latitude: number; longitude: number } | undefined => {
    const geo = asRecord(value);
    const latitude = num(geo.latitude);
    const longitude = num(geo.longitude);
    return latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;
};

export const readExhibit = (record: LedgerRecord): LedgerExhibit | null => {
    const data = asRecord(record.data);
    const notes = legacyNotes(data);
    const id = str(data.id) ?? str(data.evidenceId);
    if (!id) return null;
    const device = asRecord(data.device);
    return {
        id,
        caseId: str(data.caseId),
        fileName: str(data.fileName) ?? str(notes.fileName),
        fileType: str(data.fileType) ?? str(data.mimeType) ?? str(notes.fileType),
        fileSize: num(data.fileSize) ?? num(notes.fileSize),
        fileDigest: str(data.sha256) ?? str(data.hash) ?? str(notes.hash),
        purpose: str(data.purpose),
        captureTimestamp: str(data.captureTimestamp) ?? str(notes.timestamp),
        durationSeconds: num(data.duration),
        geo: geoOf(data.geo),
        device: {
            make: str(device.make),
            model: str(device.model),
            osVersion: str(device.osVersion),
        },
        recordIndex: record.index,
        loggedAt: record.timestamp,
        raw: data,
    };
};

/** Journal order, newest first: a re-filed exhibit should read as the latest word on itself. */
export const listExhibits = (records: LedgerRecord[]): LedgerExhibit[] =>
    records
        .filter(isEvidenceRecord)
        .map(readExhibit)
        .filter((exhibit): exhibit is LedgerExhibit => exhibit !== null)
        .reverse();

/**
 * The latest record for one exhibit id. Deliberately "last written wins" rather than first match:
 * the journal is append-only, so the newest record is the current statement about that exhibit.
 */
export const findExhibit = (
    records: LedgerRecord[],
    evidenceId: string
): LedgerExhibit | null => {
    const all = listExhibits(records).filter((exhibit) => exhibit.id === evidenceId);
    return all.length ? all[0] : null;
};

export const FORENSIC_SCENE_VIDEO = 'FORENSIC_SCENE_VIDEO';

export const isForensicSceneVideo = (exhibit: LedgerExhibit): boolean =>
    exhibit.purpose === FORENSIC_SCENE_VIDEO;

export const exhibitsForCase = (records: LedgerRecord[], caseId: string): LedgerExhibit[] =>
    listExhibits(records).filter((exhibit) => exhibit.caseId === caseId);

/**
 * Sections on a case are written as 'BNS 103' / 'IPC 302' / '103' depending on who filed it, and
 * the interlock matches bare numbers. Normalise here rather than at each call site.
 */
export const sectionNumbers = (sections: string[]): string[] =>
    sections
        .map((section) => section.replace(/^[^0-9]*/, '').trim())
        .filter((section) => section.length > 0);

/** What a certificate should print about where the exhibit sits in the journal. */
export const exhibitCoordinates = (
    exhibit: LedgerExhibit,
    anchorIndex?: number
): string =>
    `ledger record #${exhibit.recordIndex}` +
    (anchorIndex !== undefined ? `, anchored at #${anchorIndex}` : ', not yet anchored');

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export interface LedgerCase {
    id: string;
    cnrNumber?: string;
    complainant?: string;
    respondent?: string;
    caseType?: string;
    summary?: string;
    filingDate?: string;
    incidentDate?: string;
    sectionsInvoked: string[];
    /** Which code the conduct falls under, as recorded. Absent means "derive it or ask". */
    applicableLaw?: 'IPC' | 'BNS';
    isZeroFir?: boolean;
    status?: string;
    recordIndex: number;
    loggedAt: string;
    raw: Record<string, unknown>;
}

const isCaseRecord = (record: LedgerRecord): boolean =>
    asRecord(record.data).kind === 'CASE';

const sectionListOf = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/**
 * Cases were written in two shapes: the ledger's golden `Case` (`cnrNumber`, `sectionsInvoked`) and
 * the older intake model (`caseNumber`, `invokedActs`, `petitioner`). Both are projected at read
 * time; new writes use the golden keys.
 *
 * This fallback remains after the mutable workspace's golden-v1 migration on purpose. A journal
 * payload is covered by its leaf digest, predecessor link and sometimes an anchor signature, so
 * renaming its stored keys would correctly make historical evidence fail verification. The reader
 * is the schema-evolution boundary: it offers new screens canonical names without claiming old,
 * signed bytes were ever written that way. Do not "migrate" `nyaya:ledger:v1:records` in place.
 */
export const readCase = (record: LedgerRecord): LedgerCase | null => {
    const data = asRecord(record.data);
    const id = str(data.id);
    if (!id) return null;
    const law = str(data.applicableLaw);
    return {
        id,
        cnrNumber: str(data.cnrNumber) ?? str(data.caseNumber),
        complainant: str(data.complainant) ?? str(data.petitioner),
        respondent: str(data.respondent),
        caseType: str(data.caseType),
        summary: str(data.summary),
        filingDate: str(data.filingDate),
        incidentDate: str(data.incidentDate) ?? str(data.filingDate),
        sectionsInvoked: sectionListOf(data.sectionsInvoked).length
            ? sectionListOf(data.sectionsInvoked)
            : sectionListOf(data.invokedActs),
        applicableLaw: law === 'BNS' || law === 'IPC' ? law : undefined,
        isZeroFir: typeof data.isZeroFir === 'boolean' ? data.isZeroFir : undefined,
        status: str(data.status),
        recordIndex: record.index,
        loggedAt: record.timestamp,
        raw: data,
    };
};

/** Latest statement per case id, newest case first — the journal is append-only, so the last write wins. */
export const listCases = (records: LedgerRecord[]): LedgerCase[] => {
    const byId = new Map<string, LedgerCase>();
    for (const record of records) {
        if (!isCaseRecord(record)) continue;
        const parsed = readCase(record);
        if (parsed) byId.set(parsed.id, parsed);
    }
    return [...byId.values()].sort((a, b) => b.recordIndex - a.recordIndex);
};

export const findCase = (records: LedgerRecord[], caseId: string): LedgerCase | null =>
    listCases(records).find((kase) => kase.id === caseId || kase.cnrNumber === caseId) ?? null;

// ---------------------------------------------------------------------------
// Companion records the charge-sheet gate depends on
// A charge sheet is blocked on two things this app can actually hold: the scene recording, and a
// record that a forensic expert attended the scene. Neither arrives over a wire, so the officer
// writes them; both are ordinary journal records, which means the gate checks a signed record
// rather than a checkbox.

export interface ExpertVisitRecord {
    kind: 'FORENSIC_EXPERT_VISIT';
    caseId: string;
    ioName?: string;
    ioId?: string;
    expertName?: string;
    expertDesignation?: string;
    expertOrganization?: string;
    geo?: { latitude: number; longitude: number };
    handshakeMethod?: string;
    visitTimestamp?: string;
    recordIndex: number;
    leafDigest: string;
    loggedAt: string;
}

export interface OverrideRecord {
    kind: 'FORENSIC_OVERRIDE_REQUEST';
    caseId: string;
    requestedBy?: string;
    reason?: string;
    details?: string;
    requestedAt?: string;
    recordIndex: number;
    loggedAt: string;
}

export const readExpertVisit = (record: LedgerRecord): ExpertVisitRecord | null => {
    const data = asRecord(record.data);
    const caseId = str(data.caseId);
    if (data.companionKind !== 'FORENSIC_EXPERT_VISIT' || !caseId) return null;
    return {
        kind: 'FORENSIC_EXPERT_VISIT',
        caseId,
        ioName: str(data.ioName),
        ioId: str(data.ioId),
        expertName: str(data.expertName),
        expertDesignation: str(data.expertDesignation),
        expertOrganization: str(data.expertOrganization),
        geo: geoOf(data.geo),
        handshakeMethod: str(data.handshakeMethod),
        visitTimestamp: str(data.visitTimestamp),
        recordIndex: record.index,
        leafDigest: record.leafDigest,
        loggedAt: record.timestamp,
    };
};

export const readOverrideRequest = (record: LedgerRecord): OverrideRecord | null => {
    const data = asRecord(record.data);
    const caseId = str(data.caseId);
    if (data.companionKind !== 'FORENSIC_OVERRIDE_REQUEST' || !caseId) return null;
    return {
        kind: 'FORENSIC_OVERRIDE_REQUEST',
        caseId,
        requestedBy: str(data.requestedBy),
        reason: str(data.reason),
        details: str(data.details),
        requestedAt: str(data.requestedAt),
        recordIndex: record.index,
        loggedAt: record.timestamp,
    };
};

/** The newest expert-visit record for a case. Newest, because the journal only ever gains entries. */
export const latestExpertVisit = (records: LedgerRecord[], caseId: string): ExpertVisitRecord | null => {
    const found = records
        .map(readExpertVisit)
        .filter((entry): entry is ExpertVisitRecord => entry !== null && entry.caseId === caseId);
    return found.length ? found[found.length - 1] : null;
};

/** The newest override request for a case, if the officer filed one. */
export const latestOverrideRequest = (records: LedgerRecord[], caseId: string): OverrideRecord | null => {
    const found = records
        .map(readOverrideRequest)
        .filter((entry): entry is OverrideRecord => entry !== null && entry.caseId === caseId);
    return found.length ? found[found.length - 1] : null;
};
