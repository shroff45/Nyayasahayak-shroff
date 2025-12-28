import { Case } from '../types';
import { Clock, AlertCircle, Search } from 'lucide-react';

interface CaseQueueProps {
    cases: Case[];
    onSelectCase: (id: string) => void;
    selectedCaseId: string | undefined;
    t: (key: string) => string;
}

export default function CaseQueue({ cases, onSelectCase, selectedCaseId, t }: CaseQueueProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
                <h2 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider opacity-90">
                    <Clock className="w-4 h-4 text-ns-primary-500" /> {t('case_list_header')}
                </h2>
                <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input
                        type="text"
                        placeholder={t('search_by_title_number')}
                        className="w-full text-sm pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-ns-primary-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {cases.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => onSelectCase(c.id)}
                        className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-200 group ${selectedCaseId === c.id
                            ? 'bg-ns-primary-900/20 border-l-4 border-l-ns-primary-500 pl-[12px]' // Adjust padding to account for border
                            : 'hover:bg-white/5 border-l-4 border-l-transparent'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{c.cnrNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${c.urgency === 'HIGH' ? 'bg-ns-danger/20 text-ns-danger border border-ns-danger/20' :
                                c.urgency === 'MEDIUM' ? 'bg-ns-warning/20 text-ns-warning border border-ns-warning/20' :
                                    'bg-ns-success/20 text-ns-success border border-ns-success/20'
                                }`}>
                                {c.urgency}
                            </span>
                        </div>
                        <h3 className={`font-medium text-sm truncate mb-1 ${selectedCaseId === c.id ? 'text-white' : 'text-white/80 group-hover:text-white'}`} title={c.complainant + ' v. ' + c.respondent}>
                            {c.complainant} v. {c.respondent}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <AlertCircle className="w-3 h-3" />
                            <span>{new Date(c.filingDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}

                {cases.length === 0 && (
                    <div className="p-8 text-center text-white/30 text-sm italic">
                        {t('no_cases_found')}
                    </div>
                )}
            </div>
        </div>
    );
}
