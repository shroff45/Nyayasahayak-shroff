/**
 * custody.ts — the chain of custody, read straight out of the ledger journal.
 *
 * This module exists because the timeline component it feeds was already well built and had no
 * data source. `src/personas/police/pages/EvidenceLocker.tsx` rendered four fixed steps
 * ("Captured / Uploaded / Hashed / Court Ready") with a progress bar whose width was chosen by an
 * `if` on a status string - a picture of custody, not a record of it. Everything here is the
 * opposite: each node is one journal record, and each node's badge is the answer
 * `ledger.verifyRecord()` gave for that specific record.
 *
 * What a node's `evidenceHash` means, deliberately: it is the *record's own leaf digest*, not the
 * digest of the exhibit file. The leaf digest is the only hash this layer can recompute and prove
 * membership of, and it commits to the file digest inside the payload - so a node whose
 * `evidenceHash` matches is a node whose embedded file digest is the one that was written at that
 * time. Storing the file digest in the display field instead would have made the badge look
 * verifiable while it was not.
 *
 * One consequence worth stating where a judge will read it: an anchor signs a *batch*. Edit one
 * record and every record under that same anchor loses its inclusion proof, so siblings show
 * MISMATCH too. That is not a false alarm — membership in a signed root is a property of the batch
 * — and it is why each node names the anchor covering it.
 */
import type { Ledger, LedgerRecord, RecordVerification } from './ledger.ts';
import type {
    CustodyChain,
    CustodyEvent,
    CustodyEventType,
    CustodianRole,
    IntegrityStatus,
} from '../../types/custody.types.ts';

export const CUSTODY_KIND = 'CUSTODY' as const;

/** Longer than this between two custody events and the chain has to explain itself. */
export const GAP_TOLERANCE_HOURS = 24;

export interface CustodyEventInput {
    caseId: string;
    evidenceId: string;
    eventType: CustodyEventType;
    description: string;
    /** ISO string; defaults to now. Accepted from a caller because a transfer is often logged late. */
    timestamp?: string;
    custodian: {
        id: string;
        name: string;
        role: CustodianRole;
        designation: string;
        badgeNumber?: string;
        stationCode?: string;
        organization?: string;
    };
    location: {
        name: string;
        address?: string;
        gpsCoordinates?: { latitude: number; longitude: number };
    };
    previousCustodianId?: string;
    receiverId?: string;
    /** Whatever the receiving officer typed/signed. Stored as evidence, never as proof of identity. */
    receiverSignature?: string;
    sealNumber?: string;
    /** The exhibit's own SHA-256, if this event re-measured it (a lab receipt usually does). */
    fileDigest?: string;
}

export interface CustodyNodeDetail {
    recordIndex: number;
    integrity: IntegrityStatus;
    reason: string;
    anchorIndex?: number;
    signerFingerprint?: string;
    /**
     * When this entry was written, as opposed to when the event it describes happened. Kept because
     * a custody log written two days later is legitimate, and a custody log *backdated* into the
     * middle of an unexplained gap is the thing a defence lawyer will ask about. Both timestamps
     * are inside the hashed payload, so neither can be quietly rewritten after the fact.
     */
    loggedAt?: string;
}

export interface CustodyChainWithProofs extends CustodyChain {
    /** Per-record verification, keyed by record index, for whoever renders badges. */
    proofs: CustodyNodeDetail[];
}

const statusFor = (verdict: RecordVerification): { integrity: IntegrityStatus; reason: string } => {
    if (!verdict.digestMatches) {
        return { integrity: 'MISMATCH', reason: verdict.reason };
    }
    if (verdict.proofValid === false) {
        return { integrity: 'MISMATCH', reason: verdict.reason };
    }
    if (!verdict.anchored) {
        return { integrity: 'PENDING', reason: verdict.reason };
    }
    if (verdict.signature && !verdict.signature.ok) {
        // A signature that does not verify at all is tampering; one that verifies but comes from
        // an unpinned key is simply not verifiable by us. Collapsing those two into one badge would
        // either accuse a clerk of forging an anchor or bless a record nobody trusts.
        const untrusted = /trust|pin/i.test(verdict.signature.reason);
        return { integrity: untrusted ? 'UNKNOWN' : 'MISMATCH', reason: verdict.signature.reason };
    }
    return { integrity: verdict.ok ? 'VERIFIED' : 'UNKNOWN', reason: verdict.reason };
};

