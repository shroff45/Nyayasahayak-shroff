// src/features/citizen/hooks/useCitizenTranslation.ts
// NyayaSahayak Citizen Portal Translation Hook
// Returns translated strings based on current language setting

import { useMemo } from 'react';
import { useAppSettings } from '../../../core/context/AppSettingsContext';
import { citizenTranslations, baseTranslations, CitizenTranslationKey } from '../constants/citizenTranslations';

export const useCitizenTranslation = () => {
    const { language } = useAppSettings();

    // Create merged translations (current language over English base)
    const translations = useMemo(() => {
        const langTranslations = citizenTranslations[language] || {};
        return { ...baseTranslations, ...langTranslations };
    }, [language]);

    // Translation function
    const t = useMemo(() => {
        return (key: CitizenTranslationKey): string => {
            return translations[key] || baseTranslations[key] || String(key);
        };
    }, [translations]);

    return { t, language, translations };
};

export default useCitizenTranslation;
