// src/personas/judge/components/HashVerifier.tsx
// NyayaSahayak v2.0.0 - Evidence Hash Verifier for Judge Dashboard
// Implements BSA Section 63 admissibility check

import React, { useState, useCallback } from 'react';
import {
    Shield, ShieldCheck, ShieldX, Upload, Hash, CheckCircle2, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { verifyFileHash } from '../../../core/services/evidenceHasher';

interface HashVerifierProps {
    evidenceId?: string;
    expectedHash?: string;
    ledgerBlockId?: string;
}

interface VerificationResult {
    isMatch: boolean;
    computedHash: string;
    expectedHash: string;
    timestamp: Date;
    fileName: string;
    fileSize: number;
}

const HashVerifier: React.FC<HashVerifierProps> = ({
    evidenceId,
    expectedHash: initialExpectedHash,
    ledgerBlockId
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [expectedHash, setExpectedHash] = useState(initialExpectedHash || '');
    const [hashError, setHashError] = useState<string | null>(null);

    const normalizeHash = (value: string) => value.trim().toLowerCase();

    const handleVerify = useCallback(async (file: File) => {
        const expected = normalizeHash(expectedHash);
        // Without an expected digest there is nothing to compare against, so say so instead
        // of dropping the file silently.
        if (!expected) {
            setHashError(
                'Enter the expected SHA-256 digest from the Section 63 certificate (or the seizure memo) before verifying a file.'
            );
            return;
        }
        if (!/^[0-9a-f]{64}$/.test(expected)) {
            setHashError('Expected digest must be a 64-character SHA-256 hex string.');
            return;
        }
        setHashError(null);

        setIsVerifying(true);
        try {
            const verification = await verifyFileHash(file, expected);

            setResult({
                isMatch: verification.isMatch,
                computedHash: verification.computedHash,
                expectedHash: verification.knownHash,
                timestamp: new Date(),
                fileName: file.name,
                fileSize: file.size
            });
        } catch (error) {
            // Surfaced to the judge: a read failure must not look like a clean pass.
            setHashError(
                `Verification could not be completed: ${error instanceof Error ? error.message : 'unreadable file'}.`
            );
            setResult(null);
        } finally {
            setIsVerifying(false);
        }
    }, [expectedHash]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            await handleVerify(file);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleVerify(file);
        }
    };

    const resetVerification = () => {
        setResult(null);
        setExpectedHash(initialExpectedHash || '');
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold text-white">Evidence Hash Verifier</h2>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        BSA Sec 63 Compliance
                    </span>
                </div>
                {ledgerBlockId && (
                    <span className="text-xs text-slate-400 font-mono">
                        Ledger: {ledgerBlockId}
                    </span>
                )}
            </div>

            {/* Expected Hash Input (if not provided) */}
            {!result && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Expected Hash (from Section 63 Certificate)
                    </label>
                    <input
                        type="text"
                        value={expectedHash}
                        onChange={(e) => setExpectedHash(e.target.value)}
                        placeholder="Enter SHA-256 hash from certificate..."
                        className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white font-mono text-sm ${hashError ? 'border-red-500/70' : 'border-slate-600'
                            }`}
                    />
                    {hashError && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {hashError}
                        </p>
                    )}
                    {evidenceId && (
                        <p className="mt-2 text-xs text-slate-500">
                            Verifying evidence item <span className="font-mono text-slate-400">{evidenceId}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Drop Zone */}
            {!result && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                            ? 'border-purple-400 bg-purple-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                >
                    {isVerifying ? (
                        <div>
                            <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                            <p className="text-white font-medium">Computing SHA-256 hash...</p>
                            <p className="text-sm text-slate-400">Please wait while we verify the file integrity</p>
                        </div>
                    ) : (
                        <>
                            <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">
                                Drag & Drop Evidence File Here
                            </p>
                            <p className="text-sm text-slate-400 mb-4">
                                or click to select file for verification
                            </p>
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="verifyFile"
                            />
                            <label
                                htmlFor="verifyFile"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Select File
                            </label>
                        </>
                    )}
                </div>
            )}

            {/* Verification Result */}
            {result && (
                <div className={`rounded-xl p-6 ${result.isMatch
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                    {/* Result Header */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {result.isMatch ? (
                            <>
                                <ShieldCheck className="w-16 h-16 text-emerald-400" />
                                <div className="text-left">
                                    <p className="text-2xl font-bold text-emerald-400">VERIFIED</p>
                                    <p className="text-sm text-slate-400">Hash values match - Evidence is authentic</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <ShieldX className="w-16 h-16 text-red-400" />
                                <div className="text-left">
                                    <p className="text-2xl font-bold text-red-400">MISMATCH</p>
                                    <p className="text-sm text-slate-400">Potential tampering detected</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Hash Comparison */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-400">File: {result.fileName}</span>
                                <span className="text-xs text-slate-500">
                                    ({(result.fileSize / 1024 / 1024).toFixed(2)} MB)
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-4">
                                <p className="text-xs text-slate-400 mb-2">Expected Hash (Certificate)</p>
                                <p className="font-mono text-xs text-amber-400 break-all">
                                    {result.expectedHash}
                                </p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4">
                                <p className="text-xs text-slate-400 mb-2">Computed Hash (Uploaded File)</p>
                                <p className={`font-mono text-xs break-all ${result.isMatch ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {result.computedHash}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Admissibility Status */}
                    <div className={`flex items-center gap-3 p-4 rounded-lg ${result.isMatch
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                        {result.isMatch ? (
                            <>
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <p className="font-bold text-emerald-400">Admissible under BSA Section 63</p>
                                    <p className="text-xs text-slate-400">
                                        Evidence integrity verified at {result.timestamp.toLocaleString()}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                <div>
                                    <p className="font-bold text-red-400">Admissibility Risk - Require Expert Review</p>
                                    <p className="text-xs text-slate-400">
                                        Hash mismatch detected. Consider requesting original evidence.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={resetVerification}
                            className="flex-1 py-2 border border-slate-600 text-slate-400 hover:text-white rounded-lg"
                        >
                            Verify Another File
                        </button>
                        <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
                            Generate Verification Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HashVerifier;
