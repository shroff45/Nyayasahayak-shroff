/**
 * Document integrity check - the screen that used to be called "Quantum Fingerprinting".
 *
 * It does one thing: computes SHA-256 over the bytes in front of the user (text pasted in, or a
 * file read from disk) and asks this device's journal whether a record stores that digest. The
 * wording of the answer comes from `integrityLookup.ts`, not from this file, and there is no
 * language model anywhere in the path - the previous version asked one to "generate a unique
 * quantum cryptographic hash" over the document and printed whatever came back as a fingerprint,
 * which is a hash-shaped sentence, not an integrity check.
 *
 * No API key is required, and none is consulted. The AI banner is deliberately absent here.
 */

import { useCallback, useRef, useState } from 'react';
import { sha256Hex, sha256OfFile } from '../../core/trust/sha256.ts';
import { getLedger } from '../../services/akhandLedger.ts';
import {
    findByDigest,
    integrityVerdict,
    isSha256Hex,
    INTEGRITY_FOOTNOTE,
    type IntegrityVerdict,
} from '../utils/integrityLookup.ts';

interface DocumentIntegrityCheckProps {
    t: (key: string) => string;
    /** Optional activity-log sink. The caller owns the log type; this component owns the sentence. */
    onActivity?: (details: string) => void;
}

type Source = 'text' | 'file';

const STATE_STYLE: Record<IntegrityVerdict['state'], string> = {
    FOUND_ANCHORED: 'border-emerald-300/70 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-700',
    FOUND_UNANCHORED: 'border-amber-300/70 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700',
    NOT_IN_JOURNAL: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40',
};

const DocumentIntegrityCheck: React.FC<DocumentIntegrityCheckProps> = ({ t, onActivity }) => {
    const [source, setSource] = useState<Source>('text');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [verdict, setVerdict] = useState<IntegrityVerdict | null>(null);
    const [digest, setDigest] = useState<string | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const run = useCallback(async () => {
        if (source === 'text' && !text.trim()) return;
        if (source === 'file' && !file) return;
        setBusy(true);
        setVerdict(null);
        setDigest(null);
        setFailure(null);
        try {
            // The digest is computed here, from these bytes, on this device. Nothing else produces it.
            const computed = source === 'text'
                ? await sha256Hex(text)
                : await sha256OfFile(file as File, (fraction) => setProgress(fraction));
            setDigest(computed);

            const ledger = await getLedger();
            const records = await ledger.records();
            const match = findByDigest(records, computed);
            // Anchoring is read from the ledger, never from the record's own fields - see integrityVerdict.
            const anchored = match ? (await ledger.getProof(match.recordIndex)) !== null : false;
            const result = integrityVerdict(match, anchored, records.length === 0);
            setVerdict(result);
            onActivity?.(`Ran a document integrity check. ${result.label}.`);
        } catch (error) {
            // A store that cannot be read is not a verdict about the document, so it is reported as a
            // failure to check and never as NOT IN JOURNAL.
            setFailure(error instanceof Error ? error.message : String(error));
        } finally {
            setBusy(false);
            setProgress(null);
        }
    }, [file, onActivity, source, text]);

    const canRun = !busy && (source === 'text' ? text.trim().length > 0 : file !== null);

    return (
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
            <header className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('integrity_check_title')}</h2>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{t('integrity_check_desc')}</p>
            </header>

            <div className="mt-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
                <div className="flex gap-2" role="tablist" aria-label={t('integrity_check_title')}>
                    {(['text', 'file'] as Source[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            role="tab"
                            aria-selected={source === mode}
                            onClick={() => { setSource(mode); setVerdict(null); setDigest(null); setFailure(null); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                source === mode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {mode === 'text' ? t('integrity_mode_text') : t('integrity_mode_file')}
                        </button>
                    ))}
                </div>

                {source === 'text' ? (
                    <textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        rows={6}
                        className="mt-4 w-full p-3 text-sm border rounded-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono"
                        placeholder={t('integrity_text_placeholder')}
                    />
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                                const chosen = event.target.files?.[0] ?? null;
                                setFile(chosen);
                                setVerdict(null);
                                setDigest(null);
                                setFailure(null);
                            }}
                        />
                        {file ? (
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                <span className="font-semibold">{file.name}</span>
                                {' '}· {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('integrity_file_placeholder')}</p>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={run}
                    disabled={!canRun}
                    className="mt-4 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
                >
                    {busy ? t('integrity_running') : t('integrity_run')}
                </button>
                {busy && progress !== null && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        {t('integrity_hashing')} {(progress * 100).toFixed(0)}%
                    </p>
                )}

                {failure && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-300/70 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                        {failure}
                    </p>
                )}

                {digest && (
                    <div className="mt-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {t('integrity_digest_label')}
                        </p>
                        <p className="mt-1 p-3 rounded-lg bg-gray-100 dark:bg-gray-900/60 text-blue-700 dark:text-blue-300 font-mono text-xs break-all leading-relaxed">
                            {digest}
                        </p>
                        {!isSha256Hex(digest) && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t('integrity_digest_unexpected')}</p>
                        )}
                    </div>
                )}

                {verdict && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`mt-6 p-4 rounded-xl border ${STATE_STYLE[verdict.state]}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {t('integrity_journal_label')}
                        </p>
                        <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{verdict.label}</p>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{verdict.detail}</p>
                        {verdict.exhibit && (
                            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                {verdict.exhibit.fileName && (
                                    <>
                                        <dt className="font-semibold">{t('integrity_field_name')}</dt>
                                        <dd className="break-all">{verdict.exhibit.fileName}</dd>
                                    </>
                                )}
                                <dt className="font-semibold">{t('integrity_field_logged')}</dt>
                                <dd>{verdict.exhibit.loggedAt}</dd>
                                {verdict.exhibit.caseId && (
                                    <>
                                        <dt className="font-semibold">{t('integrity_field_case')}</dt>
                                        <dd>{verdict.exhibit.caseId}</dd>
                                    </>
                                )}
                            </dl>
                        )}
                    </div>
                )}

                <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{INTEGRITY_FOOTNOTE}</p>
            </div>
        </div>
    );
};

export default DocumentIntegrityCheck;
