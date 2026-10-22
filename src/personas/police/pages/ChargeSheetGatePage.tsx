// src/personas/police/pages/ChargeSheetGatePage.tsx
// NyayaSahayak v2.0.0 - BNSS s.176(3) charge-sheet interlock, bound to the ledger
//
// Route: /police/chargesheet and /police/chargesheet/:caseId/gate
//
// `ChargeSheetGate` was already written and already called the real interlock; what it lacked was a
// parent, so it had been fed demo props. Here its inputs come out of the journal: the scene
// recording is an exhibit the locker marked `FORENSIC_SCENE_VIDEO`, and the expert's attendance is
// a companion record this page writes. Both carry their own verification verdict, so the gate is
// refusing or allowing submission on the strength of a signed record rather than a checkbox.
//
// What this page does not do is grant approvals. An override can be *requested* and recorded — the
// record is what makes it visible to the judge — but nothing here lets the same officer approve it,
// because a button that unlocks a statutory interlock for whoever presses it is not an interlock.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Scale, Video, UserCheck, Loader2, ShieldAlert, Save, FileSignature, Info,
} from 'lucide-react';

import ChargeSheetGate from '../components/ChargeSheetGate';
import { getLedger } from '../../../services/akhandLedger';
import {
    exhibitsForCase, isForensicSceneVideo, latestExpertVisit, latestOverrideRequest,
    listCases, sectionNumbers, type LedgerExhibit, type LedgerCase,
} from '../../../shared/utils/ledgerRecords';
import { toGoldenCase } from '../../../core/workspace/legacyCaseAdapter';
import { useToast } from '../../../shared/hooks/useToast';
import { useWorkspace } from '../../../core/context/WorkspaceContext';
import type { LedgerRecord } from '../../../core/trust/ledger.ts';
import type { ForensicVideoMetadata, ForensicVisitToken, OverrideReason } from '../../../types/forensic.types';

type OverrideShape = NonNullable<import('../../../types/forensic.types').ForensicCompliance['override']>;

const REASONS: { value: OverrideReason; label: string }[] = [
    { value: 'FORENSIC_TEAM_UNAVAILABLE', label: 'Forensic team not available' },
    { value: 'TECHNICAL_FAILURE', label: 'Equipment or technical failure' },
    { value: 'EXTREME_TERRAIN', label: 'Extreme terrain or security risk' },
    { value: 'INFRASTRUCTURE_LIMITATION', label: 'No FSL infrastructure in this jurisdiction' },
    { value: 'STATE_EXEMPTION', label: 'State exemption notification' },
    { value: 'OTHER', label: 'Other (state it)' },
];

const label = 'block text-xs text-slate-400 mb-1';
const box = 'w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1.5 text-white text-xs';

