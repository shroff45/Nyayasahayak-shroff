import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Heart } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../../services/analytics';

gsap.registerPlugin(ScrollTrigger);

interface AboutCTAProps {
    t: (key: string) => string;
    onGetStarted?: () => void;
}

/**
 * AboutCTA - Final call to action section
 * 
 * Killer lines:
 * - "Ready to transform justice delivery?"
 * - "Built for India. Designed for tomorrow."
 */
const AboutCTA: React.FC<AboutCTAProps> = ({ t: _t, onGetStarted }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || !sectionRef.current || !contentRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 40, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        once: true
                    }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    const handleGetStarted = () => {
        trackAboutEvent({ type: 'cta_click', button: 'get_started' });
        onGetStarted?.();
    };

    return (
        <section
            ref={sectionRef}
            className="py-20 md:py-32 px-4"
            aria-labelledby="cta-title"
        >
            <div
                ref={contentRef}
                className="max-w-4xl mx-auto text-center"
            >
                {/* Main CTA Card */}
                <div className="glass rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
                    {/* Background gradient accents */}
                    <div
                        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20"
                        style={{ background: 'var(--primary-500)' }}
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-15"
                        style={{ background: 'var(--secondary-500)' }}
                        aria-hidden="true"
                    />

                    <div className="relative z-10">
                        {/* Headline */}
                        <h2
                            id="cta-title"
                            className="title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--hi)]"
                        >
                            Ready to Transform<br className="hidden sm:block" /> Justice Delivery?
                        </h2>

                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-[var(--mid)] mb-8 max-w-2xl mx-auto">
                            Built for India. Designed for tomorrow.
                        </p>

                        {/* Supporting text */}
                        <p className="text-[var(--low)] mb-10 max-w-xl mx-auto leading-relaxed">
                            Join thousands of judicial officers, police personnel, and citizens
                            who are already experiencing faster, more accessible justice.
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={handleGetStarted}
                            className="btn btn-primary px-10 py-4 text-lg font-semibold rounded-full inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 focus:ring-offset-[var(--bg0)] sheen"
                            aria-label="Get started with NyayaSahayak"
                            style={{ minWidth: '220px' }}
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </button>

                        {/* Trust indicators */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--faint)]">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--success-600)]" aria-hidden="true" />
                                Free to start
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--success-600)]" aria-hidden="true" />
                                22 languages supported
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--success-600)]" aria-hidden="true" />
                                Court-grade security
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-12 flex items-center justify-center gap-2 text-[var(--faint)]">
                    <span>Made with</span>
                    <Heart className="w-4 h-4 text-[var(--danger-600)] fill-current" aria-hidden="true" />
                    <span>for Bharat</span>
                    <span className="text-lg" role="img" aria-label="Indian flag">🇮🇳</span>
                </div>
            </div>
        </section>
    );
};

export default AboutCTA;
