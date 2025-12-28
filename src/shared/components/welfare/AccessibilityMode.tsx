// src/shared/components/welfare/AccessibilityMode.tsx
// Accessibility Mode - For senior citizens and persons with disabilities
// Large text, high contrast, voice navigation

import React, { useState, useEffect } from 'react';
import {
    Accessibility, Eye, Volume2, Type, Sun,
    X, Mic, ZoomIn, ZoomOut
} from 'lucide-react';

interface AccessibilityModeProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AccessibilitySettings {
    largeText: boolean;
    highContrast: boolean;
    voiceNav: boolean;
    reduceMotion: boolean;
    fontSize: number; // 100, 125, 150, 175
}

const AccessibilityMode: React.FC<AccessibilityModeProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<AccessibilitySettings>({
        largeText: false,
        highContrast: false,
        voiceNav: false,
        reduceMotion: false,
        fontSize: 100
    });
    const [speaking, setSpeaking] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('nyaya_accessibility');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSettings(parsed);
                applySettings(parsed);
            } catch { /* ignore */ }
        }
    }, []);

    const applySettings = (s: AccessibilitySettings) => {
        const root = document.documentElement;

        // Font size
        root.style.fontSize = `${s.fontSize}%`;

        // High contrast
        if (s.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Reduce motion
        if (s.reduceMotion) {
            root.style.setProperty('--animation-duration', '0s');
        } else {
            root.style.removeProperty('--animation-duration');
        }
    };

    const updateSetting = <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('nyaya_accessibility', JSON.stringify(newSettings));
        applySettings(newSettings);
    };

    const speak = (text: string) => {
        if (!settings.voiceNav) return;
        setSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
    };

    const resetSettings = () => {
        const defaults: AccessibilitySettings = {
            largeText: false,
            highContrast: false,
            voiceNav: false,
            reduceMotion: false,
            fontSize: 100
        };
        setSettings(defaults);
        localStorage.setItem('nyaya_accessibility', JSON.stringify(defaults));
        applySettings(defaults);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 rounded-3xl border border-cyan-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-cyan-500/20 bg-cyan-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                                <Accessibility className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                    Accessibility
                                </h2>
                                <p className="text-xs text-slate-400">पहुँच सेटिंग्स</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Settings */}
                <div className="p-4 space-y-4">
                    {/* Font Size */}
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Type className="w-5 h-5 text-cyan-400" />
                                <span className="font-medium text-white">Text Size</span>
                            </div>
                            <span className="text-sm text-cyan-400 font-bold">{settings.fontSize}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updateSetting('fontSize', Math.max(100, settings.fontSize - 25))}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                            >
                                <ZoomOut className="w-4 h-4 text-white" />
                            </button>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                    style={{ width: `${((settings.fontSize - 100) / 75) * 100}%` }}
                                />
                            </div>
                            <button
                                onClick={() => updateSetting('fontSize', Math.min(175, settings.fontSize + 25))}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                            >
                                <ZoomIn className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Toggle Options */}
                    {[
                        { key: 'highContrast', label: 'High Contrast', icon: Sun, desc: 'Increase contrast for visibility' },
                        { key: 'voiceNav', label: 'Voice Readout', icon: Volume2, desc: 'Read screen content aloud' },
                        { key: 'reduceMotion', label: 'Reduce Motion', icon: Eye, desc: 'Minimize animations' },
                    ].map(({ key, label, icon: Icon, desc }) => (
                        <div
                            key={key}
                            className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                        >
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <Icon className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-white">{label}</p>
                                <p className="text-xs text-slate-500">{desc}</p>
                            </div>
                            <button
                                onClick={() => updateSetting(key as keyof AccessibilitySettings, !settings[key as keyof AccessibilitySettings])}
                                className={`w-12 h-7 rounded-full transition-all ${settings[key as keyof AccessibilitySettings]
                                    ? 'bg-cyan-500'
                                    : 'bg-slate-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings[key as keyof AccessibilitySettings]
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Voice Navigation Demo */}
                {settings.voiceNav && (
                    <div className="p-4 border-t border-slate-700/50">
                        <button
                            onClick={() => speak('नमस्ते, न्याय सहायक में आपका स्वागत है। यह ऐप आपको शिकायत दर्ज करने और मामले को ट्रैक करने में मदद करता है।')}
                            disabled={speaking}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Mic className={`w-4 h-4 ${speaking ? 'animate-pulse' : ''}`} />
                            {speaking ? 'Speaking...' : 'Test Voice (Hindi)'}
                        </button>
                    </div>
                )}

                {/* Reset */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <button
                        onClick={resetSettings}
                        className="w-full py-2 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-xl transition-all"
                    >
                        Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessibilityMode;
