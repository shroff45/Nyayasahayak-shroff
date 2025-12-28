import { useState, useEffect } from 'react';
import {
    Gavel, AlertTriangle, Scale, Camera, Clock,
    MessageSquare, Heart, Activity, FileSignature, Shield, Flame, CheckCircle, TrendingUp, Calendar,
    Lock, Wifi, Search, Loader2
} from 'lucide-react';

// --- MODULAR IMPORTS ---
import { Case } from '../../core/types';
import { VisualEvidencePanel } from '../../shared/components/VisualEvidencePanel';
import { observability } from '../../shared/services/observabilityService';

// --- CROSS-MODULE IMPORTS (Reusing features for the Judge) ---
import { RightsAssistant } from '../citizen/RightsAssistant';

// --- MOCK DATA ---
const MOCK_CASES: Case[] = [
    {
        id: 'case-101',
        cnrNumber: 'DL/2024/00801',
        complainant: 'State of Delhi',
        respondent: 'Rahul Kumar',
        caseType: 'Criminal',
        summary: 'Bail application in case of alleged assault and causing grievous hurt.',
        caseNotes: 'Accused has prior record. High flight risk.',
        filingDate: '2024-11-20',
        status: 'HEARING',
        urgency: 'HIGH',
        sectionsInvoked: ['IPC 326', 'IPC 307'],
        adjournmentsCount: 2,
        lawyerId: 'L001' // Links to Adv. Sharma (HIGH risk)
    },
    {
        id: 'case-102',
        cnrNumber: 'DL/2024/00045',
        complainant: 'Amit Shah',
        respondent: 'Vijay Mallya',
        caseType: 'Financial Crime',
        summary: 'Fraud and money laundering case involving shell companies.',
        caseNotes: 'Complex financial trail. Multiple jurisdictions.',
        filingDate: '2024-10-15',
        status: 'HEARING',
        urgency: 'MEDIUM',
        sectionsInvoked: ['PMLA'],
        adjournmentsCount: 5,
        lawyerId: 'L003' // Links to Adv. Patel (HIGH risk)
    },
    {
        id: 'case-103',
        cnrNumber: 'DL/2024/00112',
        complainant: 'Priya Singh',
        respondent: 'Rohan Singh',
        caseType: 'Family',
        summary: 'Divorce petition on grounds of cruelty.',
        caseNotes: 'Mediation attempted but failed.',
        filingDate: '2024-09-01',
        status: 'HEARING',
        urgency: 'LOW',
        sectionsInvoked: ['HMA 13(1)'],
        adjournmentsCount: 1,
        lawyerId: 'L002' // Links to Adv. Verma (LOW risk)
    }
];

// Mock Lawyer Database for Adjournment Risk
const LAWYER_STATS: Record<string, { name: string; adjournmentRate: number; casesHandled: number; averageDelayMonths: number }> = {
    'L001': { name: 'Adv. Sharma', adjournmentRate: 0.71, casesHandled: 45, averageDelayMonths: 3.8 },
    'L002': { name: 'Adv. Verma', adjournmentRate: 0.22, casesHandled: 67, averageDelayMonths: 0.5 },
    'L003': { name: 'Adv. Patel', adjournmentRate: 0.71, casesHandled: 52, averageDelayMonths: 3.8 },
};

// Mock Vipaksh (Adversary) Results
const MOCK_VIPAKSH_RESULTS = [
    { type: 'Fundamental Rights', quote: 'Personal Liberty', weakness: 'requires bail consideration. Blanket custody may be challenged.', fix: 'Given the flight risk and severity of offense, bail is denied at this stage, referencing Sanjay Chandra v. CBI.' },
];


// --- SUB-COMPONENTS ---
const WellnessPanel = () => (
    <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <Heart size={48} className="text-pink-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Judicial Wellness Monitor</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">Your cognitive load is optimal today. Recommend taking a 5-minute break after the next hearing.</p>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-700 dark:text-green-400 font-bold">Stress: Low</div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-700 dark:text-blue-400 font-bold">Focus: High</div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-700 dark:text-purple-400 font-bold">Sleep: 7h</div>
        </div>
    </div>
);

