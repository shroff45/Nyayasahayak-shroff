import { useEffect, useState } from 'react';
import { observability } from '../services/observabilityService';
import { AIDecisionTrace } from '../../core/types';

export const DecisionStream = () => {
    const [logs, setLogs] = useState<AIDecisionTrace[]>([]);
    useEffect(() => observability.subscribe(l => setLogs(p => [l, ...p].slice(0, 4))), []);
    if (!logs.length) return null;
    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 bg-black/90 text-green-400 p-2 rounded-lg border border-green-900 font-mono text-xs shadow-xl">
            <div className="border-b border-green-800 pb-1 mb-1 flex justify-between">
                <span className="font-bold">AI_DECISION_STREAM</span>
                <span className="animate-pulse">●</span>
            </div>
            {logs.map(l => (
                <div key={l.traceId} className="border-l-2 border-green-600 pl-2 mb-1 animate-fade-in">
                    <div className="opacity-70 flex justify-between"><span>{l.timestamp}</span><span>{l.agent}</span></div>
                    <div className="text-white font-bold">{l.action}</div>
                </div>
            ))}
        </div>
    );
};
