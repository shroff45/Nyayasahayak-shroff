// src/core/services/evidenceHasher.ts
// NyayaSahayak v2.0.0 - BSA Section 63 Compliant Evidence Hasher
// Implements SHA-256 chunked hashing for large files

import CryptoJS from 'crypto-js';

/**
 * BSA Schedule requires SHA-256 hash for evidence certification
 * This service computes hashes client-side before upload
 */

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
 * Compute SHA-256 hash of a file using chunked processing
 * Handles large files (videos, CCTV footage) without memory issues
 * 
 * @param file - The File object to hash
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<HashResult>
 */
export const computeFileHash = async (
    file: File,
    onProgress?: (progress: HashProgress) => void
): Promise<HashResult> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Use WordArray for incremental hashing
    let hashAccumulator = CryptoJS.algo.SHA256.create();
    let bytesProcessed = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Read chunk as ArrayBuffer
        const arrayBuffer = await readChunkAsArrayBuffer(chunk);

        // Convert to WordArray for CryptoJS
        const wordArray = arrayBufferToWordArray(arrayBuffer);

        // Update hash with chunk
        hashAccumulator.update(wordArray);

        bytesProcessed = end;

        // Report progress
        if (onProgress) {
            onProgress({
                bytesProcessed,
                totalBytes: file.size,
                percentComplete: Math.round((bytesProcessed / file.size) * 100)
            });
        }
    }

    // Finalize hash
    const finalHash = hashAccumulator.finalize();

    return {
        algorithm: 'SHA-256',
        hash: finalHash.toString(CryptoJS.enc.Hex).toUpperCase(),
        fileSize: file.size,
        timestamp: new Date(),
        isComplete: true
    };
};

/**
 * Read a Blob/File chunk as ArrayBuffer
 */
const readChunkAsArrayBuffer = (chunk: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(chunk);
    });
};

/**
 * Convert ArrayBuffer to CryptoJS WordArray
 */
const arrayBufferToWordArray = (arrayBuffer: ArrayBuffer): CryptoJS.lib.WordArray => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const words: number[] = [];

    for (let i = 0; i < uint8Array.length; i += 4) {
        words.push(
            (uint8Array[i] << 24) |
            (uint8Array[i + 1] << 16) |
            (uint8Array[i + 2] << 8) |
            uint8Array[i + 3]
        );
    }

    return CryptoJS.lib.WordArray.create(words, uint8Array.length);
};

/**
 * Verify a file's hash against a known hash value
 * Used for Section 63 Part B verification
 * 
 * @param file - The file to verify
 * @param knownHash - The hash to compare against
 * @returns Promise<boolean>
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
        knownHash: normalizedKnown
    };
};

/**
 * Extract EXIF/metadata from image files
 * For auto-populating device information in Section 63 certificate
 */
export const extractFileMetadata = async (file: File): Promise<{
    make?: string;
    model?: string;
    captureDate?: Date;
    gps?: { latitude: number; longitude: number };
}> => {
    // For image files, attempt EXIF extraction
    if (file.type.startsWith('image/')) {
        try {
            // Basic metadata from file
            return {
                make: 'Unknown', // EXIF extraction would go here
                model: 'Unknown',
                captureDate: new Date(file.lastModified)
            };
        } catch {
            return { captureDate: new Date(file.lastModified) };
        }
    }

    // For other files, return basic info
    return {
        captureDate: new Date(file.lastModified)
    };
};

/**
 * Generate a formatted hash for display in certificates
 * Breaks into 8-character groups for readability
 */
export const formatHashForDisplay = (hash: string): string => {
    const groups = hash.match(/.{1,8}/g) || [];
    return groups.join(' ');
};

/**
 * Create a hash verification report for audit trail
 */
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
    status: 'VERIFIED' | 'MISMATCH' | 'ERROR';
} => {
    return {
        reportId: `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        originalHash,
        verificationHash,
        isMatch,
        verifierId,
        verificationTimestamp: new Date(),
        status: isMatch ? 'VERIFIED' : 'MISMATCH'
    };
};

export default {
    computeFileHash,
    verifyFileHash,
    extractFileMetadata,
    formatHashForDisplay,
    createVerificationReport
};
