/**
 * src/core/trust — the trust layer.
 *
 * One place where it is decided what "this evidence is intact and somebody accountable signed
 * it" means, so that no screen can quietly invent its own hashing or anchoring rule. The app's
 * existing pages keep importing `src/services/akhandLedger`, which is a thin façade over this.
 *
 *  - sha256.ts  native WebCrypto SHA-256, hex handling, bounded file hashing
 *  - merkle.ts  real Merkle tree + offline-verifiable inclusion proofs
 *  - store.ts   append-only journal: localStorage, IndexedDB, memory fallback
 *  - keys.ts    ECDSA P-256 anchors, canonical encoding, pinned-authority trust decisions
 *  - ledger.ts  the journal + anchors + verification, and portable certificates
 *  - bail.ts    conditional bail escrow recorded as ledger events
 *
 * Read docs/TRUST_MODEL.md before describing any of this as court-admissible, tamper-proof or
 * post-quantum. It states what each mechanism does and does not buy.
 */
export { sha256, sha256Hex, sha256OfFile, toHex, fromHex, MAX_INLINE_BYTES, SHA256_BYTES } from './sha256.ts';
export {
    buildMerkleTree,
    createInclusionProof,
    merkleRoot,
    verifyInclusionProof,
    EMPTY_ROOT,
} from './merkle.ts';
export type { MerkleInclusionProof, MerkleProofStep, MerkleTree } from './merkle.ts';
export {
    defaultDriver,
    indexedDbDriver,
    localStorageDriver,
    memoryDriver,
    JOURNAL_VERSION,
} from './store.ts';
export type { JournalDriver, JournalMeta, LedgerRecord, WebStorage } from './store.ts';
export {
    anchorSignablePayload,
    createLedger,
    leafDigestFor,
    verifyCertificate,
} from './ledger.ts';
export type {
    AnchorPayload,
    AnchorRecord,
    AppendInput,
    ChainVerification,
    EntryKind,
    Ledger,
    LedgerConfig,
    RecordVerification,
} from './ledger.ts';
export {
    KEY_ALG,
    canonicalBytes,
    fingerprintFromPublicKey,
    generateSigningIdentity,
    importPrivateKey,
    importPublicKey,
    lockPrivateKey,
    resolveOrCreateIdentity,
    signPayload,
    verifyAnchorSignature,
    verifySignature,
    webStorageIdentityVault,
} from './keys.ts';
export type { AnchorKeyPair, AuthorityRecord, CustodyStrength, IdentityVault, StoredIdentity } from './keys.ts';
export { createBailLedger } from './bail.ts';
export type { BailContract, BailLedger, BailStatus } from './bail.ts';
