// CitizenComplaint.tsx - 3D Enhanced File FIR/Complaint
// Immersive voice recording with waveform visualizer

import React, { useState, useEffect, useRef } from 'react';
import {
    Mic, MicOff, FileText, Upload, Loader2, CheckCircle, AlertTriangle, Globe, Calendar, MapPin, Keyboard, Volume2, Sparkles } from 'lucide-react';
import ParticleHeader from '../../../shared/components/3d/ParticleHeader';
import GlassCard from '../../../shared/components/3d/GlassCard';
import Waveform3D from '../../../shared/components/3d/Waveform3D';
import ProcessingOrb from '../../../shared/components/3d/ProcessingOrb';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';

type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te';

interface ExtractedData {
    complainant: string;
    respondent: string;
    summary: string;
    caseType: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    sections: string[];
    incidentDate: string;
    isZeroFir: boolean;
}

const languageLabels: Record<Language, string> = {
    en: 'English',
    hi: 'हिन्दी (Hindi)',
    gu: 'ગુજરાતી (Gujarati)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)'
};

const CitizenComplaint: React.FC = () => {
    const { t } = useCitizenTranslation();
    const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
    const [language, setLanguage] = useState<Language>('en');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isZeroFir, setIsZeroFir] = useState(false);
    const [cnr, setCnr] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = getLangCode(language);

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                setError('Speech recognition error: ' + event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, [language]);

    const getLangCode = (lang: Language): string => {
        const codes: Record<Language, string> = {
            en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN', ta: 'ta-IN', te: 'te-IN'
        };
        return codes[lang];
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            if (transcript.trim()) {
                processInput(transcript);
            }
        } else {
            setTranscript('');
            setExtractedData(null);
            setError(null);
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleTextSubmit = () => {
        if (textInput.trim().length > 20) {
            processInput(textInput);
        }
    };

    const processInput = async (text: string) => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock extraction
        const urgency: ExtractedData['urgency'] =
            /urgent|emergency|immediate|serious|critical|murder|attack/i.test(text) ? 'HIGH' :
                /important|priority/i.test(text) ? 'MEDIUM' : 'LOW';

        const sections: string[] = [];
        if (/murder|kill|death/i.test(text)) sections.push('BNS 103');
        if (/theft|stole|stolen/i.test(text)) sections.push('BNS 303');
        if (/cheat|fraud/i.test(text)) sections.push('BNS 316');
        if (/assault|attack|hurt/i.test(text)) sections.push('BNS 115');

        const caseType = /murder|theft|assault|crime/i.test(text) ? 'Criminal' :
            /property|contract|dispute/i.test(text) ? 'Civil' :
                /divorce|custody|marriage/i.test(text) ? 'Family' : 'General';

        setExtractedData({
            complainant: 'Citizen User',
            respondent: 'To be identified',
            summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            caseType,
            urgency,
            sections: sections.length ? sections : ['To be determined'],
            incidentDate,
            isZeroFir
        });
        setIsProcessing(false);
    };

    const handleSubmit = async () => {
        if (!extractedData) return;
        setSubmissionStatus('submitting');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const cnrNumber = `${isZeroFir ? '0' : Math.floor(Math.random() * 1000)}/2024/DL/${Date.now().toString().slice(-4)}`;
        setCnr(cnrNumber);
        setSubmissionStatus('success');
    };

    const resetForm = () => {
        setTranscript('');
        setTextInput('');
        setExtractedData(null);
        setSubmissionStatus('idle');
        setCnr('');
    };

    const speechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* 3D Header */}
            <ParticleHeader
                title={t('complaint_file_complaint')}
                subtitle={t('complaint_subtitle')}
                icon={<FileText className="w-6 h-6 text-cyan-400" />}
                variant="blue"
            />

            {/* Controls Bar */}
            <GlassCard className="p-4" variant="default">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Language Selector */}
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="bg-transparent text-white text-sm border-none focus:ring-0 cursor-pointer"
                        >
                            {Object.entries(languageLabels).map(([code, label]) => (
                                <option key={code} value={code} className="bg-slate-900">{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
                        <button
                            onClick={() => setInputMode('voice')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'voice'
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Volume2 className="w-4 h-4" />
                            {t('complaint_voice')}
                        </button>
                        <button
                            onClick={() => setInputMode('text')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'text'
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Keyboard className="w-4 h-4" />
                            {t('complaint_type')}
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Date & Zero FIR Controls */}
            <GlassCard className="p-5" variant="default">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            {t('complaint_date_of_incident')}
                        </label>
                        <input
                            type="date"
                            value={incidentDate}
                            onChange={(e) => setIncidentDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                            <MapPin className="w-4 h-4 text-red-400" />
                            {t('complaint_jurisdiction')}
                        </label>
                        <label className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-500/50 transition-all">
                            <input
                                type="checkbox"
                                checked={isZeroFir}
                                onChange={(e) => setIsZeroFir(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-300">{t('complaint_zero_fir')}</span>
                        </label>
                        {isZeroFir && (
                            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                ⚠️ Will be auto-transferred within 24hrs (BNSS Sec 173)
                            </p>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Input Section */}
            {!extractedData ? (
                <GlassCard className="p-8" variant="emerald" glow>
                    {inputMode === 'voice' ? (
                        <div className="flex flex-col items-center">
                            {!speechSupported ? (
                                <div className="text-center">
                                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                    <p className="text-amber-400 mb-2">Speech recognition not supported</p>
                                    <p className="text-sm text-slate-500">Please use Chrome/Edge or switch to text input</p>
                                </div>
                            ) : isProcessing ? (
                                /* AI Processing State */
                                <div className="text-center py-8">
                                    <ProcessingOrb isProcessing={true} size="lg" label="AI Analyzing..." />
                                    <p className="text-slate-400 mt-4 text-sm">
                                        Extracting case details, identifying sections...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* 3D Microphone Button */}
                                    <div className="relative mb-8">
                                        {/* Animated rings */}
                                        {isListening && (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/30 to-orange-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                                                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse" style={{ animationDuration: '1s' }} />
                                            </>
                                        )}

                                        <button
                                            onClick={toggleListening}
                                            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 ${isListening
                                                ? 'bg-gradient-to-br from-red-500 to-orange-500 border-red-400 scale-110'
                                                : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:border-emerald-500 hover:from-emerald-600 hover:to-cyan-600'
                                                }`}
                                            style={{
                                                boxShadow: isListening
                                                    ? '0 0 60px rgba(239, 68, 68, 0.4), 0 0 120px rgba(239, 68, 68, 0.2)'
                                                    : '0 0 30px rgba(0, 0, 0, 0.5)'
                                            }}
                                        >
                                            {isListening ? (
                                                <MicOff className="w-12 h-12 text-white" />
                                            ) : (
                                                <Mic className="w-12 h-12 text-slate-300" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Waveform Visualizer */}
                                    <div className="w-full h-20 mb-6">
                                        <Waveform3D isActive={isListening} className="w-full h-full" />
                                    </div>

                                    <p className={`text-xl font-black ${isListening ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                        {isListening ? t('complaint_listening_tap_stop') : t('complaint_tap_to_speak')}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2 max-w-md text-center">
                                        {t('complaint_describe_incident')}
                                    </p>
                                </>
                            )}

                            {/* Live Transcript */}
                            {transcript && !isProcessing && (
                                <div className="w-full mt-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                                    <p className="text-xs text-emerald-400 font-bold mb-2">📝 {t('complaint_transcript')}</p>
                                    <p className="text-sm text-slate-300">{transcript}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Text Input Mode */
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3">
                                <FileText className="w-4 h-4" />
                                {t('complaint_describe_your_complaint')}
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                rows={8}
                                placeholder="Example: On 15th December 2024, my mobile phone was stolen near Central Market. The thief was wearing a black jacket and fled on a motorcycle..."
                                className="w-full p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                            />
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-slate-500">
                                    {textInput.length}/20 characters minimum
                                    {textInput.length >= 20 && <CheckCircle className="w-3 h-3 inline ml-1 text-emerald-400" />}
                                </p>
                                <button
                                    onClick={handleTextSubmit}
                                    disabled={textInput.length < 20 || isProcessing}
                                    className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            AI Process
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </GlassCard>
            ) : submissionStatus === 'success' ? (
                /* Success Screen */
                <GlassCard className="p-8 text-center" variant="emerald" glow>
                    <div className="inline-flex p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                        <CheckCircle className="w-16 h-16 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                        {t('complaint_filed_successfully')}
                    </h2>
                    <p className="text-emerald-400 font-mono text-lg bg-emerald-500/10 inline-block px-4 py-2 rounded-lg mb-4 border border-emerald-500/30">
                        CNR: {cnr}
                    </p>
                    <p className="text-slate-400 text-sm mb-6">
                        🔗 Your complaint has been recorded on the blockchain. You will receive updates via SMS and email.
                    </p>
                    <button
                        onClick={resetForm}
                        className="px-6 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                        {t('complaint_file_another')}
                    </button>
                </GlassCard>
            ) : (
                /* Review Screen */
                <div className="space-y-6">
                    <GlassCard className="p-6" variant="emerald">
                        <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            {t('complaint_review_extracted')}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { label: 'Complainant', value: extractedData.complainant, icon: '👤' },
                                { label: 'Case Type', value: extractedData.caseType, icon: '📋' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                                    <label className="text-xs text-slate-500 uppercase font-bold">{item.icon} {item.label}</label>
                                    <p className="text-white font-medium mt-1">{item.value}</p>
                                </div>
                            ))}
                            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                                <label className="text-xs text-slate-500 uppercase font-bold">⚡ Urgency</label>
                                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold mt-1 ${extractedData.urgency === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    extractedData.urgency === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                    {extractedData.urgency}
                                </span>
                            </div>
                            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                                <label className="text-xs text-slate-500 uppercase font-bold">⚖️ Sections</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {extractedData.sections.map((sec, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                                            {sec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2 bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                                <label className="text-xs text-slate-500 uppercase font-bold">📝 Summary</label>
                                <p className="text-slate-300 text-sm mt-1">{extractedData.summary}</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={resetForm}
                            className="flex-1 py-3 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                        >
                            ← Edit
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submissionStatus === 'submitting'}
                            className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-black hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {submissionStatus === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('complaint_submitting')}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    {t('complaint_submit_blockchain')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <GlassCard variant="red" className="p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

export default CitizenComplaint;
