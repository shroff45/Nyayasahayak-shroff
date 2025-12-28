import React from 'react';
import { CheckCircle, Clock, Circle } from 'lucide-react';

interface TimelineStep {
    id: string;
    label: string;
    status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
    date?: string;
    description: string;
}

export const NyayaPath: React.FC = () => {
    const steps: TimelineStep[] = [
        {
            id: '1',
            label: 'FIR Filed',
            status: 'COMPLETED',
            date: 'Nov 28',
            description: 'Case #2998 registered via Voice Interface.'
        },
        {
            id: '2',
            label: 'Police Verification',
            status: 'ACTIVE',
            date: 'In Progress',
            description: 'Officer assigned. Visiting incident spot.'
        },
        {
            id: '3',
            label: 'Charge Sheet',
            status: 'PENDING',
            description: 'Police to file formal charges.'
        },
        {
            id: '4',
            label: 'Court Hearing',
            status: 'PENDING',
            description: 'First appearance before Magistrate.'
        }
    ];

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <h3 className="text-lg font-bold text-white mb-6 px-2 title flex items-center gap-2">
                Your Case Journey
                <span className="text-[10px] font-normal text-white/50 bg-white/10 px-2 py-0.5 rounded-full border border-white/5">CASE #2998</span>
            </h3>
            <div className="flex items-start min-w-[600px] px-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex-1 relative group">
                        {index !== steps.length - 1 && (
                            <div className={`absolute top-4 left-1/2 w-full h-0.5 ${step.status === 'COMPLETED' ? 'bg-ns-success' : 'bg-white/10'}`}></div>
                        )}
                        <div className="relative flex flex-col items-center text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-black/50 shadow-lg transition-all duration-500 ${step.status === 'COMPLETED' ? 'bg-ns-success text-black scale-110 shadow-[0_0_15px_rgba(0,255,157,0.5)]' : step.status === 'ACTIVE' ? 'bg-ns-primary-500 text-black animate-pulse-slow scale-125 shadow-[0_0_20px_rgba(0,240,255,0.6)]' : 'bg-white/10 text-white/30 border-white/5'}`}>
                                {step.status === 'COMPLETED' && <CheckCircle size={16} />}
                                {step.status === 'ACTIVE' && <Clock size={16} />}
                                {step.status === 'PENDING' && <Circle size={16} />}
                            </div>
                            <div className={`mt-6 p-3 rounded-xl border transition-all duration-300 w-36 relative ${step.status === 'ACTIVE' ? 'glass border-ns-primary-500/50 shadow-lg shadow-ns-primary-500/10 -translate-y-2' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'}`}>
                                {step.status === 'ACTIVE' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ns-primary-500 rotate-45 border-l border-t border-ns-primary-500/50 bg-black"></div>}
                                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: step.status === 'ACTIVE' ? '#00f0ff' : step.status === 'COMPLETED' ? '#00ff9d' : '#94a3b8' }}>
                                    {step.label}
                                </div>
                                {step.date && <div className="text-[10px] font-bold text-white mb-1">{step.date}</div>}
                                <div className="text-[10px] text-white/60 leading-tight">
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
