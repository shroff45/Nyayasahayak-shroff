// src/shared/layout/LandingPage.tsx
// NyayaSahayak - Landing Page with Unified Authentication for All Personas

import { useState } from 'react';
import { Shield, Gavel, User, ArrowRight, Activity, Building2 } from 'lucide-react';
import { useAuth, UserRole } from '../../core/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import UnifiedSignInModal from '../components/UnifiedSignInModal';

const LandingPage = () => {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);

    // Handle role selection - opens unified modal with role pre-selected
    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
        setShowSignInModal(true);
    };

    // Handle unified sign-in completion for all roles
    const handleUnifiedSignIn = (
        userData: {
            name: string;
            email?: string;
            avatar: string;
            station?: string;
            courtId?: string;
            department?: string;
        },
        role: UserRole
    ) => {
        // Use atomic loginWithGoogle for all roles - it handles role-specific fields
        loginWithGoogle({
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar
        }, role);

        setShowSignInModal(false);
        setSelectedRole(null);

        // Navigate to appropriate dashboard based on role
        const roleRoutes: Record<string, string> = {
            'CITIZEN': '/citizen/home',
            'POLICE': '/police/dashboard',
            'JUDGE': '/judge/board',
            'ADMIN': '/admin/dashboard'
        };
        navigate(roleRoutes[role || 'CITIZEN'] || '/citizen/home');
    };

    const handleModalClose = () => {
        setShowSignInModal(false);
        setSelectedRole(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-orange-200">
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 z-0"></div>
            {/* Hero banner overlay */}
            <div
                className="absolute inset-0 opacity-5 z-0"
                style={{
                    backgroundImage: 'url(/hero-banner.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            ></div>

            <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="NyayaSahayak" className="w-10 h-10 rounded-lg" />
                    <span className="text-xl font-bold tracking-tight">NyayaSahayak</span>
                </div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    National Hackathon Edition
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20 md:pt-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-orange-600 uppercase tracking-wide">
                            <Activity size={12} />Local integrity ledger
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Justice at the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Speed of Voice.</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                            An AI-assisted judicial interface: draft a complaint by voice, read the bail conditions the case carries, and see how long the matter has been waiting. Every exhibit is hashed and written to a ledger on this device - not to a network, and not to any court's systems.
                        </p>
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><Shield size={14} className="text-green-600" />Nothing leaves this device</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Pick a role to look around - no accounts here</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <RoleCard
                            role="CITIZEN"
                            icon={User}
                            title="Citizen Access"
                            titleHi="नागरिक पोर्टल"
                            desc="File complaints, track status, and understand your rights."
                            color="orange"
                            onClick={() => handleRoleSelect('CITIZEN')}
                        />
                        <RoleCard
                            role="POLICE"
                            icon={Shield}
                            title="Police Force"
                            titleHi="पुलिस पोर्टल"
                            desc="Manage FIRs, evidence lockers, and patrol units."
                            color="blue"
                            onClick={() => handleRoleSelect('POLICE')}
                        />
                        <RoleCard
                            role="JUDGE"
                            icon={Gavel}
                            title="Judiciary"
                            titleHi="न्यायपालिका"
                            desc="Review cases, grant bail, and analyze adjournments."
                            color="purple"
                            onClick={() => handleRoleSelect('JUDGE')}
                        />
                        <RoleCard
                            role="ADMIN"
                            icon={Building2}
                            title="Administration"
                            titleHi="प्रशासन"
                            desc="Monitor BNS transition, view pendency heatmaps."
                            color="amber"
                            onClick={() => handleRoleSelect('ADMIN')}
                        />
                    </div>
                </div>
            </main>

            {/* Unified Sign-In Modal for All Roles */}
            <UnifiedSignInModal
                isOpen={showSignInModal}
                onClose={handleModalClose}
                onSignIn={handleUnifiedSignIn}
                preselectedRole={selectedRole}
            />
        </div>
    )
};

const RoleCard = ({ icon: Icon, title, titleHi, desc, color, onClick, badge }: any) => {
    const colorStyles = {
        orange: "hover:border-orange-500 hover:shadow-orange-500/20 group-hover:bg-orange-50",
        blue: "hover:border-blue-500 hover:shadow-blue-500/20 group-hover:bg-blue-50",
        purple: "hover:border-purple-500 hover:shadow-purple-500/20 group-hover:bg-purple-50",
        amber: "hover:border-amber-500 hover:shadow-amber-500/20 group-hover:bg-amber-50"
    };

    return (
        <button onClick={onClick} className={`group flex items-center gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 ${colorStyles[color as keyof typeof colorStyles]}`}>
            <div className={`p-4 rounded-xl bg-slate-50 transition-colors ${colorStyles[color as keyof typeof colorStyles]}`}>
                <Icon size={28} className={`text-slate-700 group-hover:text-${color}-600 transition-colors`} />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-black">{title}</h3>
                        {titleHi && <span className="text-xs text-slate-500">{titleHi}</span>}
                    </div>
                    {badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 leading-snug mt-1">{desc}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                <ArrowRight className={`text-${color}-600`} />
            </div>
        </button>
    );
};

export default LandingPage;

