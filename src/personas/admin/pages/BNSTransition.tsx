// src/personas/admin/pages/BNSTransition.tsx
// NyayaSahayak Hybrid v2.0.0 - BNS Transition Tracker
// IPC to BNS Migration Dashboard

import React from 'react';
import {
    TrendingUp, Scale, ArrowRight, CheckCircle,
    Clock, AlertTriangle, BarChart3, PieChart
} from 'lucide-react';

// Mock transition data
const TRANSITION_STATS = {
    totalSections: 511,
    mappedSections: 358,
    pendingSections: 153,
    percentComplete: 70,
};

const SECTION_MAPPINGS = [
    { ipc: 'Section 302', bns: 'Section 103', category: 'Murder', status: 'MAPPED' },
    { ipc: 'Section 304', bns: 'Section 105', category: 'Culpable Homicide', status: 'MAPPED' },
    { ipc: 'Section 376', bns: 'Section 64', category: 'Rape', status: 'MAPPED' },
    { ipc: 'Section 420', bns: 'Section 318', category: 'Cheating', status: 'MAPPED' },
    { ipc: 'Section 498A', bns: 'Section 85', category: 'Cruelty by Husband', status: 'PENDING' },
    { ipc: 'Section 307', bns: 'Section 109', category: 'Attempt to Murder', status: 'MAPPED' },
];

const BNSTransition: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">BNS Transition Tracker</h1>
                        <p className="text-slate-400 text-sm">IPC → BNS Section Migration Dashboard</p>
                    </div>
                </div>
                <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-bold">
                    Effective: July 1, 2024
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Scale className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Total Sections</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{TRANSITION_STATS.totalSections}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Mapped</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">{TRANSITION_STATS.mappedSections}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-400">{TRANSITION_STATS.pendingSections}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <PieChart className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Progress</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-400">{TRANSITION_STATS.percentComplete}%</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">Migration Progress</span>
                    <span className="text-amber-400 font-bold">{TRANSITION_STATS.percentComplete}%</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                        style={{ width: `${TRANSITION_STATS.percentComplete}%` }}
                    />
                </div>
            </div>

            {/* Section Mapping Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-400" />
                        Section Mapping Reference
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="text-left text-xs font-bold text-slate-400 uppercase px-4 py-3">IPC Section</th>
                                <th className="text-center text-xs font-bold text-slate-400 uppercase px-4 py-3"></th>
                                <th className="text-left text-xs font-bold text-slate-400 uppercase px-4 py-3">BNS Section</th>
                                <th className="text-left text-xs font-bold text-slate-400 uppercase px-4 py-3">Category</th>
                                <th className="text-left text-xs font-bold text-slate-400 uppercase px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {SECTION_MAPPINGS.map((mapping, idx) => (
                                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 text-white font-medium">{mapping.ipc}</td>
                                    <td className="px-4 py-3 text-center">
                                        <ArrowRight className="w-4 h-4 text-amber-400 mx-auto" />
                                    </td>
                                    <td className="px-4 py-3 text-emerald-400 font-medium">{mapping.bns}</td>
                                    <td className="px-4 py-3 text-slate-300">{mapping.category}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${mapping.status === 'MAPPED'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {mapping.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BNSTransition;
