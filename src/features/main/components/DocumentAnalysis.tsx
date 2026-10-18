
import React, { useState, useCallback, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { legalParser } from '../services/legalParser';
import { DocumentAnalysisResult, HistoryItem } from '../types';
import { fileToBase64 } from '../lib/utils';
import Spinner from './common/Spinner';


import AnimatedPageWrapper from './common/AnimatedPageWrapper';

interface DocumentAnalysisProps {
    t: (key: string) => string;
    logActivity: (type: HistoryItem['type'], details: string) => void;
}

const getEntityColor = (type: string) => {
    switch (type.toUpperCase()) {
        case 'PERSON': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        case 'ORGANIZATION': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        case 'LOCATION': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        case 'DATE': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
};

const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({ t, logActivity }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
    const [highlightedSummary, setHighlightedSummary] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (selectedFiles: FileList | null) => { if (selectedFiles) setFiles(prev => [...prev, ...Array.from(selectedFiles as FileList)]); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
    const handleDragEvents = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(e.type !== 'dragleave'); };
    const removeFile = (n: string) => setFiles(f => f.filter(x => x.name !== n));
    const handleAnalyze = useCallback(async () => {
        if (files.length === 0) return;
        setIsLoading(true); setResult(null); setHighlightedSummary('');
        try {
            const fileParts = await Promise.all(files.map(async f => ({ inlineData: { mimeType: f.type, data: await fileToBase64(f) } })));
            const res = await geminiService.analyzeDocuments(fileParts);
            setResult(res);
            if (res.summary) {
                setHighlightedSummary(legalParser.highlightLegalTerms(res.summary));
                logActivity('DOCUMENT_ANALYZED', t('history_doc_analyzed').replace('{files}', files.map(f => f.name).join(', ')));
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, [files, t, logActivity]);

    return (
        <AnimatedPageWrapper>
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white tracking-tight">{t('tab_document_analysis')}</h2>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                        <div className="space-y-8 p-4">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-10 text-center border border-gray-200 dark:border-gray-700 shadow-xl transition-all">
                                <div
                                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 group ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                                    </div>
                                    <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('drag_and_drop')}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('or_click_to_browse')}</p>
                                </div>
                                {files.length > 0 && (
                                    <div className="mt-6 grid gap-3 max-w-2xl mx-auto">
                                        {files.map((file) => (
                                            <div key={file.name} className="flex items-center justify-between bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <i className="fas fa-file-alt"></i>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{file.name}</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={handleAnalyze} disabled={isLoading || files.length === 0} className="mt-8 px-10 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 transform hover:-translate-y-1">
                                    {isLoading ? <Spinner /> : t('analyze_documents')}
                                </button>
                            </div>

                            {result && (
                                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in-up shadow-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">{t('severity')}</p>
                                            <p className={`text-2xl font-bold ${result.severity === 'High' ? 'text-red-600 dark:text-red-400' : result.severity === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{result.severity}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">{t('confidence_score')}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(result.confidenceScore * 100).toFixed(0)}%</p>
                                                <div className="h-1.5 flex-grow bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.confidenceScore * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">{t('recommended_court')}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{result.recommendedCourt}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><i className="fas fa-align-left text-blue-500"></i> {t('summary')}</h4>
                                            <div className="prose prose-lg prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightedSummary }}></div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-4 tracking-wide">{t('key_legal_issues')}</h4>
                                                <ul className="space-y-3">
                                                    {result.keyLegalIssues.map((issue, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 shadow-sm shadow-blue-500/50"></span>
                                                            {issue}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-4 tracking-wide">{t('identified_entities')}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.identifiedEntities.map((entity, i) => (
                                                        <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm ${getEntityColor(entity.type)}`}>{entity.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </AnimatedPageWrapper>
    );
};

export default DocumentAnalysis;
