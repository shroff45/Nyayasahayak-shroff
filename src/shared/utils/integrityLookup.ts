/**
 * The lookup behind the document integrity check.
 *
 * Question it answers: this device just computed a SHA-256 over some bytes — does this device's
 * journal contain a record that stores that same digest, and is that record covered by an anchor?
 *
 * Question it does NOT answer: whether the document is genuine, whether it was altered after it
 * was logged, or who logged it. A digest comparison is an equality test between two hash values.
 * `docs/TRUST_MODEL.md` §1 is the wording this module exists to enforce; the labels below are the
 * complete set of answers the product is allowed to give, which is why they live here and not in
 * a component - two screens used to render two versions of this and drifted apart.
 */
import type { LedgerRecord } from '../../core/trust/ledger.ts';
import { listExhibits, type LedgerExhibit } from './ledgerRecords.ts';

/** The three answers. There is no fourth: "the journal does not know" is not a finding. */
export type IntegrityState = 'FOUND_ANCHORED' | 'FOUND_UNANCHORED' | 'NOT_IN_JOURNAL';

export interface IntegrityVerdict {
    state: IntegrityState;
    /** The contract wording, verbatim. */
    label: string;
    /** Why the label is true, in the plainest terms available. */
    detail: string;
    /** The journal exhibit that matched, when one did. */
    exhibit: LedgerExhibit | null;
}

const SHA256_HEX = /^[0-9a-f]{64}$/;

/** Digests are stored lowercase; a pasted value may not be. Nothing else is accepted. */
const normalise = (digest: string): string => digest.trim().toLowerCase();

export const isSha256Hex = (candidate: string): boolean => SHA256_HEX.test(normalise(candidate));

/**
 * The newest exhibit record on this device whose stored `fileDigest` equals `digest`, else null.
 *
 * "Newest wins" matches `findExhibit()` in `ledgerRecords.ts`: the journal is append-only, so the
 * last record written about a digest is the current statement about it. A digest that appears in
 * several records is reported once, with the record index, so the older ones stay findable.
 */
export const findByDigest = (records: LedgerRecord[], digest: string): LedgerExhibit | null => {
    const wanted = normalise(digest);
    if (!SHA256_HEX.test(wanted)) return null;
    const matches = listExhibits(records).filter(
        (exhibit) => typeof exhibit.fileDigest === 'string' && SHA256_HEX.test(exhibit.fileDigest.trim().toLowerCase())
            && exhibit.fileDigest.trim().toLowerCase() === wanted
    );
    return matches.length ? matches[0] : null;
};

/**
 * Turns a lookup into the fixed wording.
 *
 * `anchored` must come from the ledger - `getProof(recordIndex) !== null` - and never from a field
 * on the record itself. An exhibit that claims to be anchored while the anchor log holds no anchor
 * covering it is exactly the inconsistency a verifier is here to catch, so trusting the claim
 * would defeat the check.
 */
export const integrityVerdict = (
    exhibit: LedgerExhibit | null,
    anchored: boolean,
    journalHasNoRecords: boolean = false
): IntegrityVerdict => {
    if (exhibit && anchored) {
        return {
            state: 'FOUND_ANCHORED',
            label: `FOUND (anchored at index ${exhibit.recordIndex})`,
            detail:
                `Record ${exhibit.recordIndex} of this device's journal stores this digest, and a signed anchor covers it. ` +
                'The anchor dates the digest; it does not identify who wrote the record.',
            exhibit,
        };
    }
    if (exhibit) {
        return {
            state: 'FOUND_UNANCHORED',
            label: 'FOUND (not yet anchored)',
            detail:
                `Record ${exhibit.recordIndex} of this device's journal stores this digest, but no anchor covers it yet, ` +
                'so nothing outside this device can check it. Anchoring the journal issues a certificate.',
            exhibit,
        };
    }
    return {
        state: 'NOT_IN_JOURNAL',
        label: 'NOT IN JOURNAL',
        detail:
            `No record on this device stores this digest${journalHasNoRecords ? ' - this journal holds no records yet' : ''}. ` +
            'A missing record is not a finding about the file: an exhibit logged on another device, or before this ' +
            'journal began, reads exactly the same.',
        exhibit: null,
    };
};

/** Said once, shown everywhere the check appears. */
export const INTEGRITY_FOOTNOTE =
    'This compares two hash values. It cannot tell you who produced the document, whether it was '
    + 'changed after it was logged, or whether the log itself is correct.';
