import { useState, useEffect } from 'react';
import { Unlock, Banknote, Lock, CalendarClock, FileText, PartyPopper, AlertTriangle, Speaker } from 'lucide-react';

export type Language = 'hi' | 'gu' | 'en';

export interface VisualCard {
    icon: string;
    heading: string;
    description: string;
    color: string;
    audioText: string;
}

const ICON_MAP: Record<string, any> = {
    'Unlock': Unlock,
    'Banknote': Banknote,
    'Lock': Lock,
    'CalendarClock': CalendarClock,
    'FileText': FileText,
    'PartyPopper': PartyPopper,
    'AlertTriangle': AlertTriangle
};

function parseOrderToVisuals(text: string, language: Language): VisualCard[] {
    const cards: VisualCard[] = [];

    // Bail detection
    if (/bail.*granted|zamanat.*mili/i.test(text)) {
        cards.push({
            icon: 'Unlock',
            heading: language === 'hi' ? 'ज़मानत मिली' : language === 'gu' ? 'જામીન મળ્યા' : 'Bail Granted',
            description: language === 'hi' ? 'आप जेल से बाहर आ सकते हैं' : language === 'gu' ? 'તમે જેલમાંથી બહાર આવી શકો છો' : 'You can leave jail',
            color: 'green',
            audioText: language === 'hi' ? 'Zamanat mil gayi hai' : language === 'gu' ? 'Jamin malyu chhe' : 'Bail has been granted'
        });
    }

    // Fine detection
    const fineMatch = text.match(/fine.*?₹?\s*(\d+)|jurmana.*?(\d+)/i);
    if (fineMatch) {
        const amount = fineMatch[1] || fineMatch[2];
        cards.push({
            icon: 'Banknote',
            heading: language === 'hi' ? `जुर्माना: ₹${amount}` : language === 'gu' ? `દંડ: ₹${amount}` : `Fine: ₹${amount}`,
            description: language === 'hi' ? 'यह रकम आपको देनी होगी' : language === 'gu' ? 'આ રકમ તમારે ચૂકવવી પડશે' : 'You must pay this amount',
            color: 'red',
            audioText: language === 'hi' ? `${amount} rupaye jurmana dena hoga` : language === 'gu' ? `${amount} rupiya dand bharvanu` : `You must pay ${amount} rupees fine`
        });
    }

    // Date detection
    const dateMatch = text.match(/next.*?(\d{1,2}[/-]\d{1,2}[/-]\d{4})|agli.tareekh.*?(\d{1,2}[/-]\d{1,2})/i);
    if (dateMatch) {
        const date = dateMatch[1] || dateMatch[2];
        cards.push({
            icon: 'CalendarClock',
            heading: language === 'hi' ? `अगली तारीख: ${date}` : language === 'gu' ? `આગલી તારીખ: ${date}` : `Next Date: ${date}`,
            description: language === 'hi' ? 'इस दिन कोर्ट आना है' : language === 'gu' ? 'આ દિવસે કોર્ટમાં આવવું' : 'You must come to court on this date',
            color: 'blue',
            audioText: language === 'hi' ? `Agli tareekh ${date} hai` : language === 'gu' ? `Agli tarikh ${date} chhe` : `Next date is ${date}`
        });
    }

    // Acquittal detection
    if (/acquit|bari|not guilty/i.test(text)) {
        cards.push({
            icon: 'PartyPopper',
            heading: language === 'hi' ? 'बरी कर दिया गया' : language === 'gu' ? 'દોષમુક્ત કરવામાં આવ્યા' : 'Acquitted',
            description: language === 'hi' ? 'आप दोषी नहीं पाए गए' : language === 'gu' ? 'તમે દોષિત નથી' : 'You were found not guilty',
            color: 'green',
            audioText: language === 'hi' ? 'Aapko bari kar diya gaya hai' : language === 'gu' ? 'Tame doshmukt karya chho' : 'You have been acquitted'
        });
    }

    // Guilty detection
    if (/guilty|doshi|convicted/i.test(text)) {
        cards.push({
            icon: 'AlertTriangle',
            heading: language === 'hi' ? 'दोषी पाया गया' : language === 'gu' ? 'દોષિત જાહેર કરવામાં આવ્યા' : 'Found Guilty',
            description: language === 'hi' ? 'आप अपराध के लिए दोषी हैं' : language === 'gu' ? 'તમે દોષિત છો' : 'You are guilty of the offense',
            color: 'red',
            audioText: language === 'hi' ? 'Aapko doshi paya gaya hai' : language === 'gu' ? 'Tame doshit chho' : 'You have been found guilty'
        });
    }

    return cards;
}

