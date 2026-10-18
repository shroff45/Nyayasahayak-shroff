// src/shared/layout/AdminLayout.tsx
// NyayaSahayak Hybrid v2.0.0 - Admin Persona Layout Wrapper

import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import {
    LayoutDashboard,
    PieChart,
    Map,
    TrendingUp,
    Smile,
    FileText,
    History,
    Fingerprint,
    LogOut
} from 'lucide-react';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/happiness', label: 'Litigant Happiness', icon: Smile },
        { path: '/admin/analysis', label: 'Document Analysis', icon: FileText },
        { path: '/admin/history', label: 'Activity Log', icon: History },
        { path: '/admin/quantum', label: 'Ledger Verify', icon: Fingerprint },
        { path: '/admin/transition', label: 'BNS Transition', icon: TrendingUp },
        { path: '/admin/pendency', label: 'Pendency Map', icon: Map },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-amber-700/50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="NyayaSahayak" className="w-8 h-8 rounded-lg" />
                        <span className="text-xl font-bold text-white">NyayaPrashaasak</span>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                            Admin Portal
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                                title="Profile & Settings"
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full border-2 border-amber-500"
                                />
                                <div className="text-right">
                                    <span className="text-sm text-slate-300 block">{user.name}</span>
                                    {user.department && (
                                        <span className="text-xs text-slate-500">{user.department}</span>
                                    )}
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content with Sidebar */}
            <div className="flex pt-16">
                {/* Sidebar Navigation */}
                <aside className="fixed left-0 top-16 bottom-0 w-64 bg-slate-800/50 border-r border-amber-700/30 p-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* System Status Widget */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <PieChart className="w-4 h-4" />
                                <p className="text-sm font-medium">BNS Adoption</p>
                            </div>
                            <p className="text-2xl font-bold text-white">67%</p>
                            <p className="text-xs text-slate-400">National Average</p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
