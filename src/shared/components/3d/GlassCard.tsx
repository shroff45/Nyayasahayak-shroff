// src/shared/components/3d/GlassCard.tsx
// Universal glassmorphic card with subtle 3D effects
// No mouse tracking - just beautiful glassmorphism

import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'emerald' | 'blue' | 'purple' | 'red' | 'amber';
    hover?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'default',
    hover = true,
    glow = false,
    onClick
}) => {
    const glowColors = {
        default: 'shadow-slate-500/10',
        emerald: 'shadow-emerald-500/20',
        blue: 'shadow-blue-500/20',
        purple: 'shadow-purple-500/20',
        red: 'shadow-red-500/20',
        amber: 'shadow-amber-500/20'
    };

    const borderColors = {
        default: 'border-white/10',
        emerald: 'border-emerald-500/30',
        blue: 'border-blue-500/30',
        purple: 'border-purple-500/30',
        red: 'border-red-500/30',
        amber: 'border-amber-500/30'
    };

    const hoverBorders = {
        default: 'hover:border-white/20',
        emerald: 'hover:border-emerald-400/50',
        blue: 'hover:border-blue-400/50',
        purple: 'hover:border-purple-400/50',
        red: 'hover:border-red-400/50',
        amber: 'hover:border-amber-400/50'
    };

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl
                bg-slate-800/40 backdrop-blur-xl
                border ${borderColors[variant]}
                ${hover ? `${hoverBorders[variant]} hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-xl` : ''}
                ${glow ? `shadow-lg ${glowColors[variant]}` : ''}
                ${onClick ? 'cursor-pointer' : ''}
                transition-all duration-300 ease-out
                ${className}
            `}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
