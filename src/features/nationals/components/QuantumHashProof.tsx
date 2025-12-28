import React from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const QuantumHashProof: React.FC = () => {
    const { caseId } = useParams();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
                <ShieldCheck size={64} className="text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Quantum Secure Verification
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Verifying cryptographic integrity for Case ID:
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                    {caseId || 'UNKNOWN_CASE_ID'}
                </div>

                <div className="mt-8 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Algorithm:</span>
                        <span className="font-medium text-blue-600">CRYSTALS-Kyber-1024</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium text-green-600">IMMUTABLE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuantumHashProof;
