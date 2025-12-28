import React, { useState } from 'react';
import { Case } from '@core/types';
import { Loader2, Brain, Gavel, FileText } from 'lucide-react';

// --- MOCKS FOR MISSING SERVICES ---
const geminiService = {
    predictCaseOutcome: async (_caseData: any, _lang: any) => {
        await new Promise(r => setTimeout(r, 1000));
        return {
            priority: 'High',
            rationale: 'Based on the severity of the charges (IPC 302) and the presence of forensic evidence, this case warrants immediate judicial attention.',
            contributingFactors: ['Severity of Offense', 'Forensic Evidence Available', 'Public Interest'],
            legalCitations: ['State vs. Nanavati (1959)', 'IPC Section 302']
        };
    }
};

// --- INLINE COMPONENTS ---
const Spinner = () => <Loader2 className="animate-spin text-blue-600" />;

// Modal component removed as it was unused in the simplified version


// --- MAIN COMPONENT ---
interface CaseTriageProps {
    cases: Case[];
    onSelectCase: (c: Case) => void;
}

export const CaseTriage: React.FC<CaseTriageProps> = ({ cases, onSelectCase }) => {
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async () => {
        if (!selectedCase) return;
        setLoading(true);
        const result = await geminiService.predictCaseOutcome(selectedCase, 'en');
        setPrediction(result);
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* LIST VIEW */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden h-[600px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Case Queue</h3>
                    <p className="text-xs text-slate-500">{cases.length} Pending Cases</p>
                </div>
                <div className="overflow-y-auto p-2 space-y-2">
                    {cases.map(c => (
                        <div
                            key={c.id}
                            onClick={() => { setSelectedCase(c); onSelectCase(c); setPrediction(null); }}
                            className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedCase?.id === c.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-mono text-slate-500">{c.cnrNumber}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.urgency === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{c.urgency}</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{c.complainant} v. {c.respondent}</h4>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 rounded text-slate-600 dark:text-slate-400">{c.caseType}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DETAIL VIEW */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-[600px] overflow-y-auto relative">
                {selectedCase ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{selectedCase.cnrNumber}</span>
                                <h2 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{selectedCase.complainant} vs. {selectedCase.respondent}</h2>
                            </div>
                            <button
                                onClick={handlePredict}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                            >
                                {loading ? <Spinner /> : <><Brain size={16} /> AI Analysis</>}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCase.status}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Next Hearing</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCase.nextHearingDate || 'Not Scheduled'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2"><FileText size={16} /> Summary</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl">{selectedCase.summary}</p>
                        </div>

                        {prediction && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-2xl animate-fade-in-up">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2"><Brain size={18} /> AI Prediction</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Recommended Priority:</span>
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">{prediction.priority}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{prediction.rationale}"</p>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Citations</p>
                                        <div className="flex flex-wrap gap-2">
                                            {prediction.legalCitations.map((cit: string) => (
                                                <span key={cit} className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{cit}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Gavel size={48} className="mb-4 opacity-20" />
                        <p>Select a case to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
