// src/features/main/components/LegalTechHub.tsx
// NyayaSahayak Hybrid v2.0.0 - Legal Tech Hub (Corrected)
// Fixed: Using Lucide icons, dark mode styling, loading states

import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import Spinner from './common/Spinner';
import { Part } from '@google/genai';
import { fileToBase64 } from '../lib/utils';
import AnimatedPageWrapper from './common/AnimatedPageWrapper';
import {
    Mic,
    MicOff,
    Upload,
    Scale,
    GraduationCap,
    CheckCircle,
    XCircle,
    Lightbulb,
    BookOpen,
    FileAudio,
    Send,
    AlertCircle
} from 'lucide-react';

interface LegalTechHubProps {
    t: (key: string) => string;
}

const ToolButton: React.FC<{
    toolId: string;
    icon: React.ReactNode;
    name: string;
    isActive: boolean;
    onClick: (id: string) => void;
}> = ({ toolId, icon, name, isActive, onClick }) => (
    <button
        onClick={() => onClick(toolId)}
        className={`
            flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 w-full h-36 border group relative overflow-hidden
            ${isActive
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105 z-10'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600 hover:shadow-md'}
        `}
    >
        <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`}>
            {icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest text-center transition-colors ${isActive ? 'text-white' : 'group-hover:text-slate-200'}`}>
            {name}
        </span>
    </button>
);

const LegalTechHub: React.FC<LegalTechHubProps> = ({ t }) => {
    const [activeTool, setActiveTool] = useState('transcriber');

    return (
        <AnimatedPageWrapper>
            <div className="max-w-5xl mx-auto h-full flex flex-col">
                <h2 className="text-3xl font-bold mb-8 text-center text-white tracking-tight flex items-center justify-center gap-3">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                    {t('tab_legal_tech_hub') || 'Legal Tech Hub'}
                </h2>

                <div className="grid grid-cols-3 gap-6 mb-8 px-4">
                    <ToolButton
                        toolId="transcriber"
                        icon={<Mic className="w-10 h-10" />}
                        name={t('tool_audio_transcriber') || 'Audio Transcriber'}
                        isActive={activeTool === 'transcriber'}
                        onClick={setActiveTool}
                    />
                    <ToolButton
                        toolId="analyzer"
                        icon={<Scale className="w-10 h-10" />}
                        name={t('tool_argument_analyzer') || 'Legal Analyzer'}
                        isActive={activeTool === 'analyzer'}
                        onClick={setActiveTool}
                    />
                    <ToolButton
                        toolId="tutor"
                        icon={<GraduationCap className="w-10 h-10" />}
                        name={t('tool_ai_tutor') || 'AI Legal Tutor'}
                        isActive={activeTool === 'tutor'}
                        onClick={setActiveTool}
                    />
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 flex-grow overflow-y-auto transition-colors shadow-xl">
                    <div key={activeTool} className="content-animate max-w-3xl mx-auto">
                        {activeTool === 'transcriber' && <AudioTranscriber t={t} />}
                        {activeTool === 'analyzer' && <ArgumentAnalyzer t={t} />}
                        {activeTool === 'tutor' && <AITutor t={t} />}
                    </div>
                </div>
            </div>
        </AnimatedPageWrapper>
    );
};

