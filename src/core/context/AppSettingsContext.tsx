// src/core/context/AppSettingsContext.tsx
// NyayaSahayak - Global App Settings for Accessibility & Internationalization
// Manages language, theme, font size, and simplified mode across the application

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================
export type Language =
    | 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa'
    | 'or' | 'as' | 'ur' | 'sa' | 'ks' | 'ne' | 'sd' | 'kok' | 'doi' | 'mai'
    | 'sat' | 'mni' | 'brx';
export type Theme = 'dark' | 'light' | 'high-contrast';
export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

export interface AppSettings {
    language: Language;
    theme: Theme;
    fontSize: FontSize;
    simplifiedMode: boolean;
    reducedMotion: boolean; // Accessibility: reduces animations for vestibular disorders
}

interface AppSettingsContextType extends AppSettings {
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    setFontSize: (size: FontSize) => void;
    toggleSimplifiedMode: () => void;
    toggleReducedMotion: () => void;
    resetSettings: () => void;
}

// ============================================
// CONSTANTS
// ============================================
const STORAGE_KEY = 'nyayasahayak_settings';

const DEFAULT_SETTINGS: AppSettings = {
    language: 'en',
    theme: 'dark',
    fontSize: 'normal',
    simplifiedMode: false,
    reducedMotion: typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false, // Respect system preference
};

// All 22 Scheduled Languages of India + English
export const LANGUAGE_OPTIONS: { code: Language; name: string; nativeName: string; region?: string }[] = [
    // Major Languages
    { code: 'en', name: 'English', nativeName: 'English', region: 'Pan-India' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', region: 'North India' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra/Telangana' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Gujarat' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Odisha' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Punjab' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Assam' },

    // Other Scheduled Languages
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Pan-India' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'Classical' },
    { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', region: 'Kashmir' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Sikkim' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', region: 'Sindhi diaspora' },
    { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', region: 'Goa' },
    { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', region: 'J&K' },
    { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', region: 'Bihar' },
    { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'Jharkhand' },
    { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', region: 'Manipur' },
    { code: 'brx', name: 'Bodo', nativeName: 'बर\'', region: 'Assam' },
];

// Theme display information
export const THEME_OPTIONS: { code: Theme; name: string; icon: string; description: string }[] = [
    { code: 'dark', name: 'Dark', icon: '🌙', description: 'Eye-friendly dark theme' },
    { code: 'light', name: 'Light', icon: '☀️', description: 'Bright and formal' },
    { code: 'high-contrast', name: 'High Contrast', icon: '👁️', description: 'GIGW 3.0 Accessible' },
];

// Font size display
export const FONT_SIZE_OPTIONS: { code: FontSize; label: string; scale: number }[] = [
    { code: 'small', label: 'A-', scale: 0.875 },
    { code: 'normal', label: 'A', scale: 1 },
    { code: 'large', label: 'A+', scale: 1.125 },
    { code: 'xlarge', label: 'A++', scale: 1.25 },
];

// ============================================
// CONTEXT
// ============================================
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================
export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        // Load from localStorage on initialization
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist to localStorage whenever settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }, [settings]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // Remove all theme classes
        root.classList.remove('dark');
        body.classList.remove('high-contrast');

        // Apply current theme
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else if (settings.theme === 'high-contrast') {
            root.classList.add('dark');
            body.classList.add('high-contrast');
        }
        // light mode = no dark class
    }, [settings.theme]);

    // Apply font size to document
    useEffect(() => {
        const root = document.documentElement;

        // Remove all font size classes
        root.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');

        // Apply current font size
        root.classList.add(`font-${settings.fontSize}`);
    }, [settings.fontSize]);

    // Apply simplified mode
    useEffect(() => {
        const body = document.body;

        if (settings.simplifiedMode) {
            body.classList.add('simplified-mode');
        } else {
            body.classList.remove('simplified-mode');
        }
    }, [settings.simplifiedMode]);

    // Setters
    const setLanguage = useCallback((language: Language) => {
        setSettings(prev => ({ ...prev, language }));
    }, []);

    const setTheme = useCallback((theme: Theme) => {
        setSettings(prev => ({ ...prev, theme }));
    }, []);

    const setFontSize = useCallback((fontSize: FontSize) => {
        setSettings(prev => ({ ...prev, fontSize }));
    }, []);

    const toggleSimplifiedMode = useCallback(() => {
        setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode }));
    }, []);

    const toggleReducedMotion = useCallback(() => {
        setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
    }, []);

    // Apply reduced motion to document
    useEffect(() => {
        const root = document.documentElement;
        if (settings.reducedMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
    }, [settings.reducedMotion]);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    const value: AppSettingsContextType = {
        ...settings,
        setLanguage,
        setTheme,
        setFontSize,
        toggleSimplifiedMode,
        toggleReducedMotion,
        resetSettings,
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export const useAppSettings = (): AppSettingsContextType => {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
};

export default AppSettingsContext;
