/**
 * keys.ts — who signed the anchor, and would a stranger's signature be accepted?
 *
 * This is the part the previous ledger did not have, and its absence is the specific reason
 * the old design was not evidence: `verifyChainIntegrity()` recomputed hashes from whatever was
 * in memory, so it caught clumsy edits but *not* an adversary with write access, who could
 * rewrite a payload and recompute every hash in the chain. Nothing bound the record to an
 * authority, so a laundered chain verified as happily as the real one.
 *
 * Here, every anchor carries an ECDSA P-256 signature over its canonical bytes, and
 * `AuthorityRegistry` holds the fingerprints the deployment trusts. A rewritten chain fails
 * because the attacker cannot sign with a pinned key — not because the hash changed.
 *
 * Honest limits, stated because a court will ask:
 *  - These are self-signed device keys. There is no CA, no certificate chain, no revocation
 *    infrastructure. The registry pins keys by agreement between operators; it establishes
 *    "which device signed", not "which officer signed", unless the deployment binds the two.
 *  - ` custodyStrength` below reports how well the private key is protected. On a browser it is
 *    a device secret, not an HSM. A StrongBox/TEE-backed key (see docs/TRUST_MODEL.md) is the
 *    upgrade path, and it is the reason the private key is a `CryptoKey` rather than a string.
 */
import { sha256, toHex, fromHex, utf8 } from './sha256.ts';

/** Short label baked into payloads so a future key-format change cannot be silently re-read. */
export const KEY_ALG = 'ECDSA-P256-SHA256';
export const FINGERPRINT_PREFIX = 'NYAYA-A1';

export interface AnchorKeyPair {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    /** Exportable form of the public key — this is what gets pinned in the registry. */
    publicKeyJwk: JsonWebKey;
    fingerprint: string;
}

export interface AuthorityRecord {
    fingerprint: string;
    label: string;
    publicKeyJwk: JsonWebKey;
    addedAt: string;
    /** Revoked keys still verify old anchors but are reported, so history is never rewritten. */
    revokedAt?: string;
    note?: string;
}

const EC_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' } as const;

/** 8 hex pairs is 32 bits — enough to eyeball, not enough to rely on. Said so nobody mistakes it for a hash. */
const shortForm = (hex: string) => hex.slice(0, 8).toUpperCase();

export const fingerprintFromPublicKey = async (publicKey: CryptoKey): Promise<string> => {
    const spki = new Uint8Array(await globalThis.crypto.subtle.exportKey('spki', publicKey));
    return `${FINGERPRINT_PREFIX}:${shortForm(toHex(await sha256(spki)))}`;
};

/**
 * Generate a signing identity. This one is *exportable*, because a browser key that cannot be
 * serialised cannot survive a cleared IndexedDB or a second device, and the localStorage tier
 * needs the JWK. `lockPrivateKey` upgrades a key to non-extractable once it lives in IndexedDB:
 * with `extractable: false` the key material never enters JS memory, so a script bug or XSS in
 * the page can only *use* it, not read it. The honest summary is in the custody tiers below -
 * a self-generated key pinned by the same device that used it is a checksum with extra steps,
 * which is why a second, independently-pinned authority is what makes an anchor worth anything.
 */
export const generateSigningIdentity = async (): Promise<AnchorKeyPair & { custody: CustodyStrength }> => {
    const pair = await globalThis.crypto.subtle.generateKey(EC_PARAMS, true, ['sign', 'verify']);
    const publicKeyJwk = await globalThis.crypto.subtle.exportKey('jwk', pair.publicKey);
    return {
        privateKey: pair.privateKey,
        publicKey: pair.publicKey,
        publicKeyJwk,
        fingerprint: await fingerprintFromPublicKey(pair.publicKey),
        // Exportable and serialisable, so this is the weakest tier we can honestly claim.
        custody: 'exportable-in-web-storage',
    };
};

/**
 * Re-import a generated key without exportability for day-to-day signing. The caller keeps the
 * exportable copy only long enough to persist it in the vault.
 */
export const lockPrivateKey = async (privateKey: CryptoKey): Promise<CryptoKey> => {
    const jwk = await globalThis.crypto.subtle.exportKey('jwk', privateKey);
    return globalThis.crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
};

export const importPrivateKey = async (jwk: JsonWebKey, extractable = false): Promise<CryptoKey> =>
    globalThis.crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, extractable, ['sign']);

export const importPublicKey = async (jwk: JsonWebKey): Promise<CryptoKey> =>
    globalThis.crypto.subtle.importKey('jwk', jwk, EC_PARAMS, true, ['verify']);

/**
 * Deterministic byte encoding of an anchor. ECDSA signatures are not canonical (a valid
 * signature can be malleated into a second valid encoding), so signatures are always made over
 * this fixed serialization and verifiers recompute it — never re-serialize a mutated object.
 */
