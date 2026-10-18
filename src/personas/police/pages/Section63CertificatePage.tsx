// src/personas/police/pages/Section63CertificatePage.tsx
// NyayaSahayak v2.0.0 - BSA s.63(4) certificate, mounted and bound to the ledger
//
// Route: /police/certificate and /police/certificate/:evidenceId
//
// Before this page existed, `Section63CertificateGenerator` was a complete component with no
// importer. It asked the officer to upload a file and hash it, which is a different act from
// certifying the exhibit already in the locker: the certificate would have attested to whatever
// bytes happened to be re-selected, not to what was anchored. Here the digest carried on Part A is
// the one recorded for that exhibit, and re-hashing a file is offered only as a check against it.
//
// Issuing a certificate writes two ledger records, which is not redundancy:
//   1. the statutory particulars as certified (exhibit digest, deponent, device, period of control);
//   2. the digest of the *printed text*, which includes record 1's coordinates and therefore cannot
//      be hashed before record 1 exists.
// That second record is what makes the downloaded file checkable by someone holding only the paper:
// re-render the fields, or `sha256sum` the file, and compare.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileCheck, ShieldAlert, Link2, Loader2 } from 'lucide-react';

import Section63CertificateGenerator from '../components/Section63CertificateGenerator';
import { getLedger } from '../../../services/akhandLedger';
import { formatSection63Certificate } from '../../../core/services/section63Certificate';
import { sha256Hex } from '../../../core/trust/sha256.ts';
import { findExhibit, listExhibits } from '../../../shared/utils/ledgerRecords';
import { useToast } from '../../../shared/hooks/useToast';
import { useWorkspace } from '../../../core/context/WorkspaceContext';
import type { LedgerRecord, RecordVerification } from '../../../core/trust/ledger.ts';
import type { Section63PartA } from '../../../types/evidence.types';

