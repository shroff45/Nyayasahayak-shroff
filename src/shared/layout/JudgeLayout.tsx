// src/shared/layout/JudgeLayout.tsx
// NyayaSahayak Hybrid v2.0.0 - Judge Persona Layout Wrapper

import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import {
    LayoutDashboard,
    Scale,
    PenTool,
    Briefcase,
    LogOut,
    FileText,
    Gavel,
    ShieldCheck
} from 'lucide-react';

const JudgeLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/judge/board', label: 'Case Board', labelHi: 'केस बोर्ड', icon: LayoutDashboard },
        { path: '/judge/draft', label: 'Draft & Audit', labelHi: 'मसौदा और लेखापरीक्षा', icon: PenTool },
        { path: '/judge/moot-court', label: 'Virtual Moot Court', labelHi: 'वर्चुअल मूट कोर्ट', icon: Gavel },
        { path: '/judge/evidence', label: 'Evidence Vault', labelHi: 'साक्ष्य भंडार', icon: Briefcase },
        { path: '/judge/custody', label: 'Chain of Custody', labelHi: 'हिरासत श्रृंखला', icon: ShieldCheck },
        { path: '/judge/bail', label: 'Smart Bail', labelHi: 'स्मार्ट जमानत', icon: Scale },
        { path: '/about', label: 'About this build', icon: FileText },
        { path: '/judge/orders', label: 'Orders History', labelHi: 'आदेश इतिहास', icon: FileText },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* 3D Wood Grain Background */}
            <div className="fixed inset-0 -z-10">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="judgeWood" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1a1510" />
                            <stop offset="30%" stopColor="#2d2318" />
                            <stop offset="70%" stopColor="#241c14" />
                            <stop offset="100%" stopColor="#1a1510" />
                        </linearGradient>
                        <pattern id="woodGrain" patternUnits="userSpaceOnUse" width="200" height="200">
                            <rect fill="url(#judgeWood)" width="200" height="200" />
                            <path d="M0,20 Q50,15 100,22 T200,18" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <path d="M0,50 Q70,45 140,55 T200,48" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <path d="M0,80 Q60,75 120,82 T200,78" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <path d="M0,110 Q80,105 160,115 T200,108" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <path d="M0,140 Q50,135 100,142 T200,138" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <path d="M0,170 Q70,165 140,175 T200,168" stroke="#3a2d20" strokeWidth="0.5" fill="none" opacity="0.3" />
                        </pattern>
                        <radialGradient id="judgeGlow" cx="30%" cy="30%" r="60%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#1a1510" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#woodGrain)" />
                    <rect width="100%" height="100%" fill="url(#judgeGlow)" />
                </svg>
            </div>

            {/* Top Header - Senior Judge Friendly with Large Elements */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-purple-950/90 to-slate-900/95 
                backdrop-blur-xl border-b-2 border-amber-700/50 shadow-2xl"
                style={{ boxShadow: '0 4px 30px rgba(168, 85, 247, 0.15)' }}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* 3D Logo Effect */}
                        <div className="relative">
                            <img src="/logo.png" alt="NyayaSahayak"
                                className="w-12 h-12 rounded-xl shadow-lg"
                                style={{ boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)' }} />
                            <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-pulse" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-white tracking-wide">NyayaAdhikari</span>
                            <span className="ml-3 text-sm bg-gradient-to-r from-amber-500/30 to-amber-600/30 
                                text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/40 font-medium">
                                ⚖️ Judicial Portal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {user && (
                            <Link
                                to="/profile"
                                className="flex items-center gap-3 hover:bg-white/5 px-4 py-2 rounded-xl transition-all cursor-pointer"
                                title="Profile & Settings"
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full border-3 border-amber-500/50 shadow-lg"
                                    style={{ boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)' }}
                                />
                                <div className="text-right">
                                    <span className="text-lg text-white font-medium block">{user.name}</span>
                                    {user.courtId && (
                                        <span className="text-sm text-amber-400/80">{user.courtId}</span>
                                    )}
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-4 text-slate-400 hover:text-red-400 hover:bg-red-500/10 
                                rounded-xl transition-all text-lg"
                            aria-label="Logout"
                            style={{ minWidth: '52px', minHeight: '52px' }}
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content with 3D Glassmorphism Sidebar */}
            <div className="flex pt-20">
                {/* 3D Floating Sidebar */}
                <aside className="fixed left-3 top-24 bottom-3 w-72 rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(30, 20, 15, 0.95) 0%, rgba(45, 35, 24, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(168, 85, 247, 0.2)'
                    }}>

                    {/* Decorative Gold Trim */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/0 via-amber-500/60 to-amber-600/0" />

                    <nav className="p-4 space-y-3 flex-1 overflow-y-auto pb-32">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 
                                    ${isActive
                                        ? 'bg-gradient-to-r from-purple-600/30 to-amber-600/20 text-amber-300 border-l-4 border-amber-500 shadow-lg'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                    }`
                                }
                                style={{ minHeight: '56px' }}
                            >
                                <item.icon className="w-6 h-6 flex-shrink-0" />
                                <span className="text-lg font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Case Load Widget - 3D Card */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="rounded-xl p-5"
                            style={{
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 10px 30px -10px rgba(168, 85, 247, 0.3)',
                                border: '1px solid rgba(168, 85, 247, 0.3)'
                            }}>
                            <div className="flex items-center gap-3 text-amber-400 mb-3">
                                <Scale className="w-6 h-6" />
                                <p className="text-lg font-semibold">Today's Board</p>
                            </div>
                            <p className="text-4xl font-bold text-white mb-1">12 Cases</p>
                            <p className="text-base text-amber-300/80">🔴 3 High Priority</p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 ml-80 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default JudgeLayout;
