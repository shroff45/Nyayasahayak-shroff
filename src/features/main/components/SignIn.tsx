
import React, { useState } from 'react';
import { Scale, Mail, Lock, AlertCircle, ArrowRight, Chrome } from 'lucide-react';
import AnimatedPageWrapper from './common/AnimatedPageWrapper';
import { User } from '../types';

interface SignInProps {
    onSignIn: (user: User) => void;
    t: (key: string) => string;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn, t }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleSignIn = () => {
        // Simulate Google sign-in with a mock user
        onSignIn({ email: 'user.google@example.com' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        // Mock user database in localStorage
        const users = JSON.parse(localStorage.getItem('nyaya:users') || '{}');

        if (isSignUp) {
            if (users[email]) {
                setError('User with this email already exists.');
                return;
            }
            users[email] = { password }; // In a real app, hash the password
            localStorage.setItem('nyaya:users', JSON.stringify(users));
            onSignIn({ email });
        } else {
            if (!users[email] || users[email].password !== password) {
                setError('Invalid email or password.');
                return;
            }
            onSignIn({ email });
        }
    };

    return (
        <AnimatedPageWrapper fullscreen={true}>
            <div className="w-full min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ns-primary-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ns-secondary-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                </div>

                <div className="glass relative z-10 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full border border-white/10 backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="relative w-20 h-20 rounded-2xl brand-ring flex items-center justify-center shadow-lg shadow-ns-primary-900/20">
                            <div className="absolute inset-0 gridline rounded-2xl"></div>
                            <Scale className="w-10 h-10 text-white relative z-10" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="title text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">{t('header_title')}</h1>
                        <p className="text-base text-white/60 leading-relaxed">
                            {t('about_desc')}
                        </p>
                    </div>

                    {/* Form for Email/Password */}
                    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-ns-primary-500 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('email_address')}
                                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-ns-primary-500/50 focus:border-ns-primary-500/50 transition-all text-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-ns-primary-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('password')}
                                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-ns-primary-500/50 focus:border-ns-primary-500/50 transition-all text-sm"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-ns-danger text-sm font-medium bg-ns-danger/10 p-3 rounded-lg border border-ns-danger/20">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full group">
                            {isSignUp ? t('create_account') : t('sign_in_prompt').split('? ')[1]}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <div className="flex-grow h-px bg-white/10"></div>
                        <span className="mx-4 text-xs text-white/40 font-bold uppercase tracking-wider">OR</span>
                        <div className="flex-grow h-px bg-white/10"></div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="btn btn-quiet w-full hover:bg-white/10 border-white/10"
                    >
                        <Chrome className="w-5 h-5 text-white/80" />
                        {t('sign_in_with_google')}
                    </button>

                    <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="w-full text-center text-sm font-medium text-ns-primary-500 hover:text-ns-primary-400 hover:underline mt-8 transition-colors">
                        {isSignUp ? t('sign_in_prompt') : t('sign_up_prompt')}
                    </button>

                    <p className="text-[10px] text-center text-white/30 mt-6">
                        {t('by_signing_in')}
                    </p>
                </div>
            </div>
        </AnimatedPageWrapper>
    );
};

export default SignIn;
