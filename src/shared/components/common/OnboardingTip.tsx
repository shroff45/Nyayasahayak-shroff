// src/shared/components/common/OnboardingTip.tsx
// NyayaSahayak First-Time User Onboarding
// Helps citizens understand features

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingStep {
    title: string;
    titleHindi: string;
    description: string;
    descriptionHindi: string;
    icon?: string;
}

interface OnboardingProps {
    id: string; // Unique ID to track if user has seen this
    steps: OnboardingStep[];
    onComplete?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ id, steps, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem(`nyaya:onboarding:${id}`);
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, [id]);

    const handleComplete = () => {
        localStorage.setItem(`nyaya:onboarding:${id}`, 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="max-w-md w-full mx-4 bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-6">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                            {step.icon || '💡'}
                        </div>
                        <button
                            onClick={handleSkip}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-1">{step.title}</h2>
                    <p className="text-sm text-emerald-400 mb-4">{step.titleHindi}</p>

                    <p className="text-slate-300 mb-2">{step.description}</p>
                    <p className="text-sm text-slate-400 italic">{step.descriptionHindi}</p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${i === currentStep
                                        ? 'bg-emerald-500 w-6'
                                        : i < currentStep
                                            ? 'bg-emerald-500/50'
                                            : 'bg-slate-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                पीछे
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {currentStep === steps.length - 1 ? 'शुरू करें' : 'आगे'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleSkip}
                        className="w-full mt-3 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                    >
                        Skip / छोड़ें
                    </button>
                </div>
            </div>
        </div>
    );
};

// Tooltip for individual features
export const FeatureTooltip: React.FC<{
    children: React.ReactNode;
    tip: string;
    tipHindi?: string;
}> = ({ children, tip, tipHindi }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-white font-medium">{tip}</span>
                    </div>
                    {tipHindi && (
                        <p className="text-xs text-slate-400 mt-1">{tipHindi}</p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
                </div>
            )}
        </div>
    );
};

export default Onboarding;
