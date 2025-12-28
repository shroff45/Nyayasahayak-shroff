// src/shared/components/3d/AnimatedBackground.tsx
// Stunning animated gradient background with floating particles
// Fixed: Simplified to work with React properly

import React, { useEffect, useRef, useCallback } from 'react';

interface AnimatedBackgroundProps {
    children: React.ReactNode;
    variant?: 'default' | 'aurora' | 'cosmic';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
    children,
    variant = 'default'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
        opacity: number;
        hue: number;
    }>>([]);

    const getHue = useCallback(() => {
        switch (variant) {
            case 'cosmic': return Math.random() * 60 + 260; // purple-blue
            case 'aurora': return Math.random() * 60 + 140; // green-cyan
            default: return Math.random() * 40 + 150; // emerald
        }
    }, [variant]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 20000));
            particlesRef.current = [];

            for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.4 + 0.1,
                    hue: getHue()
                });
            }
        };

        const drawParticle = (p: typeof particlesRef.current[0]) => {
            // Main particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
            ctx.fill();

            // Glow
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.2})`);
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        const connectParticles = () => {
            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `hsla(160, 60%, 50%, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                drawParticle(p);
            });

            connectParticles();
            animationRef.current = requestAnimationFrame(animate);
        };

        resize();
        createParticles();
        animate();

        const handleResize = () => {
            resize();
            createParticles();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [variant, getHue]);

    const gradientClasses: Record<string, string> = {
        default: 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950',
        aurora: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-950',
        cosmic: 'bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950'
    };

    return (
        <div className={`relative min-h-screen overflow-hidden ${gradientClasses[variant]}`}>
            {/* Animated mesh gradient overlay */}
            <div
                className="absolute inset-0 opacity-30 animate-mesh-gradient"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(ellipse at 40% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)
                    `
                }}
            />

            {/* Particle canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none opacity-60"
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default AnimatedBackground;