const ChargeSheetGatePage: React.FC = () => {
    const { showToast, updateToast } = useToast();
    const navigate = useNavigate();
    const { caseId } = useParams<{ caseId?: string }>();
    const { allCases, selectedCase } = useWorkspace();

    const [records, setRecords] = useState<LedgerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visitOpen, setVisitOpen] = useState(false);
    const [visit, setVisit] = useState({
        expertName: '', expertDesignation: '', expertOrganization: '', ioName: '',
        latitude: '', longitude: '', handshake: 'MANUAL', remarks: '',
    });
    const [submitted, setSubmitted] = useState<string | null>(null);
    /**
     * Live verification of the two records the gate rests on, keyed by journal index. Nothing is
     * trusted because it was once written: an exhibit whose digest no longer matches its record, or
     * an anchor whose key is no longer pinned, has to stop opening this gate.
     */
    const [verdicts, setVerdicts] = useState<Record<number, { ok: boolean; digestMatches: boolean; reason: string }>>({});

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ledger = await getLedger();
            setRecords(await ledger.records());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Cases in the journal first; the intake workspace fills the gaps, adapted to the same keys so
    // one screen can read both without the split-brain the ledger was built to remove.
    // `toGoldenCase` returns a result, not a Case (see the adapter's header), so a record this app
    // cannot date is *named* here rather than dropped: the list below shows the cases the interlock
    // can evaluate, and the line under it counts the ones it cannot. Hiding them entirely would
    // shrink the gate's denominator silently, which is the same class of defect the refusal exists to
    // stop. Both halves come out of one memo, so the pair cannot drift apart.
    const { cases, gateExclusions } = useMemo(() => {
        const fromLedger = listCases(records);
        const seen = new Set(fromLedger.map((entry) => entry.id));
        const fromWorkspace: LedgerCase[] = [];
        const excluded: { id: string; label: string; reason: string }[] = [];
        for (const entry of allCases) {
            if (seen.has(entry.id)) continue;
            const result = toGoldenCase(entry);
            if (!result.ok) {
                excluded.push({
                    id: entry.id,
                    label: `${entry.caseNumber || entry.id}${entry.title ? ` · ${entry.title}` : ''}`,
                    reason: result.reason,
                });
                continue;
            }
            const golden = result.case;
            fromWorkspace.push({
                    
                    id: golden.id,
                    cnrNumber: golden.cnrNumber,
                    complainant: golden.complainant,
                    respondent: golden.respondent,
                    caseType: golden.caseType,
                    summary: golden.summary,
                    filingDate: golden.filingDate,
                    incidentDate: golden.incidentDate,
                    sectionsInvoked: golden.sectionsInvoked,
                    applicableLaw: golden.applicableLaw,
                    isZeroFir: golden.isZeroFir,
                    status: golden.status,
                    recordIndex: -1,
                    loggedAt: golden.filingDate,
                    raw: {},
            });
        }
        return { cases: [...fromLedger, ...fromWorkspace], gateExclusions: excluded };
    }, [records, allCases]);

    const kase = useMemo(() => {
        if (caseId) {
            return cases.find((entry) => entry.id === caseId || entry.cnrNumber === caseId)
                ?? {
                    id: caseId, sectionsInvoked: [], recordIndex: -1, loggedAt: '', raw: {},
                };
        }
        const fallback = selectedCase ? listCases(records).find((e) => e.id === selectedCase.id) ?? null : null;
        return fallback;
    }, [caseId, cases, selectedCase, records]);

    const exhibits = useMemo<LedgerExhibit[]>(
        () => (kase ? exhibitsForCase(records, kase.id) : []),
        [records, kase]
    );

    const sceneVideoExhibit = useMemo(
        () => exhibits.find((exhibit) => isForensicSceneVideo(exhibit)) ?? null,
        [exhibits]
    );

    const expertVisit = useMemo(
        () => (kase ? latestExpertVisit(records, kase.id) : null),
        [records, kase]
    );

    const overrideRecord = useMemo(
        () => (kase ? latestOverrideRequest(records, kase.id) : null),
        [records, kase]
    );

    const writeCompanion = useCallback(async (
        data: Record<string, unknown>,
        toastId: number,
        describe: (index: number, anchored: boolean) => string
    ) => {
        const ledger = await getLedger();
        const written = await ledger.append({ kind: 'CUSTOM', data });
        const anchor = await ledger.anchor();
        const verdict = await ledger.verifyRecord(written.index);
        updateToast(toastId, describe(written.index, Boolean(anchor) && verdict.ok), verdict.ok ? 'success' : 'error');
        await load();
        return written;
    }, [load, updateToast]);

    const saveExpertVisit = async () => {
        if (!kase) return;
        if (!visit.expertName.trim() || !visit.ioName.trim()) {
            showToast('Name the expert and the investigating officer. An unsigned visit record is a rumour.', 'error', 7000);
            return;
        }
        const toastId = showToast('Recording the expert visit...', 'loading');
        try {
            await writeCompanion({
                companionKind: 'FORENSIC_EXPERT_VISIT',
                caseId: kase.id,
                ioName: visit.ioName.trim(),
                expertName: visit.expertName.trim(),
                expertDesignation: visit.expertDesignation.trim() || 'Forensic Expert',
                expertOrganization: visit.expertOrganization.trim() || 'Forensic Science Laboratory',
                handshakeMethod: visit.handshake,
                remarks: visit.remarks.trim() || undefined,
                geo: visit.latitude && visit.longitude
                    ? { latitude: Number(visit.latitude), longitude: Number(visit.longitude) }
                    : undefined,
                visitTimestamp: new Date().toISOString(),
            }, toastId, (index, verified) =>
                `Visit recorded as ledger record #${index}${verified ? ' and anchored' : ' — NOT verifiable yet'}`);
            setVisitOpen(false);
        } catch (cause) {
            updateToast(toastId, `Not recorded: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        }
    };

    useEffect(() => {
        const indexes = [sceneVideoExhibit?.recordIndex, expertVisit?.recordIndex]
            .filter((index): index is number => typeof index === 'number' && index >= 0);
        if (indexes.length === 0) {
            setVerdicts({});
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const ledger = await getLedger();
                const next: Record<number, { ok: boolean; digestMatches: boolean; reason: string }> = {};
                for (const index of indexes) {
                    const verdict = await ledger.verifyRecord(index);
                    next[index] = { ok: verdict.ok, digestMatches: verdict.digestMatches, reason: verdict.reason };
                }
                if (!cancelled) setVerdicts(next);
            } catch (cause) {
                if (!cancelled) {
                    setVerdicts({});
                    setError(cause instanceof Error ? cause.message : String(cause));
                }
            }
        })();
        return () => { cancelled = true; };
    }, [sceneVideoExhibit?.recordIndex, expertVisit?.recordIndex]);

    const forensicVideo: ForensicVideoMetadata | null = useMemo(() => {
        if (!kase || !sceneVideoExhibit) return null;
        const videoVerdict = verdicts[sceneVideoExhibit.recordIndex];
        return {
            videoId: sceneVideoExhibit.id,
            caseId: kase.id,
            fileName: sceneVideoExhibit.fileName ?? 'unlabelled scene video',
            fileSize: sceneVideoExhibit.fileSize ?? 0,
            duration: sceneVideoExhibit.durationSeconds ?? 0,
            mimeType: sceneVideoExhibit.fileType ?? 'video/*',
            captureDevice: {
                make: sceneVideoExhibit.device?.make ?? 'unknown',
                model: sceneVideoExhibit.device?.model ?? 'unknown',
                osVersion: sceneVideoExhibit.device?.osVersion ?? 'unknown',
            },
            captureTimestamp: new Date(sceneVideoExhibit.captureTimestamp ?? sceneVideoExhibit.loggedAt),
            // This app has no time source to sync against and does not claim one.
            ntpSynced: false,
            geoLocation: sceneVideoExhibit.geo ?? { latitude: 0, longitude: 0 },
            sourceHash: (sceneVideoExhibit.fileDigest ?? '').toUpperCase(),
            hashAlgorithm: 'SHA-256',
            ledgerBlockId: `ledger-record-${sceneVideoExhibit.recordIndex}`,
            // `uploadStatus` here is the ledger's answer, not a claim about a server: 'VERIFIED'
            // only when the record's digest and its anchor both check out. The interlock treats
            // UPLOADED and VERIFIED alike on this leg; integrity is judged separately.
            uploadStatus: videoVerdict?.ok ? 'VERIFIED' : 'UPLOADED',
            integrityStatus: !videoVerdict
                ? 'UNVERIFIED'
                : videoVerdict.ok
                    ? 'VERIFIED'
                    : videoVerdict.digestMatches
                        ? 'UNVERIFIED'
                        : 'MISMATCH',
        };
    }, [kase, sceneVideoExhibit, verdicts]);

    const expertToken: ForensicVisitToken | null = useMemo(() => {
        if (!kase || !expertVisit) return null;
        return {
            tokenId: `LEDGER-${expertVisit.recordIndex}`,
            caseId: kase.id,
            investigatingOfficerId: expertVisit.ioId ?? expertVisit.ioName ?? 'unknown',
            investigatingOfficerName: expertVisit.ioName ?? 'unknown',
            forensicExpertId: expertVisit.expertName ?? 'unknown',
            forensicExpertName: expertVisit.expertName ?? 'unknown',
            forensicExpertDesignation: expertVisit.expertDesignation ?? 'Forensic Expert',
            visitTimestamp: new Date(expertVisit.visitTimestamp ?? expertVisit.loggedAt),
            geoLocation: {
                latitude: expertVisit.geo?.latitude ?? 0,
                longitude: expertVisit.geo?.longitude ?? 0,
                accuracy: -1,
            },
            handshakeMethod: 'MANUAL',
            // The device key's signature over this record is the "digital signature" here, and the
            // record index is where a reader goes to check it. Nothing more is claimed.
            digitalSignature: expertVisit.leafDigest,
            // Not `true`: the visit only counts as verified when the ledger says the record behind it
            // is intact, anchored and signed by a key this device trusts.
            isVerified: verdicts[expertVisit.recordIndex]?.ok ?? false,
        };
    }, [kase, expertVisit, verdicts]);

    const recordedOverride: OverrideShape | undefined = useMemo(() => {
        if (!overrideRecord) return undefined;
        const reason = REASONS.some((entry) => entry.value === overrideRecord.reason)
            ? (overrideRecord.reason as OverrideReason)
            : 'OTHER';
        return {
            requestedBy: overrideRecord.requestedBy ?? 'unknown',
            requestedAt: new Date(overrideRecord.requestedAt ?? overrideRecord.loggedAt),
            reason,
            reasonDetails: overrideRecord.details ?? '',
            isApproved: false,
            judicialReviewFlag: true,
        };
    }, [overrideRecord]);

    const handleSubmit = async () => {
        if (!kase) return;
        const toastId = showToast('Filing the charge sheet record...', 'loading');
        try {
            await writeCompanion({
                companionKind: 'CHARGE_SHEET_FILED',
                caseId: kase.id,
                cnrNumber: kase.cnrNumber,
                sections: kase.sectionsInvoked,
                applicableLaw: kase.applicableLaw,
                incidentDate: kase.incidentDate,
                sceneVideoRecord: sceneVideoExhibit?.recordIndex ?? null,
                expertVisitRecord: expertVisit?.recordIndex ?? null,
                overrideRecord: overrideRecord?.recordIndex ?? null,
                note: 'The interlock was open when this was written. This record states what the journal held at that moment; it is not a court finding.',
            }, toastId, (index) => {
                setSubmitted(`Charge sheet filed. Ledger record #${index}.`);
                return `Charge sheet record anchored as #${index}`;
            });
        } catch (cause) {
            updateToast(toastId, `Not filed: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        }
    };

    const requestOverride = async (reason: OverrideReason, details: string) => {
        if (!kase) return;
        const toastId = showToast('Recording the override request...', 'loading');
        try {
            await writeCompanion({
                companionKind: 'FORENSIC_OVERRIDE_REQUEST',
                caseId: kase.id,
                requestedBy: 'the officer holding this device',
                reason,
                details,
                requestedAt: new Date().toISOString(),
            }, toastId, (index) => `Override request recorded as record #${index} — it stays pending until a superior approves it outside this app`);
        } catch (cause) {
            updateToast(toastId, `Override NOT recorded: ${cause instanceof Error ? cause.message : String(cause)}`, 'error');
        }
    };

    if (error) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-white">
                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg">
                    <p className="flex items-center gap-2 font-bold text-red-300">
                        <ShieldAlert className="w-4 h-4" /> The ledger could not be opened
                    </p>
                    <p className="text-sm text-slate-300 mt-2">{error}</p>
                    <p className="text-xs text-slate-400 mt-2">
                        With the journal unreadable there is nothing to check the scene recording or the
                        expert visit against, so the gate cannot honestly open or close. Fix the store
                        before filing.
                    </p>
                </div>
            </div>
        );
    }

    const sections = kase?.sectionsInvoked ?? [];

    return (
        <div className="text-white p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link to="/police/dashboard" className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Scale className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Charge Sheet — Forensic Interlock</h1>
                    <p className="text-slate-400 text-sm">
                        BNSS s.176(3) videography and expert attendance, read out of the case record
                    </p>
                </div>
            </div>

            {loading && (
                <p className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading the journal…
                </p>
            )}

            {!loading && !caseId && (
                <div className="mb-6">
                    <p className="text-xs uppercase text-slate-400 font-bold mb-2">Cases on this device</p>
                    {gateExclusions.length > 0 && (
                        <p className="text-sm text-amber-400/90 mb-2" role="status">
                            {gateExclusions.length} case{gateExclusions.length === 1 ? '' : 's'} listed below
                            cannot be gated: no incident or filing date is recorded, so this app will not
                            decide whether the BNS or the IPC applies.{' '}
                            <span className="text-slate-400">
                                ({gateExclusions.map((e) => e.label).join(', ')})
                            </span>
                        </p>
                    )}
                    {cases.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No case has been recorded. File the FIR first — the interlock decides
                            whether s.176(3) applies from the sections and the date on the case record.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {cases.map((entry) => (
                                <Link
                                    key={`${entry.id}-${entry.recordIndex}`}
                                    to={`/police/chargesheet/${encodeURIComponent(entry.id)}/gate`}
                                    className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-lg text-sm"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{entry.id}</span>
                                        <span className="block text-xs text-slate-400 truncate">
                                            {entry.cnrNumber ?? 'no CNR'} · {(entry.sectionsInvoked.join(', ') || 'no sections recorded')}
                                        </span>
                                    </span>
                                    <span className="text-xs text-slate-500 shrink-0 ml-3">
                                        {entry.incidentDate ? `incident ${entry.incidentDate.slice(0, 10)}` : ''}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {kase && (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <p className="text-slate-400 mb-1">Sections on the case record</p>
                            <p className="font-mono text-slate-200 break-words">
                                {sections.length ? sections.join(', ') : 'none recorded — the interlock cannot decide mandate from nothing'}
                            </p>
                            <p className="text-slate-500 mt-1">
                                matched numbers: {sectionNumbers(sections).join(', ') || '—'}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <p className="flex items-center gap-1 text-slate-400 mb-1">
                                <Video className="w-3 h-3" /> Scene recording in the locker
                            </p>
                            {sceneVideoExhibit ? (
                                <p className="text-slate-200">
                                    {sceneVideoExhibit.fileName ?? sceneVideoExhibit.id}
                                    <span className="block text-slate-500 font-mono">
                                        record #{sceneVideoExhibit.recordIndex}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-amber-300">
                                    None marked. Upload it in the Evidence Locker with the s.176(3)
                                    box ticked — a video file sitting in the locker is not, by itself,
                                    scene videography.
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <p className="flex items-center gap-1 text-slate-400 mb-1">
                                <UserCheck className="w-3 h-3" /> Expert attendance
                            </p>
                            {expertVisit ? (
                                <p className="text-slate-200">
                                    {expertVisit.expertName}
                                    <span className="block text-slate-500 font-mono">
                                        record #{expertVisit.recordIndex} · {expertVisit.loggedAt}
                                    </span>
                                    <span className={`block mt-1 ${verdicts[expertVisit.recordIndex]?.ok ? 'text-emerald-400' : 'text-amber-300'}`}>
                                        {verdicts[expertVisit.recordIndex]?.ok
                                            ? 'ledger: verified'
                                            : verdicts[expertVisit.recordIndex]?.reason ?? 'checking this record…'}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-amber-300">
                                    Not recorded.{' '}
                                    <button onClick={() => setVisitOpen(true)} className="text-blue-400 hover:underline">
                                        Log the visit
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>

                    {visitOpen && (
                        <div className="mb-6 p-4 bg-slate-900/60 border border-slate-700 rounded-lg grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                                <p className="text-slate-400">
                                    There is no QR or NFC handshake in this app: a "digital handshake" is
                                    recorded as one officer's signed journal entry naming the expert. It
                                    documents who was said to be there. It does not identify them.
                                </p>
                            </div>
                            <label className="block">
                                <span className={label}>Investigating officer *</span>
                                <input className={box} value={visit.ioName} onChange={(e) => setVisit({ ...visit, ioName: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={label}>Forensic expert *</span>
                                <input className={box} value={visit.expertName} onChange={(e) => setVisit({ ...visit, expertName: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={label}>Expert designation</span>
                                <input className={box} value={visit.expertDesignation} onChange={(e) => setVisit({ ...visit, expertDesignation: e.target.value })} placeholder="e.g. Scientist 'B'" />
                            </label>
                            <label className="block">
                                <span className={label}>Laboratory / organisation</span>
                                <input className={box} value={visit.expertOrganization} onChange={(e) => setVisit({ ...visit, expertOrganization: e.target.value })} placeholder="e.g. FSL Rohini" />
                            </label>
                            <label className="block">
                                <span className={label}>Scene latitude</span>
                                <input className={box} value={visit.latitude} onChange={(e) => setVisit({ ...visit, latitude: e.target.value })} inputMode="decimal" />
                            </label>
                            <label className="block">
                                <span className={label}>Scene longitude</span>
                                <input className={box} value={visit.longitude} onChange={(e) => setVisit({ ...visit, longitude: e.target.value })} inputMode="decimal" />
                            </label>
                            <label className="block col-span-2">
                                <span className={label}>Remarks</span>
                                <textarea className={box} rows={2} value={visit.remarks} onChange={(e) => setVisit({ ...visit, remarks: e.target.value })} />
                            </label>
                            <div className="col-span-2 flex justify-end gap-2">
                                <button onClick={() => setVisitOpen(false)} className="px-3 py-2 border border-slate-600 text-slate-300 rounded text-xs">
                                    Cancel
                                </button>
                                <button onClick={() => void saveExpertVisit()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1">
                                    <Save className="w-3 h-3" /> Write and anchor this record
                                </button>
                            </div>
                        </div>
                    )}

                    <ChargeSheetGate
                        caseId={kase.id}
                        cnrNumber={kase.cnrNumber}
                        sections={sections}
                        lawCode={kase.applicableLaw ?? 'BNS'}
                        incidentDate={kase.incidentDate ?? null}
                        forensicVideo={forensicVideo}
                        expertVisitToken={expertToken}
                        recordedOverride={recordedOverride}
                        onOverrideRequested={(reason, details) => { void requestOverride(reason, details); }}
                        onSubmit={() => void handleSubmit()}
                        onUploadVideo={() => navigate('/police/evidence')}
                        onRequestExpert={() => setVisitOpen(true)}
                    />

                    {submitted && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2">
                            <FileSignature className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-300">{submitted}</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-slate-800/40 border border-slate-700 rounded-lg text-[11px] text-slate-400 space-y-2">
                        <p className="font-bold text-slate-300 uppercase">Read this before relying on the lock</p>
                        <p>
                            BNSS s.176(3) requires the forensic expert to visit the scene and the
                            investigation officer to record it on video for offences punishable with seven
                            years or more, and the report must carry that video. It also binds a State only
                            <em> from such date as may be notified</em> by that State within five years of
                            commencement, and applies where the State or Union Territory laboratory lacks the
                            equipment or personnel.
                        </p>
                        <p>
                            This screen enforces the requirement as a matter of this project's policy, from
                            01-07-2024 onward. It is not a court's ruling on whether your State has issued
                            that notification, and an override recorded here is an unresolved request in
                            front of a judge — not a permission.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChargeSheetGatePage;
