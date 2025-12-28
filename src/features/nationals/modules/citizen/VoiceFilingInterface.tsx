import React, { useState, useEffect, useRef } from 'react';
import { Case, Language, UrgencyLevel } from '../../core/types';
import { addBlock } from '../../shared/services/akhandLedger';

import { v4 as uuidv4 } from 'uuid';
import { Mic, MicOff, Loader2, CheckCircle, AlertTriangle, FileText, Globe } from 'lucide-react';

/**
 * VoiceFilingInterface - Multilingual voice-first complaint filing.
 * Features: Speech-to-Text, Auto-Parsing, Blockchain Submission.
 */
const VoiceFilingInterface: React.FC = () => {

    const [language, setLanguage] = useState<Language>('hi');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [extractedData, setExtractedData] = useState<Partial<Case> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string>('');
    const [cnr, setCnr] = useState<string>('');

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition
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
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    // recognitionRef.current.start(); // Keep listening if state is true
                } else {
                    setIsListening(false);
                }
            };
        }
    }, [language]);

    const getLangCode = (lang: Language) => {
        switch (lang) {
            case 'hi': return 'hi-IN';
            case 'gu': return 'gu-IN';
            case 'ta': return 'ta-IN';
            case 'te': return 'te-IN';
            default: return 'en-IN';
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            processTranscript(transcript);
        } else {
            setTranscript('');
            setExtractedData(null);
            setSubmissionStatus('idle');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const processTranscript = (text: string) => {
        setIsProcessing(true);
        // Simulate AI processing delay
        setTimeout(() => {
            const data = parseTranscript(text);
            setExtractedData(data);
            setIsProcessing(false);
        }, 1500);
    };

    /**
     * Intelligent Auto-Parsing Logic
     */
    const parseTranscript = (text: string): Partial<Case> => {
        const lowerText = text.toLowerCase();
        let sectionsInvoked: string[] = [];
        let urgency: UrgencyLevel = 'LOW';
        let caseType = 'Civil';

        // Pattern Detection
        if (lowerText.match(/murder|killed|death|maara|hatya/)) {
            sectionsInvoked.push("IPC 302");
            urgency = 'HIGH';
            caseType = 'Criminal';
        }
        if (lowerText.match(/theft|stolen|robbery|chori|loot/)) {
            sectionsInvoked.push("IPC 379");
            urgency = 'MEDIUM';
            caseType = 'Criminal';
        }
        if (lowerText.match(/cheating|fraud|deceived|dhokha|420/)) {
            sectionsInvoked.push("IPC 420");
            urgency = 'MEDIUM';
            caseType = 'Criminal';
        }
        if (lowerText.match(/assault|beaten|attacked|maarpit|hamla/)) {
            sectionsInvoked.push("IPC 323");
            urgency = 'HIGH';
            caseType = 'Criminal';
        }
        if (lowerText.match(/bail|release|custody|zamanat|jail/)) {
            urgency = 'HIGH';
        }

        // Name Extraction (Naive implementation for demo)
        // In real app, use NER model
        const complainant = "Complainant [Auto-detected]";
        const respondent = "Respondent [Auto-detected]";

        return {
            id: uuidv4(),
            cnrNumber: `TEMP-${Date.now()}`,
            complainant,
            respondent,
            caseType,
            summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            caseNotes: text,
            filingDate: new Date().toISOString(),
            status: 'FILED',
            urgency,
            sectionsInvoked,
            adjournmentsCount: 0
        };
    };

    const handleSubmit = () => {
        if (!extractedData) return;

        setSubmissionStatus('submitting');

        // Simulate network + blockchain delay
        setTimeout(() => {
            const result = addBlock(extractedData as Case);
            if (result.success) {
                setSubmissionStatus('success');
                setTxHash(result.blockHash);
                setCnr(extractedData.cnrNumber || '');
            } else {
                setSubmissionStatus('error');
            }
        }, 2000);
    };

    // Browser Compatibility Check
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        return (
            <div className="bg-ns-warning/10 border border-ns-warning/30 p-4 rounded-xl m-4">
                <h3 className="font-bold text-ns-warning flex items-center gap-2">
                    <AlertTriangle /> Speech Recognition Not Supported
                </h3>
                <p className="text-sm text-ns-warning/80 mt-2">
                    Please use Google Chrome or Microsoft Edge.
                </p>
                <p className="text-sm text-ns-warning/80 mt-1">
                    Or use manual text input below:
                </p>
                <textarea
                    className="w-full mt-4 p-3 border border-ns-warning/30 rounded bg-black/20 text-white"
                    placeholder="Type your complaint here..."
                    rows={6}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                />
                <button
                    onClick={() => processTranscript(transcript)}
                    className="mt-2 px-4 py-2 bg-ns-primary-500 text-black rounded font-bold hover:bg-ns-primary-400"
                >
                    Process Text
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Globe size={14} className="text-white/60" />
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-transparent text-white text-xs font-medium border-none focus:ring-0 cursor-pointer pr-8"
                    >
                        <option value="en" className="bg-ns-neutral-900">English</option>
                        <option value="hi" className="bg-ns-neutral-900">Hindi (हिन्दी)</option>
                        <option value="gu" className="bg-ns-neutral-900">Gujarati (ગુજરાતી)</option>
                        <option value="ta" className="bg-ns-neutral-900">Tamil (தமிழ்)</option>
                        <option value="te" className="bg-ns-neutral-900">Telugu (తెలుగు)</option>
                    </select>
                </div>
            </div>

            {/* Main Interaction Area */}
            {!extractedData ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    {/* Microphone Button */}
                    <div className="relative group">
                        <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${isListening ? 'bg-ns-danger/50 scale-150' : 'bg-ns-primary-500/20 scale-100 group-hover:scale-110'}`}></div>
                        <button
                            onClick={toggleListening}
                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4 ${isListening
                                ? 'bg-ns-danger border-ns-danger/50 animate-pulse scale-110'
                                : isProcessing
                                    ? 'bg-ns-secondary-500 border-ns-secondary-500/50'
                                    : 'bg-gradient-to-br from-ns-neutral-800 to-black border-white/10 hover:border-ns-primary-500/50'
                                }`}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            ) : isListening ? (
                                <Mic className="w-10 h-10 text-white" />
                            ) : (
                                <MicOff className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
                            )}
                        </button>
                    </div>

                    <div className="text-center space-y-2">
                        <p className={`text-lg font-bold transition-colors ${isListening ? 'text-ns-danger animate-pulse' : 'text-white'}`}>
                            {isListening ? "Listening... Speak now" : isProcessing ? "Processing Complaint..." : "Tap to Speak"}
                        </p>
                        <p className="text-xs text-white/40 max-w-[200px] mx-auto">
                            Describe your incident clearly. Include names, dates, and locations.
                        </p>
                    </div>

                    {/* Live Transcript Preview */}
                    {(transcript || isListening) && (
                        <div className="w-full max-w-md mt-4 p-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
                            <p className="text-sm text-white/80 font-mono leading-relaxed">
                                {transcript || <span className="text-white/20 italic">Listening for speech...</span>}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* Review & Submit Screen */
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-ns-primary-500" /> Review Complaint Details
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Complainant</label>
                                        <div className="text-sm text-white">{extractedData.complainant}</div>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Respondent</label>
                                        <div className="text-sm text-white">{extractedData.respondent}</div>
                                    </div>
                                </div>

                                <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                    <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Incident Summary</label>
                                    <div className="text-sm text-white/80 leading-relaxed">{extractedData.summary}</div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 bg-black/20 p-2 rounded-lg border border-white/5">
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Urgency</label>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${extractedData.urgency === 'HIGH' ? 'bg-ns-danger/20 text-ns-danger border border-ns-danger/30' :
                                            extractedData.urgency === 'MEDIUM' ? 'bg-ns-warning/20 text-ns-warning border border-ns-warning/30' :
                                                'bg-ns-success/20 text-ns-success border border-ns-success/30'
                                            }`}>
                                            {extractedData.urgency}
                                        </span>
                                    </div>
                                    <div className="flex-1 bg-black/20 p-2 rounded-lg border border-white/5">
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Sections</label>
                                        <div className="flex flex-wrap gap-1">
                                            {extractedData.sectionsInvoked?.map(sec => (
                                                <span key={sec} className="px-1.5 py-0.5 bg-ns-secondary-500/20 text-ns-secondary-400 text-[10px] rounded border border-ns-secondary-500/30">
                                                    {sec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {submissionStatus === 'success' && (
                            <div className="bg-ns-success/10 border border-ns-success/30 rounded-xl p-4 text-center animate-scale-in">
                                <CheckCircle className="w-10 h-10 text-ns-success mx-auto mb-2" />
                                <h4 className="text-white font-bold text-lg title">Case Filed Successfully!</h4>
                                <p className="text-ns-success font-mono text-sm mt-1 bg-ns-success/10 inline-block px-2 py-1 rounded">CNR: {cnr}</p>
                                <div className="mt-3 text-[10px] text-white/40 break-all font-mono bg-black/20 p-2 rounded">
                                    Tx: {txHash}
                                </div>
                                <button
                                    className="mt-4 text-ns-primary-400 hover:text-white underline text-xs transition-colors"
                                    onClick={() => {
                                        setExtractedData(null);
                                        setTranscript('');
                                        setSubmissionStatus('idle');
                                    }}
                                >
                                    File Another Case
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {submissionStatus !== 'success' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            {submissionStatus === 'submitting' ? (
                                <div className="text-center py-2">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-ns-primary-500 mb-2" />
                                    <p className="text-xs text-white/60 animate-pulse">Encrypting & Mining Block...</p>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 py-3 border border-white/10 rounded-xl hover:bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors"
                                        onClick={() => setExtractedData(null)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="flex-[2] py-3 bg-ns-primary-500 text-black rounded-xl font-bold hover:bg-ns-primary-400 shadow-lg shadow-ns-primary-500/20 text-sm transition-all active:scale-95"
                                        onClick={handleSubmit}
                                    >
                                        Submit to Blockchain
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceFilingInterface;
