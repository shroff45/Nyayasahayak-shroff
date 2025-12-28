import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Scale, ArrowRight, Command } from 'lucide-react';
import { gsap } from 'gsap';

interface SearchResult {
    id: string;
    type: 'CASE' | 'STATUTE' | 'NAV';
    title: string;
    subtitle: string;
    icon: React.ElementType;
}

export const SmartSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Mock Data
    const mockData: SearchResult[] = [
        { id: '1', type: 'CASE', title: 'State vs. Sharma', subtitle: 'Case #2998 • Theft • Hearing Tomorrow', icon: FileText },
        { id: '2', type: 'STATUTE', title: 'IPC Section 379', subtitle: 'Punishment for theft', icon: Scale },
        { id: '3', type: 'NAV', title: 'File New Complaint', subtitle: 'Voice Filing Interface', icon: Command },
        { id: '4', type: 'CASE', title: 'Mehta vs. Union of India', subtitle: 'Case #1024 • Civil Dispute', icon: FileText },
        { id: '5', type: 'STATUTE', title: 'IPC Section 302', subtitle: 'Punishment for murder', icon: Scale },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            gsap.fromTo(modalRef.current,
                { opacity: 0, scale: 0.95, y: 10 },
                { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' }
            );
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
        } else {
            const filtered = mockData.filter(item =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        }
    }, [query]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/50 transition-all group"
            >
                <Search size={14} className="group-hover:text-white" />
                <span>Search...</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 font-mono text-[10px] font-medium text-white/50">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-ns-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
            >
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/5">
                    <Search className="text-white/50" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-lg text-white placeholder-white/30 focus:outline-none"
                        placeholder="Search cases, laws, or actions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/50 font-mono hidden sm:block">ESC</div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            <div className="px-2 py-1.5 text-xs font-bold text-white/30 uppercase tracking-wider">Top Results</div>
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group transition-colors text-left"
                                >
                                    <div className={`p-2 rounded-lg ${result.type === 'CASE' ? 'bg-blue-500/20 text-blue-400' :
                                            result.type === 'STATUTE' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-green-500/20 text-green-400'
                                        }`}>
                                        <result.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white group-hover:text-ns-primary-400 transition-colors">
                                            {result.title}
                                        </div>
                                        <div className="text-xs text-white/50 truncate">
                                            {result.subtitle}
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-8 text-center text-white/30">
                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                                    <FileText className="mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-white/60">Search Cases</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                                    <Scale className="mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-white/60">Find Statutes</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                                    <Command className="mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-white/60">Quick Actions</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 bg-black/20 text-[10px] text-white/30 flex justify-between">
                    <div>
                        <span className="font-bold text-ns-primary-500">Quantum Search</span> v1.0
                    </div>
                    <div className="flex gap-3">
                        <span>Use <kbd className="font-mono bg-white/10 px-1 rounded">↑</kbd> <kbd className="font-mono bg-white/10 px-1 rounded">↓</kbd> to navigate</span>
                        <span><kbd className="font-mono bg-white/10 px-1 rounded">↵</kbd> to select</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
