import { useState, useEffect } from 'react';
import { Case, LegalPrecedent } from '../types';
import { FileEdit, ShieldAlert, Check, AlertTriangle, Wand2 } from 'lucide-react';

interface DraftJudgmentPanelProps {
    caseData: Case | null;
    precedents: LegalPrecedent[];
    onDraftGenerated: (draft: string) => void;
    t: (key: string) => string;
}

interface VipakshRisk {
    type: string;
    quote: string;
    weakness: string;
    fix: string;
}

export default function DraftJudgmentPanel({ caseData, precedents, onDraftGenerated, t }: DraftJudgmentPanelProps) {
    const [draftOrder, setDraftOrder] = useState('');
    const [showVipaksh, setShowVipaksh] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [vipakshResults, setVipakshResults] = useState<VipakshRisk[]>([]);

    useEffect(() => {
        if (caseData) {
            // Reset when case changes
            setDraftOrder('');
            setShowVipaksh(false);
            setVipakshResults([]);
        }
    }, [caseData?.id]);

    const generateDraft = () => {
        if (!caseData) return;

        const draft = `IN THE COURT OF THE DISTRICT JUDGE
CASE NO: ${caseData.cnrNumber}

BETWEEN:
${caseData.complainant} ... Complainant
AND
${caseData.respondent} ... Respondent

ORDER

1. This case was filed on ${new Date(caseData.filingDate).toLocaleDateString()} under sections ${caseData.sectionsInvoked.join(', ')}.
2. The complainant alleges that ${caseData.summary}.
3. The accused was seen near the scene of the crime.
4. Considering the arguments and the precedents cited (${precedents.map(p => p.citation).join(', ')}), the court finds merit in the prosecution's case.
5. The bail is granted subject to conditions.
6. The accused shall remain in custody pending trial.

Date: ${new Date().toLocaleDateString()}
(Signed)
District Judge`;

        setDraftOrder(draft);
        onDraftGenerated(draft);
    };

    const handleRunVipaksh = async () => {
        // Visual Persona Switch Animation
        // In dark mode, we might want a subtle red flash or border change instead of body bg
        const originalTransition = document.body.style.transition;
        document.body.style.transition = 'box-shadow 0.2s';
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255, 61, 90, 0.2)'; // Red flash
        setTimeout(() => {
            document.body.style.boxShadow = '';
            document.body.style.transition = originalTransition;
        }, 300);

        setShowVipaksh(true);
        setIsAnalyzing(true);

        // Mock Vipaksh analysis delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock results
        const mockResults: VipakshRisk[] = [
            {
                type: "Weak Evidence Link",
                quote: "The accused was seen near the scene",
                weakness: "Circumstantial evidence without corroboration. Presence near scene doesn't prove guilt.",
                fix: "The accused was seen near the scene, corroborated by CCTV footage and witness testimony."
            },
            {
                type: "Procedural Gap",
                quote: "The bail is granted subject to conditions",
                weakness: "Conditions not explicitly stated. Vague terms can lead to appeal.",
                fix: "The bail is granted subject to the following conditions: (a) surrender passport, (b) weekly reporting to station."
            },
            {
                type: "Constitutional Challenge",
                quote: "The accused shall remain in custody pending trial",
                weakness: "Article 21 (Right to Personal Liberty) requires bail consideration. Blanket custody may be challenged.",
                fix: "Given the flight risk and severity of offense, bail is denied at this stage, referencing Sanjay Chandra v. CBI."
            }
        ];

        setVipakshResults(mockResults);
        setIsAnalyzing(false);
    };

    const applyFix = (quote: string, fix: string) => {
        const updatedDraft = draftOrder.replace(quote, fix);
        setDraftOrder(updatedDraft);
        // Could add highlight effect here
    };

    if (!caseData) return null;

    return (
        <div className="flex h-full gap-4">
            {/* LEFT: Draft Editor (Blue Theme) */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ${showVipaksh ? 'w-1/2' : 'w-full'}`}>
                <div className="bg-ns-primary-900/20 p-3 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-ns-primary-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <FileEdit className="w-4 h-4" /> {t('nyayasahayak_draft')}
                    </h3>
                    <button
                        onClick={generateDraft}
                        className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1"
                    >
                        <Wand2 className="w-3 h-3" /> {t('generate_draft_order')}
                    </button>
                </div>
                <textarea
                    value={draftOrder}
                    onChange={(e) => setDraftOrder(e.target.value)}
                    className="flex-1 p-4 font-mono text-sm bg-transparent text-white/80 focus:bg-white/5 outline-none resize-none custom-scrollbar"
                    placeholder={t('draft_placeholder')}
                />

                {!showVipaksh && draftOrder && (
                    <div className="mt-4 text-center absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                        <button
                            onClick={handleRunVipaksh}
                            className="btn bg-ns-danger border-ns-danger/50 text-white shadow-lg shadow-ns-danger/30 hover:bg-ns-danger/90 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <ShieldAlert className="w-5 h-5" /> {t('run_vipaksh_analysis')}
                        </button>
                        <p className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">{t('adversarial_audit_desc')}</p>
                    </div>
                )}
            </div>

            {/* RIGHT: Vipaksh Panel (Red Theme - Initially Hidden) */}
            {showVipaksh && (
                <div className="flex-1 flex flex-col bg-ns-danger/5 border-l border-white/10 animate-in slide-in-from-right duration-500">
                    <div className="bg-ns-danger/20 text-ns-danger p-4 border-b border-ns-danger/20 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">{t('vipaksh_audit_title')}</h3>
                            <p className="text-[10px] opacity-80">{t('vipaksh_audit_desc')}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center h-40 text-ns-danger">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ns-danger mb-2"></div>
                                <p className="text-sm font-medium">{t('analyzing_logic')}</p>
                                <p className="text-xs opacity-70">{t('checking_precedents')}</p>
                            </div>
                        ) : (
                            vipakshResults.map((risk, index) => (
                                <div key={index} className="glass-quiet p-4 rounded-xl border-l-4 border-l-ns-danger border-y border-r border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-ns-danger text-xs uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {t('risk')} {index + 1}: {risk.type}
                                        </span>
                                    </div>

                                    <div className="mb-3 bg-white/5 p-2 rounded text-xs italic text-white/60 border-l-2 border-white/10">
                                        "{risk.quote}"
                                    </div>

                                    <p className="text-sm text-white/80 mb-3 font-medium">
                                        <span className="text-ns-danger/80 text-xs uppercase mr-1">{t('issue_label')}</span> {risk.weakness}
                                    </p>

                                    <div className="bg-ns-success/10 p-3 rounded-lg border border-ns-success/20">
                                        <p className="text-xs font-bold text-ns-success mb-1 uppercase tracking-wider">{t('suggested_fix_label')}</p>
                                        <p className="text-sm text-white/90 mb-3">{risk.fix}</p>
                                        <button
                                            onClick={() => applyFix(risk.quote, risk.fix)}
                                            className="w-full bg-ns-success/20 text-ns-success border border-ns-success/30 px-3 py-1.5 rounded text-xs font-bold hover:bg-ns-success/30 flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Check className="w-3 h-3" /> {t('apply_fix_button')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
