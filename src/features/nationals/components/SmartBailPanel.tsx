import React, { useState } from 'react';
import { SmartBailContract } from '../core/types';
import { verifyCourtAppearance, releaseBailAmount } from '../shared/services/akhandLedger';
import { ShieldCheck, CalendarCheck, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface SmartBailPanelProps {
    contract: SmartBailContract;
}

const SmartBailPanel: React.FC<SmartBailPanelProps> = ({ contract }) => {
    const [localContract, setLocalContract] = useState(contract);
    const [message, setMessage] = useState('');

    const handleVerifyAppearance = () => {
        // Simulate verifying the next pending date
        const nextDate = localContract.releaseConditions.courtDates.find(d => !localContract.verifiedAppearances?.includes(d));
        if (!nextDate) return;

        const result = verifyCourtAppearance(localContract.transactionId, nextDate, "mock-bio-hash");
        if (result.success) {
            setLocalContract(prev => ({
                ...prev,
                verifiedAppearances: [...(prev.verifiedAppearances || []), nextDate],
                status: result.status,
                complianceScore: (((prev.verifiedAppearances?.length || 0) + 1) / prev.releaseConditions.courtDates.length) * 100,
                refundEligible: result.status === 'ACTIVE'
            }));
            setMessage(`Verified appearance for ${nextDate}`);
        }
    };

    const handleReleaseRefund = () => {
        const result = releaseBailAmount(localContract.transactionId);
        if (result.success) {
            setLocalContract(prev => ({ ...prev, status: 'REFUNDED' }));
            setMessage(`Refund of ₹${result.refundAmount} initiated!`);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="text-purple-600" size={20} />
                Smart Bail Contract (DeFi)
            </h3>

            <div className="bg-purple-50 p-3 rounded mb-3 text-sm">
                <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Tx ID:</span>
                    <span className="font-mono text-xs text-purple-800 truncate w-24" title={localContract.transactionId}>
                        {localContract.transactionId}
                    </span>
                </div>
                <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-gray-900">₹{localContract.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-bold px-2 rounded text-xs ${localContract.status === 'ACTIVE' ? 'bg-green-200 text-green-800' :
                        localContract.status === 'REFUNDED' ? 'bg-blue-200 text-blue-800' :
                            'bg-yellow-200 text-yellow-800'
                        }`}>
                        {localContract.status}
                    </span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Compliance Score</span>
                    <span>{localContract.complianceScore.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${localContract.complianceScore}%` }}
                    ></div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Court Appearances</h4>
                {localContract.releaseConditions.courtDates.map(date => {
                    const isVerified = localContract.verifiedAppearances?.includes(date);
                    return (
                        <div key={date} className="flex items-center justify-between text-sm p-2 border rounded bg-gray-50">
                            <span className="flex items-center gap-2">
                                <CalendarCheck size={14} className={isVerified ? "text-green-500" : "text-gray-400"} />
                                {date}
                            </span>
                            {isVerified ? (
                                <CheckCircle size={16} className="text-green-500" />
                            ) : (
                                <span className="text-xs text-orange-500 font-medium">Pending</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {message && (
                <div className="mb-3 p-2 bg-blue-50 text-blue-800 text-xs rounded flex items-center gap-2">
                    <AlertCircle size={12} /> {message}
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleVerifyAppearance}
                    disabled={localContract.status !== 'LOCKED'}
                    className="flex-1 py-2 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50"
                >
                    Verify Appearance
                </button>
                {localContract.refundEligible && localContract.status !== 'REFUNDED' && (
                    <button
                        onClick={handleReleaseRefund}
                        className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                        <Wallet size={14} /> Release Refund
                    </button>
                )}
            </div>
        </div>
    );
};

export default SmartBailPanel;
