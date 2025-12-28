// src/shared/pages/ProfileSettings.tsx
// NyayaSahayak Hybrid v2.0.0 - User Profile & Settings Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import {
    Shield,
    Bell,
    Moon,
    LogOut,
    ChevronRight,
    Check,
    ArrowLeft
} from 'lucide-react';

const ProfileSettings: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Settings state
    const [notifications, setNotifications] = useState({
        caseUpdates: true,
        hearingReminders: true,
        systemAlerts: false
    });
    const [darkMode, setDarkMode] = useState(true);
    const [language, setLanguage] = useState('en');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getRoleBadgeColor = (role: string | null | undefined) => {
        switch (role) {
            case 'JUDGE': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
            case 'POLICE': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'CITIZEN': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'ADMIN': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    const getRolePortalName = (role: string | null | undefined) => {
        switch (role) {
            case 'JUDGE': return 'NyayaAdhikari Portal';
            case 'POLICE': return 'NyayaRakshak Portal';
            case 'CITIZEN': return 'NyayaSetu Portal';
            case 'ADMIN': return 'Admin Console';
            default: return 'NyayaSahayak';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                            alt={user?.name || 'User'}
                            className="w-20 h-20 rounded-full border-2 border-emerald-500"
                        />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">{user?.name || 'User'}</h1>
                            <p className="text-slate-400 text-sm">{user?.id || 'No ID assigned'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getRoleBadgeColor(user?.role)}`}>
                                    {user?.role || 'Guest'}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {getRolePortalName(user?.role)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Role-specific info */}
                    {user?.station && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500">Station</p>
                            <p className="text-sm text-white">{user.station}</p>
                        </div>
                    )}
                    {user?.courtId && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500">Court ID</p>
                            <p className="text-sm text-white">{user.courtId}</p>
                        </div>
                    )}
                </div>

                {/* Notification Settings */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-amber-400" />
                        Notifications
                    </h2>

                    <div className="space-y-4">
                        {[
                            { key: 'caseUpdates', label: 'Case Updates', desc: 'Get notified when your cases are updated' },
                            { key: 'hearingReminders', label: 'Hearing Reminders', desc: 'Reminders before scheduled hearings' },
                            { key: 'systemAlerts', label: 'System Alerts', desc: 'Important system notifications' }
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => setNotifications(prev => ({
                                        ...prev,
                                        [item.key]: !prev[item.key as keyof typeof prev]
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications]
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications[item.key as keyof typeof notifications]
                                        ? 'translate-x-6'
                                        : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Display Settings */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Moon className="w-5 h-5 text-blue-400" />
                        Display
                    </h2>

                    <div className="space-y-4">
                        {/* Dark Mode */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Dark Mode</p>
                                <p className="text-xs text-slate-500">Use dark theme across the app</p>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-emerald-500' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Language</p>
                                <p className="text-xs text-slate-500">Select your preferred language</p>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी</option>
                                <option value="ta">தமிழ்</option>
                                <option value="te">తెలుగు</option>
                                <option value="bn">বাংলা</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        Security
                    </h2>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors">
                            <span className="text-white">Change Password</span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors">
                            <span className="text-white">Two-Factor Authentication</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Enabled
                            </span>
                        </button>
                        <button className="w-full flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors">
                            <span className="text-white">Session History</span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>

                {/* App Version */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    NyayaSahayak Hybrid v2.0.0 • HMAC Secured Session
                </p>
            </div>
        </div>
    );
};

export default ProfileSettings;
