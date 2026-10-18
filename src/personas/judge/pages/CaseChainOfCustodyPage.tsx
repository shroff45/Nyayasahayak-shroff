// src/personas/judge/pages/CaseChainOfCustodyPage.tsx
// NyayaSahayak v2.0.0 - the chain of custody, as the court sees it
//
// Routes: /judge/custody (pick a case) and /judge/case/:id/chain-of-custody (the deep link a party
// would be served). Both land here.
//
// Every node on the timeline is one record in the ledger journal, and every badge on it is the
// answer `verifyRecord` gave for that record just now — recomputed on every load, so nothing here
// can be a stale green tick. The export box produces the inclusion proof for a single record; the
// verify box checks a proof someone pastes in, on this machine, against the keys pinned on this
// machine. That pair is the whole point: a court should be able to re-run the check without taking
// the producing side's word for it.
//
// What it cannot show: who really held the exhibit. The journal records what was written and when it
// was written — see docs/TRUST_MODEL.md.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ShieldCheck, ShieldX, AlertTriangle, Download, Search, Loader2, RefreshCw, FileJson, Info,
} from 'lucide-react';

import ChainOfCustodyTimeline from '../../../shared/components/ChainOfCustodyTimeline';
import { buildCustodyChain, type CustodyChainWithProofs } from '../../../core/trust/custody.ts';
import { exportCertificate, getLedger, getLedgerStatus, verifyCertificate, type LedgerStatus } from '../../../services/akhandLedger';
import { exhibitsForCase, listCases, type LedgerCase, type LedgerExhibit } from '../../../shared/utils/ledgerRecords';
import { useWorkspace } from '../../../core/context/WorkspaceContext';
import type { LedgerRecord } from '../../../core/trust/ledger.ts';

const label = 'text-xs text-slate-400';

const CaseChainOfCustodyPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const { allCases } = useWorkspace();

    const [records, setRecords] = useState<LedgerRecord[]>([]);
    const [status, setStatus] = useState<LedgerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evidenceId, setEvidenceId] = useState<string | null>(null);
    const [chain, setChain] = useState<CustodyChainWithProofs | null>(null);
    const [chainBusy, setChainBusy] = useState(false);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [pasted, setPasted] = useState('');
    const [checkResult, setCheckResult] = useState<{ ok: boolean; reason: string } | null>(null);
    const [checking, setChecking] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ledger = await getLedger();
            setRecords(await ledger.records());
            setStatus(await getLedgerStatus());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const kase: LedgerCase | null = useMemo(() => {
        if (!id) return null;
        const fromLedger = listCases(records).find((entry) => entry.id === id || entry.cnrNumber === id);
        if (fromLedger) return fromLedger;
        // The case may exist only in the intake workspace; the custody records are still keyed by
        // its id, so show them rather than reporting an empty case.
        const fromWorkspace = allCases.find((entry) => entry.id === id);
        return fromWorkspace
            ? {
                id: fromWorkspace.id,
                cnrNumber: fromWorkspace.caseNumber,
                complainant: fromWorkspace.petitioner,
                respondent: fromWorkspace.respondent,
                caseType: fromWorkspace.caseType,
                summary: fromWorkspace.summary,
                filingDate: fromWorkspace.filingDate,
                incidentDate: fromWorkspace.filingDate,
                sectionsInvoked: fromWorkspace.invokedActs,
                recordIndex: -1,
                loggedAt: fromWorkspace.filingDate,
                raw: {},
            }
            : { id, sectionsInvoked: [], recordIndex: -1, loggedAt: '', raw: {} };
    }, [id, records, allCases]);

    const exhibits = useMemo(
        () => (kase ? exhibitsForCase(records, kase.id) : []),
        [records, kase]
    );

    const chosen = useMemo(
        () => exhibits.find((exhibit) => exhibit.id === evidenceId) ?? exhibits[0] ?? null,
        [exhibits, evidenceId]
    );

    const loadChain = useCallback(async (exhibit: LedgerExhibit | null) => {
        if (!exhibit) {
            setChain(null);
            return;
        }
        setChainBusy(true);
        try {
            const ledger = await getLedger();
            setChain(await buildCustodyChain(ledger, {
                evidenceId: exhibit.id,
                caseId: exhibit.caseId,
                description: exhibit.fileName,
            }));
        } catch (cause) {
            setChain(null);
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setChainBusy(false);
        }
    }, []);

    useEffect(() => { void loadChain(chosen); }, [chosen, loadChain]);

    const downloadProof = async (recordIndex: number) => {
        try {
            const json = await exportCertificate(recordIndex);
            const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `ledger-proof-record-${recordIndex}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };

    const runCheck = async () => {
        setChecking(true);
        setCheckResult(null);
        try {
            setCheckResult(await verifyCertificate(pasted));
        } catch (cause) {
            setCheckResult({ ok: false, reason: cause instanceof Error ? cause.message : String(cause) });
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen text-white p-6 max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" /> Chain of Custody
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Read from the device ledger, verified record by record at the moment you opened it
                    </p>
                    {kase && (
                        <p className="text-xs font-mono text-slate-500 mt-2">
                            case {kase.id}{kase.cnrNumber ? ` · ${kase.cnrNumber}` : ''}
                            {kase.sectionsInvoked.length ? ` · ${kase.sectionsInvoked.join(', ')}` : ''}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs"
                        title="Timeline language"
                    >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                    </select>
                    <button
                        onClick={() => { void load(); void loadChain(chosen); }}
                        className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Re-verify
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-sm text-red-200">
                    {error}
                </div>
            )}

            {!id && (
                <div className="mb-6">
                    <p className={`${label} uppercase font-bold mb-2`}>Cases with records on this device</p>
                    {loading ? (
                        <p className="flex items-center gap-2 text-sm text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" /> Reading the journal…
                        </p>
                    ) : listCases(records).length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No case has been recorded in this device's ledger, so there is no custody
                            chain to show. A timeline that reads "verified" over an empty journal would be
                            the worst possible output of this screen.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {listCases(records).map((entry) => (
                                <Link
                                    key={`${entry.id}-${entry.recordIndex}`}
                                    to={`/judge/case/${encodeURIComponent(entry.id)}/chain-of-custody`}
                                    className="p-3 bg-slate-800/50 border border-slate-700 hover:border-emerald-500 rounded-lg"
                                >
                                    <p className="text-sm font-medium">{entry.id}</p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {entry.cnrNumber ?? 'no CNR'} · {entry.respondent ?? entry.complainant ?? '—'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {kase && (
                <>
                    <div className="mb-6">
                        <p className={`${label} uppercase font-bold mb-2`}>Exhibits recorded for this case</p>
                        {exhibits.length === 0 ? (
                            <p className="text-sm text-amber-300">
                                Nothing in the ledger names this case as an exhibit owner. Either the
                                evidence was filed without a case id, or none was ever filed.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {exhibits.map((exhibit) => (
                                    <button
                                        key={exhibit.recordIndex}
                                        onClick={() => setEvidenceId(exhibit.id)}
                                        className={`text-xs px-3 py-2 rounded-lg border ${chosen?.recordIndex === exhibit.recordIndex
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        {exhibit.fileName ?? exhibit.id}
                                        <span className="block text-[10px] text-slate-500 font-mono">
                                            record #{exhibit.recordIndex}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {chainBusy && (
                        <p className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Re-computing every digest and
                            inclusion proof in this chain…
                        </p>
                    )}

                    {chain && !chainBusy && (
                        <div className="space-y-6">
                            <ChainOfCustodyTimeline chain={chain} language={language} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                                    <p className={`${label} uppercase font-bold mb-3`}>Per-record verification</p>
                                    <div className="space-y-2">
                                        {chain.proofs.map((proof) => (
                                            <div key={proof.recordIndex} className="text-xs p-2 bg-slate-900/50 rounded-lg">
                                                <p className="flex items-center gap-2 font-mono">
                                                    {proof.integrity === 'VERIFIED' ? (
                                                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                                    ) : proof.integrity === 'MISMATCH' ? (
                                                        <ShieldX className="w-3 h-3 text-red-400" />
                                                    ) : (
                                                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                                                    )}
                                                    <span className={proof.integrity === 'VERIFIED' ? 'text-emerald-400'
                                                        : proof.integrity === 'MISMATCH' ? 'text-red-400' : 'text-amber-400'}>
                                                        record #{proof.recordIndex} · {proof.integrity}
                                                    </span>
                                                    <button
                                                        onClick={() => void downloadProof(proof.recordIndex)}
                                                        className="ml-auto text-blue-400 hover:underline flex items-center gap-1"
                                                        title="Download the inclusion proof for this record"
                                                    >
                                                        <FileJson className="w-3 h-3" /> proof
                                                    </button>
                                                </p>
                                                <p className="text-slate-400 mt-1 leading-snug">{proof.reason}</p>
                                                <p className="text-slate-500 mt-1">
                                                    {proof.anchorIndex !== undefined ? `anchor #${proof.anchorIndex}` : 'no anchor'}
                                                    {proof.signerFingerprint ? ` · ${proof.signerFingerprint}` : ''}
                                                    {proof.loggedAt && proof.loggedAt !== chain.events.find((e) => e.eventId === `LEDGER-${proof.recordIndex}`)?.timestamp.toISOString()
                                                        ? ` · written at ${proof.loggedAt}`
                                                        : ''}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {chain.gaps.length > 0 && (
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                            <p className="text-xs uppercase font-bold text-amber-300 mb-2">
                                                Unexplained periods
                                            </p>
                                            <ul className="space-y-2 text-xs text-slate-300">
                                                {chain.gaps.map((gap) => (
                                                    <li key={`${gap.fromEvent}-${gap.toEvent}`}>
                                                        <span className="font-mono text-amber-200">
                                                            {gap.gapDuration}h
                                                        </span>{' '}
                                                        between {gap.fromEvent} and {gap.toEvent}. {gap.reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                                        <p className={`${label} uppercase font-bold mb-2`}>
                                            Verify a proof offline
                                        </p>
                                        <p className="text-[11px] text-slate-400 mb-2">
                                            Paste an inclusion-proof certificate (as exported by any
                                            terminal) to check it here, against the keys pinned on this
                                            machine. No network is involved, and nothing is written.
                                        </p>
                                        <textarea
                                            value={pasted}
                                            onChange={(e) => setPasted(e.target.value)}
                                            rows={5}
                                            placeholder='{ "record": …, "proof": …, "anchor": … }'
                                            className="w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1.5 text-white font-mono text-[11px]"
                                        />
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => void runCheck()}
                                                disabled={!pasted.trim() || checking}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1"
                                            >
                                                {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                                Check this proof
                                            </button>
                                            {status && (
                                                <span className="text-[11px] text-slate-500">
                                                    {status.pinnedAuthorities} pinned key(s){status.selfSignedOnly ? ' · only this device’s own key' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {checkResult && (
                                            <p className={`mt-3 text-xs ${checkResult.ok ? 'text-emerald-400' : 'text-red-300'}`}>
                                                {checkResult.ok
                                                    ? 'Proof holds: the digest, the path and the anchor signature agree.'
                                                    : `Proof does not hold: ${checkResult.reason}`}
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-[11px] text-slate-400 space-y-2">
                                        <p className="flex items-center gap-1 font-bold text-slate-300 uppercase">
                                            <Info className="w-3 h-3" /> What this page cannot tell you
                                        </p>
                                        <p>
                                            The ledger records when a transfer was <em>written</em>, and by
                                            which device key — not who physically held the exhibit, and not
                                            that the events are complete. Absence of a record is absence of a
                                            record.
                                        </p>
                                        <p>
                                            A verified badge means: this payload hashes to the digest stored
                                            beside it, an anchor covers it, the Merkle path reaches the root
                                            in that anchor, and the anchor's signature verifies against a key
                                            you have pinned. Nothing more.
                                        </p>
                                        {status?.selfSignedOnly && (
                                            <p className="text-amber-300">
                                                Only this device's own key is pinned, so a proof produced
                                                elsewhere on this machine verifies against itself. Ask for the
                                                producing terminal's key to be pinned before treating that as
                                                independent attestation.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {kase && !chain && !chainBusy && !loading && (
                        <div className="p-6 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                            <Download className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">
                                {exhibits.length === 0
                                    ? 'No exhibit to show a chain for.'
                                    : 'Pick an exhibit to verify its chain.'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CaseChainOfCustodyPage;
