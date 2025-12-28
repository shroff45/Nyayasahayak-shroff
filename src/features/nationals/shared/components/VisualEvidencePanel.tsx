import { useState } from 'react';
import { documentAnalysis } from '../services/documentAnalysis';
import { observability } from '../services/observabilityService';
import { EvidenceAnalysis } from '../../core/types';
import { Scan, CheckCircle, Loader2 } from 'lucide-react';

export const VisualEvidencePanel = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<EvidenceAnalysis | null>(null);

    const runAnalysis = async () => {
        setAnalyzing(true);
        observability.trace('EVIDENCE_AI', 'Initiating SAM-3 Segmentation Model', 0.0);

        // Use a reliable high-res image for the demo
        const mockImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800";

        const data = await documentAnalysis.analyzeEvidence(mockImage, "CASE-101");
        setResult(data);
        setAnalyzing(false);

        observability.trace('EVIDENCE_AI', 'Objects Detected & Segmented (Masks Applied)', 0.98);
    };

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden text-slate-100 mb-6 shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Scan className="text-blue-500" /> SAM-3 Vision Engine
                </h3>
                {!result && (
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50"
                    >
                        {analyzing ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : 'Analyze Evidence'}
                    </button>
                )}
            </div>

            <div className="relative aspect-video bg-black group">
                {!result ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
                        <Scan size={48} className="opacity-20" />
                        <p>Load CCTV footage or Image to start segmentation</p>
                    </div>
                ) : (
                    <>
                        <img src={result.sourceUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Evidence" />

                        {/* RENDER BOUNDING BOXES */}
                        {result.detections.map((det, i) => (
                            <div
                                key={i}
                                className="absolute border-2 border-green-500 bg-green-500/20 hover:bg-green-500/40 transition-all cursor-pointer animate-fade-in"
                                style={{
                                    left: `${det.bbox.x}%`,
                                    top: `${det.bbox.y}%`,
                                    width: `${det.bbox.w}%`,
                                    height: `${det.bbox.h}%`,
                                    animationDelay: `${i * 200}ms`
                                }}
                            >
                                <div className="absolute -top-7 left-0 bg-green-600 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-lg">
                                    {det.concept} ({Math.round(det.confidence * 100)}%)
                                </div>
                            </div>
                        ))}

                        {/* AI INSIGHTS OVERLAY */}
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 animate-fade-in-up">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Key Findings</h4>
                            <ul className="space-y-1">
                                {result.keyFindings.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
