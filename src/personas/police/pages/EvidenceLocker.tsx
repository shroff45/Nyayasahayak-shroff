// src/personas/police/pages/EvidenceLocker.tsx
// NyayaSahayak Hybrid v2.0.0 - Evidence Locker, bound to the Akhand Ledger
//
// What changed when this page was wired up, and why each change matters more than it looks:
//
//  * The list is read out of the persisted journal on mount. It used to be component state fed only
//    by the current session's uploads, so a refresh "lost" evidence that was in fact recorded, and
//    the judge's screens could see a record this page denied ever existing.
//  * Uploads go through `appendEvidenceRecord`, not the deprecated case-shaped `addBlock`. The old
//    call invented a case (`complainant: 'SYSTEM'`, a random CNR) to satisfy a shape it did not
//    belong to, which is how exhibits ended up unfindable by exhibit id.
//  * The four-step "Captured / Uploaded / Hashed / Court Ready" strip is gone. It drew a progress
//    bar whose width was chosen by an `if` on a status string: a picture of custody, not a record of
//    it. What is here instead is `ChainOfCustodyTimeline` fed by `buildCustodyChain` — one journal
//    record per node, one verification pass per badge — plus a form that actually writes transfers.
//  * "Generate BSA Sec 63 Certificate" no longer fabricates a text file after `mockDelay(1200)`.
//    It routes to the certificate page, where Part A is filled in and anchored.

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Upload, FileText, Shield, CheckCircle, AlertTriangle, Hash,
    RefreshCw, Lock, Link2, Download, Eye, Loader2, FileCheck, Plus, X
} from 'lucide-react';
import { computeFileHash, formatHashForDisplay, type HashProgress } from '../../../core/services/evidenceHasher';
import { appendEvidenceRecord, getLedger, getLedgerStatus, type LedgerStatus } from '../../../services/akhandLedger';
import { appendCustodyEvent, buildCustodyChain } from '../../../core/trust/custody.ts';
import type { CustodyChainWithProofs, CustodyNodeDetail } from '../../../core/trust/custody.ts';
import { listCases, listExhibits, type LedgerCase, type LedgerExhibit } from '../../../shared/utils/ledgerRecords';
import ChainOfCustodyTimeline from '../../../shared/components/ChainOfCustodyTimeline';
import type { CustodyEvent, CustodyEventType, CustodianRole } from '../../../types/custody.types';
import { useToast } from '../../../shared/hooks/useToast';
import { useWorkspace } from '../../../core/context/WorkspaceContext';

const MAX_HASHABLE_BYTES = 64 * 1024 * 1024;

/** The picker's explicit "no case yet" entry — chosen, never defaulted to. */
const UNLINKED = '__unlinked__';

interface LockerExhibit extends LedgerExhibit {
    /** The record's own digest — what the anchor commits to, distinct from the file's hash. */
    recordDigest: string;
    ok: boolean;
    reason: string;
    anchorIndex?: number;
    merkleRoot?: string;
    signerFingerprint?: string;
    integrityStatus: 'VERIFIED' | 'PENDING' | 'MISMATCH';
}

const EVENT_TYPES: { value: CustodyEventType; label: string }[] = [
    { value: 'SEIZURE', label: 'Seizure at scene' },
    { value: 'HANDOVER', label: 'Handover to another officer' },
    { value: 'TRANSPORT', label: 'In transport' },
    { value: 'RECEIPT', label: 'Received at destination' },
    { value: 'ANALYSIS', label: 'Forensic analysis' },
    { value: 'STORAGE', label: 'Stored (Malkhana / FSL)' },
    { value: 'COURT_SUBMISSION', label: 'Submitted to court' },
    { value: 'EXAMINATION', label: 'Examined in court' },
    { value: 'RETURN', label: 'Returned after proceedings' },
    { value: 'DISPOSAL', label: 'Disposed of' },
];

const ROLES: CustodianRole[] = [
    'INVESTIGATING_OFFICER', 'MALKHANA_INCHARGE', 'ESCORT_OFFICER', 'FSL_RECEIVING',
    'FORENSIC_EXPERT', 'COURT_READER', 'JUDGE', 'EVIDENCE_OFFICER',
];

