import React, { useState } from 'react';
import { Mic, FileText, Sparkles, Send, AlertTriangle } from 'lucide-react';

export const SmartFIR: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const toggleListening = () => {
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                const mockText = "Subject reported a snatching incident near Sector 12 market. Two bike-borne assailants snatched a gold chain and fled towards the highway. The victim is Mrs. Sharma.";
                setTranscript(prev => prev + mockText);
                handleAIAnalysis(mockText);
                setIsListening(false);
            }, 2000);
        }
    };

    const handleAIAnalysis = (_text: string) => {
        setAnalyzing(true);
        setTimeout(() => {
            setSuggestions(['IPC 379 (Theft)', 'IPC 356 (Assault or criminal force in attempt to commit theft)']);
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6 h-full">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="text-blue-500" /> New FIR Entry
                </h2>

                <div className="flex-1 relative">
                    <textarea className="w-full h-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm leading-relaxed" placeholder="Start typing or use voice input..." value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                    <button onClick={toggleListening} className={`absolute bottom-4 right-4 p-4 rounded-full shadow-lg transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        <Mic className="text-white" />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                    {analyzing && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-blue-400 font-bold animate-pulse">
                            <Sparkles size={20} /> Analyzing Incident...
                        </div>
                    </div>}

                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500" /> AI Recommendations
                    </h3>

                    {suggestions.length > 0 ? (
                        <div className="space-y-3">
                            {suggestions.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg group hover:border-blue-500 transition-colors cursor-pointer">
                                    <span className="text-slate-200 font-medium">{s}</span>
                                    <button className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-all">Add</button>
                                </div>
                            ))}
                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 flex gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>Suggestion: Check for similar MO in "Bike Gangs" database.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl">
                            Describe the incident to get Section recommendations.
                        </div>
                    )}
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <button className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">Save Draft</button>
                        <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                            <Send size={18} /> File FIR
                        </button>
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-3">
                        Action will be recorded on immutable ledger.
                    </p>
                </div>
            </div>
        </div>
    );
};
