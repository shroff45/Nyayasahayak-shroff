import React from 'react';
import { GraphNode, GraphLink, Case } from '../core/types';
import GraphVisualizationPanel from './GraphVisualizationPanel';
import NyayaChitra from './NyayaChitra';

interface IntelligencePanelProps {
    graphData: { nodes: GraphNode[]; links: GraphLink[] } | null;
    selectedCase: Case | null;
    draftText: string; // For NyayaChitra to visualize the draft order
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ graphData, draftText }) => {
    return (
        <div className="intelligence-panel space-y-4 h-full flex flex-col">
            {/* Top: Knowledge Graph */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <i className="fas fa-project-diagram text-blue-500"></i> Legal Knowledge Graph
                </h3>
                {graphData ? (
                    <GraphVisualizationPanel graphData={graphData} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                        Search precedents to generate graph...
                    </div>
                )}
            </div>

            {/* Bottom: Visual Justice (Nyaya Chitra) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <i className="fas fa-image text-purple-500"></i> Visual Justice
                </h3>
                {draftText ? (
                    <NyayaChitra legalText={draftText} language="hi" />
                ) : (
                    <div className="text-center text-gray-400 text-sm py-8 italic">
                        Start drafting to generate visual cards...
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntelligencePanel;