const matchesEvidence = (record: LedgerRecord, evidenceId: string): boolean => {
    if (record.data.kind === CUSTODY_KIND) {
        return (record.data as { evidenceId?: string }).evidenceId === evidenceId;
    }
    // The exhibit record itself (written by the Evidence Locker as kind EVIDENCE or a CASE filing)
    // carries the case/exhibit id in its payload, so the timeline can start at registration rather
    // than at the first handover.
    const payload = record.data as { id?: string; caseId?: string };
    return payload?.id === evidenceId || payload?.caseId === evidenceId;
};

const toEvent = (
    record: LedgerRecord,
    integrity: IntegrityStatus,
    anchorIndex: number | undefined,
    asRegistration: boolean
): CustodyEvent => {
    // `ledger.append` stores `{ kind, ...data }` flat on the record, so the payload's own fields
    // sit directly on `record.data` next to `kind` - not nested under another `data` key.
    const payload = record.data as Partial<CustodyEventInput> & { summary?: string; fileName?: string };
    const input = record.data.kind === CUSTODY_KIND ? (payload as CustodyEventInput) : undefined;
    const eventTime = record.timestamp;

    const fallbackCustodian = {
        id: 'SYSTEM',
        name: 'Evidence Locker',
        role: 'EVIDENCE_OFFICER' as CustodianRole,
        designation: 'Automatic entry on registration',
    };

    return {
        eventId: `LEDGER-${record.index}`,
        evidenceId: input?.evidenceId ?? (record.data as { id?: string }).id ?? '',
        caseId: input?.caseId ?? (record.data as { caseId?: string }).caseId ?? '',
        eventType: asRegistration ? 'RECEIPT' : (input?.eventType ?? 'STORAGE'),
        description:
            input?.description ??
            (record.data.summary as string) ??
            (record.data.fileName as string) ??
            'Exhibit registered in the evidence locker and anchored.',
        timestamp: new Date(eventTime),
        custodian: input?.custodian ?? fallbackCustodian,
        location: input?.location ?? { name: 'Police Station' },
        previousCustodianId: input?.previousCustodianId,
        receiverId: input?.receiverId,
        receiverSignature: input?.receiverSignature,
        evidenceHash: record.leafDigest,
        hashAlgorithm: 'SHA-256',
        ledgerBlockId: anchorIndex === undefined ? undefined : String(anchorIndex),
        ledgerTransactionHash: record.leafDigest,
        integrityStatus: integrity,
        verifiedAt: integrity === 'VERIFIED' ? new Date() : undefined,
        verifiedBy: 'src/core/trust/ledger.verifyRecord',
        sealNumber: input?.sealNumber,
        signatureTimestamp: new Date(record.timestamp),
    };
};

/**
 * Reads the journal and returns the custody chain for one exhibit.
 *
 * Async by necessity: every badge comes from a real verification pass over the stored records, so
 * this is also the function a screen calls when a judge asks "is this timeline still true?" -
 * nothing here is cached, and a stale view is not possible.
 */
