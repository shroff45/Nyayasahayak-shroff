// src/personas/judge/pages/CaseQueuePage.tsx
// NyayaSahayak Hybrid v2.0.0 - Case Queue Page
// Standalone case queue without external prop dependencies

import React, { useState } from 'react';
import {
    ListFilter, Clock, Scale, AlertTriangle,
    Search, ChevronRight, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QueueCase {
    id: string;
    cnr: string;
    title: string;
    type: 'CRIMINAL' | 'CIVIL' | 'MOTOR_ACCIDENT' | 'FAMILY';
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    filingDate: string;
    nextHearing: string;
    pendingDays: number;
    advocate: string;
}

const MOCK_QUEUE: QueueCase[] = [
    { id: '1', cnr: 'DLCT/2025/001', title: 'State vs. Mohan', type: 'CRIMINAL', priority: 'URGENT', filingDate: '2025-01-05', nextHearing: '2025-01-20', pendingDays: 45, advocate: 'Adv. Sharma' },
    { id: '2', cnr: 'DLCT/2025/002', title: 'Priya vs. Insurance', type: 'MOTOR_ACCIDENT', priority: 'HIGH', filingDate: '2025-01-10', nextHearing: '2025-01-22', pendingDays: 30, advocate: 'Adv. Gupta' },
    { id: '3', cnr: 'DLCT/2025/003', title: 'Ram vs. Shyam', type: 'CIVIL', priority: 'MEDIUM', filingDate: '2025-01-15', nextHearing: '2025-01-25', pendingDays: 20, advocate: 'Adv. Mehta' },
    { id: '4', cnr: 'DLCT/2025/004', title: 'Family Dispute - A', type: 'FAMILY', priority: 'MEDIUM', filingDate: '2025-01-18', nextHearing: '2025-01-28', pendingDays: 15, advocate: 'Adv. Kapoor' },
    { id: '5', cnr: 'DLCT/2025/005', title: 'State vs. Lakshmi', type: 'CRIMINAL', priority: 'LOW', filingDate: '2025-01-20', nextHearing: '2025-02-01', pendingDays: 10, advocate: 'Adv. Sinha' },
];

const CaseQueuePage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('ALL');
    const [selectedCase, setSelectedCase] = useState<QueueCase | null>(null);

    const filteredCases = MOCK_QUEUE.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.cnr.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' || c.type === filter;
        return matchesSearch && matchesFilter;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'LOW': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CRIMINAL': return 'text-red-400';
            case 'CIVIL': return 'text-blue-400';
            case 'MOTOR_ACCIDENT': return 'text-amber-400';
            case 'FAMILY': return 'text-pink-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ListFilter className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Case Queue</h1>
                        <p className="text-slate-400 text-sm">Manage pending cases in your queue</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['ALL', 'CRIMINAL', 'CIVIL', 'MOTOR_ACCIDENT', 'FAMILY'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === type
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Cases Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map(case_ => (
                    <div
                        key={case_.id}
                        onClick={() => setSelectedCase(case_)}
                        className={`bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800 ${selectedCase?.id === case_.id
                                ? 'border-purple-500 ring-1 ring-purple-500/50'
                                : 'border-slate-700'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className={`text-xs font-bold ${getTypeColor(case_.type)}`}>
                                {case_.type.replace('_', ' ')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getPriorityColor(case_.priority)}`}>
                                {case_.priority}
                            </span>
                        </div>

                        <h3 className="font-bold text-white mb-1">{case_.title}</h3>
                        <p className="text-xs text-slate-500 mb-3">{case_.cnr}</p>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {case_.pendingDays}d pending
                            </span>
                            <span>{case_.advocate}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Case Details */}
            {selectedCase && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">{selectedCase.title}</h2>
                        <Link
                            to="/judge/board"
                            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                        >
                            View in Board <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">CNR Number</p>
                            <p className="text-white font-medium">{selectedCase.cnr}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Filing Date</p>
                            <p className="text-white">{selectedCase.filingDate}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Next Hearing</p>
                            <p className="text-white">{selectedCase.nextHearing}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Advocate</p>
                            <p className="text-white">{selectedCase.advocate}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseQueuePage;
