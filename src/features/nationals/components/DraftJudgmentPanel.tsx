import React from 'react';
import { Case } from '../core/types';
import { FileSignature, Shield, AlertCircle, CheckCircle, Gavel, Flame } from 'lucide-react';

interface DraftJudgmentPanelProps {
    caseData: Case;
    draft: string;
    onDraftChange: (text: string) => void;
    onVipakshAudit: () => void;
    vipakshMode: boolean;
    vipakshResults: any[];
    onCreateBail: (amount: number) => void;
    onSign: () => void;
}

const DraftJudgmentPanel: React.FC<DraftJudgmentPanelProps> = ({
    caseData,
    draft,
    onDraftChange,
    onVipakshAudit,
    vipakshMode,
    vipakshResults,
    onCreateBail,
    onSign
}) => {
    const handleGenerateDraft = () => {
        const template = `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE
CASE NO: ${caseData.cnrNumber || 'N/A'}

${caseData.complainant || 'Complainant'} ... Complainant
VERSUS
${caseData.respondent} ... Accused

ORDER

1. This is an application for bail filed under Section 437 CrPC.
2. The accused is charged with offences under ${(caseData.sectionsInvoked || []).join(', ')}.
3. Heard the learned counsel for the applicant and the learned APP for the State.
4. Considering the facts and circumstances...

[...Judge to complete...]
    `;
        onDraftChange(template);
    };

    const applyFix = (quote: string, fix: string) => {
        const newDraft = draft.replace(quote, fix);
        onDraftChange(newDraft);
    };

    return (
        <div className="draft-panel bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col h-full">
            <div className="header flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                    <FileSignature className="text-blue-600" /> Draft Judgment
                </h2>
                <div className="actions flex gap-2">
                    <button
                        onClick={handleGenerateDraft}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                    >
                        Generate Draft
                    </button>
                    <button
                        onClick={onVipakshAudit}
                        className={`px-3 py-1.5 border rounded text-sm font-bold flex items-center gap-1 transition-colors ${vipakshMode
                            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                    >
                        {vipakshMode ? <Flame size={14} className="animate-pulse" /> : <Shield size={14} />}
                        {vipakshMode ? 'Vipaksh Active' : 'Run Vipaksh Audit'}
                    </button>
                </div>
            </div>

            <div className={`content grid flex-1 min-h-0 gap-4 ${vipakshMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* LEFT PANEL: Draft */}
                <div className={`flex flex-col h-full ${vipakshMode ? 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800' : ''}`}>
                    {vipakshMode && (
                        <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-2 text-sm flex items-center gap-1">
                            <Gavel size={14} /> Nyaya-Sahayak Draft
                        </h3>
                    )}
                    <textarea
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        className="w-full flex-grow p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
                        placeholder="Order will appear here..."
                    />
                    <div className="mt-2 text-xs text-gray-500 text-right">
                        Word Count: {draft.split(/\s+/).filter(Boolean).length}
                    </div>
                </div>

                {/* RIGHT PANEL: Vipaksh Audit */}
                {vipakshMode && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-2 border-red-500 flex flex-col h-full overflow-hidden">
                        <div className="mb-4 flex-shrink-0">
                            <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5" /> VIPAKSH AUDIT
                            </h3>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                Adversarial AI acting as Defense Counsel
                            </p>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                            {vipakshResults.map((result, idx) => (
                                <div key={idx} className="risk-card bg-white dark:bg-gray-800 border-l-4 border-red-500 p-3 shadow-sm rounded-r">
                                    <h4 className="font-bold text-red-700 dark:text-red-400 text-xs uppercase flex items-center gap-1">
                                        <AlertCircle size={12} /> Risk {idx + 1}: {result.type}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic border-l-2 pl-2 my-1 border-gray-300 dark:border-gray-600">
                                        "{result.quote}"
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                        Issue: {result.weakness}
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">
                                            Fix: {result.fix}
                                        </p>
                                        <button
                                            onClick={() => applyFix(result.quote, result.fix)}
                                            className="w-full py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-xs hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <CheckCircle size={10} /> Apply Fix
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="footer mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => onCreateBail(50000)}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm font-bold transition-colors"
                    >
                        Grant Bail (₹50k)
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
                        Save Draft
                    </button>
                    <button
                        onClick={onSign}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold shadow-md flex items-center gap-2 transition-colors"
                    >
                        <FileSignature size={16} /> Sign & Seal Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftJudgmentPanel;
