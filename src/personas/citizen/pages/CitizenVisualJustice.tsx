// CitizenVisualJustice.tsx - Visual Justice for Citizens
// Allows citizens to input legal text and get visual cards

import React, { useState } from 'react';
import {
    Image,
    FileText,
    Sparkles,
    Download,
    Share2,
    Eye,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Home,
    Scale,
    Shield,
    Gavel,
    Users
} from 'lucide-react';
import { useCitizenTranslation } from '../../../features/citizen/hooks/useCitizenTranslation';

interface VisualCard {
    id: string;
    icon: React.ReactNode;
    heading: string;
    description: string;
    color: string;
}

// Sample legal scenarios for quick selection
const sampleScenarios = [
    {
        id: 'property',
        title: 'Property Dispute',
        icon: <Home className="w-5 h-5" />,
        text: 'Under Section 53A of Transfer of Property Act, 1882, a person who has taken possession of immovable property in part performance of a contract for sale, may be protected from eviction if they have performed their part of the contract and are ready to perform the remaining part.'
    },
    {
        id: 'bail',
        title: 'Bail Application',
        icon: <Scale className="w-5 h-5" />,
        text: 'As per Section 437 of CrPC, in non-bailable offences, the court may release the accused on bail if there are reasonable grounds to believe that he is not guilty, or if the investigation is complete and there is no likelihood of the accused tampering with evidence or influencing witnesses.'
    },
    {
        id: 'consumer',
        title: 'Consumer Rights',
        icon: <Shield className="w-5 h-5" />,
        text: 'Under the Consumer Protection Act, 2019, a consumer can file a complaint within two years from the date of purchase. The consumer is entitled to refund, replacement, or compensation if the product is defective or services are deficient.'
    },
    {
        id: 'maintenance',
        title: 'Family Maintenance',
        icon: <Users className="w-5 h-5" />,
        text: 'Section 125 of CrPC provides for maintenance of wives, children, and parents. A person having sufficient means but neglecting or refusing to maintain them may be ordered to pay monthly maintenance to ensure their basic needs are met.'
    }
];

const CitizenVisualJustice: React.FC = () => {
    const { t } = useCitizenTranslation();
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [visualCards, setVisualCards] = useState<VisualCard[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

    const handleScenarioClick = (scenario: typeof sampleScenarios[0]) => {
        setSelectedScenario(scenario.id);
        setInputText(scenario.text);
        setVisualCards([]);
    };

    const generateVisuals = async () => {
        if (!inputText || inputText.length < 20) return;

        setIsGenerating(true);
        setVisualCards([]);

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock visual cards based on input
        const generatedCards: VisualCard[] = [
            {
                id: '1',
                icon: <Gavel className="w-8 h-8" />,
                heading: 'Key Legal Provision',
                description: 'The law provides specific protections and rights under the mentioned section. Understanding these provisions helps citizens navigate the legal system effectively.',
                color: 'from-blue-500 to-indigo-600'
            },
            {
                id: '2',
                icon: <CheckCircle className="w-8 h-8" />,
                heading: 'Your Rights',
                description: 'As a citizen, you have the right to seek legal remedy through proper channels. The courts are bound to consider your case on merit.',
                color: 'from-emerald-500 to-green-600'
            },
            {
                id: '3',
                icon: <FileText className="w-8 h-8" />,
                heading: 'Required Documents',
                description: 'Gather all relevant documents including ID proof, supporting evidence, and any previous correspondence related to your case.',
                color: 'from-amber-500 to-orange-600'
            },
            {
                id: '4',
                icon: <Scale className="w-8 h-8" />,
                heading: 'Next Steps',
                description: 'Consult with a legal professional, prepare your documentation, and file your case at the appropriate court or forum.',
                color: 'from-purple-500 to-pink-600'
            }
        ];

        setVisualCards(generatedCards);
        setIsGenerating(false);
    };

    const handleShare = () => {
        // Mock share functionality
        alert('Share feature: In production, this would generate a WhatsApp-friendly image or PDF for easy sharing.');
    };

    const handleDownload = () => {
        // Mock download functionality
        alert('Download feature: In production, this would download the visual cards as a PDF document.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image className="w-8 h-8 text-pink-400" />
                        <h1 className="text-3xl font-bold text-white">{t('visual_justice_title')}</h1>
                    </div>
                    <p className="text-slate-400">{t('visual_justice_subtitle')}</p>
                </div>

                {/* Quick Scenarios */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Quick Scenarios (Click to use)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {sampleScenarios.map((scenario) => (
                            <button
                                key={scenario.id}
                                onClick={() => handleScenarioClick(scenario)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedScenario === scenario.id
                                    ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {scenario.icon}
                                    <span className="font-medium text-sm">{scenario.title}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <label className="text-sm font-medium text-slate-300">Enter Legal Text or Case Details</label>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        Paste a legal provision, court order, or case summary. Our AI will create visual cards explaining it simply.
                    </p>
                    <textarea
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setSelectedScenario(null);
                        }}
                        rows={6}
                        placeholder="Example: Under Section 125 of CrPC, a person having sufficient means but neglecting to maintain his wife, children, or parents..."
                        className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all resize-none"
                    />
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-slate-500">
                            {inputText.length}/20 characters minimum {inputText.length >= 20 && <CheckCircle className="w-3 h-3 inline text-emerald-400" />}
                        </p>
                        <button
                            onClick={generateVisuals}
                            disabled={inputText.length < 20 || isGenerating}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {t('visual_generating')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {t('visual_generate_summary')}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-pink-500/20 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                        </div>
                        <p className="text-slate-400 mt-4">Analyzing legal text and creating visual cards...</p>
                        <p className="text-xs text-slate-500 mt-1">Powered by AI for simple explanations</p>
                    </div>
                )}

                {/* Visual Cards */}
                {visualCards.length > 0 && !isGenerating && (
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Eye className="w-6 h-6 text-pink-400" />
                                Generated Visual Summary
                                <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 font-medium">
                                    ✨ AI-Powered
                                </span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleShare}
                                    className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {visualCards.map((card, index) => (
                                <div
                                    key={card.id}
                                    className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10`}></div>
                                    <div className="relative p-6">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                            {card.icon}
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-2">{card.heading}</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Note */}
                        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-400 text-sm font-medium">Legal Disclaimer</p>
                                <p className="text-slate-400 text-xs mt-1">
                                    These visual summaries are for educational purposes only. For legal advice, please consult a qualified legal professional.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {visualCards.length === 0 && !isGenerating && (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <Image className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-400 mb-2">No Visual Cards Generated Yet</h3>
                        <p className="text-sm text-slate-500">
                            Enter legal text above or select a sample scenario to generate visual summaries
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenVisualJustice;
