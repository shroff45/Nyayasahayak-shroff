import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronDown } from 'lucide-react';
import About3DScene from './About3DScene';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../../services/analytics';

interface AboutHeroProps {
    t: (key: string) => string;
    onExploreClick?: () => void;
}

/**
 * AboutHero - The opening section establishing the CHAOS narrative
 * 
 * Killer line: "5 crore cases pending. Every delay is justice denied."
 */
const AboutHero: React.FC<AboutHeroProps> = ({ t, onExploreClick }) => {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const taglineRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || !heroRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            tl.fromTo(titleRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8 }
            )
                .fromTo(subtitleRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6 },
                    '-=0.4'
                )
                .fromTo(taglineRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6 },
                    '-=0.3'
                )
                .fromTo(ctaRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5 },
                    '-=0.2'
                )
                .fromTo(scrollRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.5 },
                    '-=0.1'
                );
        }, heroRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    const handleExploreClick = () => {
        trackAboutEvent({ type: 'cta_click', button: 'explore_features' });
        onExploreClick?.();
    };

    const handleSignInClick = () => {
        trackAboutEvent({ type: 'cta_click', button: 'sign_in' });
        // Could trigger sign in modal or navigate
    };

    return (
        <section
            ref={heroRef}
            className="min-h-[90vh] flex flex-col items-center justify-center relative px-4 py-12"
            aria-labelledby="hero-title"
        >
            {/* 3D Scene / Fallback */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 -z-10">
                <About3DScene />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass-quiet text-sm text-[var(--mid)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-500)] animate-pulse" aria-hidden="true" />
                    <span>AI-Powered Judicial Platform</span>
                </div>

                {/* Title */}
                <h1
                    id="hero-title"
                    ref={titleRef}
                    className="title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 gradient-text"
                >
                    {t('header_title') || 'NyayaSahayak'}
                </h1>

                {/* Subtitle */}
                <p
                    ref={subtitleRef}
                    className="text-xl sm:text-2xl md:text-3xl text-[var(--mid)] font-medium mb-6"
                >
                    AI-Powered Justice for Bharat
                </p>

                {/* Tagline - The CHAOS hook */}
                <p
                    ref={taglineRef}
                    className="text-base sm:text-lg md:text-xl text-[var(--low)] max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    <strong className="text-[var(--hi)]">5 crore cases pending.</strong>{' '}
                    Every delay is justice denied. NyayaSahayak brings AI-assisted triage,
                    translation in <strong className="text-[var(--primary-500)]">22 Indian languages</strong>,
                    and intelligent drafting to accelerate the delivery of justice.
                </p>

                {/* CTAs */}
                <div
                    ref={ctaRef}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={handleExploreClick}
                        className="btn btn-primary px-8 py-3 text-base font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 focus:ring-offset-[var(--bg0)]"
                        aria-label="Explore features of NyayaSahayak"
                    >
                        Explore Features
                        <ChevronDown className="w-4 h-4 ml-1" aria-hidden="true" />
                    </button>

                    <button
                        onClick={handleSignInClick}
                        className="btn px-8 py-3 text-base font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--stroke)] focus:ring-offset-2 focus:ring-offset-[var(--bg0)]"
                        aria-label="Sign in to NyayaSahayak"
                    >
                        Sign In
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            </div>

            {/* Scroll indicator */}
            <div
                ref={scrollRef}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--faint)]"
                aria-hidden="true"
            >
                <span className="text-xs uppercase tracking-widest">Scroll to discover</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
        </section>
    );
};

export default AboutHero;
