import { AdjournmentRisk } from '../types';
import { AlertTriangle, TrendingUp, Calendar, Gavel } from 'lucide-react';

interface AdjournmentRiskPanelProps {
    lawyerId: string | undefined;
    t: (key: string) => string;
}

// Mock Lawyer Database
const LAWYER_STATS: Record<string, { name: string; adjournmentRate: number; casesHandled: number; averageDelayMonths: number }> = {
    'L001': { name: 'Adv. Sharma', adjournmentRate: 0.82, casesHandled: 45, averageDelayMonths: 4.9 },
    'L002': { name: 'Adv. Verma', adjournmentRate: 0.34, casesHandled: 67, averageDelayMonths: 1.2 },
    'L003': { name: 'Adv. Patel', adjournmentRate: 0.71, casesHandled: 52, averageDelayMonths: 3.8 },
    'L004': { name: 'Adv. Singh', adjournmentRate: 0.15, casesHandled: 120, averageDelayMonths: 0.5 },
    'L005': { name: 'Adv. Gupta', adjournmentRate: 0.55, casesHandled: 30, averageDelayMonths: 2.1 },
};

const calculateRisk = (lawyerId: string): AdjournmentRisk | null => {
    const stats = LAWYER_STATS[lawyerId];
    if (!stats) return null;

    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    if (stats.adjournmentRate > 0.7) riskLevel = 'HIGH';
    else if (stats.adjournmentRate > 0.4) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
        lawyerId,
        lawyerName: stats.name,
        riskLevel,
        historicalRate: stats.adjournmentRate,
        casesHandled: stats.casesHandled,
        predictedDelayMonths: stats.averageDelayMonths
    };
};

export default function AdjournmentRiskPanel({ lawyerId, t }: AdjournmentRiskPanelProps) {
    if (!lawyerId) return null;

    const risk = calculateRisk(lawyerId);
    if (!risk) return null;

    return (
        <div className={`mt-0 p-4 rounded-xl border ${risk.riskLevel === 'HIGH' ? 'bg-ns-danger/10 border-ns-danger/30' :
            risk.riskLevel === 'MEDIUM' ? 'bg-ns-warning/10 border-ns-warning/30' :
                'bg-ns-success/10 border-ns-success/30'
            }`}>
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-5 h-5 ${risk.riskLevel === 'HIGH' ? 'text-ns-danger' :
                    risk.riskLevel === 'MEDIUM' ? 'text-ns-warning' :
                        'text-ns-success'
                    }`} />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">{t('adjournment_analysis_title')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{t('lawyer_label')}</p>
                    <p className="font-medium text-white">{risk.lawyerName}</p>
                </div>
                <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{t('risk_level')}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${risk.riskLevel === 'HIGH' ? 'bg-ns-danger/20 text-ns-danger border-ns-danger/30' :
                        risk.riskLevel === 'MEDIUM' ? 'bg-ns-warning/20 text-ns-warning border-ns-warning/30' :
                            'bg-ns-success/20 text-ns-success border-ns-success/30'
                        }`}>
                        {risk.riskLevel}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/60">
                        <TrendingUp className="w-4 h-4" /> {t('historical_pattern')}
                    </span>
                    <span className="font-bold text-white">{(risk.historicalRate * 100).toFixed(0)}% {t('adjournments_suffix')}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4" /> {t('impact_forecast')}
                    </span>
                    <span className="font-bold text-ns-danger">+{risk.predictedDelayMonths} {t('months_delay_suffix')}</span>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button className="flex-1 btn bg-ns-danger border-ns-danger/50 text-white py-2 rounded-lg text-xs font-bold hover:bg-ns-danger/90 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-ns-danger/20">
                    <Gavel className="w-3 h-3" /> {t('deny_record_button')}
                </button>
                <button className="flex-1 btn glass-quiet border-white/10 text-white py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">
                    {t('override_grant_button')}
                </button>
            </div>
        </div>
    );
}
