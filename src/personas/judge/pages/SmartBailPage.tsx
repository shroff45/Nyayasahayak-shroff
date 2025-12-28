// src/personas/judge/pages/SmartBailPage.tsx
// NyayaSahayak Hybrid v2.0.0 - Smart Bail Analysis Page
// AI-powered bail recommendation system

import React, { useState } from 'react';
import {
    Scale, AlertTriangle, CheckCircle, XCircle,
    User, FileText, Shield, Clock, Search
} from 'lucide-react';

interface BailCase {
    id: string;
    accused: string;
    section: string;
    offenseType: 'BAILABLE' | 'NON_BAILABLE';
    custody: number; // Days in custody
    previousBail: boolean;
    flightRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    communityTies: 'STRONG' | 'MODERATE' | 'WEAK';
    recommendation: 'GRANT' | 'DENY' | 'CONDITIONAL';
    confidence: number;
}

const MOCK_CASES: BailCase[] = [
    {
        id: 'BAIL-001',
        accused: 'Ramesh Kumar',
        section: 'BNS 303 (Murder)',
        offenseType: 'NON_BAILABLE',
        custody: 45,
        previousBail: false,
        flightRisk: 'HIGH',
        communityTies: 'WEAK',
        recommendation: 'DENY',
        confidence: 87
    },
    {
        id: 'BAIL-002',
        accused: 'Suresh Patel',
        section: 'BNS 318 (Cheating)',
        offenseType: 'BAILABLE',
        custody: 15,
        previousBail: false,
        flightRisk: 'LOW',
        communityTies: 'STRONG',
        recommendation: 'GRANT',
        confidence: 92
    },
    {
        id: 'BAIL-003',
        accused: 'Anita Sharma',
        section: 'BNS 351 (Criminal Intimidation)',
        offenseType: 'BAILABLE',
        custody: 7,
        previousBail: true,
        flightRisk: 'MEDIUM',
        communityTies: 'MODERATE',
        recommendation: 'CONDITIONAL',
        confidence: 78
    }
];

const SmartBailPage: React.FC = () => {
    const [selectedCase, setSelectedCase] = useState<BailCase | null>(MOCK_CASES[0]);
    const [search, setSearch] = useState('');

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'GRANT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'DENY': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'CONDITIONAL': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'text-red-400';
            case 'MEDIUM': return 'text-amber-400';
            case 'LOW': return 'text-emerald-400';
            default: return 'text-slate-400';
        }
    };

    const filteredCases = MOCK_CASES.filter(c =>
        c.accused.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 h-full flex flex-col lg:flex-row gap-6">
            {/* Case List */}
            <div className="w-full lg:w-80 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Scale className="w-5 h-5 text-purple-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Smart Bail</h1>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search accused..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                    {filteredCases.map(case_ => (
                        <div
                            key={case_.id}
                            onClick={() => setSelectedCase(case_)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedCase?.id === case_.id
                                    ? 'bg-purple-500/20 border-purple-500/50'
                                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white">{case_.accused}</span>
                                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getRecommendationColor(case_.recommendation)}`}>
                                    {case_.recommendation}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">{case_.section}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Panel */}
            {selectedCase && (
                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">{selectedCase.accused}</h2>
                            <p className="text-slate-400">{selectedCase.section}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getRecommendationColor(selectedCase.recommendation)}`}>
                            {selectedCase.recommendation === 'GRANT' && <CheckCircle className="w-5 h-5" />}
                            {selectedCase.recommendation === 'DENY' && <XCircle className="w-5 h-5" />}
                            {selectedCase.recommendation === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5" />}
                            <span className="font-bold">{selectedCase.recommendation} BAIL</span>
                        </div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-400">AI Confidence</span>
                            <span className="text-purple-400 font-bold">{selectedCase.confidence}%</span>
                        </div>
                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${selectedCase.confidence}%` }}
                            />
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <h3 className="text-lg font-bold text-white mb-4">Risk Assessment</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm">Flight Risk</span>
                            </div>
                            <span className={`text-lg font-bold ${getRiskColor(selectedCase.flightRisk)}`}>
                                {selectedCase.flightRisk}
                            </span>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm">Community Ties</span>
                            </div>
                            <span className={`text-lg font-bold ${selectedCase.communityTies === 'STRONG' ? 'text-emerald-400' :
                                    selectedCase.communityTies === 'MODERATE' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {selectedCase.communityTies}
                            </span>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Days in Custody</span>
                            </div>
                            <span className="text-lg font-bold text-white">{selectedCase.custody}</span>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">Offense Type</span>
                            </div>
                            <span className={`text-lg font-bold ${selectedCase.offenseType === 'BAILABLE' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {selectedCase.offenseType.replace('_', '-')}
                            </span>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-400">AI Advisory Only</h4>
                                <p className="text-sm text-slate-300">
                                    This recommendation is generated by AI analysis and should be used as one factor in your judicial decision.
                                    The final decision rests with the Honorable Court.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartBailPage;
