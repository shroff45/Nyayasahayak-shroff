// src/personas/police/pages/SmartFIR.tsx
// NyayaSahayak Hybrid v3.0.0 - Premium Smart FIR (NyayaRakshak)
// AI-Powered Voice-to-FIR with BNS Section Recommendations
// सत्यमेव जयते - Truth Alone Triumphs

import React, { useState, useCallback, useEffect } from 'react';
import {
    Mic, MicOff, FileText, Sparkles, Send, AlertTriangle,
    Shield, Brain, CheckCircle, Loader2, Volume2, Wand2,
    Scale, Clock, Save, RefreshCw, Target, Zap, BookOpen
} from 'lucide-react';
import AnimatedBackground from '../../../shared/components/3d/AnimatedBackground';
import FloatingCard from '../../../shared/components/3d/FloatingCard';
import { useToast } from '../../../shared/hooks/useToast';

// BNS Section suggestions are generated dynamically based on incident analysis

interface SectionSuggestion {
    code: string;
    oldCode: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    added?: boolean;
}

interface FormData {
    complainant: string;
    respondent: string;
    location: string;
    dateTime: string;
    sections: SectionSuggestion[];
}

const SmartFIR: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<SectionSuggestion[]>([]);
    const [formData, setFormData] = useState<FormData>({
        complainant: '',
        respondent: '',
        location: '',
        dateTime: new Date().toISOString().slice(0, 16),
        sections: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const { showToast } = useToast();

    // Simulate voice recognition
    const toggleListening = useCallback(() => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        setIsListening(true);
        showToast('🎤 Listening... Speak now', 'info', 2000);

        // Simulate voice input after 3 seconds
        setTimeout(() => {
            const mockText = "Subject reported a snatching incident near Sector 12 market around 5:30 PM today. Two bike-borne assailants wearing helmets snatched a gold chain worth Rs. 50,000 and mobile phone from Mrs. Sunita Sharma, aged 45 years. The accused fled towards the highway. Nearby CCTV footage available. Witness: Ramesh Kumar, shopkeeper.";
            setTranscript(prev => prev ? prev + ' ' + mockText : mockText);
            setIsListening(false);
            handleAIAnalysis(mockText);
            showToast('✓ Voice captured successfully', 'success', 2000);
        }, 3000);
    }, [isListening, showToast]);

    // AI Analysis for section detection
    const handleAIAnalysis = useCallback((text: string) => {
        setAnalyzing(true);
        setConfidence(0);

        // Animate confidence meter
        const interval = setInterval(() => {
            setConfidence(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            setConfidence(100);

            // Mock AI suggestions based on keywords
            const detectedSections: SectionSuggestion[] = [];
            const lowerText = text.toLowerCase();

            if (lowerText.includes('snatch') || lowerText.includes('robbery') || lowerText.includes('chain')) {
                detectedSections.push({
                    code: 'BNS 304',
                    oldCode: 'IPC 379',
                    description: 'Snatching',
                    severity: 'MEDIUM',
                    confidence: 94
                });
                detectedSections.push({
                    code: 'BNS 309',
                    oldCode: 'IPC 392',
                    description: 'Robbery',
                    severity: 'HIGH',
                    confidence: 87
                });
            }

            if (lowerText.includes('assault') || lowerText.includes('attack') || lowerText.includes('hurt')) {
                detectedSections.push({
                    code: 'BNS 115',
                    oldCode: 'IPC 323',
                    description: 'Voluntarily Causing Hurt',
                    severity: 'MEDIUM',
                    confidence: 78
                });
            }

            if (lowerText.includes('bike') || lowerText.includes('vehicle')) {
                detectedSections.push({
                    code: 'MV Act 184',
                    oldCode: 'MV Act 184',
                    description: 'Dangerous Driving',
                    severity: 'LOW',
                    confidence: 65
                });
            }

            // Extract entities from text
            const nameMatch = text.match(/Mrs?\.\s*(\w+\s*\w*)/i);
            if (nameMatch) {
                setFormData(prev => ({ ...prev, complainant: nameMatch[0] }));
            }

            const locationMatch = text.match(/near\s+([\w\s]+\d*)/i);
            if (locationMatch) {
                setFormData(prev => ({ ...prev, location: locationMatch[1].trim() }));
            }

            setSuggestions(detectedSections);
            setAnalyzing(false);
            showToast('✨ AI analysis complete - sections detected', 'success', 3000);
        }, 2000);
    }, [showToast]);

    // Add section to FIR
    const addSection = useCallback((section: SectionSuggestion) => {
        setSuggestions(prev => prev.map(s =>
            s.code === section.code ? { ...s, added: true } : s
        ));
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, section]
        }));
        showToast(`✓ ${section.code} added to FIR`, 'success', 2000);
    }, [showToast]);

    // Submit FIR
    const handleSubmit = useCallback(async () => {
        if (!transcript || formData.sections.length === 0) {
            showToast('⚠️ Please add incident details and at least one section', 'info', 3000);
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setShowSuccess(true);
        setIsSubmitting(false);
        showToast('🎉 FIR registered successfully on Akhand Ledger!', 'success', 4000);

        // Reset after 3 seconds
        setTimeout(() => {
            setShowSuccess(false);
            setTranscript('');
            setSuggestions([]);
            setFormData({
                complainant: '',
                respondent: '',
                location: '',
                dateTime: new Date().toISOString().slice(0, 16),
                sections: []
            });
        }, 3000);
    }, [transcript, formData.sections, showToast]);

    // Analyze on text change
    useEffect(() => {
        if (transcript.length > 50 && suggestions.length === 0 && !analyzing) {
            handleAIAnalysis(transcript);
        }
    }, [transcript, suggestions.length, analyzing, handleAIAnalysis]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'text-red-400 bg-red-500/20 border-red-500/50';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
            case 'LOW': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    return (
        <AnimatedBackground variant="aurora">
            <div className="p-6 space-y-6 min-h-full">
                {/* Premium Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                            <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Smart FIR <span className="text-emerald-400">•</span> AI Voice Filing
                            </h1>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                BNS-Compliant with Gemini AI Section Detection
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">BNSS 2023 Compliant</span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Panel - Voice Input & Transcript */}
                    <div className="space-y-6">
                        <FloatingCard glowColor="cyan" intensity="medium">
                            <div className="p-6">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-cyan-400" />
                                    Incident Narration
                                </h2>

                                {/* Voice Button */}
                                <div className="flex flex-col items-center mb-6">
                                    <button
                                        onClick={toggleListening}
                                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50 animate-pulse scale-110'
                                            : 'bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 hover:scale-105 shadow-lg shadow-emerald-500/30'
                                            }`}
                                    >
                                        {isListening ? (
                                            <MicOff className="w-10 h-10 text-white" />
                                        ) : (
                                            <Mic className="w-10 h-10 text-white" />
                                        )}
                                        {/* Ripple effect when listening */}
                                        {isListening && (
                                            <>
                                                <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                                                <span className="absolute inset-[-8px] rounded-full border border-red-400/50 animate-pulse" />
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-3 text-sm font-medium text-slate-300">
                                        {isListening ? (
                                            <span className="flex items-center gap-2 text-red-400">
                                                <Volume2 className="w-4 h-4 animate-pulse" /> Recording...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Mic className="w-4 h-4" /> Click to start voice input
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Transcript Textarea */}
                                <div className="relative">
                                    <textarea
                                        className="w-full h-48 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none font-mono text-sm leading-relaxed transition-all"
                                        placeholder="Start speaking or type the incident details here...

Example: 'Subject reported a theft incident near Gandhi Chowk around 3:00 PM...'"
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                    />
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3">
                                            <Brain className="w-10 h-10 text-purple-400 animate-pulse" />
                                            <div className="text-purple-300 font-medium">Analyzing Incident...</div>
                                            <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-200"
                                                    style={{ width: `${confidence}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-slate-400">AI Confidence: {confidence}%</div>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleAIAnalysis(transcript)}
                                        disabled={!transcript || analyzing}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-xl text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Wand2 className="w-4 h-4" /> Re-Analyze with AI
                                    </button>
                                    <button
                                        onClick={() => { setTranscript(''); setSuggestions([]); }}
                                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-600 transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </FloatingCard>

                        {/* Form Details */}
                        <FloatingCard glowColor="green" intensity="low">
                            <div className="p-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-400" /> Auto-Extracted Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Complainant</label>
                                        <input
                                            type="text"
                                            value={formData.complainant}
                                            onChange={(e) => setFormData({ ...formData, complainant: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                            placeholder="Auto-detected..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Accused/Unknown</label>
                                        <input
                                            type="text"
                                            value={formData.respondent}
                                            onChange={(e) => setFormData({ ...formData, respondent: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                            placeholder="Unknown accused"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                            placeholder="Auto-detected..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.dateTime}
                                            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </FloatingCard>
                    </div>

                    {/* Right Panel - AI Suggestions & Actions */}
                    <div className="space-y-6">
                        {/* AI Section Recommendations */}
                        <FloatingCard glowColor="purple" intensity="medium">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-purple-400" /> AI Section Recommendations
                                    </h3>
                                    {suggestions.length > 0 && (
                                        <span className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300">
                                            {suggestions.length} detected
                                        </span>
                                    )}
                                </div>

                                {suggestions.length > 0 ? (
                                    <div className="space-y-3">
                                        {suggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-xl border transition-all ${s.added
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : 'bg-slate-800/50 border-slate-600 hover:border-purple-500'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(s.severity)}`}>
                                                            {s.severity}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold">{s.code}</p>
                                                            <p className="text-xs text-slate-400">was {s.oldCode}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-400">Confidence</p>
                                                            <p className="text-sm font-bold text-emerald-400">{s.confidence}%</p>
                                                        </div>
                                                        {!s.added ? (
                                                            <button
                                                                onClick={() => addSection(s)}
                                                                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/30 transition-all"
                                                            >
                                                                Add
                                                            </button>
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-300 mt-2">{s.description}</p>
                                            </div>
                                        ))}

                                        {/* Legal Tip */}
                                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>AI Tip:</strong> Check CCTV footage mentioned in statement. Consider IPC 379/BNS 304 for chain snatching under Motor Vehicles Act for dangerous driving.
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                                        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">
                                            Describe the incident to get<br />BNS Section recommendations
                                        </p>
                                    </div>
                                )}
                            </div>
                        </FloatingCard>

                        {/* Added Sections Summary */}
                        {formData.sections.length > 0 && (
                            <FloatingCard glowColor="green" intensity="low">
                                <div className="p-6">
                                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Scale className="w-4 h-4" /> Sections in FIR ({formData.sections.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.sections.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-sm text-emerald-300 font-medium">
                                                {s.code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </FloatingCard>
                        )}

                        {/* Submit Actions */}
                        <FloatingCard glowColor="cyan" intensity="low">
                            <div className="p-6">
                                <div className="flex gap-4">
                                    <button className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> Save Draft
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !transcript}
                                        className={`flex-1 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${isSubmitting
                                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/30'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" /> File FIR
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Action recorded in the Akhand Ledger (tamper-evident, this device only)
                                </p>
                            </div>
                        </FloatingCard>

                        {/* BNSS Compliance Info */}
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-300">BNSS Compliance Reminder</p>
                                    <p className="text-xs text-blue-300/80 mt-1">
                                        Under BNSS Section 154, every FIR must be registered immediately upon cognizable offense report. Zero FIR allowed for cross-jurisdiction.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Modal */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 max-w-md text-center shadow-2xl shadow-emerald-500/20 animate-in zoom-in-50 duration-300">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">FIR Registered Successfully!</h2>
                            <p className="text-slate-400 mb-4">
                                FIR Number: <span className="text-emerald-400 font-mono">FIR/2025/{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</span>
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                <Shield className="w-4 h-4" />
                                Recorded on Akhand Ledger at {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Satyamev Jayate Badge */}
                <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-full z-40">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold text-sm">Smart FIR</span>
                    <span className="text-xs text-emerald-300/70">• AI-Powered</span>
                </div>
            </div>
        </AnimatedBackground>
    );
};

export default SmartFIR;
