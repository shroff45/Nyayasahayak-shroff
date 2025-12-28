import React, { useState } from 'react';
export type Language = 'hi' | 'gu' | 'en' | 'ta' | 'te';

export interface VisualCard {
    icon: string;
    heading: string;
    description: string;
    color: string;
    audioText: string;
}
import {
    Unlock,
    Lock,
    Banknote,
    CalendarClock,
    FileText,
    PartyPopper,
    AlertTriangle,
    Share2,
    Play,
    Pause
} from 'lucide-react';

interface NyayaChitraProps {
    legalText: string;
    language: Language;
}

/**
 * NyayaChitra - Generative Visual Justice
 * Converts legal text to accessible visual cards with audio and WhatsApp sharing.
 */
const NyayaChitra: React.FC<NyayaChitraProps> = ({ legalText, language }) => {
    const [cards, setCards] = useState<VisualCard[]>([]);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared'>('idle');

    // Generate cards on mount or when text changes
    React.useEffect(() => {
        if (legalText) {
            setCards(parseTextToVisuals(legalText, language));
        }
    }, [legalText, language]);

    const parseTextToVisuals = (text: string, lang: Language): VisualCard[] => {
        const visualCards: VisualCard[] = [];
        const lowerText = text.toLowerCase();

        // 1. Bail/Release
        if (lowerText.match(/bail|release|zamanat|released/)) {
            visualCards.push({
                icon: 'Unlock',
                heading: lang === 'hi' ? "ज़मानत मिली" : "Bail Granted",
                description: lang === 'hi' ? "आप जेल से बाहर आ सकते हैं" : "You can leave jail",
                color: 'green',
                audioText: lang === 'hi' ? "मुबारक हो, आपको ज़मानत मिल गई है। आप अब घर जा सकते हैं।" : "Good news, bail has been granted. You can be released from custody."
            });
        }

        // 2. Fine/Penalty
        const fineMatch = lowerText.match(/₹?\s*(\d+)/);
        if (lowerText.match(/fine|penalty|rupees|jurmana/) && fineMatch) {
            const amount = fineMatch[1];
            visualCards.push({
                icon: 'Banknote',
                heading: lang === 'hi' ? `जुर्माना: ₹${amount}` : `Fine: ₹${amount}`,
                description: lang === 'hi' ? "यह रकम आपको देनी होगी" : "You must pay this amount",
                color: 'red',
                audioText: lang === 'hi' ? `आपको ${amount} रुपये का जुर्माना भरना होगा।` : `You are required to pay a fine of ${amount} rupees.`
            });
        }

        // 3. Court Date
        const dateMatch = lowerText.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
        if ((lowerText.match(/next|date|hearing|appear|tareekh/) || true) && dateMatch) { // Always check for date
            const date = dateMatch[1];
            visualCards.push({
                icon: 'CalendarClock',
                heading: lang === 'hi' ? `अगली तारीख: ${date}` : `Next Date: ${date}`,
                description: lang === 'hi' ? "इस दिन कोर्ट आना है" : "You must appear in court",
                color: 'blue',
                audioText: lang === 'hi' ? `आपकी अगली सुनवाई ${date} को है। समय पर कोर्ट पहुंचें।` : `Your next court hearing is on ${date}. Please appear on time.`
            });
        }

        // 4. Custody
        if (lowerText.match(/custody|jail|prison|detained|qaidi/) && !lowerText.match(/bail|release/)) {
            visualCards.push({
                icon: 'Lock',
                heading: lang === 'hi' ? "हिरासत" : "Custody",
                description: lang === 'hi' ? "जेल में रहना होगा" : "Remanded to custody",
                color: 'orange',
                audioText: lang === 'hi' ? "अदालत ने आपको हिरासत में भेजने का आदेश दिया है।" : "The court has ordered remand to judicial custody."
            });
        }

        return visualCards;
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Unlock': return <Unlock size={32} className="text-green-600" />;
            case 'Lock': return <Lock size={32} className="text-red-600" />;
            case 'Banknote': return <Banknote size={32} className="text-red-600" />;
            case 'CalendarClock': return <CalendarClock size={32} className="text-blue-600" />;
            case 'FileText': return <FileText size={32} className="text-gray-600" />;
            case 'PartyPopper': return <PartyPopper size={32} className="text-green-600" />;
            case 'AlertTriangle': return <AlertTriangle size={32} className="text-red-600" />;
            default: return <FileText size={32} />;
        }
    };

    const playAudio = (index: number) => {
        if (playingIndex === index) {
            window.speechSynthesis.cancel();
            setPlayingIndex(null);
            return;
        }

        window.speechSynthesis.cancel();
        const card = cards[index];
        const utterance = new SpeechSynthesisUtterance(card.audioText);
        utterance.lang = language === 'hi' ? 'hi-IN' :
            language === 'gu' ? 'gu-IN' :
                language === 'ta' ? 'ta-IN' :
                    language === 'te' ? 'te-IN' : 'en-IN';

        utterance.onend = () => setPlayingIndex(null);
        window.speechSynthesis.speak(utterance);
        setPlayingIndex(index);
    };

    const shareToWhatsApp = () => {
        setShareStatus('sharing');

        // Play sound
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.frequency.value = 800;
        oscillator.connect(context.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);

        const message = cards
            .map(c => `*${c.heading}*\n${c.description}`)
            .join('\n\n');

        const encodedMessage = encodeURIComponent(
            `NyayaSahayak Case Update:\n\n${message}\n\n- Powered by NyayaSahayak`
        );

        const url = `https://api.whatsapp.com/send?text=${encodedMessage}`;
        window.open(url, '_blank');

        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 3000);
    };

    if (cards.length === 0) return null;

    return (
        <div className="nyaya-chitra-container mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Nyaya-Chitra (Visual Summary)</h3>
                <button
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                >
                    <Share2 size={16} />
                    {shareStatus === 'shared' ? 'Shared!' : 'WhatsApp'}
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`flex-shrink-0 w-[180px] h-[240px] rounded-xl p-4 flex flex-col items-center justify-between text-center border-2 snap-center transition-transform hover:scale-105 ${card.color === 'green' ? 'bg-green-50 border-green-200' :
                            card.color === 'red' ? 'bg-red-50 border-red-200' :
                                card.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                                    card.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                                        'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${card.color === 'green' ? 'bg-green-100' :
                            card.color === 'red' ? 'bg-red-100' :
                                card.color === 'blue' ? 'bg-blue-100' :
                                    card.color === 'orange' ? 'bg-orange-100' :
                                        'bg-gray-100'
                            }`}>
                            {getIcon(card.icon)}
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">{card.heading}</h4>
                            <p className="text-xs text-gray-600 leading-snug">{card.description}</p>
                        </div>

                        <button
                            onClick={() => playAudio(index)}
                            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors ${playingIndex === index
                                ? 'bg-gray-800 text-white'
                                : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            {playingIndex === index ? <Pause size={16} /> : <Play size={16} />}
                            {playingIndex === index ? 'Playing...' : 'Listen'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NyayaChitra;
