import { AIDecisionTrace } from '../../core/types';

type Listener = (trace: AIDecisionTrace) => void;

class ObservabilityService {
    private listeners: Listener[] = [];

    // Emit a trace event so the UI can show it
    trace(agent: 'JUDGE_ASSIST' | 'EVIDENCE_AI' | 'BLOCKCHAIN_WATCHDOG' | 'SYSTEM', action: string, confidence: number) {
        const traceData: AIDecisionTrace = {
            traceId: `tr-${Math.random().toString(36).substr(2, 9)}`,
            agent,
            action,
            confidence,
            timestamp: new Date().toLocaleTimeString()
        };

        // Log to console for debugging
        console.log(`[LLM_OBSERVABILITY] ${agent}: ${action}`);

        // Notify visual components
        this.listeners.forEach(l => l(traceData));
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const observability = new ObservabilityService();
