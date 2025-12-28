
import { useCallback } from 'react';
import { translations } from '../constants/localization';
import type { Translations } from '../constants/localization';
import { getLocalizedNumber } from '../lib/utils';

export type Language = keyof Translations;

export const useLocalization = (language: Language) => {
    const t = useCallback((key: string) => {
        return translations[language][key as keyof Translations['en']] || translations['en'][key as keyof Translations['en']] || key;
    }, [language]);

    const formatNumber = useCallback((num: number | string) => {
        return getLocalizedNumber(num, language);
    }, [language]);

    return { t, formatNumber };
};
