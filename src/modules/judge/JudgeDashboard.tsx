import { useState } from 'react';
import { Case } from '@core/types';
import { CaseTriage } from './features/CaseTriage';
import { VisualEvidencePanel } from '@shared/components/VisualEvidencePanel';
import { Scale, Camera, Activity } from 'lucide-react';

// --- MOCK DATA ---
const MOCK_CASES: Case[] = [
    {
        id: 'case-101',
        cnrNumber: 'CNR-DL-2024-9988',
        complainant: 'State of Maharashtra',
        respondent: 'Raj Sharma',
        caseType: 'Criminal',
        summary: 'A criminal case involving charges of murder and illegal possession of firearms.',
        caseNotes: 'Prosecution relies on CCTV footage and forensic reports.',
        filingDate: '2023-01-15',
        status: 'HEARING',
        urgency: 'HIGH',
        sectionsInvoked: ['IPC 302', 'Arms Act 25'],
        lawyerId: 'LAW-009'
    },
    {
        id: 'case-102',
        cnrNumber: 'CIV/1089/2022',
        complainant: 'Priya Singh',
        respondent: 'ABC Corp',
        caseType: 'Civil',
        summary: 'Breach of contract dispute regarding commercial lease.',
        caseNotes: 'Mediation failed. Proceeding to trial.',
        filingDate: '2022-11-20',
        status: 'HEARING',
        urgency: 'MEDIUM',
        sectionsInvoked: ['Contract Act'],
        lawyerId: 'LAW-012'
    }
];

export default function JudgeDashboard() {
    const [activeTab, setActiveTab] = useState('TRIAGE');
    const [cases] = useState<Case[]>(MOCK_CASES);

    const tabs = [
        { id: 'TRIAGE', label: 'Case Triage', icon: Scale },
        { id: 'EVIDENCE', label: 'Evidence Analysis', icon: Camera },
        { id: 'ANALYTICS', label: 'Analytics', icon: Activity },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Judicial Dashboard</h1>
                    <p className="text-slate-500">Welcome back, Hon. Justice Verma</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'TRIAGE' && (
                    <CaseTriage cases={cases} onSelectCase={(c) => console.log('Selected', c)} />
                )}
                {activeTab === 'EVIDENCE' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">Visual Evidence Analysis</h2>
                            <p className="text-blue-700 dark:text-blue-400">Powered by SAM-3 Vision Engine</p>
                        </div>
                        <VisualEvidencePanel />
                    </div>
                )}
                {activeTab === 'ANALYTICS' && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Analytics Module Loading...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
