import React from 'react';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface AdjournmentRiskPanelProps {
    caseId: string;
    lawyerId: string;
}

const AdjournmentRiskPanel: React.FC<AdjournmentRiskPanelProps> = ({ lawyerId }) => {
    // Mock Database as requested
    const LAWYER_RISK: Record<string, { rate: number; risk: 'HIGH' | 'MEDIUM' | 'LOW'; name: string }> = {
        'L001': { rate: 0.82, risk: 'HIGH', name: 'Adv. Sharma' },
        'L002': { rate: 0.34, risk: 'LOW', name: 'Adv. Verma' },
        'L003': { rate: 0.71, risk: 'HIGH', name: 'Adv. Patel' },
    };

    const stats = LAWYER_RISK[lawyerId];

    if (!stats) return null;

    return (
        <div className={`risk-panel rounded-lg p-4 border-l-4 shadow-sm mb-4 ${stats.risk === 'HIGH' ? 'bg-red-50 border-red-500' :
            stats.risk === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                'bg-green-50 border-green-500'
            }`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className={`font-bold text-sm uppercase flex items-center gap-2 ${stats.risk === 'HIGH' ? 'text-red-800' :
                        stats.risk === 'MEDIUM' ? 'text-yellow-800' :
                            'text-green-800'
                        }`}>
                        <AlertTriangle size={16} />
                        {stats.risk} Delay Risk Detected
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                        Counsel <strong>{stats.name}</strong> has a history of frequent adjournments.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                        {Math.round(stats.rate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Adjournment Rate</div>
                </div>
            </div>

            {stats.risk === 'HIGH' && (
                <div className="mt-3 pt-3 border-t border-red-200 flex gap-2">
                    <div className="flex-1 bg-white/50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Predicted Delay</div>
                        <div className="font-bold text-red-700 flex items-center justify-center gap-1">
                            <Clock size={12} /> {Math.round(stats.rate * 6)} Months
                        </div>
                    </div>
                    <div className="flex-1 bg-white/50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Case Backlog</div>
                        <div className="font-bold text-gray-700 flex items-center justify-center gap-1">
                            <TrendingUp size={12} /> 45+ Cases
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdjournmentRiskPanel;
