
import React, { useRef } from 'react';
import { Scale, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import type { Language } from '../hooks/useLocalization';
import type { Translations } from '../constants/localization';
import { SmartSearch } from './SmartSearch';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations['en']) => string;
    onSignOut: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, language, setLanguage, t, onSignOut, theme, toggleTheme }) => {
    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const navCategories = [
        {
            title: 'Portals',
            items: [
                { label: 'Judge Dashboard', value: 'Judge Dashboard' },
                { label: 'Police Dashboard', value: 'Police Dashboard' },
                { label: 'Citizen Dashboard', value: 'Citizen Dashboard' },
            ]
        },
        {
            title: 'Case Intelligence',
            items: [
                { label: t('tab_case_triage'), value: 'Case Triage' },
                { label: t('tab_document_analysis'), value: 'Document Analysis' },
                { label: t('tab_relationship_mapper'), value: 'Case Maps' },
                { label: t('tab_justice_timeline'), value: 'Justice Timeline' },
                { label: 'Visual Justice', value: 'Visual Justice' },
            ]
        },
        {
            title: 'Legal Services',
            items: [
                { label: 'Voice Filing', value: 'Voice Filing' },
                { label: t('tab_nyayabot'), value: 'NYAYABOT' },
                { label: t('tab_legal_tech_hub'), value: 'Legal Tech Hub' },
                { label: 'Quantum Proof', value: 'Quantum Proof' },
            ]
        },
        {
            title: 'Wellness & Insights',
            items: [
                { label: t('tab_judicial_wellness'), value: 'Judicial Wellness' },
                { label: t('tab_litigant_happiness'), value: 'Litigant Happiness' },
                { label: t('tab_history'), value: 'History' },
            ]
        },
        {
            title: 'Platform',
            items: [
                { label: t('tab_about'), value: 'About' },
            ]
        }
    ];

    const handleMouseEnter = (title: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpenDropdown(title);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 100);
    };

    const languages: { code: Language; name: string }[] = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'bn', name: 'বাংলা' },
        { code: 'mr', name: 'मराठी' },
        { code: 'gu', name: 'ગુજરાતી' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'മലയാളം' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ' },
        { code: 'or', name: 'ଓଡ଼ିଆ' },
        { code: 'sa', name: 'संस्कृतम्' },
        { code: 'ur', name: 'اردو' },
        { code: 'as', name: 'অসমীয়া' },
        { code: 'mai', name: 'मैथिली' },
        { code: 'sat', name: 'संताली' },
        { code: 'ks', name: 'कश्मीरी' },
        { code: 'kok', name: 'कोंकणी' },
        { code: 'sd', name: 'सिंधी' },
        { code: 'doi', name: 'डोगरी' },
        { code: 'mni', name: 'मणिपुरी' },
        { code: 'brx', name: 'बड़ो' },
        { code: 'ne', name: 'नेपाली' },
    ];

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-2xl transition-all duration-300">
            <div className="px-4 sm:px-6">
                <div className="flex items-center justify-between py-2.5 gap-3">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setActiveTab('About')}>
                        <div className="relative w-9 h-9 rounded-xl border border-gray-200 dark:border-white/15 overflow-hidden brand-ring flex items-center justify-center">
                            <div className="absolute inset-0 gridline"></div>
                            <Scale className="w-5 h-5 text-ns-primary-900 dark:text-white relative z-10" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="title text-gray-900 dark:text-white/90 text-base sm:text-lg truncate tracking-tight">{t('header_title')}</span>
                                <span className="chip hidden sm:inline-flex text-[10px] py-0.5 px-2 border-gray-200 dark:border-white/14 bg-gray-100 dark:bg-white/6 text-gray-600 dark:text-white/78">v2.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Categorized Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-gray-50/50 dark:bg-white/5 p-1 rounded-xl border border-gray-200/50 dark:border-white/5">
                        {navCategories.map((category) => {
                            if (category.title === 'Platform') return null; // Skip Platform category as we handle About separately
                            const isActive = category.items.some(item => item.value === activeTab);
                            const isOpen = openDropdown === category.title;

                            return (
                                <div
                                    key={category.title}
                                    className="relative"
                                    onMouseEnter={() => handleMouseEnter(category.title)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        onClick={() => setOpenDropdown(isOpen ? null : category.title)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${isActive || isOpen ? 'text-ns-primary-700 bg-white shadow-sm dark:text-white dark:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'}`}
                                    >
                                        {category.title}
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-56 p-1 rounded-xl bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-50">
                                            <div className="flex flex-col gap-0.5">
                                                {category.items.map((item) => (
                                                    <button
                                                        key={item.value}
                                                        onClick={() => {
                                                            setActiveTab(item.value);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${activeTab === item.value ? 'bg-ns-primary-50 text-ns-primary-700 dark:bg-ns-primary-500/20 dark:text-ns-primary-500 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'}`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Standalone About Link */}
                        <button
                            onClick={() => setActiveTab('About')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${activeTab === 'About' ? 'text-ns-primary-700 bg-white shadow-sm dark:text-white dark:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'}`}
                        >
                            {t('tab_about')}
                        </button>
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <SmartSearch />

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="btn btn-quiet w-9 h-9 p-0 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 border-transparent"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="appearance-none bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-white/90 text-sm font-medium py-1.5 pl-3 pr-8 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:ring-2 focus:ring-ns-primary-500/50 focus:outline-none transition-all cursor-pointer"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-ns-neutral-900 text-gray-900 dark:text-white">{lang.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/50 pointer-events-none" />
                        </div>

                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                        <button
                            onClick={onSignOut}
                            className="btn flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all duration-200 border-0"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation (Fallback for small screens) */}
            <div className="lg:hidden border-t border-gray-200 dark:border-white/5 bg-gray-50/90 dark:bg-black/10 backdrop-blur-md overflow-x-auto hide-scrollbar rounded-b-2xl">
                <div className="flex w-fit space-x-1 p-2">
                    {/* Add About to Mobile Nav */}
                    <button
                        onClick={() => setActiveTab('About')}
                        className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${activeTab === 'About' ? 'bg-gray-200 text-gray-900 dark:bg-white/10 dark:text-white' : 'text-gray-500 dark:text-white/60'}`}
                    >
                        {t('tab_about')}
                    </button>
                    {navCategories.filter(c => c.title !== 'Platform').flatMap(c => c.items).map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setActiveTab(item.value)}
                            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${activeTab === item.value ? 'bg-gray-200 text-gray-900 dark:bg-white/10 dark:text-white' : 'text-gray-500 dark:text-white/60'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Header;
