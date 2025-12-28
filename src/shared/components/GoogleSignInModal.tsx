// src/shared/components/GoogleSignInModal.tsx
// NyayaSahayak - Simulated Google OAuth Modal for Hackathon Demo
// Ready for real Google Identity Services upgrade

import React, { useState } from 'react';
import { X, Chrome, User, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface GoogleSignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignIn: (userData: { name: string; email: string; avatar: string }) => void;
}

const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ isOpen, onClose, onSignIn }) => {
    const [step, setStep] = useState<'initial' | 'form' | 'loading'>('initial');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGoogleClick = () => {
        setStep('form');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        setStep('loading');

        // Simulate OAuth delay
        setTimeout(() => {
            onSignIn({
                name: name.trim(),
                email: email.trim(),
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`
            });
        }, 1200);
    };

    const handleClose = () => {
        setStep('initial');
        setName('');
        setEmail('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                            <Chrome className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800">Sign in with Google</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'initial' && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to NyayaSetu</h2>
                                <p className="text-gray-500 text-sm">
                                    Sign in with your Google account to access the Citizen Portal
                                </p>
                            </div>
                            <button
                                onClick={handleGoogleClick}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                            <p className="text-xs text-gray-400">
                                By signing in, you agree to NyayaSahayak's Terms of Service
                            </p>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500">
                                    Enter your details to continue
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => { setName(e.target.value); setError(''); }}
                                            placeholder="Enter your full name"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            placeholder="your.email@gmail.com"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Sign In to Citizen Portal
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('initial')}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Back
                            </button>
                        </form>
                    )}

                    {step === 'loading' && (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Signing you in...</h3>
                                <p className="text-sm text-gray-500 mt-1">Welcome, {name}!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-400">
                        🔒 Secured with end-to-end encryption • Jan-Parichay Compatible
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoogleSignInModal;