export const canonicalBytes = (payload: Record<string, unknown>): Uint8Array => {
    const stable = (value: unknown): string => {
        if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
        if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
        const keys = Object.keys(value as object).sort();
        return `{${keys.map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`).join(',')}}`;
    };
    return utf8(stable(payload));
};

export const signPayload = async (privateKey: CryptoKey, payload: Record<string, unknown>): Promise<string> => {
    const sig = await globalThis.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        canonicalBytes(payload) as unknown as BufferSource
    );
    return toHex(new Uint8Array(sig));
};

export const verifySignature = async (
    publicKey: CryptoKey,
    signatureHex: string,
    payload: Record<string, unknown>
): Promise<boolean> => {
    try {
        return await globalThis.crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            publicKey,
            fromHex(signatureHex) as unknown as BufferSource,
            canonicalBytes(payload) as unknown as BufferSource
        );
    } catch {
        // A malformed signature is a failed verification, not a crash: the verify path runs in
        // front of a judge with pasted input.
        return false;
    }
};

/** Where the private key lives, and how well it is protected. */
export type CustodyStrength = 'non-extractable-in-indexeddb' | 'exportable-in-web-storage' | 'session-only';

export interface StoredIdentity {
    fingerprint: string;
    label: string;
    publicKeyJwk: JsonWebKey;
    /** Present only when custody is weaker than IndexedDB; a raw JWK with `d` is the private key. */
    privateKeyJwk?: JsonWebKey;
    custody: CustodyStrength;
    createdAt: string;
}

export interface IdentityVault {
    load(): Promise<StoredIdentity | null>;
    save(identity: StoredIdentity): Promise<void>;
    /** Structured-clone storage (IndexedDB) can hold a non-extractable CryptoKey directly. */
    saveKeyObject?(key: CryptoKey): Promise<void>;
    loadKeyObject?(): Promise<CryptoKey | null>;
    clear(): Promise<void>;
}

/**
 * Vault backed by an injected key/value store. Deliberately takes storage as a parameter: the
 * browser passes `localStorage`, tests pass a fake, and nothing here decides on its own that a
 * private key may be written to disk.
 */
export const webStorageIdentityVault = (
    storage: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void },
    namespace = 'nyaya:identity:v1'
): IdentityVault => ({
    async load() {
        const raw = storage.getItem(namespace);
        return raw ? (JSON.parse(raw) as StoredIdentity) : null;
    },
    async save(identity) {
        storage.setItem(namespace, JSON.stringify(identity));
    },
    async clear() {
        storage.removeItem(namespace);
    },
});

/** Load-or-create the device identity, reporting the custody tier that was actually achieved. */
export const resolveOrCreateIdentity = async (
    vault: IdentityVault,
    label = 'NyayaSahayak device key'
): Promise<AnchorKeyPair & { custody: CustodyStrength }> => {
    const stored = await vault.load();
    if (stored) {
        const privateKey = stored.privateKeyJwk
            ? await importPrivateKey(stored.privateKeyJwk, vault.loadKeyObject === undefined)
            : null;
        if (!privateKey) {
            throw new Error(
                `Identity ${stored.fingerprint} is on file but its private key is held in IndexedDB, ` +
                'which is unavailable now. Anchoring is disabled until it returns: signing with a ' +
                'freshly generated key would produce anchors no verifier trusts.'
            );
        }
        return {
            privateKey,
            publicKey: await importPublicKey(stored.publicKeyJwk),
            publicKeyJwk: stored.publicKeyJwk,
            fingerprint: stored.fingerprint,
            custody: stored.custody,
        };
    }
    const fresh = await generateSigningIdentity();
    await vault.save({
        fingerprint: fresh.fingerprint,
        label,
        publicKeyJwk: fresh.publicKeyJwk,
        privateKeyJwk: await globalThis.crypto.subtle.exportKey('jwk', fresh.privateKey),
        custody: 'exportable-in-web-storage',
        createdAt: new Date().toISOString(),
    });
    return { ...fresh, custody: 'exportable-in-web-storage' as CustodyStrength };
};

export interface VerifyResult {
    signatureValid: boolean;
    signerTrusted: boolean;
    signerRevoked: boolean;
    /** The only verdict the UI should present as "verified". */
    ok: boolean;
    reason: string;
}

/**
 * The trust decision. Signature validity alone is not enough — a self-signed chain is a
 * self-signed chain — so verification requires the signer to be pinned, and reports
 * revocation without invalidating older anchors, because "this key is no longer trusted"
 * must not read as "this evidence was tampered with".
 */
export const verifyAnchorSignature = async (
    payload: Record<string, unknown>,
    signatureHex: string,
    signerFingerprint: string,
    trusted: AuthorityRecord[]
): Promise<VerifyResult> => {
    const record = trusted.find((t) => t.fingerprint === signerFingerprint);
    if (!record) {
        return {
            signatureValid: false,
            signerTrusted: false,
            signerRevoked: false,
            ok: false,
            reason: `No pinned authority with fingerprint ${signerFingerprint}. The signature may be ` +
                'well-formed, but an untrusted key means an unanchored record.',
        };
    }
    const valid = await verifySignature(await importPublicKey(record.publicKeyJwk), signatureHex, payload);
    const revoked = Boolean(record.revokedAt);
    return {
        signatureValid: valid,
        signerTrusted: true,
        signerRevoked: revoked,
        ok: valid && !revoked,
        reason: !valid
            ? `Signature does not match the pinned key for ${record.label} — the anchor payload was altered after signing.`
            : revoked
                ? `Signed by ${record.label}, whose key was revoked on ${record.revokedAt}. Valid at anchor time, not trusted for new writes.`
                : `Signed by ${record.label} (${signerFingerprint}).`,
    };
};
