import { useState, useEffect } from 'react';
import {
    Case,
    LegalPrecedent,
    GraphNode,
    GraphLink
} from '../types';
import { searchLegalPrecedents } from '../services/vidhikRAG';
import { applicableLawFor } from '../core/workspace/legacyCaseAdapter';
import CaseQueue from './CaseQueue';
import CaseDetailsPanel from './CaseDetailsPanel';
import DraftJudgmentPanel from './DraftJudgmentPanel';
import AdjournmentRiskPanel from './AdjournmentRiskPanel';
import GraphVisualizationPanel from './GraphVisualizationPanel';

interface JudgeDashboardProps {
    t: (key: string) => string;
}

export default function JudgeDashboard({ t }: JudgeDashboardProps) {
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [precedents, setPrecedents] = useState<LegalPrecedent[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mock initial data
    useEffect(() => {
        const mockCases: Case[] = [
            {
                id: "C001",
                incidentDate: "2024-03-14",
                cnrNumber: "DL/2024/00001",
                complainant: "State of Delhi",
                respondent: "Rahul Kumar",
                caseType: "Criminal",
                summary: "Accused charged with theft under IPC 379. Caught on CCTV.",
                caseNotes: "First hearing. Accused in custody.",
                filingDate: "2024-11-20",
                status: "HEARING",
                urgency: "HIGH",
                sectionsInvoked: ["IPC 379"],
                adjournmentsCount: 0,
                lawyerId: "L001",
                isZeroFir: false,
                applicableLaw: applicableLawFor("2024-03-14")
            },
            {
                id: "C002",
                incidentDate: "2024-02-02",
                cnrNumber: "DL/2024/00045",
                complainant: "Amit Shah",
                respondent: "Vijay Mallya",
                caseType: "Civil",
                summary: "Recovery of debt amounting to 50 Lakhs.",
                caseNotes: "Respondent seeking adjournment.",
                filingDate: "2024-10-15",
                status: "HEARING",
                urgency: "MEDIUM",
                sectionsInvoked: ["Contract Act"],
                adjournmentsCount: 2,
                lawyerId: "L002",
                isZeroFir: false,
                applicableLaw: applicableLawFor("2024-02-02")
            },
            {
                id: "C003",
                incidentDate: "2024-01-20",
                cnrNumber: "DL/2024/00112",
                complainant: "Priya Singh",
                respondent: "Rohan Singh",
                caseType: "Family",
                summary: "Divorce petition on grounds of cruelty.",
                caseNotes: "Mediation failed.",
                filingDate: "2024-09-01",
                status: "HEARING",
                urgency: "LOW",
                sectionsInvoked: ["HMA 13(1)"],
                adjournmentsCount: 1,
                lawyerId: "L003",
                isZeroFir: false,
                applicableLaw: applicableLawFor("2024-01-20")
            }
        ];
        setCases(mockCases);
        setSelectedCase(mockCases[0]);
    }, []);

    const handleSelectCase = (id: string) => {
        const c = cases.find(c => c.id === id) || null;
        setSelectedCase(c);
        // Reset search results when changing case
        setPrecedents([]);
        setGraphData(null);
    };

    const handleSearchPrecedents = async (query: string) => {
        setIsLoading(true);
        try {
            const result = await searchLegalPrecedents(query);
            if (result.success) {
                setPrecedents(result.results);
                setGraphData(result.graphData);
            } else {
                setPrecedents([]);
                setGraphData(null);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDraftGenerated = (draft: string) => {
        console.log("Draft generated:", draft);
        // In a real app, this might save to the backend
    };

    return (
        <div className="flex h-[calc(100vh-90px)] gap-4 overflow-hidden">
            {/* LEFT: Case Queue (20%) */}
            <div className="w-[22%] min-w-[280px] glass rounded-2xl overflow-hidden flex flex-col">
                <CaseQueue
                    cases={cases}
                    onSelectCase={handleSelectCase}
                    selectedCaseId={selectedCase?.id}
                    t={t}
                />
            </div>

            {/* CENTER: Case Details (50%) */}
            <div className="flex-1 flex flex-col min-w-[400px] gap-4">
                <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col">
                    <CaseDetailsPanel
                        caseData={selectedCase}
                        onSearchPrecedents={handleSearchPrecedents}
                        t={t}
                    />
                </div>

                {/* Draft Panel at bottom of Center */}
                <div className="h-[45%] glass rounded-2xl overflow-hidden flex flex-col">
                    <DraftJudgmentPanel
                        caseData={selectedCase}
                        precedents={precedents}
                        onDraftGenerated={handleDraftGenerated}
                        t={t}
                    />
                </div>
            </div>

            {/* RIGHT: AI Tools (30%) */}
            <div className="w-[28%] min-w-[300px] flex flex-col gap-4 overflow-hidden">
                {/* Adjournment Risk */}
                {selectedCase?.lawyerId && (
                    <div className="glass rounded-2xl p-4">
                        <AdjournmentRiskPanel lawyerId={selectedCase.lawyerId} t={t} />
                    </div>
                )}

                {/* Knowledge Graph */}
                <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-[250px]">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center text-white/50 animate-pulse">
                            {t('searching_precedents')}
                        </div>
                    ) : (
                        <GraphVisualizationPanel graphData={graphData} t={t} />
                    )}
                </div>

                {/* Precedents List */}
                <div className="glass rounded-2xl p-4 flex flex-col max-h-[300px]">
                    <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider opacity-80">{t('relevant_precedents')}</h3>
                    <div className="overflow-y-auto pr-2 custom-scrollbar">
                        {precedents.length === 0 ? (
                            <p className="text-sm text-white/40 italic">{t('no_precedents_loaded')}</p>
                        ) : (
                            <ul className="space-y-3">
                                {precedents.map(p => (
                                    <li key={p.id} className="text-sm border-b border-white/10 pb-3 last:border-0 last:pb-0">
                                        <a href={p.fullTextUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ns-primary-400 hover:text-ns-primary-300 hover:underline block mb-1">
                                            {p.caseName}
                                        </a>
                                        <p className="text-xs text-white/50">{p.citation} • {p.court}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
