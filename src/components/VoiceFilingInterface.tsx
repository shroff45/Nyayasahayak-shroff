import { useState } from 'react';
import { Case, Language } from '../types';
import { applicableLawFor } from '../core/workspace/legacyCaseAdapter';
import { addBlock } from '../services/akhandLedger';
import { Mic, MicOff } from 'lucide-react';

import { useLocalization } from '../features/main/hooks/useLocalization';

export default function VoiceFilingInterface() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState<Language>('hi');
    const [extractedData, setExtractedData] = useState<Partial<Case> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const { t } = useLocalization(language);

    // Web Speech API Integration
    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Browser does not support Speech Recognition");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            setTranscript((prev) => prev + ' ' + transcriptText);
        };

        recognition.onerror = (event: any) => {
            setError('Speech recognition error: ' + event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (transcript.length > 0) {
                processTranscript(transcript);
            }
        };

        recognition.start();
        setIsListening(true);
        setError(null);
    };

    const stopListening = () => {
        setIsListening(false);
        // processTranscript will be called by onend
    };

    // AI Extraction (Mock Implementation)
    async function processTranscript(text: string): Promise<Partial<Case>> {
        setIsProcessing(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock extraction logic
        const extracted: Partial<Case> = {
            complainant: extractName(text, 'complainant'),
            respondent: extractName(text, 'respondent'),
            summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            caseNotes: text,
            sectionsInvoked: extractSections(text),
            urgency: detectUrgency(text),
            caseType: detectCaseType(text),
            filingDate: new Date().toISOString(),
            status: 'FILED',
            adjournmentsCount: 0
        };

        setExtractedData(extracted);
        setIsProcessing(false);
        return extracted;
    }

    function extractName(text: string, type: 'complainant' | 'respondent'): string {
        const pattern = type === 'complainant' ? /my name is (\w+)/i : /against (\w+)/i;
        const match = text.match(pattern);
        return match ? match[1] : (type === 'complainant' ? 'Unknown Complainant' : 'Unknown Respondent');
    }

    function extractSections(text: string): string[] {
        const sections: string[] = [];
        if (/murder|kill|death/i.test(text)) sections.push('IPC 302');
        if (/theft|stole|stolen/i.test(text)) sections.push('IPC 379');
        if (/cheat|fraud/i.test(text)) sections.push('IPC 420');
        if (/assault|attack|hurt/i.test(text)) sections.push('IPC 323');
        return sections;
    }

    function detectUrgency(text: string): 'HIGH' | 'MEDIUM' | 'LOW' {
        if (/urgent|emergency|immediate|serious|critical/i.test(text)) return 'HIGH';
        if (/important|priority/i.test(text)) return 'MEDIUM';
        return 'LOW';
    }

    function detectCaseType(text: string): string {
        if (/murder|theft|assault|crime/i.test(text)) return 'Criminal';
        if (/property|contract|dispute/i.test(text)) return 'Civil';
        if (/divorce|custody|marriage/i.test(text)) return 'Family';
        return 'General';
    }

    const handleSubmit = async () => {
        if (!extractedData) return;

        const nowIso = new Date().toISOString();
        const completeCase: Case = {
            id: `C${Date.now()}`,
            cnrNumber: `DL/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`,
            complainant: extractedData.complainant || '',
            respondent: extractedData.respondent || '',
            caseType: extractedData.caseType || 'General',
            summary: extractedData.summary || '',
            caseNotes: extractedData.caseNotes || '',
            urgency: extractedData.urgency || 'MEDIUM',
            sectionsInvoked: extractedData.sectionsInvoked || [],
            status: 'FILED',
            filingDate: nowIso,
            adjournmentsCount: 0,
            // BNS vs IPC turns on the date of the incident; for a fresh e-FIR that is now.
            incidentDate: nowIso,
            isZeroFir: false,
            applicableLaw: applicableLawFor(nowIso)
        };

        const result = addBlock(completeCase);
        if (result.success) {
            setSubmissionSuccess(true);
            setTranscript('');
            setExtractedData(null);
            setTimeout(() => setSubmissionSuccess(false), 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">{t('voice_filing_title')}</h2>

            {/* Language Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">{t('select_language')}</label>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full p-2 border rounded"
                >
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="en">English</option>
                </select>
            </div>

            {/* Microphone Button */}
            <div className="flex flex-col items-center mb-8">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    aria-label="Voice input button"
                >
                    {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-gray-700" />}
                </button>
                <p className="mt-2 text-sm font-medium text-gray-600">
                    {isListening ? t('listening') : t('click_to_speak')}
                </p>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            {/* Transcript Display */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">{t('transcript_label')}</label>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={4}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder={t('spoken_text_placeholder')}
                />
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="text-center mb-6 text-blue-600">
                    {t('processing_speech')}
                </div>
            )}

            {/* Auto-Filled Form (shown after processing) */}
            {extractedData && (
                <div className="border rounded p-6 mb-6 bg-gray-50">
                    <h3 className="text-lg font-bold mb-4">{t('review_complaint')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">{t('complainant')}</label>
                            <input
                                type="text"
                                value={extractedData.complainant}
                                onChange={(e) => setExtractedData({ ...extractedData, complainant: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('respondent')}</label>
                            <input
                                type="text"
                                value={extractedData.respondent}
                                onChange={(e) => setExtractedData({ ...extractedData, respondent: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('case_type')}</label>
                            <select
                                value={extractedData.caseType}
                                onChange={(e) => setExtractedData({ ...extractedData, caseType: e.target.value })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="Criminal">Criminal</option>
                                <option value="Civil">Civil</option>
                                <option value="Family">Family</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('urgency_label')}</label>
                            <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${extractedData.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                                extractedData.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                {extractedData.urgency}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">{t('summary')}</label>
                            <textarea
                                value={extractedData.summary}
                                onChange={(e) => setExtractedData({ ...extractedData, summary: e.target.value })}
                                className="w-full p-2 border rounded"
                                rows={2}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">{t('sections_invoked')}</label>
                            <div className="flex flex-wrap gap-2">
                                {extractedData.sectionsInvoked?.map((sec, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                        {sec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        {t('submit_blockchain')}
                    </button>
                </div>
            )}

            {/* Success Message */}
            {submissionSuccess && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded shadow-lg animate-bounce">
                    {t('complaint_filed_success')}
                </div>
            )}
        </div>
    );
}