const AudioTranscriber: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [transcription, setTranscription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetState = () => {
        setTranscription('');
        setAudioBlob(null);
        setUploadedFile(null);
        setError('');
    };

    const handleStartRecording = async () => {
        resetState();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                audioChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError('Microphone access denied. Please allow microphone permissions.');
            console.error("Error accessing microphone:", err);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    };

    const handleTranscribeRecording = async () => {
        if (!audioBlob) return;
        setIsLoading(true);
        setTranscription('');
        setError('');
        try {
            const base64Data = await fileToBase64(new File([audioBlob], "audio.webm", { type: 'audio/webm' }));
            const audioPart: Part = { inlineData: { mimeType: 'audio/webm', data: base64Data } };
            const result = await geminiService.transcribeAudio(audioPart);
            setTranscription(result);
        } catch (error) {
            setError(t('transcription_error') || 'Transcription failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            resetState();
            setUploadedFile(file);
        }
    };

    const handleTranscribeFile = async () => {
        if (!uploadedFile) return;
        setIsLoading(true);
        setTranscription('');
        setError('');
        try {
            const base64Data = await fileToBase64(uploadedFile);
            const audioPart: Part = { inlineData: { mimeType: uploadedFile.type, data: base64Data } };
            const result = await geminiService.transcribeAudio(audioPart);
            setTranscription(result);
        } catch (error) {
            setError(t('transcription_file_error') || 'File transcription failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Recording Option */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 transition-colors hover:border-slate-600">
                <div className="flex items-center gap-2 mb-4">
                    <Mic className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        {t('option_1_record_audio') || 'Option 1: Record Audio'}
                    </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Click to record audio in your browser. Max 2 minutes. Supported: Any audio.
                </p>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording
                            ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                            : 'bg-slate-700 text-slate-200 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/30'
                            }`}
                    >
                        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    {isRecording && (
                        <span className="text-red-400 text-sm font-medium animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Recording in progress...
                        </span>
                    )}
                    {audioBlob && !isRecording && (
                        <button
                            onClick={handleTranscribeRecording}
                            disabled={isLoading}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isLoading ? 'Processing...' : (t('transcribe_recording') || 'Transcribe Recording')}
                        </button>
                    )}
                </div>
            </div>

            {/* Upload Option */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 transition-colors hover:border-slate-600">
                <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-5 h-5 text-blue-400" />
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        {t('option_2_upload_audio') || 'Option 2: Upload Audio File'}
                    </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Supported formats: MP3, WAV, WEBM, M4A, OGG. Max file size: 10MB.
                </p>
                <div className="flex gap-4 items-center flex-wrap">
                    <label className="px-6 py-3 rounded-xl font-medium text-slate-200 bg-slate-700 border border-slate-600 hover:bg-slate-600 cursor-pointer transition-all shadow-sm flex items-center gap-3 text-sm group">
                        <FileAudio className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                        {uploadedFile ? uploadedFile.name : (t('upload_audio_file') || 'Choose Audio File')}
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {uploadedFile && (
                        <button
                            onClick={handleTranscribeFile}
                            disabled={isLoading}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isLoading ? 'Processing...' : (t('transcribe_file') || 'Transcribe File')}
                        </button>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Loading / Result */}
            {isLoading && (
                <div className="flex justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                        <Spinner />
                        <span className="text-sm text-slate-400">Transcribing audio with AI...</span>
                    </div>
                </div>
            )}

            {transcription && !isLoading && (
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/30 shadow-lg animate-fade-in-up">
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('transcription') || 'Transcription Result'}
                    </h4>
                    <div className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed bg-slate-800/50 p-4 rounded-xl">
                        {transcription}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ArgumentAnalysisResult {
    introduction: string;
    strengths: string[];
    weaknesses: string[];
    counterarguments: string[];
    strategicRecommendations: string;
}

const ArgumentAnalyzer: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const [argument, setArgument] = useState('');
    const [analysis, setAnalysis] = useState<ArgumentAnalysisResult | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!argument || argument.length < 20) return;
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await geminiService.analyzeArgument(argument);
            setAnalysis(result);
        } catch (error) {
            setAnalysis(t('analysis_error') || 'Analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderAnalysis = () => {
        if (typeof analysis === 'string') {
            return (
                <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/30 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {analysis}
                </div>
            );
        }
        if (!analysis) return null;
        return (
            <div className="space-y-6 animate-fade-in-up">
                <p className="text-slate-300 text-lg italic border-l-4 border-emerald-500 pl-6 py-2 bg-emerald-500/10 rounded-r-xl">
                    {analysis.introduction}
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                        <h5 className="font-bold text-emerald-400 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            {t('strengths') || 'Strengths'}
                        </h5>
                        <ul className="space-y-2">
                            {analysis.strengths.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/30">
                        <h5 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            {t('weaknesses') || 'Weaknesses'}
                        </h5>
                        <ul className="space-y-2">
                            {analysis.weaknesses.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-sm">
                    <h5 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        {t('strategic_recommendations') || 'Strategic Recommendations'}
                    </h5>
                    <p className="text-slate-300 text-sm leading-relaxed">{analysis.strategicRecommendations}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                    Enter your legal argument or context
                </label>
                <p className="text-xs text-slate-500 mb-3">
                    Provide the legal argument, case facts, or context you want analyzed. Minimum 20 characters.
                </p>
                <textarea
                    value={argument}
                    onChange={e => setArgument(e.target.value)}
                    rows={6}
                    className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-white placeholder-slate-500 resize-none transition-all"
                    placeholder={t('argument_placeholder') || 'Example: My client was wrongfully terminated from employment without proper notice as required under Section 25F of the Industrial Disputes Act...'}
                ></textarea>
                <p className="text-xs text-slate-500 mt-2">
                    {argument.length}/20 characters minimum {argument.length >= 20 && <CheckCircle className="w-3 h-3 inline text-emerald-400" />}
                </p>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={handleAnalyze}
                    disabled={argument.length < 20 || isLoading}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 disabled:transform-none flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Spinner />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Scale className="w-4 h-4" />
                            {t('analyze_argument') || 'Analyze Legal Argument'}
                        </>
                    )}
                </button>
            </div>
            {analysis && (
                <div className="mt-8 border-t border-slate-700 pt-8">
                    {renderAnalysis()}
                </div>
            )}
        </div>
    );
};

const AITutor: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const [caseType, setCaseType] = useState('Civil');
    const [walkthrough, setWalkthrough] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGetWalkthrough = async () => {
        setIsLoading(true);
        setWalkthrough('');
        try {
            const result = await geminiService.getProceduralWalkthrough(caseType);
            setWalkthrough(result);
        } catch (error) {
            setWalkthrough(t('walkthrough_error') || 'Failed to generate walkthrough. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatWalkthrough = (text: string) => {
        if (!text) return { __html: '' };
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
            .replace(/^#+\s(.*)/gm, '<h4 class="text-xl font-bold mt-8 mb-4 text-emerald-400 border-b border-slate-700 pb-2">$1</h4>')
            .replace(/^\d+\.\s(.*)/gm, '<div class="flex items-start mt-4 gap-3 bg-slate-800/50 p-4 rounded-xl"><span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">$&</span><span class="text-slate-300 leading-relaxed">$1</span></div>')
            .replace(/^\*\s(.*)/gm, '<div class="ml-12 mt-2 text-slate-400 text-sm flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-slate-500"></span>$1</div>')
            .replace(/\n/g, '');
        return { __html: html };
    };

    const caseTypes = [
        { value: 'Civil', label: t('case_type_civil') || 'Civil Case', icon: '📋' },
        { value: 'Criminal', label: t('case_type_criminal') || 'Criminal Case', icon: '⚖️' },
        { value: 'Family', label: t('case_type_family') || 'Family Case', icon: '👨‍👩‍👧' },
        { value: 'Corporate', label: t('case_type_corporate') || 'Corporate/Commercial', icon: '🏢' },
    ];

    return (
        <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700">
                <label className="block text-sm font-bold text-slate-300 mb-4">
                    Select the type of case you want to learn about
                </label>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {caseTypes.map(ct => (
                        <button
                            key={ct.value}
                            onClick={() => setCaseType(ct.value)}
                            className={`p-4 rounded-xl border transition-all text-left ${caseType === ct.value
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-2xl mb-2 block">{ct.icon}</span>
                            <span className="text-sm font-medium">{ct.label}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleGetWalkthrough}
                    disabled={isLoading}
                    className="w-full px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:bg-slate-700 disabled:text-slate-500 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Spinner />
                            Generating walkthrough...
                        </>
                    ) : (
                        <>
                            <GraduationCap className="w-5 h-5" />
                            {t('get_walkthrough') || 'Get Procedural Walkthrough'}
                        </>
                    )}
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <Spinner />
                        <span className="text-sm text-slate-400">Generating educational content...</span>
                    </div>
                </div>
            )}

            {walkthrough && !isLoading && (
                <div className="animate-fade-in-up bg-slate-900/80 rounded-2xl p-8 border border-emerald-500/30 shadow-xl">
                    <h4 className="font-bold text-2xl text-white border-b border-slate-700 pb-4 mb-6 flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                        {(t('case_walkthrough_title') || '{caseType} Case Walkthrough').replace('{caseType}', caseType)}
                    </h4>
                    <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={formatWalkthrough(walkthrough)}
                    />
                </div>
            )}
        </div>
    );
};

export default LegalTechHub;
