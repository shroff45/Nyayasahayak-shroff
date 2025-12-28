import React from 'react';
import { Case } from '../core/types';
import { FileText, Calendar, User, Gavel } from 'lucide-react';

interface CaseSummaryCardProps {
    caseData: Case;
}

const CaseSummaryCard: React.FC<CaseSummaryCardProps> = ({ caseData }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{caseData.cnrNumber || 'N/A'}</h2>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{caseData.caseType}</span>
                        <span>•</span>
                        <span>Filed: {new Date(caseData.filingDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${caseData.status === 'FILED' ? 'bg-blue-100 text-blue-800' :
                    caseData.status === 'HEARING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {caseData.status || 'UNKNOWN'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <User size={12} /> Complainant
                    </div>
                    <div className="font-semibold">{caseData.complainant || 'Unknown'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <User size={12} /> Respondent
                    </div>
                    <div className="font-semibold">{caseData.respondent}</div>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Case Summary
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded">
                    {caseData.summary}
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {(caseData.sectionsInvoked || []).map(sec => (
                    <span key={sec} className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-medium">
                        {sec}
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    Next Hearing: <span className="font-semibold text-gray-900">{caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleDateString() : 'Not Scheduled'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Gavel size={14} />
                    Adjournments: <span className="font-semibold text-gray-900">{caseData.adjournmentsCount || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default CaseSummaryCard;
