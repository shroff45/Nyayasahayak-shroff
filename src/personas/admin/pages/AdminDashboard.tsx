// src/personas/admin/pages/AdminDashboard.tsx
// NyayaSahayak Hybrid v3.0.0 - Premium 3D Government Dashboard (NyayaPrashaasak)
// Fully Functional: Export, Interactive Heatmap, 3D Design
// सत्यमेव जयते - Truth Alone Triumphs

import React, { useState, useCallback } from 'react';
import {
    BarChart3, TrendingUp, MapPin, Scale, Clock, AlertCircle, CheckCircle2, Activity, Download, Shield, Globe } from 'lucide-react';
import AnimatedBackground from '../../../shared/components/3d/AnimatedBackground';
import { useToast } from '../../../shared/hooks/useToast';

// Mock District Pendency Data
const districtPendency = [
    { name: 'North Delhi', pending: 4520, disposed: 3200, rating: 'HIGH' },
    { name: 'South Delhi', pending: 3100, disposed: 4100, rating: 'LOW' },
    { name: 'East Delhi', pending: 5200, disposed: 2900, rating: 'CRITICAL' },
    { name: 'West Delhi', pending: 2800, disposed: 3500, rating: 'LOW' },
    { name: 'Central Delhi', pending: 3900, disposed: 3100, rating: 'MEDIUM' },
    { name: 'New Delhi', pending: 1800, disposed: 2400, rating: 'LOW' },
    { name: 'Shahdara', pending: 4100, disposed: 2800, rating: 'HIGH' },
    { name: 'Dwarka', pending: 2200, disposed: 3200, rating: 'LOW' },
];

// BNS Transition Statistics
const transitionStats = {
    totalCases: 45280,
    bns: 18500,
    ipc: 26780,
    bnsPercentage: 40.8,
    monthlyGrowth: 12.5,
    targetCompletion: 75,
};

// Color coding for heatmap
const getRatingColor = (rating: string) => {
    switch (rating) {
        case 'CRITICAL': return 'bg-red-500 border-red-400';
        case 'HIGH': return 'bg-orange-500 border-orange-400';
        case 'MEDIUM': return 'bg-yellow-500 border-yellow-400';
        case 'LOW': return 'bg-green-500 border-green-400';
        default: return 'bg-gray-500 border-gray-400';
    }
};

const getRatingBg = (rating: string) => {
    switch (rating) {
        case 'CRITICAL': return 'bg-red-500/20 border-red-500/30';
        case 'HIGH': return 'bg-orange-500/20 border-orange-500/30';
        case 'MEDIUM': return 'bg-yellow-500/20 border-yellow-500/30';
        case 'LOW': return 'bg-green-500/20 border-green-500/30';
        default: return 'bg-gray-500/20 border-gray-500/30';
    }
};

