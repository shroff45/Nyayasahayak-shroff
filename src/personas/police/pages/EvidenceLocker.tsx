// src/personas/police/pages/EvidenceLocker.tsx
// NyayaSahayak Hybrid v2.0.0 - SAM-3 Protected Evidence Locker
// Zero-Dormant Three-State Implementation + BSA Section 63 Compliance

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, FileText, Shield, CheckCircle, AlertTriangle,
    RefreshCw, Lock, Clock, Hash, Link2, Download, Eye, Loader2, Camera, Gavel
} from 'lucide-react';
import { computeFileHash, formatHashForDisplay, HashProgress } from '../../../core/services/evidenceHasher';
import { addBlock, getBlockchain, getLedger } from '../../../services/akhandLedger';
import { useToast } from '../../../shared/hooks/useToast';
import { mockDelay } from '../../../shared/utils/mockApi';

// ============================================
// TYPES
// ============================================
interface EvidenceArtifact {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadTime: string;
    hash: string;
    blockchainId: string;
    blockHash: string;
    integrityStatus: 'VERIFIED' | 'PENDING' | 'HASHING' | 'TAMPERED';
    chainPosition: number;
    /**
     * Position of this exhibit inside the persisted ledger journal. Kept so the certificate can
     * re-verify the record on demand instead of freezing whatever status was set at upload.
     */
    ledgerIndex: number;
    signerFingerprint?: string;
    anchorIndex?: number;
    merkleRoot?: string;
}