const Section63CertificatePage: React.FC = () => {
    const { showToast, updateToast } = useToast();
    const navigate = useNavigate();
    const { evidenceId } = useParams<{ evidenceId?: string }>();
    const { selectedCase } = useWorkspace();

    const [records, setRecords] = useState<LedgerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [verdict, setVerdict] = useState<RecordVerification | null>(null);
    const [issuedText, setIssuedText] = useState<string | null>(null);
    /** The LEDGER COORDINATES block, passed to the wizard so the download it produces is byte-for-byte the text whose digest was just recorded. */
    const [ledgerLines, setLedgerLines] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ledger = await getLedger();
            const all = await ledger.records();
            setRecords(all);
            const chosen = evidenceId ? findExhibit(all, evidenceId) : null;
            setVerdict(chosen ? await ledger.verifyRecord(chosen.recordIndex) : null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, [evidenceId]);

    useEffect(() => { void load(); }, [load]);

    const exhibits = useMemo(() => listExhibits(records), [records]);
    const selected = useMemo(
        () => (evidenceId ? findExhibit(records, evidenceId) : null),
        [evidenceId, records]
    );

    const handleCertificateGenerated = useCallback(async (partA: Section63PartA) => {
        if (!selected) return;
        const toastId = showToast('Writing the certificate to the ledger...', 'loading');
        try {
            const ledger = await getLedger();
            const base = {
                evidenceId: selected.id,
                caseId: selected.caseId ?? selectedCase?.id,
                fileName: selected.fileName,
                fileSize: selected.fileSize,
            };
            const exhibitAnchor = verdict?.anchorIndex;
            const written = await ledger.append({
                kind: 'CUSTOM',
                data: {
                    certificate: 'BSA-63(4)-PART-A',
                    ...base,
                    exhibitDigest: partA.hashValue.toUpperCase(),
                    exhibitRecord: selected.recordIndex,
                    deponent: `${partA.deponentName} (${partA.designation})`,
                    signedAt: partA.signatureTimestamp.toISOString(),
                },
            });
            const anchor = await ledger.anchor();
            const lines = [
                `Certificate particulars recorded as ledger record #${written.index}`,
                `Signed ${partA.signatureTimestamp.toISOString()} by ${partA.deponentName}`,
                `Exhibit ${selected.id} = ledger record #${selected.recordIndex}`
                + (exhibitAnchor !== undefined ? ` (anchored at #${exhibitAnchor})` : ' (NOT ANCHORED)'),
                anchor
                    ? `Covered by anchor #${anchor.anchorIndex}, Merkle root ${anchor.merkleRoot.slice(0, 16)}…`
                    : 'APPENDED BUT NOT ANCHORED — do not file this copy until an anchor covers it',
                `Record digest ${written.leafDigest.slice(0, 16)}…`,
            ];
            // The text the officer is handed, hashed as printed. The download re-renders from the
            // same fields and the same ledger lines, so the two agree byte for byte — including the
            // `Generated:` line, which is why it is derived from the signing time rather than a
            // clock read at click time.
            const printed = formatSection63Certificate(partA, { ...base, ledgerLines: lines });
            const printedDigest = (await sha256Hex(printed)).toUpperCase();
            const committed = await ledger.append({
                kind: 'CUSTOM',
                data: {
                    certificate: 'BSA-63(4)-PRINTED-DIGEST',
                    ...base,
                    coveringRecord: written.index,
                    printedDocumentDigest: printedDigest,
                },
            });
            await ledger.anchor();
            setLedgerLines(lines);
            setIssuedText(`The certificate text you can download hashes to\n${printedDigest}\n\n`
                + `That digest is ledger record #${committed.index}. Recompute it over the downloaded file `
                + '(sha256sum, certutil -hashfile, or the Hash Verification screen) and it must match exactly.');
            updateToast(
                toastId,
                written.persisted
                    ? `Certificate anchored as record #${written.index}`
                    : 'Certificate written, but the store refused to persist it — treat this copy as unsaved',
                written.persisted ? 'success' : 'error'
            );
            void load();
        } catch (cause) {
            updateToast(
                toastId,
                `Certificate was NOT recorded: ${cause instanceof Error ? cause.message : String(cause)}`,
                'error'
            );
        }
    }, [selected, selectedCase?.id, verdict?.anchorIndex, showToast, updateToast, load]);

    if (error) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-white">
                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg">
                    <p className="flex items-center gap-2 font-bold text-red-300">
                        <ShieldAlert className="w-4 h-4" /> The ledger could not be opened
                    </p>
                    <p className="text-sm text-slate-300 mt-2">{error}</p>
                    <p className="text-xs text-slate-400 mt-2">
                        No certificate should be issued while the journal is unreachable: it could not be
                        recorded, so nothing would be able to check it afterwards.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link to="/police/evidence" className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <FileCheck className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Section 63 Certificate</h1>
                    <p className="text-slate-400 text-sm">
                        Part A under section 63(4), BSA 2023 — issued against the digest the ledger holds
                    </p>
                </div>
            </div>

            {loading && (
                <p className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading the ledger…
                </p>
            )}

            {!loading && exhibits.length === 0 && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg mb-6">
                    <p className="text-sm text-slate-300">
                        No exhibit in the ledger yet. Hash and record evidence in the Evidence Locker first
                        — a section 63 certificate certifies a record, and there is nothing to certify
                        until one exists.
                    </p>
                    <button
                        onClick={() => navigate('/police/evidence')}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                        Open Evidence Locker
                    </button>
                </div>
            )}

            {!loading && exhibits.length > 0 && !selected && (
                <div className="mb-6">
                    <p className="text-xs uppercase text-slate-400 font-bold mb-2">
                        Choose the exhibit to certify
                    </p>
                    <div className="space-y-2">
                        {exhibits.map((exhibit) => (
                            <Link
                                key={exhibit.recordIndex}
                                to={`/police/certificate/${encodeURIComponent(exhibit.id)}`}
                                className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-lg"
                            >
                                <span className="min-w-0">
                                    <span className="block text-sm font-medium truncate">
                                        {exhibit.fileName ?? exhibit.id}
                                    </span>
                                    <span className="block text-xs text-slate-400 font-mono truncate">
                                        {exhibit.id} · record #{exhibit.recordIndex} · {exhibit.loggedAt}
                                    </span>
                                </span>
                                <span className="text-xs font-mono text-emerald-400 shrink-0 ml-3">
                                    {exhibit.fileDigest ? `${exhibit.fileDigest.slice(0, 12)}…` : 'no digest'}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {selected && (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <p className="text-slate-400 mb-1">Digest recorded in the ledger</p>
                            <p className="font-mono text-emerald-400 break-all">
                                {selected.fileDigest ?? '— none: this exhibit has no file digest on its record —'}
                            </p>
                            <p className="text-slate-500 mt-2">
                                Part A will carry this value. It is not recomputed here; recomputing it is the
                                optional check below.
                            </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <p className="text-slate-400 mb-1">Ledger status of that record</p>
                            <p className={verdict?.ok ? 'text-emerald-400' : 'text-amber-400'}>
                                {verdict
                                    ? `${verdict.ok ? 'Verified' : 'Not verified'} · record #${verdict.recordIndex}`
                                    : 'Checking…'}
                            </p>
                            {verdict && <p className="text-slate-500 mt-1 leading-snug">{verdict.reason}</p>}
                            <Link
                                to="/police/evidence"
                                className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-2"
                            >
                                <Link2 className="w-3 h-3" /> Chain of custody for this exhibit
                            </Link>
                        </div>
                    </div>

                    <Section63CertificateGenerator
                        evidenceId={selected.id}
                        fileName={selected.fileName}
                        fileSize={selected.fileSize}
                        caseId={selected.caseId ?? selectedCase?.id}
                        ledgerDigest={selected.fileDigest}
                        ledgerLines={ledgerLines}
                        ledgerDigestNote={
                            selected.fileDigest
                                ? `From ledger record #${selected.recordIndex}`
                                    + (verdict?.anchorIndex !== undefined
                                        ? `, anchored at #${verdict.anchorIndex}`
                                        : ', not yet anchored')
                                : 'This exhibit carries no file digest, so the certificate has to be built from a fresh hash of the file.'
                        }
                        onCertificateGenerated={(partA) => { void handleCertificateGenerated(partA); }}
                    />

                    {issuedText && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">
                                Certificate recorded — check it yourself
                            </p>
                            <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono break-all">
                                {issuedText}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Section63CertificatePage;
