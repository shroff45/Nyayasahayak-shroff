import { useState, useEffect } from 'react';
import {
    Gavel, AlertTriangle, Scale, Camera,
    Map as MapIcon, MessageSquare, Clock, Heart, Activity, History
} from 'lucide-react';

// --- MODULAR IMPORTS ---
import { Case } from '../../core/types';
import { VisualEvidencePanel } from '../../shared/components/VisualEvidencePanel';
import { observability } from '../../shared/services/observabilityService';

// --- CROSS-MODULE IMPORTS ---
import { PatrolMap } from '../police/PatrolMap';
import { RightsAssistant } from '../citizen/RightsAssistant';
import { NyayaPath } from '../citizen/NyayaPath';

// --- NEW JUDGE FEATURES ---
import AdjournmentRiskPanel from './components/AdjournmentRiskPanel';
import DraftJudgmentPanel from './components/DraftJudgmentPanel';

// --- MOCK DATA ---
const MOCK_CASES: Case[] = [
    {
        id: 'case-101',
        cnrNumber: 'DL/2024/00112',
        complainant: 'Priya Singh',
        respondent: 'Rohan Singh',
        caseType: 'Family (Divorce)',
        summary: 'Divorce petition on grounds of cruelty.',
        caseNotes: 'Mediation failed. Proceeding to trial.',
        filingDate: '9/1/2024',
        status: 'HEARING',
        urgency: 'LOW',
        sectionsInvoked: ['HMA 13(1)'],
        adjournmentsCount: 2,
        lawyerId: 'LAW-009' // Matches Adv. Patel in Risk Panel
    },
    {
        id: 'case-102',
        cnrNumber: 'DL/2024/00001',
        complainant: 'State of Delhi',
        respondent: 'Rahul Kumar',
        caseType: 'Criminal (Murder)',
        summary: 'A criminal case involving charges of murder and illegal possession of firearms.',
        caseNotes: 'Prosecution relies on CCTV footage.',
        filingDate: '11/20/2024',
        status: 'HEARING',
        urgency: 'HIGH',
        sectionsInvoked: ['IPC 302', 'Arms Act 25'],
        adjournmentsCount: 0,
        lawyerId: 'L001'
    }
];

