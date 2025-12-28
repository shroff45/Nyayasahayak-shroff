import React, { useState } from 'react';
import { EvidenceLocker } from './EvidenceLocker';
import { PatrolMap } from './PatrolMap';
import { SmartFIR } from './SmartFIR';
import { Shield, Radio, Activity, Users, FileText, Map, Database } from 'lucide-react';

const PoliceDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'FIR' | 'EVIDENCE' | 'MAP'>('FIR');

    const stats = [
        { label: 'Active FIRs', value: '24', color: 'text-ns-primary-400', bg: 'bg-ns-primary-500/20', border: 'border-ns-primary-500/30', icon: Shield },
        { label: 'Patrol Units', value: '12', color: 'text-ns-success', bg: 'bg-ns-success/20', border: 'border-ns-success/30', icon: Radio },
        { label: 'High Alert Zones', value: '03', color: 'text-ns-danger', bg: 'bg-ns-danger/20', border: 'border-ns-danger/30', icon: Activity },
        { label: 'Officers on Duty', value: '88', color: 'text-ns-secondary-400', bg: 'bg-ns-secondary-500/20', border: 'border-ns-secondary-500/30', icon: Users },
    ];

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`glass p-4 rounded-2xl border ${stat.border} relative overflow-hidden group`}>
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-lg shadow-black/20`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white tracking-tight title">{stat.value}</div>
                                <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 glass rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/50 border border-white/10">
                {/* Tabs */}
                <div className="flex items-center justify-between p-2 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex gap-1">
                        {[
                            { id: 'FIR', label: 'Smart FIR', icon: FileText },
                            { id: 'EVIDENCE', label: 'Evidence Locker', icon: Database },
                            { id: 'MAP', label: 'Patrol Map', icon: Map }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                                    ${activeTab === tab.id
                                        ? 'bg-ns-primary-500 text-black shadow-lg shadow-ns-primary-500/40 scale-105'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="px-4 text-xs font-mono text-white/30">
                        POLICE NETWORK: <span className="text-ns-success">SECURE</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                    {activeTab === 'FIR' && <SmartFIR />}
                    {activeTab === 'EVIDENCE' && <EvidenceLocker />}
                    {activeTab === 'MAP' && <PatrolMap />}
                </div>
            </div>
        </div>
    );
};

export default PoliceDashboard;
