import { useState } from 'react';
import { VerificationResult } from '../types';
import { verifyCase } from '../services/akhandLedger';
import { Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'tampered';

interface QuantumHashProofProps {
    caseId: string;
    onVerificationComplete?: (result: VerificationResult) => void;
}

import { useLocalization } from '../features/main/hooks/useLocalization';

export default function QuantumHashProof({ caseId, onVerificationComplete }: QuantumHashProofProps) {
    const [state, setState] = useState<VerificationState>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const { t } = useLocalization('en'); // Default to English for now, ideally passed as prop or from context

    const handleVerify = async () => {
        setState('verifying');
        setProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        // Call blockchain verification
        setTimeout(async () => {
            try {
                const verificationResult = await verifyCase(caseId);
                setResult(verificationResult);

                if (verificationResult.tampered) {
                    setState('tampered');
                } else {
                    setState('verified');
                }

                onVerificationComplete?.(verificationResult);
            } catch (error) {
                console.error('Verification failed:', error);
                setState('idle');
                alert(t('verification_failed_alert'));
            }
        }, 2000);
    };

    // 1. IDLE VIEW
    if (state === 'idle') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 text-center max-w-md mx-auto">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('verify_evidence_integrity')}</h3>
                <p className="text-gray-600 mb-6">
                    {t('verify_evidence_desc')}
                </p>
                <button
                    onClick={handleVerify}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Lock className="w-4 h-4" /> {t('verify_now_button')}
                </button>
            </div>
        );
    }

    // 2. VERIFYING VIEW
    if (state === 'verifying') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 text-center max-w-md mx-auto">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div
                        className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                    ></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('verifying_blockchain_hash')}</h3>
                <p className="text-gray-500 mb-4 text-sm">{t('computing_signatures')}</p>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-right text-gray-500">{progress}%</p>
            </div>
        );
    }

    // 3. VERIFIED VIEW (SUCCESS)
    if (state === 'verified' && result && !result.tampered) {
        return (
            <div className="bg-green-50 p-6 rounded-lg shadow-lg border border-green-200 max-w-md mx-auto animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 text-center mb-1">{t('evidence_verified_title')}</h3>
                <p className="text-green-700 text-center mb-6">{t('hashes_match_desc')}</p>

                <div className="bg-white p-4 rounded border border-green-100 mb-4 text-xs font-mono break-all">
                    <p className="text-gray-500 mb-1">{t('original_hash_label')}</p>
                    <p className="text-gray-800 mb-3">{result.originalHash}</p>

                    <p className="text-gray-500 mb-1">{t('current_hash_label')}</p>
                    <p className="text-gray-800">{result.currentHash}</p>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-100 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-800">{t('anchoring_label')}</p>
                        <p className="text-xs text-blue-700">{t('algorithm_label')}</p>
                        <p className="text-xs text-blue-700">{t('ledger_verification_status')}</p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    {t('verified_at_label')} {new Date().toLocaleString()}
                </p>
            </div>
        );
    }

    // 4. TAMPERED VIEW (FAILURE)
    if (state === 'tampered' || (result && result.tampered)) {
        return (
            <div className="bg-red-50 p-6 rounded-lg shadow-lg border border-red-200 max-w-md mx-auto animate-shake">
                <div className="flex items-center justify-center mb-4">
                    <AlertTriangle className="w-16 h-16 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 text-center mb-1">{t('evidence_tampering_title')}</h3>
                <p className="text-red-700 text-center mb-6">{t('evidence_modified_desc')}</p>

                {result && (
                    <div className="bg-white p-4 rounded border border-red-100 mb-4 text-xs font-mono break-all">
                        <p className="text-gray-500 mb-1">{t('original_hash_label')}</p>
                        <p className="text-gray-800 mb-2">{result.originalHash}</p>

                        <div className="text-center text-red-500 font-bold my-1">{t('mismatch_label')}</div>

                        <p className="text-gray-500 mb-1">{t('current_hash_label')}</p>
                        <p className="text-gray-800">{result.currentHash}</p>
                    </div>
                )}

                <div className="bg-red-100 p-3 rounded border border-red-200 mb-4">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {t('critical_integrity_violation')}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                        {t('integrity_violation_desc')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">
                        {t('flag_case_button')}
                    </button>
                    <button className="flex-1 bg-white border border-red-300 text-red-700 py-2 rounded font-bold hover:bg-red-50">
                        {t('contact_it_security_button')}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
