import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, ShieldCheck, MapPin, Fingerprint } from 'lucide-react';

const Onboarding = () => {
    const { user, completeOnboarding } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        id: '',
        location: ''
    });

    useEffect(() => {
        if (user?.role === 'CITIZEN') {
            setFormData({ name: 'Rajesh Kumar', id: '9988-7766-5544', location: 'Jaipur, Rajasthan' });
        } else if (user?.role === 'POLICE') {
            setFormData({ name: 'Insp. Vikram Singh', id: 'IPS-2024-88', location: 'Cyber Cell, Delhi' });
        } else if (user?.role === 'JUDGE') {
            setFormData({ name: 'Hon. Justice Verma', id: 'J-HC-209', location: 'High Court' });
        }
    }, [user]);

    const handleNext = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(prev => prev + 1);
        }, 1500);
    };

    const handleFinish = () => {
        completeOnboarding(formData);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-white text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <ShieldCheck className="mx-auto mb-2 opacity-80" size={32} />
                        <h2 className="text-xl font-bold">Jan-Parichay</h2>
                        <p className="text-xs opacity-70">National Single Sign-On</p>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-800">Verifying Identity</h3>
                                <p className="text-sm text-slate-500">Fetching details from Aadhaar/Service Database...</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                        {formData.name} <CheckCircle size={14} className="text-green-500" />
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-400 uppercase">{user?.role === 'CITIZEN' ? 'Aadhaar Number' : 'Service ID'}</label>
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Fingerprint size={14} className="text-slate-400" /> {formData.id}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Registered Location</label>
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" /> {formData.location}
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleNext} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Proceed'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Verification Successful</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Secure session established via Blockchain Node #402.
                                    <br />Access granted to <strong>{user?.role} Portal</strong>.
                                </p>
                            </div>
                            <button onClick={handleFinish} className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all">
                                Enter Dashboard
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400">Powered by NIC & Digital India</p>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