interface NyayaChitraProps {
    legalText: string;
    language: Language;
    onCardClick?: (card: VisualCard) => void;
}

import { useLocalization } from '../features/main/hooks/useLocalization';

export default function NyayaChitra({ legalText, language, onCardClick }: NyayaChitraProps) {
    const [cards, setCards] = useState<VisualCard[]>([]);
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const { t } = useLocalization(language === 'gu' ? 'en' : language); // Fallback for Gujarati if not fully supported in useLocalization yet, or just pass language. Assuming useLocalization handles 'gu' or falls back.

    useEffect(() => {
        const visualCards = parseOrderToVisuals(legalText, language);
        setCards(visualCards);
    }, [legalText, language]);

    const shareToWhatsApp = () => {
        const message = cards
            .map((card) => `*${card.heading}*\n${card.description}`)
            .join('\n\n');
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Show success notification
        setShowSuccess(true);
        playNotificationSound();
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const playNotificationSound = () => {
        const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AudioContext) return;

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const playAudio = (text: string, index: number) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
        utterance.rate = 0.9;

        speechSynthesis.speak(utterance);
        setPlayingAudio(index);

        utterance.onend = () => setPlayingAudio(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">{t('nyaya_chitra_title')}</h2>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-6 snap-x">
                {cards.map((card, index) => {
                    const IconComponent = ICON_MAP[card.icon];
                    const colorClasses: Record<string, string> = {
                        green: 'bg-green-50 border-green-400 text-green-900',
                        red: 'bg-red-50 border-red-400 text-red-900',
                        blue: 'bg-blue-50 border-blue-400 text-blue-900',
                        gray: 'bg-gray-50 border-gray-400 text-gray-900',
                        purple: 'bg-purple-50 border-purple-400 text-purple-900',
                        orange: 'bg-orange-50 border-orange-400 text-orange-900'
                    };

                    return (
                        <div
                            key={index}
                            className={`flex-shrink-0 w-64 h-80 ${colorClasses[card.color]} border-2 rounded-xl p-6 flex flex-col items-center justify-between shadow-lg cursor-pointer transform hover:scale-105 transition-transform snap-center`}
                            onClick={() => onCardClick?.(card)}
                        >
                            <div className="flex flex-col items-center">
                                <IconComponent className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-bold text-center mb-3">{card.heading}</h3>
                                <p className="text-sm text-center flex-1">{card.description}</p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio(card.audioText, index);
                                }}
                                className="mt-4 bg-white p-3 rounded-full shadow hover:shadow-md transition-shadow"
                                aria-label="Play audio"
                            >
                                <Speaker className={`w-6 h-6 ${playingAudio === index ? 'animate-pulse text-blue-600' : 'text-gray-600'}`} />
                            </button>
                        </div>
                    );
                })}

                {cards.length === 0 && (
                    <div className="w-full text-center text-gray-400 py-10 border-2 border-dashed rounded-lg">
                        {t('no_visual_cards')}
                    </div>
                )}
            </div>

            {/* WhatsApp Share Button */}
            {cards.length > 0 && (
                <div className="text-center">
                    <button
                        onClick={shareToWhatsApp}
                        className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto"
                    >
                        <span className="text-2xl">📱</span> {t('share_whatsapp')}
                    </button>
                    <p className="text-sm text-gray-600 mt-2">{t('send_visual_summary')}</p>
                </div>
            )}

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded shadow-lg animate-bounce flex items-center gap-2">
                    <span>✓</span> {t('visual_summary_sent')}
                </div>
            )}
        </div>
    );
}
