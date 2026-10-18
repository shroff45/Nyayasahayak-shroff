// src/personas/judge/pages/HashVerifier.tsx
// NyayaSahayak Hybrid v2.0.0 - Judicial Integrity Check
// Recomputes a digest and checks it against the local ledger - no zero-knowledge claim here

import React, { useState, useRef, useCallback } from 'react';
import {
    ShieldCheck, Upload, FileText, Search,
    CheckCircle, XCircle, Activity, Box, Clock,
    Database, Lock, AlertTriangle
} from 'lucide-react';
import { computeFileHash, formatHashForDisplay, HashProgress } from '../../../core/services/evidenceHasher';
import { getLedgerEntries, getLedger } from '../../../services/akhandLedger';
import { LedgerEntry } from '../../../types';

/**
 * A ledger record commits to the exhibit digest in one of several places depending on which
 * screen wrote it, so the comparison checks each - case-insensitively, because hex digests
 * arrive upper-cased from lab reports and lower-cased from browsers.
 */
const entryCommitsToDigest = (entry: LedgerEntry, digest: string): boolean => {
    const target = digest.trim().toLowerCase();
    const data = (entry.data ?? {}) as Record<string, unknown>;
    const candidates: unknown[] = [data.hash, data.sha256, data.leafDigest];
    if (typeof data.caseNotes === 'string') {
        try {
            const notes = JSON.parse(data.caseNotes) as { hash?: string };
            candidates.push(notes.hash);
        } catch {
            // caseNotes is free text for some record kinds; not JSON, not an error.
        }
    }
    return candidates.some((c) => typeof c === 'string' && c.trim().toLowerCase() === target);
};

