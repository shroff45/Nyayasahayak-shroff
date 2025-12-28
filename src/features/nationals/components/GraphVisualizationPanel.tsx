import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphNode, GraphLink } from '../core/types';
import { Share2, Maximize2 } from 'lucide-react';

interface GraphVisualizationPanelProps {
    graphData: { nodes: GraphNode[]; links: GraphLink[] };
}

const GraphVisualizationPanel: React.FC<GraphVisualizationPanelProps> = ({ graphData }) => {
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 400 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: 400
            });
        }
    }, [containerRef.current]);

    return (
        <div className="bg-white rounded-lg shadow p-4" ref={containerRef}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Share2 className="text-blue-500" size={20} />
                    Legal Knowledge Graph
                </h3>
                <button className="text-gray-400 hover:text-blue-500">
                    <Maximize2 size={16} />
                </button>
            </div>

            <div className="border rounded overflow-hidden bg-gray-50 relative">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor={(node: any) => {
                        switch (node.type) {
                            case 'CASE': return '#3b82f6'; // Blue
                            case 'JUDGE': return '#a855f7'; // Purple
                            case 'STATUTE': return '#10b981'; // Green
                            default: return '#f59e0b'; // Amber
                        }
                    }}
                    nodeRelSize={6}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={2}
                    width={dimensions.width}
                    height={dimensions.height}
                    cooldownTicks={100}
                    onEngineStop={() => graphRef.current?.zoomToFit(400)}
                />

                <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded text-[10px] shadow border">
                    <div className="flex items-center gap-1 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Case</div>
                    <div className="flex items-center gap-1 mb-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Judge</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Statute</div>
                </div>
            </div>
        </div>
    );
};

export default GraphVisualizationPanel;
