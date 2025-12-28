// src/shared/components/common/ProgressRing.tsx
// NyayaSahayak Animated Progress Indicator
// Beautiful circular progress for loading and completion states

import React from 'react';

interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    backgroundColor?: string;
    showPercentage?: boolean;
    children?: React.ReactNode;
    className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 120,
    strokeWidth = 8,
    color = '#10b981',
    backgroundColor = '#334155',
    showPercentage = true,
    children,
    className = ''
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 6px ${color}40)`
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children || (showPercentage && (
                    <span className="text-2xl font-bold text-white">
                        {Math.round(progress)}%
                    </span>
                ))}
            </div>
        </div>
    );
};

// Indeterminate spinner variant
export const SpinnerRing: React.FC<{
    size?: number;
    color?: string;
    className?: string;
}> = ({ size = 40, color = '#10b981', className = '' }) => (
    <div className={`inline-flex ${className}`}>
        <svg
            width={size}
            height={size}
            className="animate-spin"
            viewBox="0 0 24 24"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
            />
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeDasharray="32"
                strokeDashoffset="16"
                strokeLinecap="round"
                style={{
                    filter: `drop-shadow(0 0 4px ${color}60)`
                }}
            />
        </svg>
    </div>
);

// Success checkmark animation
export const SuccessCheck: React.FC<{ size?: number; className?: string }> = ({ size = 60, className = '' }) => (
    <div className={`relative ${className}`}>
        <div
            className="rounded-full bg-emerald-500/20 flex items-center justify-center animate-scale-in"
            style={{ width: size, height: size }}
        >
            <svg
                width={size * 0.6}
                height={size * 0.6}
                viewBox="0 0 24 24"
                fill="none"
                className="animate-draw-check"
            >
                <path
                    d="M4 12l6 6L20 6"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        strokeDasharray: 30,
                        strokeDashoffset: 30,
                        animation: 'draw-check 0.5s ease forwards 0.2s'
                    }}
                />
            </svg>
        </div>
        <style>{`
            @keyframes scale-in {
                from { transform: scale(0); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes draw-check {
                to { stroke-dashoffset: 0; }
            }
            .animate-scale-in {
                animation: scale-in 0.3s ease-out forwards;
            }
        `}</style>
    </div>
);

export default ProgressRing;
