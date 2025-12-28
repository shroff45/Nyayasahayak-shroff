// src/shared/components/3d/ProcessingOrb.tsx
// Animated AI processing orb with pulsing effects
// Shows when AI is analyzing input

import React from 'react';

interface ProcessingOrbProps {
    isProcessing: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
}

const ProcessingOrb: React.FC<ProcessingOrbProps> = ({
    isProcessing,
    size = 'md',
    label,
    className = ''
}) => {
    const sizes = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    const innerSizes = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-20 h-20'
    };

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div className={`relative ${sizes[size]} flex items-center justify-center`}>
                {/* Outer pulsing ring */}
                <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 ${isProcessing ? 'animate-ping' : ''}`}
                    style={{ animationDuration: '2s' }}
                />

                {/* Middle ring */}
                <div
                    className={`absolute inset-2 rounded-full bg-gradient-to-r from-cyan-500/40 to-blue-500/40 ${isProcessing ? 'animate-pulse' : ''}`}
                />

                {/* Core orb */}
                <div
                    className={`relative ${innerSizes[size]} rounded-full flex items-center justify-center`}
                    style={{
                        background: isProcessing
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(6, 182, 212, 0.8) 50%, rgba(59, 130, 246, 0.8) 100%)'
                            : 'linear-gradient(135deg, rgba(100, 116, 139, 0.5) 0%, rgba(71, 85, 105, 0.5) 100%)',
                        boxShadow: isProcessing
                            ? '0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                            : 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
                        animation: isProcessing ? 'spin 3s linear infinite' : 'none'
                    }}
                >
                    {/* Brain/AI icon */}
                    <svg
                        className={`w-1/2 h-1/2 ${isProcessing ? 'text-white' : 'text-slate-400'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.129c-1.431.238-2.898-.137-4.024-1.04a8.992 8.992 0 00-5.678-1.402l-.773.13c-1.716.292-2.3 2.378-1.067 3.61L8.192 23" />
                    </svg>
                </div>

                {/* Orbiting dots when processing */}
                {isProcessing && (
                    <>
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-emerald-400"
                                style={{
                                    animation: `orbit-processing ${1.5 + i * 0.3}s linear infinite`,
                                    animationDelay: `${i * -0.5}s`
                                }}
                            />
                        ))}
                    </>
                )}
            </div>

            {label && (
                <span className={`text-sm font-medium ${isProcessing ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
                    {label}
                </span>
            )}

            <style>{`
                @keyframes orbit-processing {
                    from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
                }
            `}</style>
        </div>
    );
};

export default ProcessingOrb;
