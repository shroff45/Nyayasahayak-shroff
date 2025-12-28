import React, { useEffect, useRef } from 'react';

interface Background3DProps {
    theme?: 'light' | 'dark';
}

const Background3D: React.FC<Background3DProps> = ({ theme = 'dark' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const themeRef = useRef(theme);
    const particlesRef = useRef<any[]>([]);
    const animationFrameRef = useRef<number>();

    // Update theme ref when prop changes
    useEffect(() => {
        themeRef.current = theme;
    }, [theme]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                if (!ctx) return;
                const currentTheme = themeRef.current;

                if (currentTheme === 'dark') {
                    ctx.fillStyle = `rgba(100, 150, 255, 0.5)`;
                } else {
                    ctx.fillStyle = `rgba(50, 50, 200, 0.5)`;
                }

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particlesRef.current = [];
            const numberOfParticles = Math.min(window.innerWidth * 0.1, 150);
            for (let i = 0; i < numberOfParticles; i++) {
                particlesRef.current.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const currentTheme = themeRef.current;

            const particles = particlesRef.current;

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        if (currentTheme === 'dark') {
                            ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 - distance / 1000})`;
                        } else {
                            ctx.strokeStyle = `rgba(50, 50, 200, ${0.1 - distance / 1000})`;
                        }
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []); // Empty dependency array - runs once on mount

    return (
        <canvas
            ref={canvasRef}
            className={`fixed top-0 left-0 w-full h-full -z-10 transition-colors duration-500 ${theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black'
                : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
                }`}
        />
    );
};

export default Background3D;
