// src/shared/components/3d/ParticleHeader.tsx
// Premium particle banner for header sections
// Creates an immersive animated header with floating particles

import React, { useEffect, useRef } from 'react';

interface ParticleHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'emerald' | 'blue' | 'purple' | 'red';
    className?: string;
}

const ParticleHeader: React.FC<ParticleHeaderProps> = ({
    title,
    subtitle,
    icon,
    variant = 'emerald',
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const colors = {
        emerald: { primary: 'rgba(16, 185, 129, ', secondary: 'rgba(6, 182, 212, ' },
        blue: { primary: 'rgba(59, 130, 246, ', secondary: 'rgba(99, 102, 241, ' },
        purple: { primary: 'rgba(139, 92, 246, ', secondary: 'rgba(236, 72, 153, ' },
        red: { primary: 'rgba(239, 68, 68, ', secondary: 'rgba(249, 115, 22, ' }
    };

    const gradients = {
        emerald: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
        blue: 'from-blue-500/20 via-indigo-500/10 to-transparent',
        purple: 'from-purple-500/20 via-pink-500/10 to-transparent',
        red: 'from-red-500/20 via-orange-500/10 to-transparent'
    };

    const textColors = {
        emerald: 'from-emerald-400 to-cyan-400',
        blue: 'from-blue-400 to-indigo-400',
        purple: 'from-purple-400 to-pink-400',
        red: 'from-red-400 to-orange-400'
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const particles: Array<{
            x: number; y: number; size: number;
            speedX: number; speedY: number; opacity: number;
        }> = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
            ctx.scale(2, 2);
        };

        const createParticles = () => {
            const count = Math.floor(canvas.offsetWidth / 15);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.offsetWidth,
                    y: Math.random() * canvas.offsetHeight,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            const color = colors[variant];

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.offsetWidth;
                if (p.x > canvas.offsetWidth) p.x = 0;
                if (p.y < 0) p.y = canvas.offsetHeight;
                if (p.y > canvas.offsetHeight) p.y = 0;

                // Glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                gradient.addColorStop(0, `${color.primary}${p.opacity})`);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${color.secondary}${p.opacity + 0.2})`;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        resize();
        createParticles();
        animate();

        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [variant]);

    return (
        <div className={`relative overflow-hidden rounded-2xl ${className}`}>
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`} />

            {/* Mesh gradient */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 30%, ${colors[variant].primary}0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, ${colors[variant].secondary}0.1) 0%, transparent 50%)
                    `
                }}
            />

            {/* Particle canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textColors[variant]}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-slate-400 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom glow line */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${gradients[variant]} opacity-50`} />
        </div>
    );
};

export default ParticleHeader;