// Pie Chart Component (Simple CSS-based)
const TransitionPieChart: React.FC<{ bns: number; ipc: number }> = ({ bns, ipc }) => {
    const total = bns + ipc;
    const bnsPercent = (bns / total) * 100;

    return (
        <div className="relative w-48 h-48">
            <div
                className="w-full h-full rounded-full"
                style={{
                    background: `conic-gradient(
                        #10b981 0deg ${bnsPercent * 3.6}deg,
                        #6366f1 ${bnsPercent * 3.6}deg 360deg
                    )`
                }}
            />
            <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">{bnsPercent.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">BNS Cases</span>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const { showToast } = useToast();

    // Calculate summary stats
    const totalPending = districtPendency.reduce((acc, d) => acc + d.pending, 0);
    const totalDisposed = districtPendency.reduce((acc, d) => acc + d.disposed, 0);
    const criticalDistricts = districtPendency.filter(d => d.rating === 'CRITICAL' || d.rating === 'HIGH').length;

    // Export to CSV
    const handleExport = useCallback(() => {
        const headers = ['District', 'Pending Cases', 'Disposed Cases', 'Rating', 'Pendency Ratio'];
        const rows = districtPendency.map(d => [
            d.name, d.pending, d.disposed, d.rating, (d.pending / (d.pending + d.disposed) * 100).toFixed(1) + '%'
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Delhi_NCT_Pendency_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Report exported successfully!', 'success', 3000);
    }, [showToast]);

    const selectedDistrictData = selectedDistrict ? districtPendency.find(d => d.name === selectedDistrict) : null;

    return (
        <AnimatedBackground variant="aurora">
            <div className="space-y-6 p-6">
                {/* Premium Header with Gradient */}
                <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-6 overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <Shield className="w-8 h-8 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">NyayaPrashaasak Dashboard</h1>
                                <p className="text-amber-300/80">Government Oversight & Judicial Analytics</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl">
                                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                                <span className="text-emerald-400 text-sm font-medium">Live Data Feed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* National Justice Index Card */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">National Justice Index</h2>
                                <p className="text-xs text-blue-300/70">Based on NJDG metrics • Updated daily</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-400">78.3</p>
                                <p className="text-xs text-slate-400">Score / 100</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-400">+2.4%</p>
                                <p className="text-xs text-slate-400">vs Last Quarter</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-400">#3</p>
                                <p className="text-xs text-slate-400">National Rank</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <Scale className="w-6 h-6 text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{totalPending.toLocaleString()}</p>
                        <p className="text-sm text-slate-400">Total Pending Cases</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{totalDisposed.toLocaleString()}</p>
                        <p className="text-sm text-slate-400">Cases Disposed</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{criticalDistricts}</p>
                        <p className="text-sm text-slate-400">High Pendency Districts</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{transitionStats.bnsPercentage}%</p>
                        <p className="text-sm text-slate-400">BNS Adoption Rate</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Pendency Heatmap */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-bold text-white">Pendency Heatmap</h2>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                Delhi NCT
                            </span>
                        </div>

                        {/* 4x2 Grid Heatmap */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {districtPendency.map((district, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${getRatingBg(district.rating)}`}
                                    onClick={() => setSelectedDistrict(district.name)}
                                    title={`${district.name}: ${district.pending} pending`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${getRatingColor(district.rating)} mb-2`} />
                                    <p className="text-xs text-white font-medium truncate">{district.name}</p>
                                    <p className="text-xs text-slate-400">{district.pending}</p>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-slate-400">Low</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-slate-400">Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-slate-400">High</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-slate-400">Critical</span>
                            </div>
                        </div>

                        {/* Selected District Detail */}
                        {selectedDistrict && selectedDistrictData && (
                            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <p className="text-sm text-white font-medium">{selectedDistrictData.name}</p>
                                <p className="text-xs text-slate-400">
                                    {selectedDistrictData.pending.toLocaleString()} pending •{' '}
                                    {selectedDistrictData.disposed.toLocaleString()} disposed • backlog risk:{' '}
                                    {selectedDistrictData.rating}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* BNS Transition Tracker */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-bold text-white">BNS Transition Tracker</h2>
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                Live
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Pie Chart */}
                            <TransitionPieChart bns={transitionStats.bns} ipc={transitionStats.ipc} />

                            {/* Stats */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-emerald-500" />
                                    <div>
                                        <p className="text-white font-medium">{transitionStats.bns.toLocaleString()}</p>
                                        <p className="text-xs text-slate-400">BNS Cases (Post Jul 2024)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-indigo-500" />
                                    <div>
                                        <p className="text-white font-medium">{transitionStats.ipc.toLocaleString()}</p>
                                        <p className="text-xs text-slate-400">IPC Cases (Pre Jul 2024)</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                        <span className="text-green-400 text-sm">+{transitionStats.monthlyGrowth}% this month</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Transition Progress</span>
                                <span className="text-sm text-white font-medium">{transitionStats.targetCompletion}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
                                    style={{ width: `${transitionStats.targetCompletion}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Target: Full BNS adoption by Dec 2025</p>
                        </div>
                    </div>
                </div>

                {/* Compliance Metrics */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-bold text-white">BNSS Compliance Metrics</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">e-FIR Signature Rate</p>
                            <p className="text-xl font-bold text-emerald-400">94.2%</p>
                            <p className="text-xs text-slate-500">Sec 173(1)(ii)</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Videographed Searches</p>
                            <p className="text-xl font-bold text-amber-400">78.5%</p>
                            <p className="text-xs text-slate-500">Sec 105</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Forensic Coverage</p>
                            <p className="text-xl font-bold text-blue-400">85.1%</p>
                            <p className="text-xs text-slate-500">Sec 176(3)</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Evidence Certification</p>
                            <p className="text-xl font-bold text-purple-400">91.3%</p>
                            <p className="text-xs text-slate-500">BSA Sec 63</p>
                        </div>
                    </div>
                </div>

                {/* Satyamev Jayate Badge */}
                <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-full z-40">
                    <span className="text-amber-400 font-bold text-sm">🏛️ न्याय प्रशासक</span>
                    <span className="text-xs text-amber-300/70">सत्यमेव जयते</span>
                </div>
            </div>
        </AnimatedBackground>
    );
};

export default AdminDashboard;