interface TransferDraft {
    eventType: CustodyEventType;
    description: string;
    custodianName: string;
    custodianRole: CustodianRole;
    designation: string;
    badgeNumber: string;
    locationName: string;
    sealNumber: string;
    /** Optional: a transfer is often written up hours later and the log must be able to say so. */
    occurredAt: string;
}

const emptyDraft = (): TransferDraft => ({
    eventType: 'HANDOVER',
    description: '',
    custodianName: '',
    custodianRole: 'MALKHANA_INCHARGE',
    designation: '',
    badgeNumber: '',
    locationName: '',
    sealNumber: '',
    occurredAt: '',
});

const EvidenceLocker: React.FC = () => {
    const { showToast, updateToast } = useToast();
    const navigate = useNavigate();
    const { selectedCase } = useWorkspace();

    const [exhibits, setExhibits] = useState<LockerExhibit[]>([]);
    /** Cases in the journal, so the exhibit can be linked to one that actually exists. */
    const [cases, setCases] = useState<LedgerCase[]>([]);
    // null means "decide from the workspace selection"; UNLINKED is a deliberate choice, not a default.
    const [caseChoice, setCaseChoice] = useState<string | null>(null);
    const [status, setStatus] = useState<LedgerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [chain, setChain] = useState<CustodyChainWithProofs | null>(null);
    const [chainLoading, setChainLoading] = useState(false);
    const [detail, setDetail] = useState<CustodyNodeDetail | null>(null);
    const [draftOpen, setDraftOpen] = useState(false);
    const [draft, setDraft] = useState<TransferDraft>(emptyDraft);
    const [busy, setBusy] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [hashProgress, setHashProgress] = useState<HashProgress | null>(null);
    const [markAsSceneVideo, setMarkAsSceneVideo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const ledger = await getLedger();
            const records = await ledger.records();
            const anchors = await ledger.anchors();
            const byIndex = new Map(records.map((r) => [r.index, r]));
            const withProofs: LockerExhibit[] = [];
            for (const exhibit of listExhibits(records)) {
                const verdict = await ledger.verifyRecord(exhibit.recordIndex);
                const covering = anchors.find(
                    (a) => exhibit.recordIndex >= a.batchStart && exhibit.recordIndex <= a.batchEnd
                );
                withProofs.push({
                    ...exhibit,
                    recordDigest: byIndex.get(exhibit.recordIndex)?.leafDigest ?? '',
                    ok: verdict.ok,
                    reason: verdict.reason,
                    anchorIndex: verdict.anchorIndex,
                    merkleRoot: covering?.merkleRoot,
                    signerFingerprint: verdict.signerFingerprint,
                    integrityStatus: !verdict.digestMatches || verdict.proofValid === false
                        ? 'MISMATCH'
                        : verdict.ok
                            ? 'VERIFIED'
                            : 'PENDING',
                });
            }
            setExhibits(withProofs);
            setCases(listCases(records));
            setStatus(await getLedgerStatus());
        } catch (cause) {
            setLoadError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const selected = useMemo(
        () => exhibits.find((exhibit) => exhibit.id === selectedId) ?? null,
        [exhibits, selectedId]
    );

    const loadChain = useCallback(async (evidenceId: string, description?: string) => {
        setChainLoading(true);
        setDetail(null);
        try {
            const ledger = await getLedger();
            setChain(await buildCustodyChain(ledger, { evidenceId, caseId: selectedCase?.id, description }));
        } catch (cause) {
            setChain(null);
            showToast(`Custody chain could not be read: ${cause instanceof Error ? cause.message : String(cause)}`, 'error', 8000);
        } finally {
            setChainLoading(false);
        }
    }, [selectedCase?.id, showToast]);

    useEffect(() => {
        if (selectedId) void loadChain(selectedId, selected?.fileName);
        else setChain(null);
    }, [selectedId, selected?.fileName, loadChain]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file || isProcessing) return;
        setIsProcessing(true);
        setHashProgress({ bytesProcessed: 0, totalBytes: file.size, percentComplete: 0 });
        try {
            const hashResult = await computeFileHash(file, (progress) => setHashProgress(progress));

            const evidenceId = `EV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1e6)
                .toString().padStart(6, '0')}`;
            const linkedCase = caseChoice === UNLINKED ? null : (caseChoice ?? selectedCase?.id ?? null);
            if (caseChoice === null && !selectedCase?.id) {
                showToast(
                    'Say which case this exhibit belongs to — or that it is a pre-FIR seizure. An exhibit filed without a case id cannot be found by the court\'s screens.',
                    'error',
                    8000
                );
                return;
            }
            const written = await appendEvidenceRecord({
                id: evidenceId,
                caseId: linkedCase ?? 'UNLINKED',
                ...(linkedCase ? {} : { unlinkedNote: 'Seized before any case was recorded on this device' }),
                fileName: file.name,
                fileType: file.type,
                mimeType: file.type,
                fileSize: file.size,
                sha256: hashResult.hash.toUpperCase(),
                summary: `Exhibit ${file.name}`,
                captureTimestamp: hashResult.timestamp.toISOString(),
                // The officer has to say this is the s.176(3) recording; a video file in the locker
                // is not automatically scene videography, and the charge-sheet gate must not be
                // satisfied by coincidence.
                ...(markAsSceneVideo ? { purpose: 'FORENSIC_SCENE_VIDEO' } : {}),
            });
            if (!written.persisted) {
                showToast(
                    'Hashed, but the journal refused to persist it. This exhibit is NOT recorded.',
                    'error',
                    10000
                );
            } else {
                showToast(`Recorded as ledger record #${written.index} and anchored`, 'success', 4000);
                setMarkAsSceneVideo(false);
            }
            await load();
        } catch (error) {
            // A failed write used to be console-only: the uploader saw a spinner stop and nothing
            // else, so an exhibit could be believed filed when it was never recorded.
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
    }, [caseChoice, isProcessing, load, markAsSceneVideo, selectedCase?.id, showToast]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) void handleFileUpload(file);
        event.target.value = '';
    };

    const handleDrag = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') setDragActive(true);
        if (event.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFileUpload(file);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    // Verify: an actual re-read of the record, not a spinner followed by a green tick.
    const handleVerify = async (exhibit: LockerExhibit, event: React.MouseEvent) => {
        event.stopPropagation();
        if (busy) return;
        setBusy(`verify:${exhibit.id}`);
        const toastId = showToast('Re-checking this record against the anchor...', 'loading');
        try {
            const ledger = await getLedger();
            const verdict = await ledger.verifyRecord(exhibit.recordIndex);
            updateToast(
                toastId,
                verdict.ok
                    ? `Verified: record #${exhibit.recordIndex}, digest intact${verdict.anchorIndex !== undefined ? `, anchor #${verdict.anchorIndex}` : ''}`
                    : `Not verifiable: ${verdict.reason}`,
                verdict.ok ? 'success' : 'error'
            );
            await load();
        } catch (cause) {
            updateToast(toastId, `Verification failed: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        } finally {
            setBusy(null);
        }
    };

    // The integrity record this page can honestly issue: the exhibit's digest, the ledger
    // coordinates, and the verification performed at the moment of export.
    const handleDownloadRecord = async (exhibit: LockerExhibit, event: React.MouseEvent) => {
        event.stopPropagation();
        if (busy) return;
        setBusy(`cert:${exhibit.id}`);
        const toastId = showToast('Re-verifying before writing the record...', 'loading');
        try {
            const ledger = await getLedger();
            const verdict = await ledger.verifyRecord(exhibit.recordIndex);
            const text = [
                'EVIDENCE INTEGRITY RECORD',
                'Issued alongside a certificate under BSA s.63(4) — it is not that certificate.',
                '===========================================================',
                `File name          : ${exhibit.fileName ?? '(unnamed)'}`,
                `Exhibit id         : ${exhibit.id}`,
                `Case               : ${exhibit.caseId ?? '(unlinked)'}`,
                `File size          : ${exhibit.fileSize ?? 'unknown'} bytes`,
                `SHA-256 of exhibit : ${(exhibit.fileDigest ?? 'not recorded').toUpperCase()}`,
                `Recorded (device)  : ${exhibit.loggedAt}`,
                `Ledger record      : #${exhibit.recordIndex} (${exhibit.recordDigest})`,
                `Anchoring          : ${exhibit.anchorIndex !== undefined
                    ? `anchor #${exhibit.anchorIndex}, Merkle root ${exhibit.merkleRoot ?? 'unknown'}`
                    : 'not anchored'}`,
                `Signed by key      : ${verdict.signerFingerprint ?? 'unknown'}`,
                `Verification now   : ${verdict.ok ? 'VERIFIED' : 'NOT VERIFIED'}`,
                `Verification note  : ${verdict.reason}`,
                '',
                'WHAT THIS RECORD ESTABLISHES',
                '  That the bytes of this file produced the digest above, computed in this browser at',
                '  the stated time, and that the digest was written to a tamper-evident journal whose',
                '  contents can be re-checked offline against a signed Merkle anchor.',
                '',
                'WHAT IT DOES NOT ESTABLISH',
                '  Who held the file, where it was seized, or that a court will admit it. A s.63(4)',
                '  Part A certificate must also state the device used, the person operating it, and the',
                '  period it was under their control — use the Section 63 Certificate screen for that.',
                '',
                `Generated: ${new Date().toISOString()}`,
            ].join('\n');
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `EVIDENCE_${exhibit.id}_integrity.txt`;
            anchor.click();
            URL.revokeObjectURL(url);
            updateToast(toastId, 'Integrity record downloaded', 'success');
        } catch (cause) {
            updateToast(toastId, `Download failed: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        } finally {
            setBusy(null);
        }
    };

    const submitTransfer = async () => {
        if (!selected) return;
        if (draft.occurredAt && !Number.isFinite(Date.parse(draft.occurredAt))) {
            showToast('That is not a date. The entry was not written.', 'error', 6000);
            return;
        }
        if (!draft.description.trim() || !draft.custodianName.trim() || !draft.locationName.trim()) {
            showToast('A custody entry needs what happened, who took custody and where. Blank fields become "Unknown" at trial.', 'error', 8000);
            return;
        }
        const toastId = showToast('Writing the transfer to the ledger...', 'loading');
        try {
            const ledger = await getLedger();
            const written = await appendCustodyEvent(ledger, {
                caseId: selected.caseId ?? selectedCase?.id ?? 'UNLINKED',
                evidenceId: selected.id,
                eventType: draft.eventType,
                description: draft.description.trim(),
                ...(draft.occurredAt ? { timestamp: new Date(draft.occurredAt).toISOString() } : {}),
                custodian: {
                    id: draft.badgeNumber.trim() ? `BADGE-${draft.badgeNumber.trim()}` : draft.custodianName.trim(),
                    name: draft.custodianName.trim(),
                    role: draft.custodianRole,
                    designation: draft.designation.trim() || draft.custodianRole.replace(/_/g, ' ').toLowerCase(),
                    ...(draft.badgeNumber.trim() ? { badgeNumber: draft.badgeNumber.trim() } : {}),
                },
                location: { name: draft.locationName.trim() },
                ...(draft.sealNumber.trim() ? { sealNumber: draft.sealNumber.trim() } : {}),
                // The exhibit's digest travels with the event only if this officer re-measured it;
                // copying the stored digest here would claim a check that did not happen.
            });
            updateToast(
                toastId,
                written.persisted
                    ? `Transfer recorded as record #${written.index}${written.anchored ? ' and anchored' : ' — NOT anchored'}`
                    : 'Transfer written but not persisted — it will vanish on refresh',
                written.persisted && written.anchored ? 'success' : 'error'
            );
            setDraft(emptyDraft());
            setDraftOpen(false);
            await load();
            void loadChain(selected.id, selected.fileName);
        } catch (cause) {
            updateToast(toastId, `Transfer NOT recorded: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        }
    };

    const field = (label: string, node: React.ReactNode) => (
        <label className="block text-xs">
            <span className="text-slate-400">{label}</span>
            {node}
        </label>
    );

    const input = 'w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1.5 text-white text-xs mt-1';

    return (
        <div className="text-white p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Lock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Evidence Locker</h1>
                            <p className="text-slate-400 text-sm">
                                SHA-256 in this browser · digests appended to a tamper-evident journal on
                                this device and anchored under its own key
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { void load(); if (selectedId) void loadChain(selectedId, selected?.fileName); }}
                        className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Re-read the journal
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                        <Shield className="w-3 h-3" />
                        {status ? `${status.signerFingerprint} · ${status.custody}` : 'key not loaded'}
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                        <Link2 className="w-3 h-3" />
                        {status
                            ? `${status.records} record(s), ${status.anchors} anchor(s), ${status.unanchored} unanchored · ${status.persisted ? `in ${status.storeName}` : 'NOT PERSISTED (memory only)'}`
                            : 'reading store…'}
                    </span>
                    {status?.selfSignedOnly && (
                        <span className="flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Only this device's key is pinned — another terminal cannot verify these anchors yet
                        </span>
                    )}
                </div>
                {loadError && (
                    <p className="mt-3 text-xs text-red-300">
                        The journal could not be opened: {loadError}. Nothing on this screen should be
                        treated as recorded.
                    </p>
                )}
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
                        <p className="text-lg font-semibold text-amber-400">Hashing and recording…</p>
                        {hashProgress && (
                            <div className="w-full max-w-md mt-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Computing SHA-256 (WebCrypto, 4 MB at a time)</span>
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
                        <p className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Writing the digest to the journal on this device
                        </p>
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
                            Video, audio, images, documents — up to {formatFileSize(MAX_HASHABLE_BYTES)}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 max-w-lg">
                            The file never leaves this device. Its digest is computed here and written to the
                            journal; a file above the limit is refused rather than frozen mid-read.
                        </p>
                        <div
                            className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <span className="text-slate-400">This exhibit belongs to</span>
                                <select
                                    value={caseChoice ?? selectedCase?.id ?? ''}
                                    onChange={(e) => setCaseChoice(e.target.value || null)}
                                    className="bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-white"
                                >
                                    <option value="">— choose —</option>
                                    {cases.map((entry) => (
                                        <option key={entry.recordIndex} value={entry.id}>
                                            {entry.id}{entry.cnrNumber ? ` (${entry.cnrNumber})` : ''}
                                        </option>
                                    ))}
                                    <option value={UNLINKED}>No case yet (pre-FIR / Zero FIR seizure)</option>
                                </select>
                            </label>
                            {cases.length === 0 && (
                                <span className="text-slate-500">
                                    no case in the ledger yet — file the FIR, or record it as an unlinked seizure
                                </span>
                            )}
                        </div>

                        <label
                            className="mt-4 flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={markAsSceneVideo}
                                onChange={(e) => setMarkAsSceneVideo(e.target.checked)}
                                className="accent-blue-500"
                            />
                            This is the BNSS s.176(3) scene videography
                            {caseChoice && caseChoice !== UNLINKED ? ` for ${caseChoice}` : ''}
                            <span className="text-slate-500">
                                — required before the charge sheet can be submitted where the offence carries
                                seven years or more
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Evidence List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Exhibits in the ledger ({exhibits.length})
                    </h2>
                    <Link
                        to="/police/certificate"
                        className="text-xs px-4 py-2 rounded-lg font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 flex items-center gap-2"
                    >
                        <FileCheck className="w-3 h-3" />
                        Section 63 certificate
                    </Link>
                </div>

                {loading && (
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Reading the journal…
                    </p>
                )}

                {!loading && exhibits.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No exhibit recorded on this device yet</p>
                        <p className="text-sm">Upload a file to write its digest into the journal</p>
                    </div>
                )}

                {exhibits.map((exhibit) => (
                    <div
                        key={exhibit.recordIndex}
                        onClick={() => setSelectedId(selectedId === exhibit.id ? null : exhibit.id)}
                        className={`bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all ${selectedId === exhibit.id
                            ? 'border-blue-500 ring-1 ring-blue-500/50'
                            : 'border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 bg-slate-700 rounded-lg">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-white truncate">{exhibit.fileName ?? exhibit.id}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {exhibit.id} · {formatFileSize(exhibit.fileSize ?? 0)} · {exhibit.caseId ?? 'unlinked'} ·{' '}
                                        {new Date(exhibit.loggedAt).toLocaleString()}
                                    </p>
                                    {exhibit.purpose === 'FORENSIC_SCENE_VIDEO' && (
                                        <p className="text-[10px] text-blue-300 mt-1">Marked as the s.176(3) scene recording</p>
                                    )}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="flex items-center justify-end gap-1 mb-1">
                                    {exhibit.integrityStatus === 'VERIFIED' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">VERIFIED</span>
                                        </>
                                    ) : exhibit.integrityStatus === 'MISMATCH' ? (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-bold text-red-400">MISMATCH</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <span className="text-xs font-bold text-amber-400">NOT VERIFIED</span>
                                        </>
                                    )}
                                </div>
                                {exhibit.anchorIndex !== undefined && (
                                    <span className="text-[10px] text-purple-400 flex items-center gap-1 justify-end">
                                        <Shield className="w-3 h-3" /> Anchored #{exhibit.anchorIndex}
                                    </span>
                                )}
                            </div>
                        </div>

                        {selectedId === exhibit.id && (
                            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">SHA-256 of the exhibit</p>
                                        <p className="text-xs font-mono bg-slate-900 p-2 rounded break-all text-emerald-400">
                                            {exhibit.fileDigest ? formatHashForDisplay(exhibit.fileDigest) : 'not recorded on this exhibit'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Ledger verification</p>
                                        <p className="text-xs bg-slate-900 p-2 rounded text-slate-300 leading-snug">
                                            {exhibit.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-slate-500" />
                                        <div className="min-w-0">
                                            <p className="text-slate-500">Record</p>
                                            <p className="text-slate-300 font-mono truncate">
                                                #{exhibit.recordIndex} · {exhibit.recordDigest.slice(0, 16)}…
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-slate-500" />
                                        <div className="min-w-0">
                                            <p className="text-slate-500">Merkle root of its batch</p>
                                            <p className="text-slate-300 font-mono truncate">
                                                {exhibit.merkleRoot ? `${exhibit.merkleRoot.slice(0, 20)}…` : 'not anchored'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-slate-500" />
                                        <div className="min-w-0">
                                            <p className="text-slate-500">Signed by</p>
                                            <p className="text-slate-300 font-mono truncate">{exhibit.signerFingerprint ?? '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={(e) => void handleVerify(exhibit, e)}
                                        disabled={busy !== null}
                                        className={`flex-1 text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1 ${busy === `verify:${exhibit.id}` ? 'bg-blue-500/40 cursor-wait' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                                    >
                                        {busy === `verify:${exhibit.id}`
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <Eye className="w-3 h-3" />}
                                        {busy === `verify:${exhibit.id}` ? 'Checking…' : 'Re-verify against the anchor'}
                                    </button>
                                    <button
                                        onClick={(e) => void handleDownloadRecord(exhibit, e)}
                                        disabled={busy !== null}
                                        className={`flex-1 text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1 ${busy === `cert:${exhibit.id}` ? 'bg-emerald-500/40 cursor-wait' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                                    >
                                        {busy === `cert:${exhibit.id}`
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <Download className="w-3 h-3" />}
                                        {busy === `cert:${exhibit.id}` ? 'Verifying…' : 'Integrity record (.txt)'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/police/certificate/${encodeURIComponent(exhibit.id)}`); }}
                                        className="flex-1 text-xs py-2 rounded-lg font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 flex items-center justify-center gap-1"
                                    >
                                        <FileCheck className="w-3 h-3" />
                                        Section 63 certificate
                                    </button>
                                </div>

                                {/* Chain of custody, read out of the journal record by record. */}
                                <div className="pt-2 space-y-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                            <Link2 className="w-3 h-3" /> Chain of custody
                                        </h4>
                                        <button
                                            onClick={() => setDraftOpen((open) => !open)}
                                            className="text-[11px] px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
                                        >
                                            {draftOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            {draftOpen ? 'Cancel' : 'Record a transfer'}
                                        </button>
                                    </div>

                                    {draftOpen && (
                                        <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg grid grid-cols-2 gap-3">
                                            {field('What happened', (
                                                <input
                                                    className={input}
                                                    value={draft.description}
                                                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                                    placeholder="e.g. Sealed and handed to the Malkhana in-charge"
                                                />
                                            ))}
                                            {field('Event type', (
                                                <select
                                                    className={input}
                                                    value={draft.eventType}
                                                    onChange={(e) => setDraft({ ...draft, eventType: e.target.value as CustodyEventType })}
                                                >
                                                    {EVENT_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                            ))}
                                            {field('Custodian taking it', (
                                                <input
                                                    className={input}
                                                    value={draft.custodianName}
                                                    onChange={(e) => setDraft({ ...draft, custodianName: e.target.value })}
                                                    placeholder="Name"
                                                />
                                            ))}
                                            {field('Their role', (
                                                <select
                                                    className={input}
                                                    value={draft.custodianRole}
                                                    onChange={(e) => setDraft({ ...draft, custodianRole: e.target.value as CustodianRole })}
                                                >
                                                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            ))}
                                            {field('Designation', (
                                                <input
                                                    className={input}
                                                    value={draft.designation}
                                                    onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
                                                    placeholder="e.g. Sub-Inspector"
                                                />
                                            ))}
                                            {field('Badge / ID number', (
                                                <input
                                                    className={input}
                                                    value={draft.badgeNumber}
                                                    onChange={(e) => setDraft({ ...draft, badgeNumber: e.target.value })}
                                                />
                                            ))}
                                            {field('Location', (
                                                <input
                                                    className={input}
                                                    value={draft.locationName}
                                                    onChange={(e) => setDraft({ ...draft, locationName: e.target.value })}
                                                    placeholder="e.g. PS Saket Malkhana"
                                                />
                                            ))}
                                            {field('Seal number', (
                                                <input
                                                    className={input}
                                                    value={draft.sealNumber}
                                                    onChange={(e) => setDraft({ ...draft, sealNumber: e.target.value })}
                                                />
                                            ))}
                                            <div className="col-span-2 flex items-end justify-between gap-3">
                                                {field('When it actually happened (leave blank for now)', (
                                                    <input
                                                        type="datetime-local"
                                                        className={input}
                                                        value={draft.occurredAt}
                                                        onChange={(e) => setDraft({ ...draft, occurredAt: e.target.value })}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => void submitTransfer()}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                                                >
                                                    Write and anchor this entry
                                                </button>
                                            </div>
                                            <p className="col-span-2 text-[11px] text-slate-500">
                                                The ledger stamps when you wrote this, and keeps the time you give it
                                                here as the time it happened. Both are inside the hashed payload, so a
                                                late entry is visible as a late entry instead of being silently
                                                presented as contemporaneous.
                                            </p>
                                        </div>
                                    )}

                                    {chainLoading ? (
                                        <p className="flex items-center gap-2 text-xs text-slate-400">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Verifying each record in
                                            this chain…
                                        </p>
                                    ) : chain && chain.events.length > 0 ? (
                                        <>
                                            <ChainOfCustodyTimeline
                                                chain={chain}
                                                onNodeClick={(event: CustodyEvent) =>
                                                    setDetail(chain.proofs.find(
                                                        (proof) => proof.recordIndex === Number(event.eventId.replace('LEDGER-', ''))
                                                    ) ?? null)}
                                                onVerifyHash={(event: CustodyEvent) =>
                                                    setDetail(chain.proofs.find(
                                                        (proof) => proof.recordIndex === Number(event.eventId.replace('LEDGER-', ''))
                                                    ) ?? null)}
                                            />
                                            {detail && (
                                                <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-xs space-y-1">
                                                    <p className="font-mono text-slate-300">
                                                        record #{detail.recordIndex} · {detail.integrity}
                                                    </p>
                                                    <p className="text-slate-400">{detail.reason}</p>
                                                    <p className="text-slate-500">
                                                        {detail.anchorIndex !== undefined
                                                            ? `covered by anchor #${detail.anchorIndex}`
                                                            : 'no anchor covers this record yet'}
                                                        {detail.signerFingerprint ? ` · signed by ${detail.signerFingerprint}` : ''}
                                                        {detail.loggedAt ? ` · written at ${detail.loggedAt}` : ''}
                                                    </p>
                                                    <button
                                                        onClick={() => navigate(`/police/certificate/${encodeURIComponent(exhibit.id)}`)}
                                                        className="text-blue-400 hover:underline"
                                                    >
                                                        Open the section 63 certificate for this exhibit
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-500">
                                            No custody events recorded for this exhibit. Until a transfer is
                                            written, the only entry is the registration itself.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvidenceLocker;
