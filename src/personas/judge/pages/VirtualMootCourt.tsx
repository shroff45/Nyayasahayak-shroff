// src/personas/judge/pages/VirtualMootCourt.tsx
// NyayaSahayak - Virtual Moot Court: Immersive 3D Courtroom Experience
// Features: 3D CSS perspective, animated speech bubbles, character podiums

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Scale, Play, Pause, RotateCcw,
    Brain, Gavel, FileText, AlertTriangle,
    CheckCircle2, Sparkles, BookOpen,
    Volume2, VolumeX, ExternalLink, Target, Lightbulb
} from 'lucide-react';

// Types
interface Argument {
    id: string;
    side: 'prosecution' | 'defense';
    content: string;
    contentHi?: string;
    evidence?: string;
    timestamp: number;
}

interface JudgeThought {
    id: string;
    content: string;
    contentHi?: string;
    type: 'analysis' | 'precedent' | 'concern' | 'favorable';
    confidence?: number;
    precedent?: string;
    precedentLink?: string;
}

interface KeyIssue {
    title: string;
    titleHi: string;
    description: string;
    descriptionHi: string;
    strength: 'prosecution' | 'defense' | 'neutral';
}

interface CaseData {
    id: string;
    title: string;
    titleHi: string;
    sections: string[];
    summary: string;
    summaryHi: string;
}

// Sample case data
const sampleCase: CaseData = {
    id: 'FIR/2024/DL/12345',
    title: 'State vs. Rajesh Kumar',
    titleHi: 'राज्य बनाम राजेश कुमार',
    sections: ['BNS 303', 'BNS 316'],
    summary: 'Theft of ₹5,00,000 from employer\'s safe. CCTV evidence vs alibi defense.',
    summaryHi: 'नियोक्ता की तिजोरी से ₹5,00,000 की चोरी। CCTV साक्ष्य बनाम एलिबी बचाव।'
};

// Simulated arguments
const simulatedArguments: Argument[] = [
    {
        id: '1',
        side: 'prosecution',
        content: 'Your Honor, CCTV footage clearly shows the accused accessing the safe after office hours on 15th March.',
        contentHi: 'माननीय, CCTV फुटेज स्पष्ट रूप से दर्शाता है कि 15 मार्च को आरोपी ने कार्यालय समय के बाद तिजोरी खोली।',
        evidence: 'CCTV Recording - Exhibit P1',
        timestamp: 0
    },
    {
        id: '2',
        side: 'defense',
        content: 'Objection! The CCTV timestamp shows signs of tampering. We request forensic verification under BSA Section 63.',
        contentHi: 'आपत्ति! CCTV टाइमस्टैम्प में छेड़छाड़ के संकेत हैं। हम BSA धारा 63 के तहत फोरेंसिक सत्यापन का अनुरोध करते हैं।',
        timestamp: 4000
    },
    {
        id: '3',
        side: 'prosecution',
        content: 'The footage is FSL certified. Additionally, the security guard witnessed accused leaving at 11:47 PM with a bag.',
        contentHi: 'फुटेज FSL प्रमाणित है। सुरक्षा गार्ड ने आरोपी को रात 11:47 बजे बैग के साथ जाते देखा।',
        evidence: 'Witness Statement - Exhibit P2',
        timestamp: 8000
    },
    {
        id: '4',
        side: 'defense',
        content: 'My client was at a family function in Gurgaon that night. We have 12 witnesses and GPS data proving this alibi.',
        contentHi: 'मेरा मुवक्किल उस रात गुरुग्राम में पारिवारिक समारोह में था। हमारे पास 12 गवाह और GPS डेटा है।',
        evidence: 'GPS Records + 12 Witnesses',
        timestamp: 12000
    },
    {
        id: '5',
        side: 'prosecution',
        content: 'GPS can be spoofed. Bank statements show the accused deposited ₹4,80,000 two days after the theft.',
        contentHi: 'GPS स्पूफ किया जा सकता है। बैंक विवरण दर्शाता है कि चोरी के दो दिन बाद ₹4,80,000 जमा किए।',
        evidence: 'Bank Statements - Exhibit P3',
        timestamp: 16000
    },
    {
        id: '6',
        side: 'defense',
        content: 'That deposit was a documented loan repayment from my client\'s cousin, dated 6 months prior.',
        contentHi: 'वह जमा राशि 6 महीने पहले के ऋण समझौते के अनुसार चचेरे भाई से वैध चुकौती थी।',
        evidence: 'Loan Agreement - Exhibit D14',
        timestamp: 20000
    }
];

// AI Judge thoughts
const simulatedThoughts: JudgeThought[] = [
    {
        id: '1',
        content: 'CCTV evidence is prima facie strong, but BSA Section 63 certification concerns are valid.',
        contentHi: 'CCTV साक्ष्य प्रथम दृष्टया मजबूत है, लेकिन BSA धारा 63 प्रमाणन चिंताएं वैध हैं।',
        type: 'analysis',
        confidence: 65
    },
    {
        id: '2',
        content: 'Anvar P.V. vs P.K. Basheer (2014): Section 65B certificate is mandatory for electronic evidence.',
        contentHi: 'अनवर पी.वी. बनाम बशीर (2014): इलेक्ट्रॉनिक साक्ष्य के लिए धारा 65B प्रमाणपत्र अनिवार्य।',
        type: 'precedent',
        precedent: '(2014) 10 SCC 473',
        precedentLink: 'https://indiankanoon.org/doc/187817/'
    },
    {
        id: '3',
        content: 'Security guard eyewitness testimony carries significant evidentiary weight.',
        contentHi: 'सुरक्षा गार्ड की प्रत्यक्षदर्शी गवाही का महत्वपूर्ण साक्ष्यात्मक मूल्य है।',
        type: 'favorable',
        confidence: 72
    },
    {
        id: '4',
        content: 'Defense alibi with GPS and 12 witnesses creates reasonable doubt. Cross-examination needed.',
        contentHi: 'GPS और 12 गवाहों की एलिबी उचित संदेह पैदा करती है। जिरह आवश्यक।',
        type: 'concern',
        confidence: 58
    },
    {
        id: '5',
        content: 'Bank deposit timing is circumstantial. Defense loan documentation appears verifiable.',
        contentHi: 'बैंक जमा का समय परिस्थितिजन्य है। ऋण दस्तावेज सत्यापन योग्य प्रतीत होते हैं।',
        type: 'analysis',
        confidence: 55
    },
    {
        id: '6',
        content: 'State of Karnataka vs. M.V. Mahesh (2019): Circumstantial chain must be unbroken.',
        contentHi: 'कर्नाटक राज्य बनाम महेश (2019): परिस्थितिजन्य शृंखला अटूट होनी चाहिए।',
        type: 'precedent',
        precedent: '(2019) 4 SCC 256',
        precedentLink: 'https://indiankanoon.org/search/?formInput=State%20of%20Karnataka%20vs%20M.V.%20Mahesh'
    }
];

