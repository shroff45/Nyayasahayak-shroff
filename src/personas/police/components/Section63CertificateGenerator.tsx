// src/personas/police/components/Section63CertificateGenerator.tsx
// NyayaSahayak v2.0.0 - BSA Section 63 Certificate Generator
// Wizard-style component for digital evidence certification
//
// Mounted by src/personas/police/pages/Section63CertificatePage.tsx at /police/certificate/:evidenceId.
// The digest on the certificate comes from the ledger record for this exhibit when there is one;
// re-hashing a file is offered as a *check against* that digest, not as the normal source of it.

import React, { useState, useCallback, useEffect } from 'react';
import {
    FileCheck, Shield, Upload, Smartphone, CheckCircle2, Loader2, Download, FileSignature, Hash, AlertTriangle } from 'lucide-react';
import { computeFileHash, formatHashForDisplay, type HashProgress } from '../../../core/services/evidenceHasher';
import {
    formatSection63Certificate,
    downloadTextFile,
    section63FileName,
} from '../../../core/services/section63Certificate';
import type { DeviceMetadata, Section63PartA } from '../../../types/evidence.types';

interface Section63CertificateGeneratorProps {
    evidenceId: string;
    /** Document being certified. A §63(4) certificate has to name the computer output it hashes. */
    fileName?: string;
    fileSize?: number;
    caseId?: string;
    /**
     * Digest the ledger already holds for this exhibit. Passed in by the page so the certificate
     * certifies the thing that was anchored, instead of a file the officer happened to re-select.
     */
    ledgerDigest?: string;
    /** One line saying where that digest came from, e.g. "record #7, anchored at #8". */
    ledgerDigestNote?: string;
    /** Printed under LEDGER COORDINATES in the document. */
    ledgerLines?: string[];
    onCertificateGenerated?: (partA: Section63PartA) => void;
}

type WizardStep = 'device' | 'operational' | 'hash' | 'review' | 'complete';