export const buildCustodyChain = async (
    ledger: Ledger,
    selector: { evidenceId: string; caseId?: string; description?: string }
): Promise<CustodyChainWithProofs> => {
    const records = (await ledger.records()).filter((r) => matchesEvidence(r, selector.evidenceId));
    const anchors = await ledger.anchors();

    const ordered = [...records].sort((a, b) => {
        const ta = Date.parse(a.timestamp);
        const tb = Date.parse(b.timestamp);
        return ta === tb ? a.index - b.index : ta - tb;
    });

    const events: CustodyEvent[] = [];
    const proofs: CustodyNodeDetail[] = [];

    for (const record of ordered) {
        const verdict = await ledger.verifyRecord(record.index);
        const { integrity, reason } = statusFor(verdict);
        const covering = anchors.find((a) => record.index >= a.batchStart && record.index <= a.batchEnd);
        events.push(toEvent(record, integrity, covering?.anchorIndex, events.length === 0 && record.data.kind !== CUSTODY_KIND));
        proofs.push({
            recordIndex: record.index,
            integrity,
            reason,
            anchorIndex: covering?.anchorIndex,
            signerFingerprint: verdict.signerFingerprint,
            loggedAt: (record.data as { loggedAt?: string }).loggedAt,
        });
    }

    const gaps: CustodyChain['gaps'] = [];
    for (let i = 0; i + 1 < events.length; i++) {
        const from = events[i];
        const to = events[i + 1];
        const hours = (to.timestamp.getTime() - from.timestamp.getTime()) / 3_600_000;
        if (hours > GAP_TOLERANCE_HOURS) {
            gaps.push({
                fromEvent: from.eventId,
                toEvent: to.eventId,
                gapDuration: Math.round(hours),
                isAcceptable: false,
                // The ledger records when a transfer was *written*, not when it happened, so an
                // unexplained long gap is a question for the officer rather than a finding.
                reason: 'No custody record exists for this period; the exhibit was not necessarily unattended, but nothing here says it was.',
            });
        }
    }

    const anyMismatch = events.some((e) => e.integrityStatus === 'MISMATCH');
    const anyPending = events.some((e) => e.integrityStatus === 'PENDING');
    const anyUnknown = events.some((e) => e.integrityStatus === 'UNKNOWN');
    const overall: IntegrityStatus = anyMismatch
        ? 'MISMATCH'
        : gaps.length > 0
            ? 'GAP_DETECTED'
            : anyUnknown
                ? 'UNKNOWN'
                : anyPending
                    ? 'PENDING'
                    : events.length > 0
                        ? 'VERIFIED'
                        : 'UNKNOWN';

    const last = events[events.length - 1];

    return {
        evidenceId: selector.evidenceId,
        caseId: last?.caseId ?? selector.caseId ?? '',
        evidenceDescription: selector.description ?? last?.description ?? 'Exhibit',
        // Everything this app hashes is a file, so 'DIGITAL' is what the ledger can actually speak
        // to; a physical seal's category belongs on the custody event, not on this projection.
        evidenceCategory: 'DIGITAL',
        events,
        currentCustodian: last?.custodian ?? {
            id: 'NONE',
            name: 'No custody record yet',
            role: 'EVIDENCE_OFFICER',
            designation: 'Nothing has been logged against this exhibit',
        },
        currentLocation: last?.location ?? { name: 'Unknown' },
        overallIntegrity: overall,
        chainStartHash: events[0]?.evidenceHash ?? '',
        chainCurrentHash: last?.evidenceHash ?? '',
        isChainUnbroken: !anyMismatch,
        hasTimeGaps: gaps.length > 0,
        gaps,
        ledgerVerification: {
            isVerified: events.length > 0 && proofs.every((p) => p.integrity === 'VERIFIED'),
            lastVerifiedAt: new Date(),
            blockCount: anchors.length,
            genesisBlockId: anchors[0]?.merkleRoot,
        },
        createdAt: events[0]?.timestamp ?? new Date(),
        updatedAt: last?.timestamp ?? new Date(),
        proofs,
    };
}

/**
 * Appends one custody event and anchors immediately.
 *
 * The anchor-per-event choice is deliberate: a custody transfer is the moment a dispute is born,
 * and leaving it in the unanchored tail would mean the freshest - most contested - entry is the
 * one with the weakest protection.
 */
export const appendCustodyEvent = async (
    ledger: Ledger,
    input: CustodyEventInput
): Promise<{ index: number; leafDigest: string; anchored: boolean; persisted: boolean }> => {
    if (!input.evidenceId.trim()) {
        throw new Error('A custody event needs the exhibit id it applies to; an unattributed transfer proves nothing.');
    }
    if (!input.custodian?.name?.trim()) {
        throw new Error('A custody event needs the person taking custody. "Unknown" is what an empty field turns into at trial.');
    }
    // The record's own timestamp is the event time, so the timeline orders by what happened and not
    // by when someone got round to typing it; `loggedAt` records the write, and both are hashed.
    const { timestamp: _eventTime, ...rest } = input;
    const appended = await ledger.append({
        kind: CUSTODY_KIND,
        timestamp: input.timestamp,
        data: { ...rest, loggedAt: new Date().toISOString() },
    });
    const anchor = await ledger.anchor();
    return {
        index: appended.index,
        leafDigest: appended.leafDigest,
        anchored: Boolean(anchor),
        persisted: appended.persisted,
    };
};
