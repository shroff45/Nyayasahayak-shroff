import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cpu, Lock, Globe, Database, Sparkles, Layers } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface AboutTechProps {
    t: (key: string) => string;
}

interface TechItem {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

/**
 * AboutTech - Technology stack showcase for credibility
 * 
 * Killer line: "Enterprise-grade security meets cutting-edge AI."
 */
const AboutTech: React.FC<AboutTechProps> = ({ t: _t }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const itemsRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const techItems: TechItem[] = [
        {
            id: 'ai',
            icon: <Sparkles className="w-6 h-6" aria-hidden="true" />,
            title: 'Gemini AI',
            description: 'Advanced reasoning and multilingual support built on Google\'s latest AI'
        },
        {
            id: 'blockchain',
            icon: <Database className="w-6 h-6" aria-hidden="true" />,
            title: 'Blockchain Ledger',
            description: 'Immutable document verification with cryptographic proofs'
        },
        {
            id: 'languages',
            icon: <Globe className="w-6 h-6" aria-hidden="true" />,
            title: '22 Languages',
            description: 'From Hindi to Sanskrit, Kashmiri to Tamil — full regional coverage'
        },
        {
            id: 'security',
            icon: <Lock className="w-6 h-6" aria-hidden="true" />,
            title: 'Court-Grade Security',
            description: 'End-to-end encryption meeting judicial data protection standards'
        },
        {
            id: 'inference',
            icon: <Cpu className="w-6 h-6" aria-hidden="true" />,
            title: 'Real-Time Inference',
            description: 'AI responses in seconds, not minutes — even on complex legal queries'
        },
        {
            id: 'stack',
            icon: <Layers className="w-6 h-6" aria-hidden="true" />,
            title: 'Modern Stack',
            description: 'React, Three.js, and TypeScript for reliability and performance'
        }
    ];

    useEffect(() => {
        if (prefersReducedMotion || !sectionRef.current || !itemsRef.current) return;

        const items = itemsRef.current.querySelectorAll('.tech-item');

        const ctx = gsap.context(() => {
            gsap.fromTo(items,
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 75%',
                        once: true
                    }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    return (
        <section
            ref={sectionRef}
            className="py-20 md:py-32 px-4 relative overflow-hidden"
            aria-labelledby="tech-title"
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 gridline opacity-30" aria-hidden="true" />

            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Content */}
                    <div>
                        <span className="chip mb-4 inline-flex">Powered By Innovation</span>
                        <h2
                            id="tech-title"
                            className="title text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-[var(--hi)]"
                        >
                            Built on Solid Foundations
                        </h2>
                        <p className="text-lg text-[var(--mid)] mb-4 leading-relaxed">
                            Enterprise-grade security meets cutting-edge AI. Every component selected
                            for reliability, performance, and alignment with emerging ethical AI guidelines
                            for Indian courts.
                        </p>
                        <p className="text-[var(--low)] mb-8">
                            No black boxes. Full transparency in how we process, store, and protect
                            judicial data.
                        </p>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-3">
                            <span className="chip">End-to-End Encrypted</span>
                            <span className="chip">WCAG 2.1 AA</span>
                            <span className="chip">e-Courts Aligned</span>
                        </div>
                    </div>

                    {/* Right: Tech grid */}
                    <div
                        ref={itemsRef}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        {techItems.map((item) => (
                            <div
                                key={item.id}
                                className="tech-item glass-quiet rounded-xl p-4 flex gap-4 transition-all duration-200 hover:bg-[var(--surface1)]"
                            >
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary-500)]/20 to-[var(--secondary-500)]/10 flex items-center justify-center text-[var(--primary-500)] flex-shrink-0">
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-[var(--hi)] mb-1">{item.title}</h3>
                                    <p className="text-sm text-[var(--low)] leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutTech;
