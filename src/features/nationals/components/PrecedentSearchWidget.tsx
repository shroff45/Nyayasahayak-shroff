import React, { useState } from 'react';
import { LegalPrecedent } from '../core/types';
import { Search, BookOpen, ExternalLink, PlusCircle } from 'lucide-react';

interface PrecedentSearchWidgetProps {
    onSearch: (query: string) => void;
    results: LegalPrecedent[];
}

const PrecedentSearchWidget: React.FC<PrecedentSearchWidgetProps> = ({ onSearch, results }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsSearching(true);
        await onSearch(query);
        setIsSearching(false);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="text-purple-600" size={20} />
                Legal Precedents (GraphRAG)
            </h3>

            <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search e.g. 'IPC 302 circumstantial'"
                        className="w-full p-2 pl-3 pr-10 border rounded text-sm focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 text-gray-400 hover:text-purple-600"
                        disabled={isSearching}
                    >
                        <Search size={16} />
                    </button>
                </div>
            </form>

            <div className="results space-y-3 max-h-[300px] overflow-y-auto">
                {results.length === 0 && !isSearching && (
                    <div className="text-center text-gray-400 text-xs py-4">
                        No precedents loaded. Try searching.
                    </div>
                )}

                {isSearching && (
                    <div className="text-center text-purple-600 text-xs py-4 animate-pulse">
                        Searching 50 years of case law...
                    </div>
                )}

                {results.map(p => (
                    <div key={p.id} className="border rounded p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm text-blue-700 line-clamp-1" title={p.caseName}>
                                {p.caseName}
                            </h4>
                            <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                {p.relevanceScore.toFixed(0)}% Match
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{p.citation} • {p.court} ({p.year})</p>
                        <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                            {p.summary}
                        </p>
                        <div className="flex justify-between items-center">
                            <a
                                href={p.fullTextUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 flex items-center gap-1 hover:underline"
                            >
                                View Full Judgment <ExternalLink size={10} />
                            </a>
                            <button className="text-[10px] flex items-center gap-1 text-purple-700 hover:bg-purple-50 px-2 py-1 rounded">
                                <PlusCircle size={10} /> Add to Draft
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrecedentSearchWidget;
