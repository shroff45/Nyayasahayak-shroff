// src/shared/components/3d/Waveform3D.tsx
// Real-time audio waveform visualization with 3D glow effects
// For voice recording interfaces

import React, { useEffect, useRef } from 'react';

interface Waveform3DProps {
    isActive: boolean;
    className?: string;
}

const Waveform3D: React.FC<Waveform3DProps> = ({ isActive, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const barsRef = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const barCount = 40;
        if (barsRef.current.length === 0) {
            barsRef.current = Array(barCount).fill(0).map(() => Math.random() * 0.3);
        }

        const resize = () => {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
            ctx.scale(2, 2);
        };

        const animate = () => {
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            ctx.clearRect(0, 0, width, height);

            const barWidth = width / barCount;
            const centerY = height / 2;

            barsRef.current.forEach((_, i) => {
                // Animate bars
                if (isActive) {
                    barsRef.current[i] += (Math.random() - 0.5) * 0.15;
                    barsRef.current[i] = Math.max(0.1, Math.min(1, barsRef.current[i]));
                } else {
                    barsRef.current[i] *= 0.95;
                    barsRef.current[i] = Math.max(0.05, barsRef.current[i]);
                }

                const barHeight = barsRef.current[i] * height * 0.8;
                const x = i * barWidth + barWidth * 0.2;
                const barW = barWidth * 0.6;

                // Glow effect
                const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
                gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.9)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');

                // Shadow/glow
                ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
                ctx.shadowBlur = 10;

                // Draw bar (centered)
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, barW, barHeight, 3);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Reset shadow
                ctx.shadowBlur = 0;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        resize();
        animate();

        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isActive]);

    return (
        <div className={`relative ${className}`}>
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 blur-xl rounded-full" />

            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
};

export default Waveform3D;
