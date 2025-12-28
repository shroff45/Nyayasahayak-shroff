// src/personas/police/pages/DutyRoster.tsx
// NyayaSahayak Hybrid v2.0.0 - Police Duty Roster / My Beat Page

import React, { useState } from 'react';
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Phone,
    Radio
} from 'lucide-react';

interface DutyAssignment {
    id: string;
    date: string;
    shift: 'Morning' | 'Afternoon' | 'Night';
    shiftTime: string;
    beat: string;
    area: string;
    status: 'Active' | 'Upcoming' | 'Completed';
    partner?: string;
    vehicleNo?: string;
}

interface BeatInfo {
    name: string;
    area: string;
    sectors: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
    activeIncidents: number;
    emergencyContact: string;
}

const MOCK_DUTIES: DutyAssignment[] = [
    {
        id: 'DUTY-001',
        date: '2024-12-22',
        shift: 'Morning',
        shiftTime: '06:00 - 14:00',
        beat: 'Beat 7',
        area: 'Connaught Place',
        status: 'Active',
        partner: 'Const. Sharma',
        vehicleNo: 'DL-01-P-1234'
    },
    {
        id: 'DUTY-002',
        date: '2024-12-23',
        shift: 'Night',
        shiftTime: '22:00 - 06:00',
        beat: 'Beat 12',
        area: 'Karol Bagh Market',
        status: 'Upcoming',
        partner: 'Const. Verma',
        vehicleNo: 'DL-01-P-5678'
    },
    {
        id: 'DUTY-003',
        date: '2024-12-24',
        shift: 'Afternoon',
        shiftTime: '14:00 - 22:00',
        beat: 'Beat 7',
        area: 'Connaught Place',
        status: 'Upcoming'
    },
    {
        id: 'DUTY-004',
        date: '2024-12-21',
        shift: 'Morning',
        shiftTime: '06:00 - 14:00',
        beat: 'Beat 7',
        area: 'Connaught Place',
        status: 'Completed',
        partner: 'Const. Kumar'
    }
];

const MY_BEAT: BeatInfo = {
    name: 'Beat 7',
    area: 'Connaught Place, Central Delhi',
    sectors: ['Block A-F', 'Palika Bazaar', 'State Emporium Complex', 'Janpath'],
    riskLevel: 'Medium',
    activeIncidents: 3,
    emergencyContact: '100 / 011-23456789'
};

const DutyRoster: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'roster' | 'beat'>('roster');

    const getStatusColor = (status: DutyAssignment['status']) => {
        switch (status) {
            case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getShiftColor = (shift: DutyAssignment['shift']) => {
        switch (shift) {
            case 'Morning': return 'bg-amber-500/20 text-amber-400';
            case 'Afternoon': return 'bg-orange-500/20 text-orange-400';
            case 'Night': return 'bg-indigo-500/20 text-indigo-400';
        }
    };

    const getRiskColor = (risk: BeatInfo['riskLevel']) => {
        switch (risk) {
            case 'Low': return 'text-green-400';
            case 'Medium': return 'text-amber-400';
            case 'High': return 'text-red-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-400" />
                        Duty Roster & My Beat
                    </h1>
                    <p className="text-slate-400 mt-1">View your assigned duties and beat information</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'roster'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Duty Roster
                </button>
                <button
                    onClick={() => setActiveTab('beat')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'beat'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    My Beat
                </button>
            </div>

            {activeTab === 'roster' ? (
                /* Duty Roster Tab */
                <div className="space-y-4">
                    {/* Current Duty Alert */}
                    {MOCK_DUTIES.some(d => d.status === 'Active') && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center animate-pulse">
                                    <Radio className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-green-400 font-semibold">Currently On Duty</p>
                                    <p className="text-sm text-slate-300">
                                        {MOCK_DUTIES.find(d => d.status === 'Active')?.beat} - {MOCK_DUTIES.find(d => d.status === 'Active')?.area}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Duty List */}
                    <div className="space-y-3">
                        {MOCK_DUTIES.map((duty) => (
                            <div
                                key={duty.id}
                                className={`bg-slate-800/50 border rounded-xl p-5 transition-all ${duty.status === 'Active'
                                        ? 'border-green-500/50 shadow-lg shadow-green-500/10'
                                        : 'border-slate-700 hover:border-blue-500/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getShiftColor(duty.shift)}`}>
                                                {duty.shift} Shift
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(duty.status)}`}>
                                                {duty.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-400" />
                                            {duty.beat} - {duty.area}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(duty.date).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {duty.shiftTime}
                                            </span>
                                            {duty.partner && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {duty.partner}
                                                </span>
                                            )}
                                            {duty.vehicleNo && (
                                                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                                                    🚔 {duty.vehicleNo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {duty.status === 'Active' && (
                                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                                            Log Activity
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* My Beat Tab */
                <div className="space-y-4">
                    {/* Beat Overview */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{MY_BEAT.name}</h2>
                                <p className="text-slate-400">{MY_BEAT.area}</p>
                            </div>
                            <div className={`flex items-center gap-2 ${getRiskColor(MY_BEAT.riskLevel)}`}>
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">{MY_BEAT.riskLevel} Risk</span>
                            </div>
                        </div>

                        {/* Sectors */}
                        <div className="mb-4">
                            <p className="text-sm text-slate-500 mb-2">Coverage Sectors</p>
                            <div className="flex flex-wrap gap-2">
                                {MY_BEAT.sectors.map((sector, idx) => (
                                    <span key={idx} className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                                        {sector}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-amber-400 mb-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Active Incidents</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{MY_BEAT.activeIncidents}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-400 mb-1">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm font-medium">Emergency</span>
                                </div>
                                <p className="text-lg font-bold text-white">{MY_BEAT.emergencyContact}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-colors">
                            <AlertTriangle className="w-5 h-5" />
                            Report Incident
                        </button>
                        <button className="flex items-center justify-center gap-2 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-medium hover:bg-green-500/30 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                            Log Patrol Check
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DutyRoster;