export default function JudgeDashboard() {
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [activeTab, setActiveTab] = useState('TRIAGE');
    const [draft, setDraft] = useState('');
    const [vipakshMode, setVipakshMode] = useState(false);
    const [vipakshResults, setVipakshResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Smart Query States (Evidence RAG)
    const [smartQuery, setSmartQuery] = useState('');
    const [isSearchingEvidence, setIsSearchingEvidence] = useState(false);

    // Mock Toast for Smart Query (reuses console for demo)
    const showSmartResult = (message: string) => {
        alert(`🔍 AI Clerk Response:\n\n${message}`);
    };

    const handleSmartSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!smartQuery.trim()) return;

        setIsSearchingEvidence(true);

        // Simulate RAG search delay
        setTimeout(() => {
            // Mock "smart" responses based on query keywords
            let mockAnswer = 'Found 2 matches in Witness Statement (Exhibit B) confirming the timestamp 23:15.';

            if (smartQuery.toLowerCase().includes('weapon')) {
                mockAnswer = 'Found: 6-inch serrated knife recovered from scene (Exhibit A, Forensic Report pg. 12).';
            } else if (smartQuery.toLowerCase().includes('medical') || smartQuery.toLowerCase().includes('injury')) {
                mockAnswer = 'Medical Report (Exhibit C) confirms: Multiple contusions, 2 deep lacerations requiring 12 stitches.';
            } else if (smartQuery.toLowerCase().includes('witness')) {
                mockAnswer = 'Found 3 witness statements corroborating timeline: Exhibits B, D, and F.';
            }

            showSmartResult(mockAnswer);
            setIsSearchingEvidence(false);
            setSmartQuery('');
        }, 2000);
    };

    useEffect(() => {
        if (MOCK_CASES.length > 0) setSelectedCase(MOCK_CASES[0]);
    }, []);

    const handleCaseSelect = (c: Case) => {
        setSelectedCase(c);
        setDraft(''); // Clear draft when switching cases
        setVipakshMode(false);
        setVipakshResults([]);
        observability.trace('JUDGE_ASSIST', `Judge viewed case ${c.cnrNumber}`, 1.0);
    };

    const handleGenerateDraft = () => {
        if (!selectedCase) return;
        observability.trace('JUDGE_ASSIST', 'Generating Bail Order Draft', 0.85);
        const template = `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE
CASE NO: ${selectedCase.cnrNumber}

${selectedCase.complainant} ... Complainant
VERSUS
${selectedCase.respondent} ... Accused

ORDER

1. This is an application for bail filed under Section 437 CrPC.
2. The accused is charged with offences under ${(selectedCase.sectionsInvoked || []).join(', ')}.
3. Heard the learned counsel for the applicant and the learned APP for the State.
4. Considering the facts and circumstances...
5. The bail is granted subject to the following conditions: (a) surrender passport, (b) weekly reporting to station..
6. Given the flight risk and severity of offense, bail is denied at this stage, referencing Sanjay Chandra v. CBI..

Date: ${new Date().toLocaleDateString('en-IN')}
(Signed)
District Judge
`;
        setDraft(template);
        observability.trace('JUDGE_ASSIST', 'Draft Generated Successfully', 0.99);
    };

    const handleVipakshAudit = () => {
        if (!vipakshMode) {
            observability.trace('JUDGE_ASSIST', 'Running adversarial audit', 0.9);
            setVipakshResults(MOCK_VIPAKSH_RESULTS);
        }
        setVipakshMode(!vipakshMode);
    };

    const applyFix = (quote: string, fix: string) => {
        const newDraft = draft.replace(quote, fix);
        setDraft(newDraft);
    };

    const getLawyerRisk = (lawyerId: string | undefined) => {
        if (!lawyerId) return null;
        return LAWYER_STATS[lawyerId] || null;
    };

    const tabs = [
        { id: 'TRIAGE', label: 'Draft Order', icon: Scale },
        { id: 'DOCS', label: 'Evidence Analysis', icon: Camera },
        { id: 'BOT', label: 'AI Assistant', icon: MessageSquare },
        { id: 'WELLNESS', label: 'Wellness Check', icon: Heart },
    ];

    const filteredCases = MOCK_CASES.filter(c =>
        (c.cnrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.complainant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.respondent || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const lawyerRisk = getLawyerRisk(selectedCase?.lawyerId);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">

            {/* Sovereign AI Header Badge */}
            <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-2 border border-slate-800">
                <h1 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                    <Scale className="text-indigo-400" size={22} />
                    Judicial Magistrate First Class
                </h1>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        <Lock size={10} /> Local-SLM Inference
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/50 text-green-400 border border-green-700">
                        <Wifi size={10} /> Sovereign Grid
                    </span>
                </div>
            </div>

            {/* Smart Query Search Bar */}
            <form onSubmit={handleSmartSearch} className="relative">
                <input
                    type="text"
                    placeholder="Ask the AI Clerk (e.g., 'Does the medical report confirm injury?')"
                    value={smartQuery}
                    onChange={(e) => setSmartQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-indigo-500/30 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3.5 text-indigo-400" size={18} />
                {isSearchingEvidence && (
                    <div className="absolute right-3 top-3.5">
                        <Loader2 size={18} className="animate-spin text-indigo-400" />
                    </div>
                )}
            </form>

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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                        {/* Column 1: Case Queue */}
                        <div className="lg:col-span-3 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 flex flex-col overflow-hidden h-full">
                            <div className="p-3 border-b border-slate-700/50">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Clock size={14} /> Case Intake Queue
                                </h3>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Search Title, Number, Petitioner..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {filteredCases.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleCaseSelect(c)}
                                        className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedCase?.id === c.id
                                            ? 'bg-blue-900/50 border-blue-500'
                                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-mono text-slate-400">{c.cnrNumber}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.urgency === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                                c.urgency === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>{c.urgency}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-white truncate">{c.complainant} v. {c.respondent}</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Calendar size={10} /> {c.filingDate}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Case Details + Draft Panel */}
                        <div className="lg:col-span-6 flex flex-col gap-4 h-full overflow-y-auto pr-1">
                            {selectedCase && (
                                <>
                                    {/* Case Header */}
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-2xl font-bold">{selectedCase.cnrNumber}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedCase.caseType === 'Criminal' ? 'bg-red-500/20 text-red-400' :
                                                        selectedCase.caseType === 'Family' ? 'bg-purple-500/20 text-purple-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>{selectedCase.caseType?.toUpperCase()}</span>
                                                </div>
                                                <h1 className="text-lg font-medium text-slate-300">{selectedCase.complainant} <span className="text-slate-500">vs</span> {selectedCase.respondent}</h1>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedCase.urgency === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                                selectedCase.urgency === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>{selectedCase.urgency} URGENCY</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                                <p className="text-[10px] text-slate-500 uppercase mb-1">Filing Date</p>
                                                <p className="font-mono text-white">{selectedCase.filingDate}</p>
                                            </div>
                                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                                <p className="text-[10px] text-slate-500 uppercase mb-1">Current Status</p>
                                                <p className="font-bold text-white">{selectedCase.status}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
                                            <p className="text-[10px] text-slate-500 uppercase mb-1">Invoked Acts</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedCase.sectionsInvoked || []).map(s => <span key={s} className="bg-slate-700 px-2 py-1 rounded text-xs font-mono">{s}</span>)}
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 p-3 rounded-lg">
                                            <h3 className="font-bold text-xs text-blue-400 uppercase mb-2 flex items-center gap-1"><FileSignature size={12} /> Case Summary</h3>
                                            <p className="text-sm text-slate-300 leading-relaxed">{selectedCase.summary}</p>
                                        </div>
                                    </div>

                                    {/* Draft Panel with Vipaksh */}
                                    <div className={`grid flex-1 min-h-[300px] gap-4 ${vipakshMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {/* Draft Section */}
                                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                                                    <Gavel size={14} className="text-amber-400" /> Nyaya-Sahayak Draft
                                                </h3>
                                                <button
                                                    onClick={handleGenerateDraft}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 flex items-center gap-1"
                                                >
                                                    ✨ Generate Draft Order
                                                </button>
                                            </div>
                                            <textarea
                                                value={draft}
                                                onChange={(e) => setDraft(e.target.value)}
                                                className="w-full flex-grow p-3 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-200 border-slate-700 resize-none"
                                                placeholder="Select a case and click Generate Draft..."
                                            />
                                            <div className="mt-2 text-[10px] text-slate-500 text-right">
                                                Word Count: {draft.split(/\s+/).filter(Boolean).length}
                                            </div>
                                        </div>

                                        {/* Vipaksh Section */}
                                        {vipakshMode && (
                                            <div className="bg-red-900/30 p-4 rounded-2xl border-2 border-red-500/50 flex flex-col overflow-hidden">
                                                <div className="mb-3 flex-shrink-0">
                                                    <h3 className="text-red-400 font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                                                        <Shield className="h-4 w-4" /> VIPAKSH (ADVERSARY) AUDIT
                                                    </h3>
                                                    <p className="text-[10px] text-red-300/70 mt-1">
                                                        Identifying weak points before the defense does.
                                                    </p>
                                                </div>
                                                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                                                    {vipakshResults.map((result, idx) => (
                                                        <div key={idx} className="bg-slate-900/50 border-l-4 border-red-500 p-3 shadow-sm rounded-r">
                                                            <h4 className="font-bold text-red-400 text-[10px] uppercase">{result.type})</h4>
                                                            <p className="text-xs text-slate-300 mt-1">{result.weakness}</p>
                                                            <div className="mt-2 pt-2 border-t border-slate-700">
                                                                <p className="text-[10px] text-amber-400 font-medium mb-1">SUGGESTED FIX:</p>
                                                                <p className="text-xs text-slate-400">{result.fix}</p>
                                                                <button
                                                                    onClick={() => applyFix(result.quote, result.fix)}
                                                                    className="w-full mt-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-500 flex items-center justify-center gap-1 font-bold"
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

                                    {/* Vipaksh Toggle Button */}
                                    <button
                                        onClick={handleVipakshAudit}
                                        className={`w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${vipakshMode
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50'
                                            }`}
                                    >
                                        {vipakshMode ? <Flame size={16} className="animate-pulse" /> : <Shield size={16} />}
                                        {vipakshMode ? 'Vipaksh Audit Active' : 'Run Vipaksh (Adversary) Audit'}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Column 3: Analytics Sidebar */}
                        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto">
                            {/* Adjournment Risk Panel */}
                            {selectedCase && lawyerRisk && (
                                <div className={`p-4 rounded-2xl border shadow-lg ${lawyerRisk.adjournmentRate > 0.6 ? 'bg-red-900/30 border-red-500/50' :
                                    lawyerRisk.adjournmentRate > 0.3 ? 'bg-amber-900/30 border-amber-500/50' :
                                        'bg-green-900/30 border-green-500/50'
                                    }`}>
                                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                        <AlertTriangle size={14} /> Adjournment Request Analysis
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase">Lawyer</p>
                                            <p className="font-medium text-white text-sm">{lawyerRisk.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase">Risk Level</p>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${lawyerRisk.adjournmentRate > 0.6 ? 'bg-red-500/20 text-red-400' :
                                                lawyerRisk.adjournmentRate > 0.3 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>{lawyerRisk.adjournmentRate > 0.6 ? 'HIGH' : lawyerRisk.adjournmentRate > 0.3 ? 'MEDIUM' : 'LOW'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between text-slate-400">
                                            <span className="flex items-center gap-1"><TrendingUp size={12} /> Historical Pattern</span>
                                            <span className="font-bold text-white">{(lawyerRisk.adjournmentRate * 100).toFixed(0)}% adjournments</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> Impact Forecast</span>
                                            <span className="font-bold text-red-400">+{lawyerRisk.averageDelayMonths} months delay</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 flex items-center justify-center gap-1">
                                            <Gavel size={12} /> Deny & Record
                                        </button>
                                        <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500">
                                            Override & Grant
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Graph Data Placeholder */}
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[150px]">
                                <Activity size={24} className="text-slate-600 mb-2" />
                                <p className="text-slate-500 text-xs">No graph data available.</p>
                                <p className="text-slate-600 text-[10px] mt-1">Search for precedents to visualize connections.</p>
                            </div>

                            {/* Relevant Precedents Placeholder */}
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex-1">
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Relevant Precedents</h3>
                                <p className="text-slate-500 text-xs italic">No precedents loaded.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: DOCUMENT ANALYSIS */}
                {activeTab === 'DOCS' && (
                    <div className="h-full overflow-y-auto">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2"><Camera /> Visual Evidence Analysis</h2>
                            <p className="text-blue-700 dark:text-blue-400">Powered by SAM-3 Vision Engine</p>
                        </div>
                        <VisualEvidencePanel />
                    </div>
                )}

                {/* VIEW 3: NYAYABOT */}
                {activeTab === 'BOT' && (
                    <div className="h-full grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Judicial Assistant Bot</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">Ask about precedents, IPC sections, or case details.</p>
                            <RightsAssistant />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Suggested Queries</h3>
                            <div className="space-y-2">
                                {['Summarize the bail arguments', 'Find precedents for Section 302', 'Draft a hearing notice'].map(q => (
                                    <button key={q} className="block w-full text-left p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-slate-700 dark:text-slate-300">{q}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 4: WELLNESS */}
                {activeTab === 'WELLNESS' && <WellnessPanel />}

            </div>
        </div>
    );
}

