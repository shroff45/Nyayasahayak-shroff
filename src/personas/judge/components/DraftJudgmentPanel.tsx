import React from 'react';
import { Case } from '../../../core/types';
import { FileSignature, Shield, CheckCircle, Flame, Sparkles } from 'lucide-react';

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

5. The bail is granted subject to the following conditions: (a) surrender passport, (b) weekly reporting to station..
6. Given the flight risk and severity of offense, bail is denied at this stage, referencing Sanjay Chandra v. CBI..

Date: 12/8/2025
(Signed)
District Judge`;
        onDraftChange(template);
    };

    const applyFix = (quote: string, fix: string) => {
        const newDraft = draft.replace(quote, fix);
        onDraftChange(newDraft);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col h-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <FileSignature size={18} className="text-blue-400" /> NYAYA-SAHAYAK DRAFT
                </h3>
                <button
                    onClick={handleGenerateDraft}
                    className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                    <Sparkles size={12} /> Generate Draft Order
                </button>
            </div>

            <div className={`flex-1 min-h-0 grid ${vipakshMode ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-slate-200`}>
                {/* Editor Area */}
                <div className="flex flex-col h-full bg-slate-50">
                    <textarea
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        className="flex-1 w-full p-6 bg-transparent border-none resize-none font-serif text-slate-800 leading-relaxed focus:ring-0 text-base"
                        placeholder="Select a case and generate draft..."
                    />
                </div>

                {/* Vipaksh Panel */}
                {vipakshMode && (
                    <div className="flex flex-col h-full bg-red-50/50">
                        <div className="p-3 bg-red-900/90 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield className="animate-pulse text-red-300" size={16} />
                                <div>
                                    <h4 className="font-bold text-sm">VIPAKSH (ADVERSARY) AUDIT</h4>
                                    <p className="text-[10px] text-red-200">Identifying weak points before the defense does.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {vipakshResults.map((result, idx) => (
                                <div key={idx} className="bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm p-4">
                                    <div className="mb-2 text-slate-600 italic text-sm border-l-2 border-slate-200 pl-3">
                                        "{result.quote}"
                                    </div>
                                    <p className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wide">
                                        Issue: {result.weakness}
                                    </p>

                                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                        <p className="text-[10px] text-green-800 font-bold mb-1 uppercase">SUGGESTED FIX:</p>
                                        <p className="text-sm text-green-900 mb-2 font-medium">{result.fix}</p>
                                        <button
                                            onClick={() => applyFix(result.quote, result.fix)}
                                            className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <CheckCircle size={12} /> Apply Fix
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Toolbar */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-400 font-mono">
                    Words: {draft.split(/\s+/).filter(Boolean).length} | Characters: {draft.length}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onVipakshAudit}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${vipakshMode
                            ? 'bg-red-100 text-red-700 border border-red-200 shadow-inner'
                            : 'bg-white border border-red-200 text-red-600 hover:bg-red-50 shadow-sm'}`}
                    >
                        {vipakshMode ? <Flame size={16} className="animate-bounce" /> : <Shield size={16} />}
                        {vipakshMode ? 'Audit Active' : 'Run Vipaksh Audit'}
                    </button>

                    <button
                        onClick={() => onCreateBail(50000)}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all"
                    >
                        Grant Bail (₹50,000 surety)
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-1"></div>

                    <button
                        onClick={onSign}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:translate-y-[-1px] transition-all flex items-center gap-2"
                    >
                        <FileSignature size={16} /> Sign & Seal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftJudgmentPanel;