// --- SUB-COMPONENTS FOR MISSING TABS ---
const MetricCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} text-white`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-bold uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

const WellnessPanel = () => (
    <div className="p-8 text-center space-y-4">
        <Heart size={48} className="text-pink-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-800">Judicial Wellness Monitor</h2>
        <p className="text-slate-600 max-w-md mx-auto">Your cognitive load is optimal today. Recommend taking a 5-minute break after the next hearing.</p>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
            <div className="p-4 bg-green-50 rounded-xl text-green-700 font-bold">Stress: Low</div>
            <div className="p-4 bg-blue-50 rounded-xl text-blue-700 font-bold">Focus: High</div>
            <div className="p-4 bg-purple-50 rounded-xl text-purple-700 font-bold">Sleep: 7h</div>
        </div>
    </div>
);

export default function JudgeDashboard() {
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [activeTab, setActiveTab] = useState('TRIAGE');

    // Draft State
    const [draft, setDraft] = useState('');
    const [vipakshMode, setVipakshMode] = useState(false);
    const [vipakshResults, setVipakshResults] = useState<any[]>([]);

    useEffect(() => {
        if (MOCK_CASES.length > 0) setSelectedCase(MOCK_CASES[0]);
    }, []);

    const handleCaseSelect = (c: Case) => {
        setSelectedCase(c);
        observability.trace('JUDGE_ASSIST', `Judge viewed case ${c.cnrNumber}`, 1.0);
        setDraft(''); // Reset draft on case switch
        setVipakshMode(false);
    };

    const handleVipakshAudit = () => {
        setVipakshMode(true);
        observability.trace('JUDGE_ASSIST', 'Running Vipaksh Adversarial Audit', 0.95);

        // Simulate AI Analysis
        setTimeout(() => {
            setVipakshResults([
                {
                    type: 'Constitutional',
                    quote: 'Personal Liberty) requires bail consideration. Blanket custody may be challenged.',
                    weakness: 'Argument relies on vague interpretation of Article 21.',
                    fix: 'Given the flight risk and severity of offense, bail is denied at this stage, referencing Sanjay Chandra v. CBI.'
                }
            ]);
        }, 800);
    };

    const handleCreateBail = (amount: number) => {
        alert(`Bail Order Created for ₹${amount}`);
    };

    const handleSign = () => {
        alert('Order Signed and Sealed on Blockchain!');
    };

    const tabs = [
        { id: 'TRIAGE', label: 'Case Intake Queue', icon: Scale },
        { id: 'DOCS', label: 'Document Analysis', icon: Camera },
        { id: 'BOT', label: 'NYAYABOT', icon: MessageSquare },
        { id: 'MAPS', label: 'Case Maps', icon: MapIcon },
        { id: 'TIMELINE', label: 'Justice Timeline', icon: Clock },
        { id: 'WELLNESS', label: 'Judicial Wellness', icon: Heart },
        { id: 'HISTORY', label: 'History', icon: History },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-6">

            {/* TOP NAVIGATION */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-1 flex overflow-x-auto scrollbar-hide shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-h-0 relative">

                {/* VIEW 1: CASE TRIAGE (The Main Dashboard) */}
                {activeTab === 'TRIAGE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                        {/* Sidebar: Case Queue */}
                        <div className="lg:col-span-3 bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden h-full border border-slate-800">
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                                    <Clock className="text-blue-400" size={16} /> CASE INTAKE QUEUE
                                </h3>
                                <input
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                    placeholder="Search Title, Number, Petitioner..."
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {MOCK_CASES.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleCaseSelect(c)}
                                        className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedCase?.id === c.id
                                            ? 'bg-blue-600/20 border-blue-500 relative overflow-hidden'
                                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}
                                    >
                                        {selectedCase?.id === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[10px] font-mono text-slate-400">{c.cnrNumber}</span>
                                            <span className={`text-[10px] px-2 rounded-full font-bold ${c.urgency === 'HIGH' ? 'bg-red-500 text-white' : c.urgency === 'MEDIUM' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}`}>{c.urgency}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-white truncate mb-1">{c.complainant} v. {c.respondent}</h4>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <Clock size={10} /> {c.filingDate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center: Case Detail & Draft */}
                        <div className="lg:col-span-6 flex flex-col gap-4 h-full overflow-y-auto">
                            {selectedCase && (
                                <>
                                    {/* Case Header Card */}
                                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h1 className="text-2xl font-bold mb-1">{selectedCase.cnrNumber}</h1>
                                                <div className="text-xl text-slate-300 font-medium">{selectedCase.complainant} <span className="text-slate-500 text-sm">vs</span> {selectedCase.respondent}</div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 border border-blue-800 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedCase.caseType.split(' ')[0]}</span>
                                                <span className="px-3 py-1 bg-green-900/50 text-green-300 border border-green-800 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedCase.urgency} URGENCY</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                                <p className="uppercase text-[10px] text-slate-400 tracking-wider mb-1">FILING DATE</p>
                                                <p className="font-mono text-lg">{selectedCase.filingDate}</p>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                                <p className="uppercase text-[10px] text-slate-400 tracking-wider mb-1">CURRENT STATUS</p>
                                                <p className="font-bold text-lg">{selectedCase.status}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
                                            <p className="uppercase text-[10px] text-slate-400 tracking-wider mb-2 flex items-center gap-2"><Gavel size={12} /> INVOKED ACTS:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {(selectedCase.sectionsInvoked || []).map(s => <span key={s} className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-sm font-mono">{s}</span>)}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="uppercase text-[10px] text-slate-400 tracking-wider mb-2 flex items-center gap-2"><MessageSquare size={12} /> CASE SUMMARY</p>
                                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                                <p className="text-slate-300 text-sm leading-relaxed">{selectedCase.summary}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drafting Interface */}
                                    <div className="flex-1 min-h-[500px]">
                                        <DraftJudgmentPanel
                                            caseData={selectedCase}
                                            draft={draft}
                                            onDraftChange={setDraft}
                                            onVipakshAudit={handleVipakshAudit}
                                            vipakshMode={vipakshMode}
                                            vipakshResults={vipakshResults}
                                            onCreateBail={handleCreateBail}
                                            onSign={handleSign}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Sidebar: Analytics */}
                        <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto">
                            {selectedCase && (
                                <>
                                    <AdjournmentRiskPanel lawyerId={selectedCase.lawyerId} />

                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 aspect-square flex flex-col items-center justify-center text-center">
                                        <div className="text-slate-700 mb-2">
                                            <Activity size={48} />
                                        </div>
                                        <p className="text-slate-500 text-sm">No graph data available.</p>
                                        <p className="text-slate-600 text-xs">Search for precedents to visualize connections.</p>
                                    </div>

                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">RELEVANT PRECEDENTS</h3>
                                        <p className="text-slate-500 text-xs italic">No precedents loaded.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 2: DOCUMENT ANALYSIS (SAM 3) */}
                {activeTab === 'DOCS' && (
                    <div className="h-full overflow-y-auto">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><Camera /> Visual Evidence Analysis</h2>
                            <p className="text-blue-700">Powered by SAM-3 Vision Engine</p>
                        </div>
                        <VisualEvidencePanel />
                    </div>
                )}

                {/* VIEW 3: NYAYABOT */}
                {activeTab === 'BOT' && (
                    <div className="h-full grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h2 className="text-xl font-bold mb-4">Judicial Assistant Bot</h2>
                            <p className="text-slate-500 mb-4">Ask about precedents, IPC sections, or case details.</p>
                            <RightsAssistant />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-4">Suggested Queries</h3>
                            <div className="space-y-2">
                                {['Summarize the bail arguments', 'Find precedents for Section 302', 'Draft a hearing notice'].map(q => (
                                    <button key={q} className="block w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">{q}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 4: CASE MAPS */}
                {activeTab === 'MAPS' && (
                    <div className="h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                        <PatrolMap />
                    </div>
                )}

                {/* VIEW 5: TIMELINE */}
                {activeTab === 'TIMELINE' && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 h-full">
                        <h2 className="text-2xl font-bold mb-8">Justice Timeline</h2>
                        <NyayaPath />
                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                            <h4 className="font-bold text-yellow-800">Delay Prediction</h4>
                            <p className="text-sm text-yellow-700">Based on current velocity, this case is likely to conclude by Nov 2025 (4 months early).</p>
                        </div>
                    </div>
                )}

                {/* VIEW 6: WELLNESS */}
                {activeTab === 'WELLNESS' && <WellnessPanel />}

            </div>
        </div>
    );
}
