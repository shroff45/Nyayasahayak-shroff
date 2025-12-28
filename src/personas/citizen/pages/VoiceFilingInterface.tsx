import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Mic, MicOff, Loader2, CheckCircle, AlertTriangle, FileText, Globe, Calendar, MapPin } from 'lucide-react';
import { getApplicableLaw, getSectionDetails, detectCrimeType, ACT_NAMES } from '../../../core/legal/offenceMapper';
import type { PilotCase, OffenceType } from '../../../types/pilot';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';

/**
 * VoiceFilingInterface - Multilingual voice-first complaint filing.
 * Features: Speech-to-Text, Auto-Parsing, Blockchain Submission.
 */
type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te';

const VoiceFilingInterface: React.FC = () => {
    const { t } = useCitizenTranslation();
    const [language, setLanguage] = useState<Language>('hi');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [extractedData, setExtractedData] = useState<Partial<PilotCase> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string>('');
    const [cnr, setCnr] = useState<string>('');

    // NEW: BNS Pilot Fields
    const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isZeroFir, setIsZeroFir] = useState(false);

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
     * Intelligent Auto-Parsing Logic with BNS/IPC Detection
     */
    const parseTranscript = (text: string): Partial<PilotCase> => {
        // Use the Hybrid Offence Engine to detect crime type
        const detectedCrime = detectCrimeType(text);
        const lawSystem = getApplicableLaw(incidentDate);

        let applicableSection = '';
        let actName = '';
        let urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        let offenceType: OffenceType = 'THEFT';

        if (detectedCrime) {
            const sectionDetails = getSectionDetails(detectedCrime, incidentDate);
            applicableSection = `${lawSystem} ${sectionDetails.section}`;
            actName = ACT_NAMES[lawSystem];
            offenceType = detectedCrime;

            // Set urgency based on crime type
            if (detectedCrime === 'MURDER' || detectedCrime === 'RAPE') {
                urgency = 'HIGH';
            } else if (detectedCrime === 'SNATCHING') {
                urgency = 'HIGH';
            } else {
                urgency = 'MEDIUM';
            }
        } else {
            // Default fallback
            applicableSection = lawSystem === 'BNS' ? 'BNS (To be determined)' : 'IPC (To be determined)';
            actName = ACT_NAMES[lawSystem];
        }

        // Generate CNR number (Zero FIR starts with 0)
        const cnrPrefix = isZeroFir ? '0' : Math.floor(Math.random() * 1000);
        const cnrNumber = `${cnrPrefix}/2024/DL/${Date.now().toString().slice(-4)}`;

        // Name Extraction (Naive implementation for demo)
        const complainant = "Complainant [Auto-detected]";
        const respondent = "Respondent [Auto-detected]";

        return {
            id: uuidv4(),
            cnrNumber,
            complainant,
            respondent,
            caseType: 'Criminal',
            summary: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
            incidentDate,
            filingDate: new Date().toISOString(),
            status: 'FILED',
            urgency,
            offenceType,
            applicableSection,
            actName,
            isZeroFir,
            zeroFirTransferStatus: isZeroFir ? 'PENDING' : undefined,
            transferDeadline: isZeroFir ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
            adjournmentsCount: 0
        };
    };

    const handleSubmit = () => {
        if (!extractedData) return;

        setSubmissionStatus('submitting');

        // Simulate network + blockchain delay (Mock for pilot)
        setTimeout(() => {
            // Generate mock blockchain hash
            const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            setSubmissionStatus('success');
            setTxHash(mockHash);
            setCnr(extractedData.cnrNumber || '');

            // Store in localStorage for Zero FIR tracking
            if (extractedData.isZeroFir) {
                const zeroFirData = {
                    ...extractedData,
                    blockHash: mockHash,
                    submittedAt: new Date().toISOString()
                };
                localStorage.setItem(`zfir_${extractedData.id}`, JSON.stringify(zeroFirData));
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
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                {/* Language Selector */}
                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Globe size={14} className="text-white/60" />
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-transparent text-white text-xs font-medium border-none focus:ring-0 cursor-pointer pr-8"
                    >
                        <option value="en" className="bg-slate-900">English</option>
                        <option value="hi" className="bg-slate-900">Hindi (हिन्दी)</option>
                        <option value="gu" className="bg-slate-900">Gujarati (ગુજરાતી)</option>
                        <option value="ta" className="bg-slate-900">Tamil (தமிழ்)</option>
                        <option value="te" className="bg-slate-900">Telugu (తెలుగు)</option>
                    </select>
                </div>

                {/* Bhashini Badge */}
                <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                    🎤 Powered by Bhashini (Simulated)
                </div>
            </div>

            {/* NEW: BNS Pilot Controls */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date of Incident - CRITICAL for BNS */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Calendar size={16} className="text-amber-400" />
                            Date of Incident *
                        </label>
                        <input
                            type="date"
                            value={incidentDate}
                            onChange={(e) => setIncidentDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Law Applied: <span className={`font-bold ${getApplicableLaw(incidentDate) === 'BNS' ? 'text-green-400' : 'text-amber-400'}`}>
                                {getApplicableLaw(incidentDate) === 'BNS' ? 'Bharatiya Nyaya Sanhita' : 'Indian Penal Code'}
                            </span>
                        </p>
                    </div>

                    {/* Zero FIR Toggle */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <MapPin size={16} className="text-red-400" />
                            Jurisdiction
                        </label>
                        <label className="flex items-center gap-3 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 cursor-pointer hover:border-amber-500 transition-colors">
                            <input
                                type="checkbox"
                                checked={isZeroFir}
                                onChange={(e) => setIsZeroFir(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-slate-300">
                                Incident happened outside my home district
                            </span>
                        </label>
                        {isZeroFir && (
                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-400 flex items-center gap-1">
                                    ⚠️ <strong>Zero FIR Mode:</strong> Will be auto-transferred within 24hrs (BNSS Sec 173)
                                </p>
                            </div>
                        )}
                    </div>
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
                            {isListening ? t('voice_listening') : isProcessing ? t('voice_processing') : t('voice_tap_to_speak')}
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
                                <FileText size={16} className="text-ns-primary-500" /> {t('voice_review_details')}
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
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Applied Law</label>
                                        <div className="flex flex-wrap gap-1">
                                            <span className={`px-1.5 py-0.5 text-[10px] rounded border ${extractedData.applicableSection?.includes('BNS')
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                }`}>
                                                {extractedData.applicableSection}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-1">{extractedData.actName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {submissionStatus === 'success' && (
                            <div className="bg-ns-success/10 border border-ns-success/30 rounded-xl p-4 text-center animate-scale-in">
                                <CheckCircle className="w-10 h-10 text-ns-success mx-auto mb-2" />
                                <h4 className="text-white font-bold text-lg title">{t('voice_case_filed')}</h4>
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
                                    {t('voice_file_another')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {
                        submissionStatus !== 'success' && (
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
                                            {t('voice_submit_blockchain')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div >
            )
            }
        </div >
    );
};

export default VoiceFilingInterface;
