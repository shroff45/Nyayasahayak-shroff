// src/shared/components/3d/FloatingCard.tsx
// 3D Floating Card with tilt effect and glassmorphism

import React, { useRef, useState } from 'react';

interface FloatingCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    intensity?: 'low' | 'medium' | 'high';
}

const FloatingCard: React.FC<FloatingCardProps> = ({
    children,
    className = '',
    glowColor = 'emerald',
    intensity = 'medium'
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');
    const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

    const intensityValues = {
        low: { tilt: 5, glow: 0.1 },
        medium: { tilt: 10, glow: 0.2 },
        high: { tilt: 15, glow: 0.3 }
    };

    const { tilt } = intensityValues[intensity];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -tilt;
        const rotateY = ((x - centerX) / centerX) * tilt;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlowPosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        setGlowPosition({ x: 50, y: 50 });
    };

    const glowColors: Record<string, string> = {
        emerald: 'rgba(16, 185, 129, 0.4)',
        blue: 'rgba(59, 130, 246, 0.4)',
        purple: 'rgba(139, 92, 246, 0.4)',
        amber: 'rgba(245, 158, 11, 0.4)',
        pink: 'rgba(236, 72, 153, 0.4)',
        cyan: 'rgba(6, 182, 212, 0.4)'
    };

    return (
        <div
            ref={cardRef}
            className={`relative group ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform,
                transition: 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d'
            }}
        >
            {/* Glow effect that follows mouse */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColors[glowColor] || glowColors.emerald}, transparent 50%)`,
                    filter: 'blur(20px)',
                    transform: 'translateZ(-10px)'
                }}
            />

            {/* Card content with glass effect */}
            <div
                className="relative rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    transform: 'translateZ(20px)'
                }}
            >
                {children}
            </div>

            {/* Reflection effect */}
            <div
                className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                    transform: 'translateZ(25px)'
                }}
            />
        </div>
    );
};

export default FloatingCard;
