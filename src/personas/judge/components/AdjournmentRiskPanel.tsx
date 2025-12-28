import React from 'react';
import { AlertTriangle, Clock, TrendingUp, Gavel } from 'lucide-react';

interface AdjournmentRiskPanelProps {
    lawyerId: string | undefined;
}

const AdjournmentRiskPanel: React.FC<AdjournmentRiskPanelProps> = ({ lawyerId }) => {
    if (!lawyerId) return null;

    // Mock Intelligence Database
    const LAWYER_RISK: Record<string, { rate: number; risk: 'HIGH' | 'MEDIUM' | 'LOW'; name: string; cases: number; delay: number }> = {
        'LAW-009': { rate: 0.71, risk: 'HIGH', name: 'Adv. Patel', cases: 52, delay: 3.8 },
        'LAW-012': { rate: 0.15, risk: 'LOW', name: 'Adv. Singh', cases: 120, delay: 0.5 },
        'L001': { rate: 0.82, risk: 'HIGH', name: 'Adv. Sharma', cases: 45, delay: 4.9 },
    };

    const stats = LAWYER_RISK[lawyerId] || { rate: 0.0, risk: 'LOW', name: 'Unknown', cases: 0, delay: 0 };

    if (stats.name === 'Unknown') return null;

    return (
        <div className={`mt-0 p-4 rounded-xl border mb-4 ${stats.risk === 'HIGH' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-5 h-5 ${stats.risk === 'HIGH' ? 'text-red-500' : 'text-green-500'}`} />
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">ADJOURNMENT REQUEST ANALYSIS</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">LAWYER</p>
                    <p className="font-bold text-white max-w-[100px] truncate">{stats.name}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">RISK LEVEL</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${stats.risk === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                        {stats.risk}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                        <TrendingUp className="w-4 h-4" /> Historical Pattern
                    </span>
                    <span className="font-bold text-white">{(stats.rate * 100).toFixed(0)}% adjournments</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" /> Impact Forecast
                    </span>
                    <span className={`font-bold ${stats.risk === 'HIGH' ? 'text-red-400' : 'text-green-400'}`}>+{stats.delay} months delay</span>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-red-500/20">
                    <Gavel className="w-3 h-3" /> Deny & Record
                </button>
                <button className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors">
                    Override & Grant
                </button>
            </div>
        </div>
    );
};

export default AdjournmentRiskPanel;
