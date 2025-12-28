import { useState, useEffect } from 'react';
import { observability } from '../services/observabilityService';
import { AIDecisionTrace } from '../../core/types';
import { Terminal } from 'lucide-react';

export const DecisionStream = () => {
    const [logs, setLogs] = useState<AIDecisionTrace[]>([]);

    useEffect(() => {
        // Subscribe to the "Invisible" logs to make them Visible
        const unsubscribe = observability.subscribe((trace) => {
            setLogs(prev => [trace, ...prev].slice(0, 4)); // Keep last 4
        });
        return unsubscribe;
    }, []);

    if (logs.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 font-mono text-[10px] sm:text-xs">
            <div className="bg-black/90 text-green-400 p-2 rounded-t-lg border-b border-green-900 flex items-center gap-2 shadow-lg">
                <Terminal size={12} />
                <span className="font-bold tracking-wider">AI_DECISION_STREAM</span>
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="bg-black/80 backdrop-blur p-2 rounded-b-lg border border-green-900/30 space-y-2 shadow-xl">
                {logs.map((log) => (
                    <div key={log.traceId} className="border-l-2 border-green-600 pl-2 animate-fade-in">
                        <div className="flex justify-between opacity-70 mb-0.5">
                            <span className="text-green-300">{log.timestamp}</span>
                            <span className="text-blue-300">{log.agent}</span>
                        </div>
                        <div className="text-white font-bold leading-tight">{log.action}</div>
                        <div className="opacity-50 mt-0.5 text-[9px]">Conf: {(log.confidence * 100).toFixed(1)}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
