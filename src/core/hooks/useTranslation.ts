// src/core/hooks/useTranslation.ts
// NyayaSahayak Translation Hook
// Connects the language setting to the translation strings

import { useMemo } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';
import { translations } from '../../features/nationals/constants/localization';

type TranslationKey = keyof typeof translations.en;

export const useTranslation = () => {
    const { language } = useAppSettings();

    const t = useMemo(() => {
        // Get translations for current language, fallback to English
        const currentTranslations = translations[language as keyof typeof translations] || translations.en;

        return (key: TranslationKey, params?: Record<string, string | number>): string => {
            let text = currentTranslations[key] || translations.en[key] || key;

            // Replace placeholders like {count}, {title}, etc.
            if (params) {
                Object.entries(params).forEach(([paramKey, value]) => {
                    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
                });
            }

            return text;
        };
    }, [language]);

    return { t, language };
};

export default useTranslation;
