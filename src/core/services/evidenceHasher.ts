// src/core/services/evidenceHasher.ts
// BSA s.63 evidence hashing: SHA-256 over the bytes the officer is holding.

/**
 * This module used to run its own incremental SHA-256 through `crypto-js`. The implementation was
 * honest - `CryptoJS.algo.SHA256.create()` with one `update()` per 5 MB slice is real streaming
 * hashing - but it left two SHA-256 code paths in one app: the officer hashed with crypto-js while
 * the ledger verified with WebCrypto, and any difference between the two (encoding, chunk framing,
 * a future bug fix on one side only) would have read as tampering on the other. Both now call the
 * same function in `src/core/trust/sha256.ts`, which is native `crypto.subtle` rather than a JS
 * implementation, so a 200 MB CCTV clip takes seconds instead of minutes on a district-court laptop.
 *
 * `src/core/auth/AuthContext.tsx` still imports crypto-js for its session HMAC. That is deliberate
 * and not oversight: converting it to WebCrypto HMAC makes the auth context async, which ripples
 * into every consumer, and its key is a constant in the bundle either way - it deters someone
 * editing their own localStorage, nothing more. Deserves its own block, not a side trip.
 */
import { sha256OfFile } from '../trust/sha256.ts';

export interface HashResult {
    algorithm: 'SHA-256';
    hash: string;
    fileSize: number;
    timestamp: Date;
    isComplete: boolean;
}

export interface HashProgress {
    bytesProcessed: number;
    totalBytes: number;
    percentComplete: number;
}

/**
 * Compute the SHA-256 digest of a file, reporting progress as it goes.
 *
 * `sha256OfFile` reads in 4 MB slices, so a large upload never blocks the main thread long enough
 * to lose the progress bar, and it refuses anything above its inline limit rather than quietly
 * consuming a gigabyte: the honest failure for a 2 GB seizure video is "take the digest from the
 * forensic lab report", not a crashed tab.
 */
export const computeFileHash = async (
    file: File,
    onProgress?: (progress: HashProgress) => void
): Promise<HashResult> => {
    // Upper-cased because that is how forensic reports print digests and how the Section 63
    // certificate renders them. The ledger stores exactly what this returns, so the value an
    // officer committed to and the value a judge recomputes are produced by one code path.
    const hash = (
        await sha256OfFile(file, (fraction) => {
            onProgress?.({
                bytesProcessed: Math.round(file.size * fraction),
                totalBytes: file.size,
                percentComplete: Math.round(fraction * 100),
            });
        })
    ).toUpperCase();

    return {
        algorithm: 'SHA-256',
        hash,
        fileSize: file.size,
        timestamp: new Date(),
        isComplete: true,
    };
};

/**
 * Verify a file's hash against a known digest - the Section 63 Part B comparison.
 *
 * Case- and whitespace-insensitive on purpose: digests are copied out of PDF lab reports, where
 * they wrap across lines, and a verification that fails on a space is a verification that gets
 * worked around by people under time pressure.
 */
export const verifyFileHash = async (
    file: File,
    knownHash: string
): Promise<{ isMatch: boolean; computedHash: string; knownHash: string }> => {
    const result = await computeFileHash(file);
    const normalizedKnown = knownHash.toUpperCase().replace(/\s/g, '');
    const normalizedComputed = result.hash.toUpperCase();

    return {
        isMatch: normalizedKnown === normalizedComputed,
        computedHash: normalizedComputed,
        knownHash: normalizedKnown,
    };
};

/**
 * File-system metadata for the certificate's device description.
 *
 * This is NOT EXIF parsing. It reports name, size, MIME type and the OS modification time, and
 * nothing else: reading make/model/GPS from a JPEG means parsing its APP1 segment, and that does
 * not exist in this codebase. Before a s.63(2)(a) certificate can name "the device used", either
 * that parser gets written or the officer types the description - pretending otherwise puts an
 * 'Unknown' placeholder in front of a judge.
 */
export const extractFileMetadata = async (file: File): Promise<{
    fileName: string;
    fileSize: number;
    mimeType: string;
    captureDate: Date;
}> => ({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    captureDate: new Date(file.lastModified),
});

/**
 * Break a digest into 8-character groups so a person can read it aloud or compare two of them
 * without a hex editor. Display only - nothing hashes or verifies against this form.
 */
export const formatHashForDisplay = (hash: string): string => {
    const groups = hash.match(/.{1,8}/g) || [];
    return groups.join(' ');
};

/** Audit-trail record of one comparison, for whoever asks how the exhibit was checked. */
export const createVerificationReport = (
    originalHash: string,
    verificationHash: string,
    isMatch: boolean,
    verifierId: string
): {
    reportId: string;
    originalHash: string;
    verificationHash: string;
    isMatch: boolean;
    verifierId: string;
    verificationTimestamp: Date;
    status: 'VERIFIED' | 'MISMATCH';
} => {
    return {
        // Random component included because two officers can verify the same exhibit in the same
        // millisecond; a timestamp-only id would collide and then overwrite an audit entry.
        reportId: `VR-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        originalHash,
        verificationHash,
        isMatch,
        verifierId,
        verificationTimestamp: new Date(),
        // 'ERROR' was in the union but no path could produce it: a failed read threw out of
        // computeFileHash and the caller's catch decided what the user saw. Two states that match
        // what this function can actually conclude.
        status: isMatch ? 'VERIFIED' : 'MISMATCH',
    };
};

export default {
    computeFileHash,
    verifyFileHash,
    extractFileMetadata,
    formatHashForDisplay,
    createVerificationReport,
};