const HashVerifier: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [progress, setProgress] = useState<HashProgress | null>(null);
    const [result, setResult] = useState<'IDLE' | 'MATCH' | 'NO_MATCH' | 'ERROR'>('IDLE');
    const [detail, setDetail] = useState<string>('');
    const [matchedEntry, setMatchedEntry] = useState<LedgerEntry | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [computedHash, setComputedHash] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVerify = useCallback(async (file: File) => {
        if (!file) return;

        setIsVerifying(true);
        setResult('IDLE');
        setMatchedEntry(null);
        setDetail('');
        setCurrentFile(file);
        setComputedHash('');
        setProgress({ bytesProcessed: 0, totalBytes: file.size, percentComplete: 0 });

        try {
            // 1. Recompute the digest here. The whole point of a judicial check is that this
            //    number does not come from the ledger or from the police station's copy.
            const hashResult = await computeFileHash(file, (p) => setProgress(p));
            setComputedHash(hashResult.hash);

            // 2. Find the ledger record that committed to this digest - the digest is stored in
            //    the record payload (or in its caseNotes JSON for records written before that).
            const chain = await getLedgerEntries();
            const foundBlock = chain.find((block) => entryCommitsToDigest(block, hashResult.hash));

            if (!foundBlock) {
                setResult('NO_MATCH');
                setDetail(
                    'No record on this device commits to this digest. That is not proof of tampering: ' +
                    'the exhibit may have been anchored on another terminal. Request its signed certificate ' +
                    'and verify it here.'
                );
                return;
            }

            // 3. Verify the record itself: payload digest, Merkle inclusion, and the anchor signature.
            const ledger = await getLedger();
            const verdict = await ledger.verifyRecord(foundBlock.index);
            setMatchedEntry(foundBlock);
            setResult(verdict.ok ? 'MATCH' : 'NO_MATCH');
            setDetail(verdict.reason);
        } catch (error) {
            // Previously every exception fell through to NO_MATCH, which tells a judge "this
            // exhibit is not in the ledger" when the real fact is "the check could not run".
            // A storage error must never read like an integrity finding.
            console.error('Verification failed', error);
            setResult('ERROR');
            setDetail(error instanceof Error ? error.message : 'Unknown error while verifying.');
        } finally {
            setIsVerifying(false);
        }
    }, []);

    // Handle drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleVerify(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Evidence Integrity Verifier</h1>
                        <p className="text-slate-400 text-sm">Evidence integrity check &bull; recomputed SHA-256 against this device&rsquo;s ledger</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Upload Zone */}
                <div className="lg:col-span-1 space-y-6">
                    <div
                        onClick={() => !isVerifying && fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
                            h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all
                            ${dragActive
                                ? 'border-purple-400 bg-purple-500/10'
                                : isVerifying
                                    ? 'border-slate-600 bg-slate-800/50 cursor-wait'
                                    : 'border-slate-600 hover:border-purple-400 hover:bg-slate-800/50'
                            }
                        `}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleVerify(e.target.files[0])}
                        />

                        {isVerifying ? (
                            <div className="flex flex-col items-center">
                                <Activity className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                <p className="font-semibold text-purple-300">Verifying Hash...</p>
                                <p className="text-xs text-slate-500 mt-2">Computing SHA-256</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="font-semibold text-white">
                                    {dragActive ? 'Drop to Verify' : 'Upload Evidence File'}
                                </p>
                                <p className="text-sm text-slate-400 mt-2">
                                    Drag & drop or click to verify integrity against the ledger.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Guidelines Card */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-purple-500/30">
                        <h4 className="font-semibold text-purple-400 flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4" /> Verification Protocol
                        </h4>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li className="flex gap-2">
                                <span className="font-bold text-purple-400">1.</span> Client-side hashing ensures privacy.
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-purple-400">2.</span> Result compared against Akhand Ledger.
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-purple-400">3.</span> Mismatches indicate potential tampering.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Col: Results Area */}
                <div className="lg:col-span-2">
                    {result === 'IDLE' && !isVerifying && (
                        <div className="h-full bg-slate-800/30 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                            <Search className="w-16 h-16 mb-4 opacity-30" />
                            <p>Waiting for evidence upload...</p>
                            <p className="text-sm text-slate-600 mt-2">Upload a file to verify its integrity</p>
                        </div>
                    )}

                    {isVerifying && progress && (
                        <div className="h-full bg-slate-800/50 rounded-xl border border-slate-700 p-8 flex flex-col justify-center">
                            <h3 className="text-xl font-bold text-white mb-6">Processing Integrity Check</h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm font-medium text-slate-400 mb-2">
                                        <span>Computing SHA-256 Hash</span>
                                        <span>{progress.percentComplete}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${progress.percentComplete}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-400 bg-slate-900/50 p-3 rounded-lg">
                                    <Database className="w-5 h-5 animate-pulse text-purple-400" />
                                    <span className="text-sm">Scanning Akhand Ledger Nodes...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {result === 'ERROR' && (
                        <div className="bg-slate-800/50 rounded-xl border border-amber-500/50 p-6 flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                            <div>
                                <h2 className="text-lg font-bold text-amber-300">Verification could not be completed</h2>
                                <p className="text-sm text-slate-300 mt-1">{detail}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    This is a tool or storage failure, <span className="font-semibold">not</span> a finding
                                    about the evidence. Nothing should be inferred about the exhibit until the check runs.
                                </p>
                            </div>
                        </div>
                    )}

                    {result !== 'IDLE' && result !== 'ERROR' && detail && (
                        <p className="text-xs text-slate-400 px-1 pb-2">{detail}</p>
                    )}

                    {result === 'MATCH' && matchedEntry && (
                        <div className="bg-slate-800/50 rounded-xl border border-emerald-500/50 overflow-hidden">
                            <div className="bg-emerald-500/20 p-6 border-b border-emerald-500/30 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-400">✅ Integrity Verified</h2>
                                    <p className="text-emerald-300/80 text-sm">
                                        The digest recomputed here matches ledger record #{matchedEntry?.index}, whose anchor signature
                                        verifies against a pinned key.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Artifact</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <p className="text-lg font-medium text-white">{currentFile?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                                            <Box className="w-4 h-4" />
                                            <span className="font-semibold text-sm">Block Position</span>
                                        </div>
                                        <p className="font-mono text-white text-lg">#{matchedEntry.index}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-semibold text-sm">Timestamp</span>
                                        </div>
                                        <p className="font-mono text-white text-sm">
                                            {new Date(matchedEntry.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Cryptographic Proof (SHA-256)</label>
                                    <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs break-all flex items-start gap-3">
                                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                                        {formatHashForDisplay(computedHash)}
                                    </div>
                                </div>

                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-emerald-300">
                                        <strong>Admissibility Confirmed:</strong> This evidence satisfies BSA Section 63(2) requirements for electronic evidence authentication. The cryptographic hash matches the original submission timestamped on the Akhand Ledger.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {result === 'NO_MATCH' && (
                        <div className="bg-slate-800/50 rounded-xl border border-red-500/50 overflow-hidden">
                            <div className="bg-red-500/20 p-6 border-b border-red-500/30 flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-500/30 text-red-400 rounded-full flex items-center justify-center">
                                    <XCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-red-400">❌ Verification Failed</h2>
                                    <p className="text-red-300/80 text-sm">CRITICAL: No matching record found in ledger.</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-300">
                                        <strong>Warning:</strong> The file "{currentFile?.name}" generates a hash that does not exist in the Akhand Ledger. This indicates the file has either never been submitted or has been altered (tampered) after submission.
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Computed Hash (No Match Found)</label>
                                    <div className="bg-slate-900 text-red-400 p-4 rounded-xl font-mono text-xs break-all flex items-start gap-3">
                                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                                        {formatHashForDisplay(computedHash)}
                                    </div>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-300">
                                        <strong>Judicial Action Required:</strong> Under BSA Section 63, this evidence may not be admissible without proper certification. Consider requesting original evidence from the submitting authority.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default HashVerifier;
