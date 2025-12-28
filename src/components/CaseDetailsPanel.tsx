import { useState } from 'react';
import { Case } from '../types';
import { FileText, Search, ChevronDown, ChevronUp, Calendar, Activity, Scale, File } from 'lucide-react';

interface CaseDetailsPanelProps {
    caseData: Case | null;
    onSearchPrecedents: (query: string) => void;
    t: (key: string) => string;
}

export default function CaseDetailsPanel({ caseData, onSearchPrecedents, t }: CaseDetailsPanelProps) {
    const [showFullNotes, setShowFullNotes] = useState(false);

    if (!caseData) {
        return (
            <div className="flex-1 flex items-center justify-center text-white/30 italic">
                {t('select_case_prompt')}
            </div>
        );
    }

    const handleSearch = () => {
        // Construct a search query from case details
        const query = `${caseData.caseType} ${caseData.sectionsInvoked.join(' ')} ${caseData.summary}`;
        onSearchPrecedents(query);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight title">{caseData.cnrNumber}</h1>
                    <p className="text-lg text-white/80 mt-1 font-medium">
                        {caseData.complainant} <span className="text-white/40 text-sm uppercase tracking-wider mx-1">vs</span> {caseData.respondent}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="bg-ns-primary-500/20 text-ns-primary-500 border border-ns-primary-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {caseData.caseType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${caseData.urgency === 'HIGH' ? 'border-ns-danger/30 text-ns-danger bg-ns-danger/10' :
                        caseData.urgency === 'MEDIUM' ? 'border-ns-warning/30 text-ns-warning bg-ns-warning/10' :
                            'border-ns-success/30 text-ns-success bg-ns-success/10'
                        }`}>
                        {caseData.urgency} {t('urgency')}
                    </span>
                </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-quiet p-4 rounded-xl border border-white/5">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                        <Calendar className="w-3 h-3" /> {t('filing_date_title')}
                    </label>
                    <p className="font-medium text-white">{new Date(caseData.filingDate).toLocaleDateString()}</p>
                </div>
                <div className="glass-quiet p-4 rounded-xl border border-white/5">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                        <Activity className="w-3 h-3" /> {t('current_status')}
                    </label>
                    <p className="font-medium text-white">{caseData.status}</p>
                </div>
                <div className="col-span-2 glass-quiet p-4 rounded-xl border border-white/5">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        <Scale className="w-3 h-3" /> {t('invoked_acts')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {caseData.sectionsInvoked.map((sec, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors cursor-default">
                                {sec}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Case Summary & Notes */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-ns-accent-500" /> {t('case_summary')}
                </h3>
                <div className="text-white/70 leading-relaxed glass-quiet p-5 rounded-xl border border-white/5 text-sm">
                    {caseData.summary}
                </div>

                <div className="mt-6">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <File className="w-3 h-3" /> {t('case_notes')}
                    </h4>
                    <div className={`text-sm text-white/60 relative ${!showFullNotes ? 'max-h-24 overflow-hidden' : ''}`}>
                        {caseData.caseNotes}
                        {!showFullNotes && (
                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-ns-bg1/90 to-transparent" />
                        )}
                    </div>
                    <button
                        onClick={() => setShowFullNotes(!showFullNotes)}
                        className="mt-2 text-ns-primary-400 text-xs font-medium flex items-center gap-1 hover:text-ns-primary-300 transition-colors"
                    >
                        {showFullNotes ? (
                            <>{t('show_less')} <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>{t('show_more')} <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
                <button
                    onClick={handleSearch}
                    className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-ns-primary-900/20"
                >
                    <Search className="w-4 h-4" /> {t('search_similar_precedents')}
                </button>
            </div>
        </div>
    );
}
