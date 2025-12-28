
import { Shield, Gavel, User, ArrowRight, Activity, Lock } from 'lucide-react';
import { useAuth, UserRole } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = (role: UserRole) => {
        login(role);
        navigate('/onboarding');
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-orange-200">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 z-0"></div>

            <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                        <Shield size={18} fill="currentColor" />
                    </div>
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
                            <Activity size={12} /> Live Blockchain Network
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Justice at the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Speed of Voice.</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                            India's first AI-powered judicial interface. File FIRs via voice, visualize bail conditions, and predict case delays using our quantum-secure ledger.
                        </p>
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><Lock size={14} className="text-green-600" /> End-to-End Encrypted</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Jan-Parichay Supported</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <RoleCard role="CITIZEN" icon={User} title="Citizen Access" desc="File complaints, track status, and understand your rights." color="orange" onClick={() => handleRoleSelect('CITIZEN')} />
                        <RoleCard role="POLICE" icon={Shield} title="Police Force" desc="Manage FIRs, evidence lockers, and patrol units." color="blue" onClick={() => handleRoleSelect('POLICE')} />
                        <RoleCard role="JUDGE" icon={Gavel} title="Judiciary" desc="Review cases, grant bail, and analyze adjournments." color="purple" onClick={() => handleRoleSelect('JUDGE')} />
                    </div>
                </div>
            </main>
        </div>
    );
};

const RoleCard = ({ icon: Icon, title, desc, color, onClick }: any) => {
    const colorStyles = {
        orange: "hover:border-orange-500 hover:shadow-orange-500/20 group-hover:bg-orange-50",
        blue: "hover:border-blue-500 hover:shadow-blue-500/20 group-hover:bg-blue-50",
        purple: "hover:border-purple-500 hover:shadow-purple-500/20 group-hover:bg-purple-50"
    };

    return (
        <button onClick={onClick} className={`group flex items-center gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 ${colorStyles[color as keyof typeof colorStyles]}`}>
            <div className={`p-4 rounded-xl bg-slate-50 transition-colors ${colorStyles[color as keyof typeof colorStyles]}`}>
                <Icon size={28} className={`text-slate-700 group-hover:text-${color}-600 transition-colors`} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-black">{title}</h3>
                <p className="text-sm text-slate-500 leading-snug">{desc}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                <ArrowRight className={`text-${color}-600`} />
            </div>
        </button>
    );
};

export default LandingPage;