const Section63CertificateGenerator: React.FC<Section63CertificateGeneratorProps> = ({
    evidenceId,
    fileName,
    fileSize,
    caseId,
    ledgerDigest,
    ledgerDigestNote,
    ledgerLines,
    onCertificateGenerated
}) => {
    const [currentStep, setCurrentStep] = useState<WizardStep>('device');
    const [isProcessing, setIsProcessing] = useState(false);
    const [hashProgress, setHashProgress] = useState<HashProgress | null>(null);

    // Device Metadata
    const [deviceMetadata, setDeviceMetadata] = useState<Partial<DeviceMetadata>>({
        type: 'mobile',
        make: '',
        model: '',
        uniqueId: ''
    });

    // Operational Certification (Sec 63(2))
    const [isDeviceWorking, setIsDeviceWorking] = useState(true);
    const [malfunctionDetails, setMalfunctionDetails] = useState('');
    const [controlAffirmation, setControlAffirmation] = useState(false);
    const [controlPeriod, setControlPeriod] = useState('');

    // Hash
    const [computedHash, setComputedHash] = useState<string>(ledgerDigest ?? '');
    const [hashOrigin, setHashOrigin] = useState<'ledger' | 'file'>(ledgerDigest ? 'ledger' : 'file');
    const [rehash, setRehash] = useState<{ fileName: string; matches: boolean } | null>(null);

    // Deponent
    const [deponentName, setDeponentName] = useState('');
    const [deponentDesignation, setDeponentDesignation] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [issued, setIssued] = useState<Section63PartA | null>(null);

    const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
        { key: 'device', label: 'Device Info', icon: <Smartphone className="w-4 h-4" /> },
        { key: 'operational', label: 'Operational', icon: <Shield className="w-4 h-4" /> },
        { key: 'hash', label: 'Hash Value', icon: <Hash className="w-4 h-4" /> },
        { key: 'review', label: 'Review', icon: <FileCheck className="w-4 h-4" /> },
        { key: 'complete', label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" /> }
    ];

    // The page reads the exhibit out of an async store, so the digest usually arrives after mount.
    useEffect(() => {
        if (!ledgerDigest) return;
        // Never overwrite a deliberate re-hash with the stored value.
        setHashOrigin((origin) => {
            if (origin !== 'file') setComputedHash(ledgerDigest);
            return origin === 'file' ? origin : 'ledger';
        });
    }, [ledgerDigest]);

    const handleHashCompute = useCallback(async (file: File) => {
        setIsProcessing(true);
        try {
            const result = await computeFileHash(file, (progress) => {
                setHashProgress(progress);
            });
            setComputedHash(result.hash);
            setHashOrigin('file');
            // Re-hashing is a verification act, so say what it found. A mismatch is reported, not
            // silently absorbed, and the officer chooses which digest to certify with open eyes.
            setRehash(ledgerDigest
                ? { fileName: file.name, matches: result.hash.toLowerCase() === ledgerDigest.toLowerCase() }
                : null);
        } catch (error) {
            console.error('Hash computation failed:', error);
            setRehash(null);
        } finally {
            setIsProcessing(false);
            setHashProgress(null);
        }
    }, []);

    const handleGenerateCertificate = () => {
        const partA: Section63PartA = {
            deponentName,
            designation: deponentDesignation,
            badgeNumber: badgeNumber || undefined,
            deviceSource: deviceMetadata.type || 'mobile',
            deviceMetadata: deviceMetadata as DeviceMetadata,
            operationalCertification: {
                isDeviceWorkingProperly: isDeviceWorking,
                malfunctionDetails: !isDeviceWorking ? malfunctionDetails : undefined,
                periodOfControl: controlPeriod,
                controlAffirmation
            },
            hashValue: computedHash,
            hashAlgorithm: 'SHA-256',
            signatureTimestamp: new Date()
        };

        setIssued(partA);
        setCurrentStep('complete');
        onCertificateGenerated?.(partA);
    };

    const handleDownloadPartA = () => {
        if (!issued) return;
        downloadTextFile(
            section63FileName(evidenceId),
            formatSection63Certificate(issued, { evidenceId, fileName, fileSize, caseId, ledgerLines })
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'device':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Step 1: Device Information</h3>
                        <p className="text-sm text-slate-400">
                            Per BSA Schedule, provide details of the device used for capture.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Device Type *</label>
                                <select
                                    value={deviceMetadata.type}
                                    onChange={(e) => setDeviceMetadata({ ...deviceMetadata, type: e.target.value as DeviceMetadata['type'] })}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="mobile">Mobile Phone</option>
                                    <option value="computer">Computer</option>
                                    <option value="dvr">DVR/NVR</option>
                                    <option value="cctv">CCTV Camera</option>
                                    <option value="server">Server</option>
                                    <option value="cloud">Cloud Storage</option>
                                    <option value="storage_media">Storage Media (USB/SD)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Make *</label>
                                <input
                                    type="text"
                                    value={deviceMetadata.make}
                                    onChange={(e) => setDeviceMetadata({ ...deviceMetadata, make: e.target.value })}
                                    placeholder="e.g., Samsung, Apple"
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Model *</label>
                                <input
                                    type="text"
                                    value={deviceMetadata.model}
                                    onChange={(e) => setDeviceMetadata({ ...deviceMetadata, model: e.target.value })}
                                    placeholder="e.g., Galaxy S23"
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">IMEI/MAC/ID *</label>
                                <input
                                    type="text"
                                    value={deviceMetadata.uniqueId}
                                    onChange={(e) => setDeviceMetadata({ ...deviceMetadata, uniqueId: e.target.value })}
                                    placeholder="Device unique identifier"
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentStep('operational')}
                            disabled={!deviceMetadata.make || !deviceMetadata.model || !deviceMetadata.uniqueId}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg"
                        >
                            Next: Operational Status
                        </button>
                    </div>
                );

            case 'operational':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Step 2: Operational Certification</h3>
                        <p className="text-sm text-slate-400">
                            BSA Section 63(2) requires certification of device functionality.
                        </p>

                        {/* Device Working Status */}
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDeviceWorking}
                                    onChange={(e) => setIsDeviceWorking(e.target.checked)}
                                    className="w-5 h-5 rounded"
                                />
                                <span className="text-white">
                                    The device was operating properly during the material period
                                </span>
                            </label>
                        </div>

                        {!isDeviceWorking && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Malfunction Details (Sec 63(2)(c))
                                </label>
                                <textarea
                                    value={malfunctionDetails}
                                    onChange={(e) => setMalfunctionDetails(e.target.value)}
                                    placeholder="Describe the malfunction and why it did not affect the record's accuracy..."
                                    rows={3}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Period of Control *
                            </label>
                            <input
                                type="text"
                                value={controlPeriod}
                                onChange={(e) => setControlPeriod(e.target.value)}
                                placeholder="e.g., 2024-01-01 to 2024-12-14"
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            />
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={controlAffirmation}
                                    onChange={(e) => setControlAffirmation(e.target.checked)}
                                    className="w-5 h-5 rounded mt-0.5"
                                />
                                <span className="text-amber-300 text-sm">
                                    I certify that the device was under my lawful control during the stated period and the electronic record was produced in the ordinary course of activities.
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep('device')}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep('hash')}
                                disabled={!controlAffirmation || !controlPeriod}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg"
                            >
                                Next: Hash Value
                            </button>
                        </div>
                    </div>
                );

            case 'hash':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Step 3: Hash Value (SHA-256)</h3>
                        <p className="text-sm text-slate-400">
                            BSA Schedule requires cryptographic hash for evidence integrity.
                        </p>

                        {ledgerDigest && (
                            <div className={`p-3 rounded-lg border text-xs space-y-1 ${hashOrigin === 'file'
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                                : 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                                }`}>
                                <p>
                                    {hashOrigin === 'file'
                                        ? 'The certificate will carry the digest you just computed from the file, which is NOT what the ledger holds for this exhibit.'
                                        : `Hash taken from the ledger record for ${evidenceId} — the digest that was anchored, not a fresh read of the file.`}
                                </p>
                                {ledgerDigestNote && <p className="text-slate-400">{ledgerDigestNote}</p>}
                                {hashOrigin === 'file' && (
                                    <button
                                        onClick={() => { setComputedHash(ledgerDigest); setHashOrigin('ledger'); setRehash(null); }}
                                        className="mt-1 px-2 py-1 bg-slate-700 text-white rounded"
                                    >
                                        Use the recorded digest instead
                                    </button>
                                )}
                            </div>
                        )}

                        {rehash && (
                            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${rehash.matches
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : 'border-red-500/50 bg-red-500/10 text-red-200'
                                }`}>
                                {rehash.matches
                                    ? <CheckCircle2 className="w-4 h-4" />
                                    : <AlertTriangle className="w-4 h-4" />}
                                <span>
                                    Re-hash of {rehash.fileName} {rehash.matches
                                        ? 'matches the recorded digest.'
                                        : 'does NOT match the digest in the ledger. The exhibit and this file are different bytes — do not certify either one until you know which is the exhibit.'}
                                </span>
                            </div>
                        )}

                        <div className="p-6 border-2 border-dashed border-slate-600 rounded-xl text-center">
                            {!computedHash && !isProcessing && (
                                <>
                                    <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                                    <p className="text-slate-400 mb-3">Upload file to compute SHA-256 hash</p>
                                    <input
                                        type="file"
                                        onChange={(e) => e.target.files?.[0] && handleHashCompute(e.target.files[0])}
                                        className="hidden"
                                        id="hashFile"
                                    />
                                    <label htmlFor="hashFile" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer">
                                        Select File
                                    </label>
                                </>
                            )}

                            {isProcessing && hashProgress && (
                                <div>
                                    <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
                                    <p className="text-white mb-2">Computing SHA-256 Hash...</p>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all"
                                            style={{ width: `${hashProgress.percentComplete}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {hashProgress.percentComplete}% ({(hashProgress.bytesProcessed / 1024 / 1024).toFixed(1)} MB processed)
                                    </p>
                                </div>
                            )}

                            {computedHash && (
                                <div>
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-emerald-400 font-bold mb-2">
                                        {hashOrigin === 'ledger' ? 'Recorded Digest Loaded' : 'Hash Computed Successfully'}
                                    </p>
                                    <div className="bg-slate-900/50 rounded-lg p-4 text-left">
                                        <p className="text-xs text-slate-400 mb-1">SHA-256 Hash Value:</p>
                                        <p className="font-mono text-xs text-emerald-400 break-all">
                                            {formatHashForDisplay(computedHash)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep('operational')}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep('review')}
                                disabled={!computedHash}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-lg"
                            >
                                Next: Review
                            </button>
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Step 4: Review & Sign (Part A)</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Your Name *</label>
                                <input
                                    type="text"
                                    value={deponentName}
                                    onChange={(e) => setDeponentName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Designation *</label>
                                <input
                                    type="text"
                                    value={deponentDesignation}
                                    onChange={(e) => setDeponentDesignation(e.target.value)}
                                    placeholder="e.g., Sub-Inspector"
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Badge/ID Number</label>
                                <input
                                    type="text"
                                    value={badgeNumber}
                                    onChange={(e) => setBadgeNumber(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Device:</span>
                                <span className="text-white">{deviceMetadata.make} {deviceMetadata.model}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Hash Algorithm:</span>
                                <span className="text-emerald-400">SHA-256</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Hash Value:</span>
                                <span className="text-white font-mono text-xs">{computedHash.substring(0, 16)}...</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep('hash')}
                                className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerateCertificate}
                                disabled={!deponentName || !deponentDesignation}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                            >
                                <FileSignature className="w-4 h-4" />
                                Generate Certificate (Part A)
                            </button>
                        </div>
                    </div>
                );

            case 'complete':
                return (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Certificate Generated!</h3>
                        <p className="text-slate-400 mb-6">
                            Part A of BSA Section 63 Certificate has been generated.
                            It will be routed to an Expert for Part B verification.
                        </p>

                        <div className="text-left bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6 space-y-1 text-xs">
                            <p className="font-mono text-emerald-400 break-all">{issued?.hashValue?.toUpperCase() ?? '—'}</p>
                            <p className="text-slate-400">
                                {issued?.deponentName} · {issued?.designation}
                                {issued?.badgeNumber ? ` · ${issued.badgeNumber}` : ''}
                            </p>
                            {(ledgerLines ?? []).map((line) => (
                                <p key={line} className="text-slate-500 font-mono">{line}</p>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleDownloadPartA}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download the certificate (text)
                            </button>
                            <button
                                onClick={() => setCurrentStep('review')}
                                className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg"
                            >
                                Back to review
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-4 max-w-lg mx-auto">
                            Plain text, because that is what this app can actually produce: no PDF writer is
                            present, and a certificate that mislabels its own format is a worse outcome than
                            one that prints from a text file. Part B is included as a blank for the expert.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold text-white">BSA Section 63 Certificate Generator</h2>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                    Evidence ID: {evidenceId}
                </span>
                {(fileName || typeof fileSize === 'number') && (
                    <span className="text-xs text-slate-400 font-mono truncate max-w-xs" title={fileName}>
                        {fileName ?? 'unlabelled export'}
                        {typeof fileSize === 'number' && fileSize > 0
                            ? ` • ${(fileSize / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`
                            : ''}
                    </span>
                )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((step, idx) => {
                    const isActive = step.key === currentStep;
                    const isPast = steps.findIndex(s => s.key === currentStep) > idx;

                    return (
                        <div key={step.key} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-400' :
                                    isPast ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-slate-700/50 text-slate-500'
                                }`}>
                                {step.icon}
                                <span className="text-sm font-medium">{step.label}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-2 ${isPast ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            {renderStepContent()}
        </div>
    );
};

export default Section63CertificateGenerator;
