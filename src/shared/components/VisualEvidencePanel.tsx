import { useState } from 'react';
import { Scan, Loader2 } from 'lucide-react';
import { documentAnalysis } from '@shared/services/documentAnalysis';
import { observability } from '@shared/services/observabilityService';
import { EvidenceAnalysis } from '@core/types';

export const VisualEvidencePanel = () => {
    const [data, setData] = useState<EvidenceAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const handleScan = async () => {
        setLoading(true);
        observability.trace('EVIDENCE_AI', 'Initiating SAM-3 Segmentation', 0.0);
        const result = await documentAnalysis.analyze('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', 'CASE-101');
        setData(result);
        setLoading(false);
        observability.trace('EVIDENCE_AI', 'Analysis Complete', 0.98);
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden text-white">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Scan className="text-blue-500" /> SAM-3 Vision Engine</h3>
                {!data && <button onClick={handleScan} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold flex gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : 'Analyze Evidence'}
                </button>}
            </div>
            <div className="relative aspect-video bg-black">
                {data ? (
                    <>
                        <img src={data.sourceUrl} className="w-full h-full object-cover opacity-50" />
                        {data.detections.map((d, i) => (
                            <div key={i} className="absolute border-2 border-green-500 bg-green-500/20"
                                style={{ left: `${d.bbox.x}%`, top: `${d.bbox.y}%`, width: `${d.bbox.w}%`, height: `${d.bbox.h}%` }}>
                                <span className="absolute -top-6 left-0 bg-green-600 text-[10px] px-1 rounded font-bold">{d.concept}</span>
                            </div>
                        ))}
                    </>
                ) : <div className="absolute inset-0 flex items-center justify-center text-slate-600">Awaiting Input...</div>}
            </div>
        </div>
    );
};