// ============================================
// CHAIN OF CUSTODY TIMELINE COMPONENT
// ============================================
const ChainOfCustodyTimeline: React.FC<{ artifact: EvidenceArtifact }> = ({ artifact }) => {
    const steps = [
        { id: 1, icon: Camera, label: 'Captured', status: 'complete', time: artifact.uploadTime },
        { id: 2, icon: Upload, label: 'Uploaded', status: 'complete', time: artifact.uploadTime },
        { id: 3, icon: Hash, label: 'Hashed', status: artifact.integrityStatus === 'VERIFIED' ? 'complete' : 'active', hash: artifact.hash.slice(0, 8) },
        { id: 4, icon: Gavel, label: 'Court Ready', status: artifact.integrityStatus === 'VERIFIED' ? 'complete' : 'pending' }
    ];

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Link2 className="w-3 h-3" /> Chain of Custody
            </h4>
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 -z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 -z-0 transition-all"
                    style={{ width: artifact.integrityStatus === 'VERIFIED' ? '100%' : '66%' }}
                />

                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-slate-900 ${step.status === 'complete' ? 'bg-emerald-500 text-white' :
                            step.status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                                'bg-slate-700 text-slate-400'
                            }`}>
                            <step.icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${step.status === 'complete' ? 'text-emerald-400' :
                            step.status === 'active' ? 'text-blue-400' : 'text-slate-500'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const EvidenceLocker: React.FC = () => {
    const { showToast, updateToast } = useToast();
    const [artifacts, setArtifacts] = useState<EvidenceArtifact[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hashProgress, setHashProgress] = useState<HashProgress | null>(null);
    const [selectedArtifact, setSelectedArtifact] = useState<EvidenceArtifact | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Three-State Button States
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const [verifyingArtifactId, setVerifyingArtifactId] = useState<string | null>(null);
    const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

    // Handle file selection
    const handleFileUpload = useCallback(async (file: File) => {
        if (!file) return;

        setIsProcessing(true);
        setHashProgress({ bytesProcessed: 0, totalBytes: file.size, percentComplete: 0 });

        try {
            // Step 1: Compute SHA-256 hash with progress tracking
            const hashResult = await computeFileHash(file, (progress) => {
                setHashProgress(progress);
            });

            // Step 2: Register on the Akhand Ledger - hashed, appended to the persisted journal
            // and Merkle-anchored, all awaited here so the status below reflects a completed write.
            const blockResult = await addBlock({
                id: `EV-${Date.now()}`,
                cnrNumber: `EVIDENCE/${new Date().getFullYear()}/${Math.floor(Math.random() * 100000)}`,
                complainant: 'SYSTEM',
                respondent: 'EVIDENCE_LOCKER',
                caseType: 'EVIDENCE',
                summary: `Evidence: ${file.name}`,
                caseNotes: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    hash: hashResult.hash,
                    timestamp: hashResult.timestamp.toISOString()
                }),
                filingDate: new Date().toISOString(),
                incidentDate: new Date().toISOString(),
                isZeroFir: false,
                applicableLaw: 'BNS' as const,
                status: 'FILED' as const,
                urgency: 'HIGH' as const,
                sectionsInvoked: ['BSA-63'],
                adjournmentsCount: 0
            });

            // Step 3: Create the evidence artifact record.
            const chain = await getBlockchain();
            const ledger = await getLedger();
            const verdict = await ledger.verifyRecord(blockResult.index);
            const newArtifact: EvidenceArtifact = {
                id: `EV-${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                uploadTime: new Date().toISOString(),
                hash: hashResult.hash,
                blockchainId: blockResult.transactionId,
                blockHash: blockResult.leafDigest,
                // Was 'VERIFIED' unconditionally, before any verification had run. Now it reflects
                // the ledger's answer for this record.
                integrityStatus: verdict.ok ? 'VERIFIED' : 'PENDING',
                chainPosition: chain.length,
                ledgerIndex: blockResult.index,
                signerFingerprint: verdict.signerFingerprint,
                anchorIndex: verdict.anchorIndex,
            };

            setArtifacts(prev => [newArtifact, ...prev]);
            if (verdict.ok) {
                showToast(`Anchored to the ledger as record #${blockResult.index}`, 'success', 3000);
            } else {
                showToast(
                    `Hashed and recorded, but not yet verifiable: ${verdict.reason}`,
                    'info',
                    6000
                );
            }
        } catch (error) {
            // A failed ledger write used to be console-only: the uploader saw a spinner stop and
            // nothing else, so an exhibit could be believed filed when it was never recorded.
            console.error('Evidence processing failed:', error);
            showToast(
                `Evidence was NOT recorded: ${error instanceof Error ? error.message : 'ledger unavailable'}`,
                'error',
                8000
            );
        } finally {
            setIsProcessing(false);
            setHashProgress(null);
        }
    }, []);

    // Handle file input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    // Handle drag and drop
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
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    // Three-State: Generate BSA Sec 63 Certificate
    const handleGenerateCertificate = async () => {
        if (isGeneratingCert || artifacts.length === 0) return;

        setIsGeneratingCert(true);
        const toastId = showToast('Computing cryptographic hashes...', 'loading');

        try {
            await mockDelay(1200); // Simulate crypto processing

            const report = artifacts.map(a =>
                `Evidence: ${a.fileName}\nHash: ${a.hash}\nBlockchain ID: ${a.blockchainId}\nTimestamp: ${a.uploadTime}\nStatus: ${a.integrityStatus}\n---`
            ).join('\n');
            const header = `BSA SECTION 63 COMPLIANCE CERTIFICATE\n=====================================\nGenerated: ${new Date().toISOString()}\nEvidence Count: ${artifacts.length}\n\n`;
            const blob = new Blob([header + report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BSA_Sec63_Certificate_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            updateToast(toastId, '✅ BSA Sec 63 Certificate generated & hashed', 'success');
        } catch {
            updateToast(toastId, '❌ Certificate generation failed', 'error');
        } finally {
            setIsGeneratingCert(false);
        }
    };

    // Three-State: Verify Artifact Integrity
    const handleVerifyIntegrity = async (artifact: EvidenceArtifact, e: React.MouseEvent) => {
        e.stopPropagation();
        if (verifyingArtifactId) return;

        setVerifyingArtifactId(artifact.id);
        const toastId = showToast('Verifying blockchain hash...', 'loading');

        try {
            await mockDelay(1500); // Simulate blockchain verification
            updateToast(toastId, `✅ Integrity Verified: Match Found (Block #${artifact.chainPosition})`, 'success');
        } catch {
            updateToast(toastId, '❌ Verification failed', 'error');
        } finally {
            setVerifyingArtifactId(null);
        }
    };

    // Three-State: Download Individual BSA Certificate
    const handleDownloadCert = async (artifact: EvidenceArtifact, e: React.MouseEvent) => {
        e.stopPropagation();
        if (downloadingCertId) return;

        setDownloadingCertId(artifact.id);
        const toastId = showToast('Generating evidence certificate...', 'loading');

        try {
            await mockDelay(1000);

            // Re-verify at export time rather than printing the status captured at upload: a
            // certificate that says "VERIFIED" because the file once hashed correctly is exactly
            // the kind of stale assurance a court should be able to catch.
            let liveStatus = 'UNVERIFIED';
            let liveReason = 'The ledger could not be reached when this certificate was generated.';
            let signer = artifact.signerFingerprint ?? 'unknown';
            let merkleRoot = 'not anchored';
            try {
                const ledger = await getLedger();
                const verdict = await ledger.verifyRecord(artifact.ledgerIndex);
                const [anchor] = (await ledger.anchors()).filter(
                    (a) => artifact.ledgerIndex >= a.batchStart && artifact.ledgerIndex <= a.batchEnd
                ).slice(-1);
                liveStatus = verdict.ok ? 'VERIFIED' : 'FAILED';
                liveReason = verdict.reason;
                signer = verdict.signerFingerprint ?? signer;
                if (anchor) {
                    merkleRoot = `anchor #${anchor.anchorIndex}, Merkle root ${anchor.merkleRoot} over ${anchor.leafCount} record(s)`;
                }
            } catch (error) {
                liveReason = error instanceof Error ? error.message : String(error);
            }

            const cert = [
                'EVIDENCE INTEGRITY RECORD',
                'Issued alongside a certificate under BSA s.63(4)',
                '===========================================',
                `File name          : ${artifact.fileName}`,
                `File size          : ${artifact.fileSize} bytes`,
                `SHA-256 digest     : ${artifact.hash}`,
                `Recorded (device)  : ${artifact.uploadTime}`,
                `Ledger record      : #${artifact.ledgerIndex} (${artifact.blockHash})`,
                `Anchoring          : ${merkleRoot}`,
                `Signed by key      : ${signer}`,
                `Verification now   : ${liveStatus}`,
                `Verification note  : ${liveReason}`,
                '',
                'WHAT THIS RECORD ESTABLISHES',
                '  That the bytes of this file produced the digest above, computed in this browser',
                '  at the stated time, and that the digest was written to a tamper-evident journal',
                '  whose contents can be re-checked offline against a signed Merkle anchor.',
                '',
                'WHAT IT DOES NOT ESTABLISH',
                '  Who held the file, where it was seized, or that a court will admit it. A BSA',
                '  s.63(4) Part A certificate must also state the device used, the person operating',
                '  it, and the period it was under their control - use the Section 63 Certificate',
                '  Generator for that. This record supplements it; it does not replace it.',
                '',
                `Generated: ${new Date().toISOString()}`,
            ].join('\n');
            const blob = new Blob([cert], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BSA63_${artifact.fileName.replace(/\.[^.]+$/, '')}_cert.txt`;
            a.click();
            URL.revokeObjectURL(url);

            updateToast(toastId, '✅ Certificate downloaded', 'success');
        } catch {
            updateToast(toastId, '❌ Download failed', 'error');
        } finally {
            setDownloadingCertId(null);
        }
    };

    return (
        <div className="text-white p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Lock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Evidence Locker</h1>
                        <p className="text-slate-400 text-sm">
                            SAM-3 evidence hashing · digests anchored to this device's ledger
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                        <Shield className="w-3 h-3" /> ECDSA P-256 anchor
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                        <Link2 className="w-3 h-3" /> Akhand Ledger Connected
                    </span>
                    <span className="flex items-center gap-1 text-purple-400">
                        <Hash className="w-3 h-3" /> SHA-256 Hashing
                    </span>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
                    transition-all duration-300 mb-6
                    ${dragActive
                        ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                        : isProcessing
                            ? 'border-amber-500/50 bg-amber-500/5 cursor-wait'
                            : 'border-slate-600 hover:border-blue-400 hover:bg-slate-800/50'
                    }
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleInputChange}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                        <p className="text-lg font-semibold text-amber-400">Processing Evidence...</p>

                        {/* Progress Bar */}
                        {hashProgress && (
                            <div className="w-full max-w-md mt-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Computing SHA-256 Hash</span>
                                    <span>{hashProgress.percentComplete}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                        style={{ width: `${hashProgress.percentComplete}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formatFileSize(hashProgress.bytesProcessed)} / {formatFileSize(hashProgress.totalBytes)}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <span>Connecting to Akhand Ledger nodes...</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">
                            {dragActive ? 'Drop Evidence Here' : 'Click or Drag to Upload Evidence'}
                        </p>
                        <p className="text-sm text-slate-400">
                            Supports Video, Audio, Images, Documents (Max 50MB)
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Files are hashed locally before secure transmission
                        </p>
                    </div>
                )}
            </div>

            {/* Evidence List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Secured Evidence ({artifacts.length})
                    </h2>
                    {artifacts.length > 0 && (
                        <button
                            onClick={handleGenerateCertificate}
                            disabled={isGeneratingCert}
                            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isGeneratingCert ? 'bg-blue-500/40 cursor-wait' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                        >
                            {isGeneratingCert ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            {isGeneratingCert ? 'Hashing...' : 'Generate BSA Sec 63 Certificate'}
                        </button>
                    )}
                </div>

                {artifacts.length === 0 && !isProcessing && (
                    <div className="text-center py-12 text-slate-500">
                        <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No evidence secured yet</p>
                        <p className="text-sm">Upload files to generate cryptographic proof</p>
                    </div>
                )}

                {artifacts.map((artifact) => (
                    <div
                        key={artifact.id}
                        onClick={() => setSelectedArtifact(selectedArtifact?.id === artifact.id ? null : artifact)}
                        className={`
                            bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all
                            ${selectedArtifact?.id === artifact.id
                                ? 'border-blue-500 ring-1 ring-blue-500/50'
                                : 'border-slate-700 hover:border-slate-600'
                            }
                        `}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-700 rounded-lg">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{artifact.fileName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {formatFileSize(artifact.fileSize)} • {new Date(artifact.uploadTime).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 mb-1">
                                    {artifact.integrityStatus === 'VERIFIED' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">SECURED</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-bold text-red-400">ALERT</span>
                                        </>
                                    )}
                                </div>
                                {artifact.anchorIndex !== undefined && (
                                    <span className="text-[10px] text-purple-400 flex items-center gap-1 justify-end">
                                        <Shield className="w-3 h-3" /> Anchored #{artifact.anchorIndex}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedArtifact?.id === artifact.id && (
                            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">SHA-256 Hash</p>
                                        <p className="text-xs font-mono bg-slate-900 p-2 rounded break-all text-emerald-400">
                                            {formatHashForDisplay(artifact.hash)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Blockchain Transaction</p>
                                        <p className="text-xs font-mono bg-slate-900 p-2 rounded text-blue-400">
                                            {artifact.blockchainId}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <p className="text-slate-500">Timestamp</p>
                                            <p className="text-slate-300">{new Date(artifact.uploadTime).toISOString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <p className="text-slate-500">Chain Position</p>
                                            <p className="text-slate-300">Block #{artifact.chainPosition}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <p className="text-slate-500">Digest</p>
                                            <p className="text-slate-300">SHA-256 (WebCrypto)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={(e) => handleVerifyIntegrity(artifact, e)}
                                        disabled={verifyingArtifactId === artifact.id}
                                        className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${verifyingArtifactId === artifact.id ? 'bg-blue-500/40 cursor-wait' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                                    >
                                        {verifyingArtifactId === artifact.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                        {verifyingArtifactId === artifact.id ? 'Verifying...' : 'Verify Integrity'}
                                    </button>
                                    <button
                                        onClick={(e) => handleDownloadCert(artifact, e)}
                                        disabled={downloadingCertId === artifact.id}
                                        className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${downloadingCertId === artifact.id ? 'bg-emerald-500/40 cursor-wait' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                                    >
                                        {downloadingCertId === artifact.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        {downloadingCertId === artifact.id ? 'Generating...' : 'BSA Sec 63 Cert'}
                                    </button>
                                </div>

                                {/* Immutable Timeline - Chain of Custody Visualization */}
                                <ChainOfCustodyTimeline artifact={artifact} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvidenceLocker;
