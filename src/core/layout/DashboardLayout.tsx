import React, { useState } from 'react';
import { useAuth } from '@core/auth/AuthContext';
import { LogOut, Shield, Gavel, User, Menu, Home, FileText, Map, Settings, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DecisionStream } from '@shared/components/DecisionStream';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const themeClass =
        user?.role === 'POLICE' ? 'bg-slate-950 text-slate-100' :
            user?.role === 'JUDGE' ? 'bg-stone-50 text-stone-900' :
                'bg-gradient-to-br from-orange-50 to-amber-50 text-slate-800';

    const glassClass =
        user?.role === 'POLICE' ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700' :
            'bg-white/70 backdrop-blur-xl border-white/40 shadow-xl';

    const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
        const isActive = location.pathname === path;
        const activeClass = user?.role === 'POLICE' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white shadow-orange-200';
        const inactiveClass = 'hover:bg-black/5 opacity-70 hover:opacity-100';

        return (
            <Link
                to={path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-medium ${isActive ? activeClass : inactiveClass}`}
            >
                <Icon size={20} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${themeClass} flex`}>
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${glassClass} border-r p-4 flex flex-col`}>
                <div className="flex items-center gap-3 mb-10 px-2 pt-2">
                    <div className={`p-2.5 rounded-xl shadow-lg ${user?.role === 'POLICE' ? 'bg-blue-600 text-white' : user?.role === 'JUDGE' ? 'bg-purple-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {user?.role === 'POLICE' ? <Shield size={24} /> : user?.role === 'JUDGE' ? <Gavel size={24} /> : <User size={24} />}
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight leading-none">Nyaya<br /><span className="text-sm font-normal opacity-80">Sahayak</span></h1>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon={Home} label="Dashboard" path="/dashboard" />
                    {user?.role === 'POLICE' && (
                        <>
                            <NavItem icon={FileText} label="Smart FIR" path="/police/fir" />
                            <NavItem icon={Shield} label="Evidence Locker" path="/police/evidence" />
                            <NavItem icon={Map} label="Patrol Map" path="/police/map" />
                        </>
                    )}
                    {user?.role === 'JUDGE' && (
                        <>
                            <NavItem icon={FileText} label="Case Queue" path="/judge/queue" />
                            <NavItem icon={Gavel} label="Bail Requests" path="/judge/bail" />
                        </>
                    )}
                    {user?.role === 'CITIZEN' && (
                        <>
                            <NavItem icon={FileText} label="My Cases" path="/citizen/cases" />
                            <NavItem icon={Settings} label="Legal Rights" path="/citizen/rights" />
                        </>
                    )}
                </nav>

                <div className="mt-auto pt-6 border-t border-current/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center overflow-hidden">
                            <img src={user?.avatar} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                            <p className="text-xs opacity-60 truncate">{user?.id || 'ID: Loading...'}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 w-full p-2.5 rounded-xl transition-colors text-sm font-bold">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            <main className="flex-1 relative overflow-y-auto h-screen">
                <header className={`md:hidden h-16 ${glassClass} backdrop-blur-md border-b flex items-center justify-between px-4 sticky top-0 z-30`}>
                    <span className="font-bold text-lg">NyayaSahayak</span>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 active:scale-95 transition-transform"><Menu /></button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up pb-24">
                    {children}
                </div>

                {user?.role === 'CITIZEN' && (
                    <button className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg shadow-red-600/40 animate-bounce hover:animate-none transition-all z-50 flex items-center gap-2 group">
                        <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20"></div>
                        <Phone size={24} fill="currentColor" />
                        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold">EMERGENCY SOS</span>
                    </button>
                )}

                <DecisionStream />
            </main>
        </div>
    );
};
