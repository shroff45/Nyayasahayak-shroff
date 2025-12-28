import { GraphNode, GraphLink } from '../types';
import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';

interface GraphVisualizationPanelProps {
    graphData: { nodes: GraphNode[]; links: GraphLink[] } | null;
    t: (key: string) => string;
}

export default function GraphVisualizationPanel({ graphData, t }: GraphVisualizationPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            });
        }

        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30 p-6 text-center">
                <Share2 className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('no_graph_data')}</p>
                <p className="text-xs mt-1 opacity-70">{t('search_for_precedents_hint')}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider pointer-events-auto">{t('knowledge_graph_title')}</h3>
                <div className="flex gap-3 text-[10px] pointer-events-auto">
                    <span className="flex items-center gap-1.5 text-white/80"><span className="w-2 h-2 rounded-full bg-ns-primary-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]"></span> {t('case_legend')}</span>
                    <span className="flex items-center gap-1.5 text-white/80"><span className="w-2 h-2 rounded-full bg-ns-secondary-500 shadow-[0_0_8px_rgba(112,0,255,0.6)]"></span> {t('judge_legend')}</span>
                    <span className="flex items-center gap-1.5 text-white/80"><span className="w-2 h-2 rounded-full bg-ns-success shadow-[0_0_8px_rgba(0,255,157,0.6)]"></span> {t('statute_legend')}</span>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-move">
                <ForceGraph2D
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor={(node: any) => {
                        if (node.type === 'CASE') return '#00f0ff'; // ns-primary
                        if (node.type === 'JUDGE') return '#7000ff'; // ns-secondary
                        if (node.type === 'STATUTE') return '#00ff9d'; // ns-success
                        return '#9CA3AF'; // Gray
                    }}
                    nodeRelSize={6}
                    linkWidth={1}
                    linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                    backgroundColor="rgba(0,0,0,0)"
                    onNodeClick={(node: any) => {
                        alert(`Clicked: ${node.label}`);
                    }}
                    cooldownTicks={100}
                    d3VelocityDecay={0.6}
                />
            </div>
        </div>
    );
}
