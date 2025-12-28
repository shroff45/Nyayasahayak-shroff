// src/shared/layout/CitizenLayout.tsx
// NyayaSahayak Hybrid v3.0.0 - 3D Immersive Citizen Portal Layout
// Expert-Level Mobile Responsive with Welfare Features

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { useAppSettings, LANGUAGE_OPTIONS } from '../../core/context/AppSettingsContext';
import { useCitizenTranslation } from '../../features/citizen/hooks/useCitizenTranslation';
import { ErrorBoundary } from '../components/common';
import OfflineBanner from '../components/common/OfflineBanner';
import {
    Home,
    Mic,
    MapPin,
    Calendar,
    Image,
    BookOpen,
    MessageCircle,
    Smile,
    LogOut,
    Menu,
    X,
    Phone,
    Shield,
    Heart,
    Scale,
    Users,
    Sparkles,
    UserPlus,
    AlertTriangle,
    Accessibility,
    Baby,
    Globe,
    Sun,
    Moon,
    Eye,
    Type,
    ChevronDown
} from 'lucide-react';

// Lazy load welfare modals
const WomenSafetySOS = lazy(() => import('../components/welfare/WomenSafetySOS'));
const VictimSupportHub = lazy(() => import('../components/welfare/VictimSupportHub'));
const FreeLegalAidFinder = lazy(() => import('../components/welfare/FreeLegalAidFinder'));
const EmergencyContacts = lazy(() => import('../components/welfare/EmergencyContacts'));
const CybercrimeReport = lazy(() => import('../components/welfare/CybercrimeReport'));
const AccessibilityMode = lazy(() => import('../components/welfare/AccessibilityMode'));
const SeniorCitizenSupport = lazy(() => import('../components/welfare/SeniorCitizenSupport'));
const ChildProtectionHub = lazy(() => import('../components/welfare/ChildProtectionHub'));

const CitizenLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Global accessibility settings
    const { language, theme, fontSize, setLanguage, setTheme, setFontSize } = useAppSettings();
    const { t } = useCitizenTranslation(); // Citizen translation hook
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Welfare modals
    const [showWomenSOS, setShowWomenSOS] = useState(false);
    const [showVictimSupport, setShowVictimSupport] = useState(false);
    const [showLegalAid, setShowLegalAid] = useState(false);
    const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
    const [showCybercrime, setShowCybercrime] = useState(false);
    const [showAccessibility, setShowAccessibility] = useState(false);
    const [showSeniorCitizen, setShowSeniorCitizen] = useState(false);
    const [showChildProtection, setShowChildProtection] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setShowWomenSOS(false);
                setShowVictimSupport(false);
                setShowLegalAid(false);
                setShowEmergencyContacts(false);
                setShowCybercrime(false);
                setShowAccessibility(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen || showWomenSOS || showVictimSupport || showLegalAid || showEmergencyContacts || showCybercrime || showAccessibility) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen, showWomenSOS, showVictimSupport, showLegalAid]);

    const navItems = [
        { path: '/citizen/home', label: t('nav_home'), icon: Home },
        { path: '/citizen/file', label: t('nav_file_complaint'), icon: Mic },
        { path: '/citizen/track', label: t('nav_nyayapath'), icon: MapPin },
        { path: '/citizen/timeline', label: t('nav_timeline'), icon: Calendar },
        { path: '/citizen/visuals', label: t('nav_visual_justice'), icon: Image },
        { path: '/citizen/legal-hub', label: t('nav_legal_hub'), icon: BookOpen },
        { path: '/citizen/bot', label: t('nav_nyayabot'), icon: MessageCircle },
        { path: '/citizen/feedback', label: t('nav_feedback'), icon: Smile },
    ];

    // Welfare quick actions - Primary
    const welfareItems = [
        { label: t('welfare_women_safety'), icon: Shield, color: 'red', onClick: () => setShowWomenSOS(true) },
        { label: t('welfare_child_protection'), icon: Baby, color: 'pink', onClick: () => setShowChildProtection(true) },
        { label: t('welfare_free_legal_aid'), icon: Scale, color: 'blue', onClick: () => setShowLegalAid(true) },
    ];

    // Welfare quick actions - Secondary
    const welfareItemsSecondary = [
        { label: t('welfare_senior_care'), icon: Heart, color: 'amber', onClick: () => setShowSeniorCitizen(true) },
        { label: t('welfare_victim_support'), icon: Users, color: 'purple', onClick: () => setShowVictimSupport(true) },
        { label: t('welfare_my_contacts'), icon: UserPlus, color: 'green', onClick: () => setShowEmergencyContacts(true) },
        { label: t('welfare_cybercrime'), icon: AlertTriangle, color: 'orange', onClick: () => setShowCybercrime(true) },
        { label: t('welfare_accessibility'), icon: Accessibility, color: 'cyan', onClick: () => setShowAccessibility(true) },
    ];

    // Bottom tab items (subset for mobile)
    const bottomTabItems = [
        { path: '/citizen/home', label: t('nav_home'), icon: Home },
        { path: '/citizen/file', label: t('nav_file'), icon: Mic },
        { path: '/citizen/track', label: t('nav_track'), icon: MapPin },
        { path: '/citizen/bot', label: t('nav_bot'), icon: MessageCircle },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
            {/* Skip to Main Content - Accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg"
            >
                Skip to main content / मुख्य सामग्री पर जाएं
            </a>
            {/* Offline Detection Banner - Critical for Rural India */}
            <OfflineBanner />
            {/* === IMMERSIVE 3D BACKGROUND === */}
            <div className="fixed inset-0 -z-10">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        {/* Deep emerald gradient for citizen portal */}
                        <linearGradient id="citizenBg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0a1a1f" />
                            <stop offset="30%" stopColor="#0d2818" />
                            <stop offset="60%" stopColor="#0a1f1a" />
                            <stop offset="100%" stopColor="#0a1515" />
                        </linearGradient>
                        {/* Emerald glow effect */}
                        <radialGradient id="emeraldGlow" cx="20%" cy="30%" r="50%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15">
                                <animate attributeName="stopOpacity" values="0.15;0.25;0.15" dur="4s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#0a1a1f" stopOpacity="0" />
                        </radialGradient>
                        {/* Cyan accent glow */}
                        <radialGradient id="cyanGlow" cx="80%" cy="70%" r="40%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1">
                                <animate attributeName="stopOpacity" values="0.1;0.2;0.1" dur="5s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#0a1a1f" stopOpacity="0" />
                        </radialGradient>
                        {/* Grid pattern for depth */}
                        <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="60" height="60">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#10b981" strokeWidth="0.3" opacity="0.1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#citizenBg)" />
                    <rect width="100%" height="100%" fill="url(#gridPattern)" opacity="0.3" />
                    <rect width="100%" height="100%" fill="url(#emeraldGlow)" />
                    <rect width="100%" height="100%" fill="url(#cyanGlow)" />
                </svg>
            </div>

            {/* Top Header - 3D Glassmorphic */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-emerald-500/10" role="banner" aria-label="Main navigation header">
                <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    {/* Mobile: Hamburger + Logo */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu Button - Mobile Only */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-emerald-400 transition-colors"
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <img src="/logo.png" alt="NyayaSahayak" className="w-7 h-7 md:w-8 md:h-8 rounded-lg" />
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur-md -z-10" />
                            </div>
                            <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                NyayaSetu
                            </span>
                            <span className="hidden sm:inline text-[10px] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                                Citizen Portal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Women Safety SOS - Always Visible */}
                        <button
                            onClick={() => setShowWomenSOS(true)}
                            className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold hover:from-red-500/30 hover:to-pink-500/30 transition-all shadow-lg shadow-red-500/10"
                            title="Women's Safety SOS"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Shakti</span>
                        </button>

                        {/* === PREMIUM ACCESSIBILITY CONTROLS === */}
                        <div
                            className="hidden md:flex items-center gap-0.5 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-2xl px-2 py-1.5 border border-white/10 shadow-2xl"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(16,185,129,0.1)' }}
                        >
                            {/* Language Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
                                    title="Change Language"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{LANGUAGE_OPTIONS.find(l => l.code === language)?.nativeName || 'EN'}</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                {showLanguageMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
                                        <div className="absolute top-full right-0 mt-1 w-40 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-emerald-500/20 shadow-xl z-50 py-1 overflow-hidden">
                                            {LANGUAGE_OPTIONS.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-500/10 transition-colors ${language === lang.code ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300'}`}
                                                >
                                                    <span className="font-medium">{lang.nativeName}</span>
                                                    <span className="text-slate-500 ml-2 text-xs">({lang.name})</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Theme Toggle */}
                            <div className="flex items-center border-l border-slate-600/50 pl-1">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Light Mode"
                                >
                                    <Sun className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Dark Mode"
                                >
                                    <Moon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setTheme('high-contrast')}
                                    className={`p-1.5 rounded-full transition-all ${theme === 'high-contrast' ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="High Contrast (GIGW 3.0)"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Font Size Controls */}
                            <div className="flex items-center border-l border-slate-600/50 pl-1">
                                <button
                                    onClick={() => setFontSize('small')}
                                    className={`px-1.5 py-1 text-[10px] font-bold rounded transition-all ${fontSize === 'small' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Small Text"
                                >
                                    A-
                                </button>
                                <button
                                    onClick={() => setFontSize('normal')}
                                    className={`px-1.5 py-1 text-xs font-bold rounded transition-all ${fontSize === 'normal' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Normal Text"
                                >
                                    A
                                </button>
                                <button
                                    onClick={() => setFontSize('large')}
                                    className={`px-1.5 py-1 text-sm font-bold rounded transition-all ${fontSize === 'large' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Large Text"
                                >
                                    A+
                                </button>
                                <button
                                    onClick={() => setFontSize('xlarge')}
                                    className={`px-1 py-1 text-base font-bold rounded transition-all ${fontSize === 'xlarge' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                    title="Extra Large Text"
                                >
                                    A++
                                </button>
                            </div>
                        </div>

                        {/* Mobile Accessibility Button - Opens Settings Panel */}
                        <button
                            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                            className="md:hidden p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-800/50"
                            title="Accessibility Settings"
                        >
                            <Type className="w-4 h-4" />
                        </button>

                        {/* Emergency Call */}
                        <a
                            href="tel:100"
                            className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-red-600/90 text-white rounded-full text-xs font-bold hover:bg-red-500 transition-all animate-pulse"
                            title="Emergency Call 100"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">SOS</span>
                        </a>

                        {user && (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                                title="Profile & Settings"
                            >
                                <div className="relative">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-emerald-500"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                                </div>
                                <span className="hidden md:inline text-sm text-slate-300">{user.name}</span>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="hidden md:block p-2 text-slate-400 hover:text-red-400 transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Slide-out Menu - 3D Enhanced */}
            <aside
                className={`
                    fixed left-0 top-14 bottom-16 w-72 z-40 
                    bg-gradient-to-b from-slate-900/98 to-slate-950/98 backdrop-blur-2xl
                    border-r border-emerald-500/10 p-4
                    transform transition-transform duration-300 ease-out md:hidden
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Welfare Quick Actions */}
                <div className="mb-4 p-3 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t('welfare_services')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {welfareItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className={`p-2 rounded-lg text-center transition-all ${item.color === 'red' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                    item.color === 'pink' ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' :
                                        'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    {/* Secondary Welfare Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {welfareItemsSecondary.map((item) => (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className={`p-2 rounded-lg text-center transition-all ${item.color === 'amber' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' :
                                    item.color === 'purple' ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' :
                                        item.color === 'green' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' :
                                            item.color === 'orange' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' :
                                                'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <nav className="space-y-1 overflow-y-auto max-h-full pb-20">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Logout in mobile menu */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left text-red-400 hover:bg-red-500/10 transition-colors mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content with Desktop Sidebar */}
            <div className="flex pt-14 md:pt-16 pb-16 md:pb-0">
                {/* Desktop Sidebar Navigation - PREMIUM 3D FLOATING */}
                <aside
                    className="hidden md:flex md:flex-col fixed left-3 top-20 bottom-3 w-72 rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(10, 26, 31, 0.95) 0%, rgba(13, 40, 24, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                >
                    {/* Decorative Emerald Trim */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600/0 via-emerald-500/60 to-cyan-500/60" />

                    <div className="p-4 overflow-y-auto flex-1">
                        {/* Welfare Quick Actions - Premium Cards */}
                        <div className="mb-4 p-4 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <p className="text-sm text-emerald-300 font-bold mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> {t('welfare_services')}
                            </p>
                            <div className="space-y-2">
                                {welfareItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-base font-medium ${item.color === 'red' ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30' :
                                            item.color === 'pink' ? 'bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 border border-pink-500/30' :
                                                'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/30'
                                            }`}
                                        style={{ minHeight: '48px' }}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Secondary Welfare Actions - Grid */}
                        <div className="mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <div className="grid grid-cols-2 gap-2">
                                {welfareItemsSecondary.slice(0, 4).map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        className={`p-3 rounded-xl text-center transition-all ${item.color === 'amber' ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' :
                                            item.color === 'purple' ? 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25' :
                                                item.color === 'green' ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' :
                                                    item.color === 'orange' ? 'bg-orange-500/15 text-orange-300 hover:bg-orange-500/25' :
                                                        'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Links - Larger for accessibility */}
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/20 text-emerald-300 border-l-4 border-emerald-400 shadow-lg'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                        }`
                                    }
                                    style={{ minHeight: '52px' }}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20' : 'bg-slate-800/50'}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-base font-medium">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Emergency Section - Bottom Fixed */}
                    <div className="p-4 border-t border-emerald-500/20">
                        <div className="rounded-xl p-4"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.15) 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            <p className="text-base text-red-300 font-bold mb-2">🚨 {t('emergency')}</p>
                            <a
                                href="tel:100"
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 text-base"
                                style={{ minHeight: '48px' }}
                            >
                                📞 {t('call_100')}
                            </a>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area - Wrapped with ErrorBoundary for graceful failure */}
                <main id="main-content" className="flex-1 md:ml-80 p-4 md:p-8 max-w-full overflow-x-hidden" role="main" aria-label="Main content area">
                    <ErrorBoundary fallbackMessage="इस पेज में कुछ समस्या है। कृपया पुनः प्रयास करें।">
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>

            {/* Mobile Bottom Tab Bar - 3D Enhanced */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-emerald-500/10 md:hidden safe-area-pb" role="navigation" aria-label="Mobile navigation">
                <div className="flex items-center justify-around h-16">
                    {bottomTabItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all min-w-[60px] ${isActive
                                    ? 'text-emerald-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20' : ''}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-medium">
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -top-0.5 w-8 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                    {/* More menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300 transition-all"
                    >
                        <div className="p-1.5 rounded-lg">
                            <Menu className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>

            {/* Welfare Modals */}
            <Suspense fallback={null}>
                <WomenSafetySOS isOpen={showWomenSOS} onClose={() => setShowWomenSOS(false)} />
                <VictimSupportHub isOpen={showVictimSupport} onClose={() => setShowVictimSupport(false)} />
                <FreeLegalAidFinder isOpen={showLegalAid} onClose={() => setShowLegalAid(false)} />
                <EmergencyContacts isOpen={showEmergencyContacts} onClose={() => setShowEmergencyContacts(false)} />
                <CybercrimeReport isOpen={showCybercrime} onClose={() => setShowCybercrime(false)} />
                <AccessibilityMode isOpen={showAccessibility} onClose={() => setShowAccessibility(false)} />
                <SeniorCitizenSupport isOpen={showSeniorCitizen} onClose={() => setShowSeniorCitizen(false)} />
                <ChildProtectionHub isOpen={showChildProtection} onClose={() => setShowChildProtection(false)} />
            </Suspense>
        </div>
    );
};

export default CitizenLayout;
