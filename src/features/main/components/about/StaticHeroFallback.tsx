import React from 'react';

/**
 * StaticHeroFallback - CSS-only fallback for devices without WebGL
 * Displays a beautiful gradient card with subtle CSS animation
 */
const StaticHeroFallback: React.FC = () => {
    return (
        <div
            className="static-hero-fallback"
            role="img"
            aria-label="Abstract representation of balanced scales of justice"
        >
            {/* Gradient background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-700)]/20 via-[var(--secondary-500)]/10 to-[var(--accent-500)]/15 rounded-3xl" />

            {/* Animated shimmer layer */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div className="shimmer-effect" />
            </div>

            {/* Central icon */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <svg
                    viewBox="0 0 120 120"
                    className="w-32 h-32 md:w-48 md:h-48 text-[var(--primary-500)]"
                    aria-hidden="true"
                >
                    {/* Abstract geometric scales - minimalist design */}
                    <defs>
                        <linearGradient id="scaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="1" />
                            <stop offset="50%" stopColor="var(--secondary-500)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="var(--accent-500)" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>

                    {/* Central pillar */}
                    <rect x="57" y="30" width="6" height="60" rx="3" fill="url(#scaleGradient)" />

                    {/* Balance beam */}
                    <rect x="20" y="28" width="80" height="4" rx="2" fill="url(#scaleGradient)" />

                    {/* Left scale pan */}
                    <circle cx="30" cy="28" r="4" fill="url(#scaleGradient)" />
                    <path d="M20 32 L30 55 L40 32" stroke="url(#scaleGradient)" strokeWidth="2" fill="none" />
                    <ellipse cx="30" cy="58" rx="14" ry="4" fill="url(#scaleGradient)" opacity="0.8" />

                    {/* Right scale pan */}
                    <circle cx="90" cy="28" r="4" fill="url(#scaleGradient)" />
                    <path d="M80 32 L90 55 L100 32" stroke="url(#scaleGradient)" strokeWidth="2" fill="none" />
                    <ellipse cx="90" cy="58" rx="14" ry="4" fill="url(#scaleGradient)" opacity="0.8" />

                    {/* Base */}
                    <ellipse cx="60" cy="95" rx="25" ry="6" fill="url(#scaleGradient)" opacity="0.6" />
                </svg>

                {/* Decorative orbiting dots */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="orbit-dot orbit-dot-1" />
                    <div className="orbit-dot orbit-dot-2" />
                    <div className="orbit-dot orbit-dot-3" />
                </div>
            </div>
        </div>
    );
};

export default StaticHeroFallback;