// Key issues
const keyIssues: KeyIssue[] = [
    {
        title: 'Electronic Evidence Admissibility',
        titleHi: 'इलेक्ट्रॉनिक साक्ष्य स्वीकार्यता',
        description: 'CCTV requires BSA Section 63 / 65B certificate',
        descriptionHi: 'CCTV के लिए BSA धारा 63/65B प्रमाणपत्र आवश्यक',
        strength: 'defense'
    },
    {
        title: 'Alibi Verification',
        titleHi: 'एलिबी सत्यापन',
        description: 'GPS + 12 witnesses need cross-examination',
        descriptionHi: 'GPS और 12 गवाहों की जिरह आवश्यक',
        strength: 'neutral'
    },
    {
        title: 'Financial Trail',
        titleHi: 'वित्तीय निशान',
        description: 'Loan documentation explains deposit timing',
        descriptionHi: 'ऋण दस्तावेज जमा समय को स्पष्ट करते हैं',
        strength: 'defense'
    }
];

// Speech Bubble Component
const SpeechBubble: React.FC<{
    text: string;
    isActive: boolean;
    side: 'prosecution' | 'defense' | 'judge';
    evidence?: string;
}> = ({ text, isActive, side, evidence }) => {
    if (!isActive || !text) return null;

    const bubbleColors = {
        prosecution: 'from-red-500/20 to-red-600/30 border-red-500/50',
        defense: 'from-green-500/20 to-green-600/30 border-green-500/50',
        judge: 'from-purple-500/20 to-purple-600/30 border-purple-500/50'
    };

    const tailColors = {
        prosecution: 'border-t-red-500/50',
        defense: 'border-t-green-500/50',
        judge: 'border-t-purple-500/50'
    };

    return (
        <div
            className={`absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full z-30 
                animate-[popIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]`}
            style={{ minWidth: '280px', maxWidth: '360px' }}
        >
            <div className={`relative bg-gradient-to-br ${bubbleColors[side]} backdrop-blur-xl 
                rounded-2xl p-4 border-2 shadow-2xl`}>
                {/* Glowing effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${bubbleColors[side]} 
                    blur-xl opacity-50 -z-10`} />

                <p className="text-white text-sm leading-relaxed font-medium">
                    {text}
                    <span className="inline-block w-0.5 h-4 bg-white/70 ml-1 animate-pulse" />
                </p>

                {evidence && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70 
                        bg-white/10 px-2 py-1 rounded-lg">
                        <FileText className="w-3 h-3" />
                        {evidence}
                    </div>
                )}

                {/* Speech bubble tail */}
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 
                    w-0 h-0 border-l-8 border-r-8 border-t-12 
                    border-l-transparent border-r-transparent ${tailColors[side]}`} />
            </div>
        </div>
    );
};

// Human Miniature SVG Components
const LawyerMiniature: React.FC<{
    gender: 'male' | 'female';
    color: string;
    isActive: boolean;
    isSpeaking: boolean;
}> = ({ gender, color, isActive, isSpeaking }) => {
    const skinTone = '#D4A574';
    const hairColor = gender === 'male' ? '#1a1a1a' : '#0d0d0d';

    return (
        <svg viewBox="0 0 100 140" className={`w-full h-full transition-transform duration-300 ${isSpeaking ? 'animate-[speaking_0.6s_ease-in-out_infinite]' : ''}`}>
            <defs>
                <linearGradient id={`coat-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#0d0d0d" />
                </linearGradient>
                <linearGradient id={`glow-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4" />
                </filter>
            </defs>

            {/* Glow effect when active */}
            {isActive && <ellipse cx="50" cy="70" rx="45" ry="60" fill={`url(#glow-${color})`} opacity="0.5" />}

            {/* Body - Black Lawyer Coat */}
            <path d="M25,70 Q20,75 20,90 L20,130 Q20,135 25,135 L75,135 Q80,135 80,130 L80,90 Q80,75 75,70 L60,65 L40,65 Z"
                fill={`url(#coat-${color})`} filter="url(#shadow)" />

            {/* White Shirt Collar */}
            <path d="M40,65 L45,85 L50,75 L55,85 L60,65" fill="#ffffff" stroke="#e5e5e5" strokeWidth="0.5" />

            {/* Lawyer Bands (White strips) */}
            <rect x="44" y="70" width="5" height="15" rx="1" fill="#ffffff" />
            <rect x="51" y="70" width="5" height="15" rx="1" fill="#ffffff" />

            {/* Coat Buttons */}
            <circle cx="50" cy="95" r="2" fill="#333" />
            <circle cx="50" cy="105" r="2" fill="#333" />
            <circle cx="50" cy="115" r="2" fill="#333" />

            {/* Arms */}
            <path d="M25,75 Q15,85 18,110 Q20,115 25,115 L28,95 Q28,80 25,75" fill={`url(#coat-${color})`} />
            <path d="M75,75 Q85,85 82,110 Q80,115 75,115 L72,95 Q72,80 75,75" fill={`url(#coat-${color})`} />

            {/* Hands */}
            <ellipse cx="20" cy="112" rx="5" ry="4" fill={skinTone} />
            <ellipse cx="80" cy="112" rx="5" ry="4" fill={skinTone} />

            {/* Neck */}
            <path d="M42,55 L42,68 L58,68 L58,55" fill={skinTone} />

            {/* Head */}
            <ellipse cx="50" cy="40" rx="18" ry="22" fill={skinTone} filter="url(#shadow)" />

            {/* Hair */}
            {gender === 'male' ? (
                <path d="M32,35 Q32,18 50,18 Q68,18 68,35 Q68,28 50,28 Q32,28 32,35" fill={hairColor} />
            ) : (
                <>
                    <path d="M30,40 Q28,15 50,15 Q72,15 70,40 Q70,30 50,32 Q30,30 30,40" fill={hairColor} />
                    <path d="M28,40 Q25,60 30,80" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
                    <path d="M72,40 Q75,60 70,80" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
                </>
            )}

            {/* Face Features */}
            {/* Eyes */}
            <ellipse cx="42" cy="38" rx="4" ry="3" fill="white" />
            <ellipse cx="58" cy="38" rx="4" ry="3" fill="white" />
            <circle cx="42" cy="38" r="2" fill="#2d1810" />
            <circle cx="58" cy="38" r="2" fill="#2d1810" />
            <circle cx="42.5" cy="37.5" r="0.8" fill="white" />
            <circle cx="58.5" cy="37.5" r="0.8" fill="white" />

            {/* Eyebrows */}
            <path d="M37,33 Q42,31 47,33" stroke={hairColor} strokeWidth="1.5" fill="none" />
            <path d="M53,33 Q58,31 63,33" stroke={hairColor} strokeWidth="1.5" fill="none" />

            {/* Nose */}
            <path d="M50,42 Q48,48 50,50 Q52,48 50,42" stroke="#c4956a" strokeWidth="1" fill="none" />

            {/* Mouth - speaking animation */}
            {isSpeaking ? (
                <ellipse cx="50" cy="54" rx="5" ry="3" fill="#8B4513">
                    <animate attributeName="ry" values="3;4;2;3" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
            ) : (
                <path d="M45,54 Q50,57 55,54" stroke="#8B4513" strokeWidth="1.5" fill="none" />
            )}

            {/* Ears */}
            <ellipse cx="32" cy="40" rx="3" ry="5" fill={skinTone} />
            <ellipse cx="68" cy="40" rx="3" ry="5" fill={skinTone} />
        </svg>
    );
};

const JudgeMiniature: React.FC<{ isActive: boolean; isSpeaking: boolean }> = ({ isActive, isSpeaking }) => {
    const skinTone = '#C9A882';

    return (
        <svg viewBox="0 0 120 160" className={`w-full h-full transition-transform duration-300 ${isSpeaking ? 'animate-[speaking_0.6s_ease-in-out_infinite]' : ''}`}>
            <defs>
                <linearGradient id="judge-robe" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>
                <linearGradient id="judge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gold-trim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#f4d03f" />
                    <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
                <filter id="judge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.5" />
                </filter>
            </defs>

            {/* Majestic glow */}
            {isActive && <ellipse cx="60" cy="80" rx="55" ry="70" fill="url(#judge-glow)" opacity="0.6" />}

            {/* Judge Robe - Flowing black with red sash */}
            <path d="M20,80 Q10,90 10,110 L10,155 Q10,158 15,158 L105,158 Q110,158 110,155 L110,110 Q110,90 100,80 L75,72 L45,72 Z"
                fill="url(#judge-robe)" filter="url(#judge-shadow)" />

            {/* Red Sash across chest */}
            <path d="M30,80 Q40,95 35,120 L45,120 Q55,95 50,80" fill="#b91c1c" />
            <path d="M70,80 Q80,95 85,120 L75,120 Q65,95 60,80" fill="#b91c1c" />

            {/* Gold Trim on robe */}
            <path d="M45,72 L45,120" stroke="url(#gold-trim)" strokeWidth="2" />
            <path d="M75,72 L75,120" stroke="url(#gold-trim)" strokeWidth="2" />

            {/* White Collar/Bands */}
            <path d="M45,72 L50,90 L60,78 L70,90 L75,72" fill="#ffffff" stroke="#e5e5e5" strokeWidth="0.5" />
            <rect x="52" y="80" width="7" height="18" rx="1" fill="#ffffff" />
            <rect x="61" y="80" width="7" height="18" rx="1" fill="#ffffff" />

            {/* Sleeves */}
            <path d="M20,85 Q5,100 10,130 Q12,135 20,135 L25,100 Q25,88 20,85" fill="url(#judge-robe)" />
            <path d="M100,85 Q115,100 110,130 Q108,135 100,135 L95,100 Q95,88 100,85" fill="url(#judge-robe)" />

            {/* Hands holding gavel */}
            <ellipse cx="15" cy="132" rx="6" ry="5" fill={skinTone} />
            <ellipse cx="105" cy="132" rx="6" ry="5" fill={skinTone} />

            {/* Gavel in right hand */}
            <rect x="100" y="125" width="18" height="5" rx="2" fill="#8B4513" transform="rotate(-30 109 127)" />
            <rect x="108" y="118" width="8" height="12" rx="2" fill="#5D3A1A" transform="rotate(-30 112 124)" />

            {/* Neck */}
            <path d="M50,58 L50,75 L70,75 L70,58" fill={skinTone} />

            {/* Head */}
            <ellipse cx="60" cy="42" rx="22" ry="26" fill={skinTone} filter="url(#judge-shadow)" />

            {/* Grey/White Hair - Distinguished look */}
            <path d="M38,38 Q38,12 60,12 Q82,12 82,38 Q82,25 60,28 Q38,25 38,38" fill="#6b7280" />
            <path d="M40,35 Q40,18 60,18 Q80,18 80,35" fill="#9ca3af" opacity="0.7" />

            {/* Wise face features */}
            {/* Eyes - Experienced gaze */}
            <ellipse cx="50" cy="40" rx="5" ry="4" fill="white" />
            <ellipse cx="70" cy="40" rx="5" ry="4" fill="white" />
            <circle cx="50" cy="40" r="2.5" fill="#1e3a5f" />
            <circle cx="70" cy="40" r="2.5" fill="#1e3a5f" />
            <circle cx="50.5" cy="39.5" r="1" fill="white" />
            <circle cx="70.5" cy="39.5" r="1" fill="white" />

            {/* Eyebrows - Thick and distinguished */}
            <path d="M43,34 Q50,31 57,34" stroke="#4b5563" strokeWidth="2.5" fill="none" />
            <path d="M63,34 Q70,31 77,34" stroke="#4b5563" strokeWidth="2.5" fill="none" />

            {/* Nose */}
            <path d="M60,45 Q57,52 60,55 Q63,52 60,45" stroke="#b8956e" strokeWidth="1.2" fill="none" />

            {/* Mouth */}
            {isSpeaking ? (
                <ellipse cx="60" cy="60" rx="6" ry="4" fill="#8B4513">
                    <animate attributeName="ry" values="4;5;3;4" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
            ) : (
                <path d="M53,60 Q60,64 67,60" stroke="#8B4513" strokeWidth="2" fill="none" />
            )}

            {/* Ears */}
            <ellipse cx="38" cy="42" rx="4" ry="6" fill={skinTone} />
            <ellipse cx="82" cy="42" rx="4" ry="6" fill={skinTone} />

            {/* AI Neural glow effect around head */}
            {isActive && (
                <>
                    <circle cx="60" cy="42" r="30" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" values="30;35;30" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.2;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="60" cy="42" r="38" fill="none" stroke="#7c3aed" strokeWidth="0.5" opacity="0.3">
                        <animate attributeName="r" values="38;42;38" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                </>
            )}
        </svg>
    );
};

// 3D Character Podium Component with Human Miniatures
const CharacterPodium: React.FC<{
    role: 'prosecution' | 'defense' | 'judge';
    isActive: boolean;
    isSpeaking: boolean;
    language: 'en' | 'hi';
    speechText?: string;
    evidence?: string;
}> = ({ role, isActive, isSpeaking, language, speechText, evidence }) => {
    const roleConfig = {
        prosecution: {
            name: language === 'hi' ? 'अभियोजन पक्ष' : 'Prosecution',
            subtitle: language === 'hi' ? 'सरकारी वकील' : 'Public Prosecutor',
            color: '#ef4444',
            gradient: 'from-red-600 to-red-800',
            glow: 'shadow-red-500/50',
            podiumGradient: 'from-red-900 via-red-800 to-red-900',
            bgGlow: 'bg-red-500/20'
        },
        defense: {
            name: language === 'hi' ? 'बचाव पक्ष' : 'Defense',
            subtitle: language === 'hi' ? 'अधिवक्ता' : 'Defense Counsel',
            color: '#22c55e',
            gradient: 'from-green-600 to-green-800',
            glow: 'shadow-green-500/50',
            podiumGradient: 'from-green-900 via-green-800 to-green-900',
            bgGlow: 'bg-green-500/20'
        },
        judge: {
            name: language === 'hi' ? 'AI न्यायाधीश' : 'AI Judge',
            subtitle: language === 'hi' ? 'निर्णय सहायक' : 'Decision Support',
            color: '#a855f7',
            gradient: 'from-purple-600 to-purple-900',
            glow: 'shadow-purple-500/60',
            podiumGradient: 'from-purple-900 via-purple-800 to-purple-900',
            bgGlow: 'bg-purple-500/30'
        }
    };

    const config = roleConfig[role];

    return (
        <div className="relative flex flex-col items-center">
            {/* Speech Bubble */}
            <SpeechBubble
                text={speechText || ''}
                isActive={isSpeaking}
                side={role}
                evidence={evidence}
            />

            {/* Spotlight glow when active */}
            {isActive && (
                <div className={`absolute -inset-12 ${config.bgGlow} rounded-full blur-3xl 
                    animate-pulse opacity-70`} />
            )}

            {/* 3D Stage with Human Figure */}
            <div
                className={`relative transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            >
                {/* Human Miniature Figure */}
                <div
                    className={`relative ${role === 'judge' ? 'w-32 h-44 md:w-40 md:h-52' : 'w-24 h-36 md:w-32 md:h-44'}`}
                    style={{
                        transform: role === 'judge' ? 'translateZ(30px)' : 'translateZ(15px)',
                        filter: isActive ? `drop-shadow(0 0 20px ${config.color}50)` : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
                    }}
                >
                    {role === 'judge' ? (
                        <JudgeMiniature isActive={isActive} isSpeaking={isSpeaking} />
                    ) : (
                        <LawyerMiniature
                            gender={role === 'prosecution' ? 'male' : 'female'}
                            color={config.color}
                            isActive={isActive}
                            isSpeaking={isSpeaking}
                        />
                    )}

                    {/* Speaking indicator */}
                    {isSpeaking && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}

                    {/* AI sparkle badge for judge */}
                    {role === 'judge' && (
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 
                            rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>

                {/* 3D Podium/Desk */}
                <div
                    className={`mt-2 rounded-lg bg-gradient-to-r ${config.podiumGradient} 
                        border-t-2 border-white/20 shadow-2xl`}
                    style={{
                        width: role === 'judge' ? '160px' : '130px',
                        height: role === 'judge' ? '30px' : '24px',
                        transform: 'perspective(500px) rotateX(15deg)',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        boxShadow: `0 15px 35px -5px ${config.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                    }}
                />
            </div>

            {/* Name Label */}
            <div className="mt-4 text-center">
                <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-400'} 
                    transition-colors duration-300`}>
                    {config.name}
                </h3>
                <p className="text-xs text-slate-500">{config.subtitle}</p>
            </div>
        </div>
    );
};

const VirtualMootCourt: React.FC = () => {
    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [visibleThoughts, setVisibleThoughts] = useState<JudgeThought[]>([]);
    const [displayedText, setDisplayedText] = useState<{ [key: string]: string }>({});
    const [currentSpeaker, setCurrentSpeaker] = useState<'prosecution' | 'defense' | 'judge' | null>(null);
    const [currentSpeech, setCurrentSpeech] = useState<{ text: string; evidence?: string } | null>(null);
    const [judgeThinking, setJudgeThinking] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(1);
    const [overallConfidence, setOverallConfidence] = useState({ prosecution: 50, defense: 50 });
    const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [showSummary, setShowSummary] = useState(false);
    const [transcript, setTranscript] = useState<Array<{
        id: string;
        speaker: 'prosecution' | 'defense' | 'judge';
        text: string;
        timestamp: string;
        evidence?: string;
    }>>([]);
    const [judgeDecision, setJudgeDecision] = useState<{
        verdict: 'prosecution' | 'defense' | null;
        reasoning: string;
        confidence: number;
    }>({ verdict: null, reasoning: '', confidence: 0 });

    const simulationRef = useRef<NodeJS.Timeout | null>(null);
    const typingRef = useRef<NodeJS.Timeout | null>(null);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Text-to-speech
    const speak = useCallback((text: string) => {
        if (!isNarrationEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isNarrationEnabled, language]);

    // Typing animation
    const typeText = useCallback((id: string, fullText: string, callback?: () => void) => {
        let index = 0;
        setDisplayedText(prev => ({ ...prev, [id]: '' }));

        const typeNextChar = () => {
            if (index < fullText.length) {
                setDisplayedText(prev => ({
                    ...prev,
                    [id]: fullText.substring(0, index + 1)
                }));
                index++;
                typingRef.current = setTimeout(typeNextChar, 25 / simulationSpeed);
            } else {
                callback?.();
            }
        };
        typeNextChar();
    }, [simulationSpeed]);

    // Main simulation logic
    useEffect(() => {
        if (isPlaying && currentTurn < simulatedArguments.length) {
            simulationRef.current = setTimeout(() => {
                const newArg = simulatedArguments[currentTurn];
                const textContent = language === 'hi' && newArg.contentHi ? newArg.contentHi : newArg.content;

                // Set current speaker and speech
                setCurrentSpeaker(newArg.side);
                setCurrentSpeech({ text: '', evidence: newArg.evidence });

                // Add to transcript
                const now = new Date();
                const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setTranscript(prev => [...prev, {
                    id: newArg.id,
                    speaker: newArg.side,
                    text: textContent,
                    timestamp: timeStr,
                    evidence: newArg.evidence
                }]);

                // Type out the speech
                typeText(`speech-${newArg.id}`, textContent, () => {
                    speak(textContent);

                    // After speech, show judge thinking
                    setTimeout(() => {
                        setCurrentSpeaker('judge');
                        setJudgeThinking(true);

                        if (currentTurn < simulatedThoughts.length) {
                            const thought = simulatedThoughts[currentTurn];
                            setVisibleThoughts(prev => [...prev, thought]);

                            const thoughtText = language === 'hi' && thought.contentHi
                                ? thought.contentHi : thought.content;
                            setCurrentSpeech({ text: '' });

                            typeText(`thought-${thought.id}`, thoughtText, () => {
                                // Update confidence
                                if (thought.confidence) {
                                    setOverallConfidence(prev => ({
                                        prosecution: newArg.side === 'prosecution'
                                            ? Math.min(100, prev.prosecution + (thought.type === 'favorable' ? 5 : 2))
                                            : Math.max(20, prev.prosecution - 2),
                                        defense: newArg.side === 'defense'
                                            ? Math.min(100, prev.defense + (thought.type === 'concern' ? 5 : 2))
                                            : Math.max(20, prev.defense - 2)
                                    }));
                                }

                                setTimeout(() => {
                                    setJudgeThinking(false);
                                    setCurrentSpeaker(null);
                                    setCurrentSpeech(null);
                                    setCurrentTurn(prev => prev + 1);
                                }, 1000 / simulationSpeed);
                            });
                        } else {
                            setCurrentTurn(prev => prev + 1);
                        }
                    }, 1500 / simulationSpeed);
                });

                // Update displayed speech text
                const updateSpeech = (id: string) => {
                    const unsubscribe = setInterval(() => {
                        setDisplayedText(prev => {
                            const text = prev[`speech-${id}`] || prev[`thought-${newArg.id}`];
                            if (text) {
                                setCurrentSpeech(curr => curr ? { ...curr, text } : null);
                            }
                            return prev;
                        });
                    }, 50);

                    setTimeout(() => clearInterval(unsubscribe), 10000);
                };
                updateSpeech(newArg.id);

            }, 2000 / simulationSpeed);
        } else if (currentTurn >= simulatedArguments.length && isPlaying) {
            setIsPlaying(false);
            setShowSummary(true);
        }

        return () => {
            if (simulationRef.current) clearTimeout(simulationRef.current);
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, [isPlaying, currentTurn, simulationSpeed, language, typeText, speak]);

    // Cleanup
    useEffect(() => {
        return () => { window.speechSynthesis?.cancel(); };
    }, []);

    const handlePlayPause = () => {
        if (!isPlaying) window.speechSynthesis?.cancel();
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentTurn(0);
        setVisibleThoughts([]);
        setDisplayedText({});
        setCurrentSpeaker(null);
        setCurrentSpeech(null);
        setJudgeThinking(false);
        setOverallConfidence({ prosecution: 50, defense: 50 });
        setShowSummary(false);
        window.speechSynthesis?.cancel();
    };

    const getThoughtIcon = (type: JudgeThought['type']) => {
        switch (type) {
            case 'analysis': return <Brain className="w-4 h-4 text-blue-400" />;
            case 'precedent': return <BookOpen className="w-4 h-4 text-purple-400" />;
            case 'concern': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'favorable': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        }
    };

    const isComplete = currentTurn >= simulatedArguments.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 overflow-hidden">
            {/* Custom Animation Keyframes */}
            <style>{`
                @keyframes popIn {
                    0% { opacity: 0; transform: translate(-50%, -100%) scale(0.3); }
                    50% { transform: translate(-50%, -100%) scale(1.05); }
                    100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
                }
                @keyframes speaking {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl 
                                flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Scale className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                    {language === 'hi' ? 'वर्चुअल मूट कोर्ट' : 'Virtual Moot Court'}
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                </h1>
                                <p className="text-purple-300 text-xs">
                                    {language === 'hi' ? '3D AI केस सिम्युलेटर' : '3D AI Case Simulator'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Language Toggle */}
                            <div className="flex bg-slate-800 rounded-lg p-0.5">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === 'en' ? 'bg-purple-500 text-white' : 'text-slate-400'
                                        }`}
                                >EN</button>
                                <button
                                    onClick={() => setLanguage('hi')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === 'hi' ? 'bg-purple-500 text-white' : 'text-slate-400'
                                        }`}
                                >हिंदी</button>
                            </div>

                            {/* Voice Toggle */}
                            <button
                                onClick={() => setIsNarrationEnabled(!isNarrationEnabled)}
                                className={`p-2 rounded-lg transition-all ${isNarrationEnabled ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {isNarrationEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>

                            {/* Case ID */}
                            <div className="hidden md:block bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700">
                                <span className="text-xs text-slate-400">Case: </span>
                                <span className="text-white font-mono text-sm">{sampleCase.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!showSummary ? (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Case Summary */}
                    <div className="mb-8 bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                                <h3 className="text-white font-semibold">
                                    {language === 'hi' ? sampleCase.titleHi : sampleCase.title}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {language === 'hi' ? sampleCase.summaryHi : sampleCase.summary}
                                </p>
                            </div>
                            <div className="ml-auto flex gap-2">
                                {sampleCase.sections.map(s => (
                                    <span key={s} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3D Courtroom Scene */}
                    <div
                        className="relative rounded-3xl bg-gradient-to-b from-slate-800/50 to-slate-900/80 
                            border border-slate-700/50 overflow-hidden"
                        style={{
                            perspective: '1200px',
                            minHeight: '500px'
                        }}
                    >
                        {/* Immersive Courtroom Background */}
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Courtroom Interior SVG */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
                                <defs>
                                    {/* Wood Panel Gradient */}
                                    <linearGradient id="woodPanel" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#5D4037" />
                                        <stop offset="30%" stopColor="#4E342E" />
                                        <stop offset="70%" stopColor="#3E2723" />
                                        <stop offset="100%" stopColor="#2D1F1A" />
                                    </linearGradient>
                                    <linearGradient id="woodDark" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3E2723" />
                                        <stop offset="50%" stopColor="#4E342E" />
                                        <stop offset="100%" stopColor="#3E2723" />
                                    </linearGradient>
                                    {/* Marble Gradient */}
                                    <linearGradient id="marble" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#E8E8E8" />
                                        <stop offset="50%" stopColor="#D0D0D0" />
                                        <stop offset="100%" stopColor="#B8B8B8" />
                                    </linearGradient>
                                    {/* Gold Gradient */}
                                    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FFD700" />
                                        <stop offset="50%" stopColor="#DAA520" />
                                        <stop offset="100%" stopColor="#B8860B" />
                                    </linearGradient>
                                    {/* Spotlight Effect */}
                                    <radialGradient id="spotlight" cx="50%" cy="0%" r="80%">
                                        <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="#000" stopOpacity="0" />
                                    </radialGradient>
                                    {/* Floor Reflection */}
                                    <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#1a1510" />
                                        <stop offset="50%" stopColor="#2d2318" />
                                        <stop offset="100%" stopColor="#1a1510" />
                                    </linearGradient>
                                </defs>

                                {/* Back Wall - Wood Paneling */}
                                <rect x="0" y="0" width="1200" height="350" fill="url(#woodPanel)" />

                                {/* Wood Panel Lines */}
                                <g stroke="#2D1F1A" strokeWidth="2">
                                    <line x1="150" y1="0" x2="150" y2="350" />
                                    <line x1="300" y1="0" x2="300" y2="350" />
                                    <line x1="450" y1="0" x2="450" y2="350" />
                                    <line x1="600" y1="0" x2="600" y2="350" />
                                    <line x1="750" y1="0" x2="750" y2="350" />
                                    <line x1="900" y1="0" x2="900" y2="350" />
                                    <line x1="1050" y1="0" x2="1050" y2="350" />
                                </g>

                                {/* Horizontal Wood Trim */}
                                <rect x="0" y="60" width="1200" height="8" fill="url(#gold)" opacity="0.6" />
                                <rect x="0" y="340" width="1200" height="10" fill="url(#woodDark)" />

                                {/* Marble Columns - Left */}
                                <rect x="80" y="80" width="50" height="270" fill="url(#marble)" rx="5" />
                                <ellipse cx="105" cy="80" rx="30" ry="10" fill="#E8E8E8" />
                                <ellipse cx="105" cy="350" rx="35" ry="12" fill="#C0C0C0" />

                                {/* Marble Columns - Right */}
                                <rect x="1070" y="80" width="50" height="270" fill="url(#marble)" rx="5" />
                                <ellipse cx="1095" cy="80" rx="30" ry="10" fill="#E8E8E8" />
                                <ellipse cx="1095" cy="350" rx="35" ry="12" fill="#C0C0C0" />

                                {/* Center Columns */}
                                <rect x="380" y="100" width="40" height="250" fill="url(#marble)" rx="4" opacity="0.7" />
                                <rect x="780" y="100" width="40" height="250" fill="url(#marble)" rx="4" opacity="0.7" />

                                {/* Judge's Elevated Backdrop */}
                                <rect x="400" y="70" width="400" height="200" fill="url(#woodDark)" rx="8" />
                                <rect x="410" y="80" width="380" height="180" fill="#2D1F1A" rx="6" />

                                {/* Ashoka Emblem - Simplified Lion Capital */}
                                <g transform="translate(600, 130)">
                                    {/* Circular Base */}
                                    <circle cx="0" cy="0" r="50" fill="url(#gold)" opacity="0.9" />
                                    <circle cx="0" cy="0" r="42" fill="#3E2723" />
                                    <circle cx="0" cy="0" r="38" fill="url(#gold)" opacity="0.8" />

                                    {/* Ashoka Chakra */}
                                    <circle cx="0" cy="0" r="28" fill="none" stroke="#1a4d8c" strokeWidth="3" />
                                    <circle cx="0" cy="0" r="6" fill="#1a4d8c" />
                                    {/* 24 Spokes */}
                                    {[...Array(24)].map((_, i) => (
                                        <line
                                            key={i}
                                            x1="0" y1="-8" x2="0" y2="-26"
                                            stroke="#1a4d8c" strokeWidth="1.5"
                                            transform={`rotate(${i * 15})`}
                                        />
                                    ))}

                                    {/* "Satyameva Jayate" Ribbon */}
                                    <path d="M-40,55 Q0,70 40,55" fill="none" stroke="url(#gold)" strokeWidth="12" />
                                    <text x="0" y="60" textAnchor="middle" fill="#2D1F1A" fontSize="8" fontWeight="bold">
                                        सत्यमेव जयते
                                    </text>
                                </g>

                                {/* "HIGH COURT" Text */}
                                <text x="600" y="250" textAnchor="middle" fill="url(#gold)" fontSize="24" fontWeight="bold" letterSpacing="8">
                                    HIGH COURT
                                </text>

                                {/* Floor - Polished Wood/Marble */}
                                <rect x="0" y="350" width="1200" height="350" fill="url(#floorGradient)" />

                                {/* Floor Tiles Pattern */}
                                <g opacity="0.3">
                                    <line x1="0" y1="420" x2="1200" y2="420" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="0" y1="500" x2="1200" y2="500" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="0" y1="590" x2="1200" y2="590" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="200" y1="350" x2="100" y2="700" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="400" y1="350" x2="300" y2="700" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="600" y1="350" x2="600" y2="700" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="800" y1="350" x2="900" y2="700" stroke="#3a2d20" strokeWidth="1" />
                                    <line x1="1000" y1="350" x2="1100" y2="700" stroke="#3a2d20" strokeWidth="1" />
                                </g>

                                {/* Spotlight Effects */}
                                <ellipse cx="600" cy="100" rx="300" ry="200" fill="url(#spotlight)" />

                                {/* Chandelier Glow - Left */}
                                <circle cx="250" cy="30" r="40" fill="#FFD700" opacity="0.15">
                                    <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
                                </circle>

                                {/* Chandelier Glow - Right */}
                                <circle cx="950" cy="30" r="40" fill="#FFD700" opacity="0.15">
                                    <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
                                </circle>

                                {/* Railing/Bar */}
                                <rect x="150" y="450" width="900" height="8" fill="url(#woodDark)" rx="4" />
                                <rect x="150" y="445" width="900" height="3" fill="url(#gold)" opacity="0.4" />
                            </svg>

                            {/* Ambient Lighting Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-slate-900/50" />
                        </div>

                        {/* Courtroom Layout with Characters */}
                        <div className="relative z-10 p-8 pt-12"
                            style={{ transformStyle: 'preserve-3d' }}>

                            {/* Judge Bench (Top Center) */}
                            <div className="flex justify-center mb-16"
                                style={{ transform: 'translateZ(40px)' }}>
                                <CharacterPodium
                                    role="judge"
                                    isActive={currentSpeaker === 'judge' || judgeThinking}
                                    isSpeaking={judgeThinking}
                                    language={language}
                                    speechText={judgeThinking ? displayedText[`thought-${visibleThoughts[visibleThoughts.length - 1]?.id}`] : undefined}
                                />
                            </div>

                            {/* Lawyers Row */}
                            <div className="flex justify-between items-end px-8 md:px-20">
                                {/* Prosecution (Left) */}
                                <div style={{ transform: 'rotateY(15deg) translateZ(20px)' }}>
                                    <CharacterPodium
                                        role="prosecution"
                                        isActive={currentSpeaker === 'prosecution'}
                                        isSpeaking={currentSpeaker === 'prosecution'}
                                        language={language}
                                        speechText={currentSpeaker === 'prosecution' ? currentSpeech?.text : undefined}
                                        evidence={currentSpeaker === 'prosecution' ? currentSpeech?.evidence : undefined}
                                    />
                                </div>

                                {/* VS Indicator */}
                                <div className="text-4xl font-bold text-amber-600/40 
                                    animate-[float_3s_ease-in-out_infinite] drop-shadow-lg">
                                    ⚔️
                                </div>

                                {/* Defense (Right) */}
                                <div style={{ transform: 'rotateY(-15deg) translateZ(20px)' }}>
                                    <CharacterPodium
                                        role="defense"
                                        isActive={currentSpeaker === 'defense'}
                                        isSpeaking={currentSpeaker === 'defense'}
                                        language={language}
                                        speechText={currentSpeaker === 'defense' ? currentSpeech?.text : undefined}
                                        evidence={currentSpeaker === 'defense' ? currentSpeech?.evidence : undefined}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Confidence Meter Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur 
                            rounded-xl p-3 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-red-400 font-medium w-24">
                                    {language === 'hi' ? 'अभियोजन' : 'Prosecution'} {overallConfidence.prosecution}%
                                </span>
                                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
                                        style={{ width: `${overallConfidence.prosecution}%` }}
                                    />
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
                                        style={{ width: `${overallConfidence.defense}%` }}
                                    />
                                </div>
                                <span className="text-xs text-green-400 font-medium w-24 text-right">
                                    {overallConfidence.defense}% {language === 'hi' ? 'बचाव' : 'Defense'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Judge Reasoning Panel */}
                    {visibleThoughts.length > 0 && (
                        <div className="mt-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-purple-500/30 p-4">
                            <h3 className="text-purple-300 font-semibold flex items-center gap-2 mb-3">
                                <Brain className="w-5 h-5" />
                                {language === 'hi' ? 'AI न्यायिक विश्लेषण' : 'AI Judicial Analysis'}
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {visibleThoughts.map((thought) => (
                                    <div key={thought.id}
                                        className="flex items-start gap-2 text-sm p-2 rounded-lg bg-slate-700/30">
                                        {getThoughtIcon(thought.type)}
                                        <span className="text-slate-300 flex-1">
                                            {displayedText[`thought-${thought.id}`] ||
                                                (language === 'hi' && thought.contentHi ? thought.contentHi : thought.content)}
                                        </span>
                                        {thought.precedent && (
                                            <a href={thought.precedentLink} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-purple-400 flex items-center gap-1 hover:underline">
                                                {thought.precedent}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Live Hearing Transcript Table */}
                    <div className="mt-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-amber-600/30 overflow-hidden">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 border-b border-amber-600/30">
                            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-3">
                                <FileText className="w-6 h-6" />
                                {language === 'hi' ? '📜 सुनवाई प्रतिलेख' : '📜 Hearing Transcript'}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                {language === 'hi' ? 'सभी कथनों का वास्तविक समय रिकॉर्ड' : 'Real-time record of all statements made'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/50">
                            {/* Prosecution Column */}
                            <div className="flex flex-col">
                                <div className="px-4 py-3 bg-red-900/20 border-b border-red-800/30">
                                    <h4 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                        🔴 {language === 'hi' ? 'अभियोजन पक्ष' : 'PROSECUTION'}
                                    </h4>
                                </div>
                                <div
                                    ref={transcriptRef}
                                    className="flex-1 max-h-64 overflow-y-auto p-3 space-y-2"
                                >
                                    {transcript.filter(t => t.speaker === 'prosecution').length === 0 ? (
                                        <p className="text-slate-500 text-center py-8 italic text-lg">
                                            {language === 'hi' ? 'सुनवाई शुरू होने की प्रतीक्षा...' : 'Awaiting hearing to begin...'}
                                        </p>
                                    ) : (
                                        transcript.filter(t => t.speaker === 'prosecution').map((entry, idx) => (
                                            <div key={entry.id} className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-red-400">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        ⏱️ {entry.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-base text-slate-200 leading-relaxed">{entry.text}</p>
                                                {entry.evidence && (
                                                    <div className="mt-2 text-sm text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg inline-block">
                                                        📎 {entry.evidence}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Defense Column */}
                            <div className="flex flex-col">
                                <div className="px-4 py-3 bg-green-900/20 border-b border-green-800/30">
                                    <h4 className="text-lg font-bold text-green-400 flex items-center gap-2">
                                        🟢 {language === 'hi' ? 'बचाव पक्ष' : 'DEFENSE'}
                                    </h4>
                                </div>
                                <div className="flex-1 max-h-64 overflow-y-auto p-3 space-y-2">
                                    {transcript.filter(t => t.speaker === 'defense').length === 0 ? (
                                        <p className="text-slate-500 text-center py-8 italic text-lg">
                                            {language === 'hi' ? 'सुनवाई शुरू होने की प्रतीक्षा...' : 'Awaiting hearing to begin...'}
                                        </p>
                                    ) : (
                                        transcript.filter(t => t.speaker === 'defense').map((entry, idx) => (
                                            <div key={entry.id} className="bg-green-950/30 border border-green-800/30 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-green-400">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        ⏱️ {entry.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-base text-slate-200 leading-relaxed">{entry.text}</p>
                                                {entry.evidence && (
                                                    <div className="mt-2 text-sm text-green-300 bg-green-900/30 px-3 py-1.5 rounded-lg inline-block">
                                                        📎 {entry.evidence}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Judge Decision Panel */}
                        <div className="px-5 py-4 bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-purple-900/30 border-t border-purple-600/30">
                            <h4 className="text-lg font-bold text-purple-300 flex items-center gap-2 mb-3">
                                ⚖️ {language === 'hi' ? 'न्यायिक निर्णय' : 'JUDICIAL DECISION'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Current Assessment */}
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-2">
                                        {language === 'hi' ? 'वर्तमान आकलन' : 'Current Assessment'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-400 font-bold text-lg">{overallConfidence.prosecution}%</span>
                                        <span className="text-slate-500">vs</span>
                                        <span className="text-green-400 font-bold text-lg">{overallConfidence.defense}%</span>
                                    </div>
                                    <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                                        <div className="bg-red-500 transition-all" style={{ width: `${overallConfidence.prosecution}%` }} />
                                        <div className="bg-green-500 transition-all" style={{ width: `${overallConfidence.defense}%` }} />
                                    </div>
                                </div>

                                {/* Verdict Display */}
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-2">
                                        {language === 'hi' ? 'अनुमानित फैसला' : 'Projected Verdict'}
                                    </p>
                                    <p className={`text-xl font-bold ${overallConfidence.prosecution > overallConfidence.defense
                                            ? 'text-red-400' : 'text-green-400'
                                        }`}>
                                        {overallConfidence.prosecution > overallConfidence.defense
                                            ? (language === 'hi' ? '⚖️ अभियोजन की ओर झुकाव' : '⚖️ Leaning Prosecution')
                                            : (language === 'hi' ? '⚖️ बचाव की ओर झुकाव' : '⚖️ Leaning Defense')
                                        }
                                    </p>
                                </div>

                                {/* Record Decision Button */}
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex items-center justify-center">
                                    <button
                                        onClick={() => setJudgeDecision({
                                            verdict: overallConfidence.prosecution > overallConfidence.defense ? 'prosecution' : 'defense',
                                            reasoning: 'Based on evidence strength and legal precedents analyzed during hearing.',
                                            confidence: Math.max(overallConfidence.prosecution, overallConfidence.defense)
                                        })}
                                        disabled={!isComplete}
                                        className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${isComplete
                                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 shadow-lg'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            }`}
                                        style={{ minHeight: '52px' }}
                                    >
                                        {language === 'hi' ? '📝 निर्णय दर्ज करें' : '📝 Record Decision'}
                                    </button>
                                </div>
                            </div>

                            {/* Final Decision Display */}
                            {judgeDecision.verdict && (
                                <div className={`mt-4 p-4 rounded-xl border-2 ${judgeDecision.verdict === 'prosecution'
                                        ? 'bg-red-950/30 border-red-600/50'
                                        : 'bg-green-950/30 border-green-600/50'
                                    }`}>
                                    <p className="text-lg font-bold text-white mb-2">
                                        ✅ {language === 'hi' ? 'निर्णय दर्ज:' : 'Decision Recorded:'}
                                    </p>
                                    <p className={`text-xl font-bold ${judgeDecision.verdict === 'prosecution' ? 'text-red-400' : 'text-green-400'
                                        }`}>
                                        {judgeDecision.verdict === 'prosecution'
                                            ? (language === 'hi' ? 'अभियोजन पक्ष के पक्ष में' : 'In favor of Prosecution')
                                            : (language === 'hi' ? 'बचाव पक्ष के पक्ष में' : 'In favor of Defense')
                                        } ({judgeDecision.confidence}% confidence)
                                    </p>
                                    <p className="text-slate-400 mt-2">{judgeDecision.reasoning}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Playback */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePlayPause}
                                    disabled={isComplete}
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg ${isComplete
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : isPlaying
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/25'
                                        }`}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-14 h-14 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center 
                                        justify-center text-slate-300 transition-colors"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="flex-1 max-w-md">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{language === 'hi' ? 'सुनवाई प्रगति' : 'Hearing Progress'}</span>
                                    <span>{currentTurn} / {simulatedArguments.length}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                        style={{ width: `${(currentTurn / simulatedArguments.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Speed */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">{language === 'hi' ? 'गति:' : 'Speed:'}</span>
                                {[0.5, 1, 2].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setSimulationSpeed(speed)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${simulationSpeed === speed
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >{speed}x</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Summary View */
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                    {/* Completion Card */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 
                        border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <Gavel className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {language === 'hi' ? 'सिमुलेशन पूर्ण' : 'Simulation Complete'}
                                </h3>
                                <p className="text-purple-300 text-sm">
                                    {language === 'hi' ? 'AI विश्लेषण सारांश' : 'AI Analysis Summary'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-red-400">{overallConfidence.prosecution}%</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {language === 'hi' ? 'अभियोजन' : 'Prosecution'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-green-400">{overallConfidence.defense}%</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {language === 'hi' ? 'बचाव' : 'Defense'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-amber-400">{keyIssues.length}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {language === 'hi' ? 'मुख्य मुद्दे' : 'Key Issues'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Issues */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            {language === 'hi' ? 'प्रमुख मुद्दे' : 'Key Issues for Attention'}
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {keyIssues.map((issue, idx) => (
                                <div key={idx}
                                    className={`rounded-2xl p-4 border ${issue.strength === 'prosecution'
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : issue.strength === 'defense'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-slate-800/60 border-slate-700'
                                        }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className={`w-4 h-4 ${issue.strength === 'prosecution' ? 'text-red-400' :
                                            issue.strength === 'defense' ? 'text-green-400' : 'text-amber-400'
                                            }`} />
                                        <h4 className="font-semibold text-white text-sm">
                                            {language === 'hi' ? issue.titleHi : issue.title}
                                        </h4>
                                    </div>
                                    <p className="text-slate-300 text-xs">
                                        {language === 'hi' ? issue.descriptionHi : issue.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <p className="text-sm text-amber-200">
                            {language === 'hi'
                                ? 'यह न्यायिक तैयारी के लिए सिमुलेशन है। अंतिम निर्णय माननीय न्यायालय का है।'
                                : 'This is a simulation for judicial preparation. Final judgment rests with the Hon\'ble Court.'}
                        </p>
                    </div>

                    {/* Restart */}
                    <button
                        onClick={handleReset}
                        className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl 
                            font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        {language === 'hi' ? 'सिमुलेशन पुनः आरंभ करें' : 'Restart Simulation'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default VirtualMootCourt;
