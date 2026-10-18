/**
 * sha256.ts — the only hashing primitive the trust layer uses.
 *
 * Deliberately small and deliberately native: SHA-256 via WebCrypto (`crypto.subtle`), which
 * is constant-time-ish, audited, and present in every browser this app targets and in Node 19+
 * (so the same code that ships is the code the tests run). No `crypto-js`: a pure-JS
 * implementation is slower and, more to the point, it is the library that let a "PQC" label be
 * bolted onto a SHA-256 call in the first place.
 *
 * Scope note for reviewers: SHA-256 is preimage-safe against anything these users face. It is
 * NOT post-quantum — Grover halves the preimage budget to ~128 bits, which is still fine, but we
 * claim nothing stronger than that. See `docs/TRUST_MODEL.md`.
 */

/** 32 bytes — the SHA-256 output length, asserted rather than assumed. */
export const SHA256_BYTES = 32;

const subtle: SubtleCrypto = globalThis.crypto?.subtle as SubtleCrypto;
if (!subtle) {
    throw new Error(
        'WebCrypto (crypto.subtle) is unavailable. Serve this app over https:// or localhost; ' +
        'insecure origins disable SubtleCrypto by design, and a trust layer that silently ' +
        'falls back to a JS hash would be worse than one that refuses to run.'
    );
}

export const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Accepts upper/lower case and *internal* whitespace too, because a digest copied out of a
 * PDF certificate is routinely wrapped across two lines. Rejecting it there would make the
 * judge's paste fail while the identical bytes typed by hand succeed - a confusing asymmetry
 * for the one input in this app that humans retype.
 */
export const fromHex = (hex: string): Uint8Array => {
    const clean = hex.replace(/\s+/g, '').toLowerCase();
    if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) {
        throw new Error(
            `Not a SHA-256 hex digest (got ${clean.length} hex chars after stripping whitespace; expected 64)`
        );
    }
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
};

export const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * SHA-256 of raw bytes.
 * `crypto.subtle.digest` is async; the whole trust layer is async because of this line, and
 * pretending otherwise (a sync hash with a queued write) is how the previous ledger ended up
 * keeping state that vanished on reload.
 */
export const sha256 = async (data: Uint8Array | string): Promise<Uint8Array> => {
    const bytes = typeof data === 'string' ? utf8(data) : data;
    const digest = await subtle.digest('SHA-256', bytes as unknown as BufferSource);
    return new Uint8Array(digest);
};

/** Lowercase hex digest — the form that appears on a s.63(4) certificate. */
export const sha256Hex = async (data: Uint8Array | string): Promise<string> =>
    toHex(await sha256(data));

/**
 * Digest a `File`/`Blob`, reading it slice by slice.
 *
 * What this is: bounded per-chunk allocation, a real progress signal, and yields to the event
 * loop so the tab keeps painting during a multi-hundred-megabyte seizure video.
 * What this is NOT: constant-memory streaming. WebCrypto has no incremental digest, so the
 * bytes are assembled before `digest` sees them and peak memory is O(file size) — which is
 * exactly why files above `MAX_INLINE_BYTES` are refused rather than attempted.
 */
export const MAX_INLINE_BYTES = 64 * 1024 * 1024;

const READ_CHUNK_BYTES = 4 * 1024 * 1024;

export const sha256OfFile = async (
    file: Blob,
    onProgress?: (fraction: number) => void
): Promise<string> => {
    if (file.size > MAX_INLINE_BYTES) {
        throw new Error(
            `File is ${(file.size / 1048576).toFixed(1)} MB, above the ${MAX_INLINE_BYTES / 1048576} MB ` +
            'inline limit. Take the digest from the forensic lab report instead of hashing it in a browser tab.'
        );
    }
    const bytes = new Uint8Array(file.size);
    let offset = 0;
    while (offset < file.size) {
        const end = Math.min(offset + READ_CHUNK_BYTES, file.size);
        bytes.set(new Uint8Array(await file.slice(offset, end).arrayBuffer()), offset);
        offset = end;
        onProgress?.(offset / file.size);
        // Yield so the progress bar can actually paint.
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return sha256Hex(bytes);
};
