import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutHero from './about/AboutHero';
import AboutFeatures from './about/AboutFeatures';
import AboutStats from './about/AboutStats';
import AboutRoles from './about/AboutRoles';
import AboutTech from './about/AboutTech';
import AboutCTA from './about/AboutCTA';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../services/analytics';

gsap.registerPlugin(ScrollTrigger);

interface AboutProps {
    t: (key: string) => string;
    /**
     * Where "Get Started" goes. The page has to hand this over: the CTA used to call an
     * optional prop that nothing in the tree ever passed, so the button on the About page did
     * nothing but log an analytics event to the console.
     */
    onGetStarted?: () => void;
}

/**
 * About - Premium landing page showcasing NyayaSahayak
 * 
 * Narrative Arc: Chaos → Clarity → Trust
 *
 * Published at /about from src/App.tsx (the route is public on purpose: this page is the one place
 * the project states what it is, and it has to be readable before someone picks a role). Every
 * number and mechanism claim on it is checked by tools/ledger_repro.cjs group F, which renders this
 * component and fails if a retired phrase comes back.
 * 
 * - Hero: Establishes the problem (5 crore pending cases)
 * - Features: Shows the AI-powered solution
 * - Stats: Validates with impact metrics
 * - Roles: Personalizes for each stakeholder
 * - Tech: Builds credibility with tech stack
 * - CTA: Drives conversion
 * 
 * Accessibility:
 * - Full keyboard navigation
 * - ARIA labels on all interactive elements
 * - prefers-reduced-motion respected
 * - WCAG AA color contrast
 * 
 * Performance:
 * - WebGL fallback for older devices
 * - Reduced motion path for accessibility
 * - Progressive animation loading via ScrollTrigger
 */
const About: React.FC<AboutProps> = ({ t, onGetStarted }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const scrollDepthsTracked = useRef<Set<number>>(new Set());

    // Track scroll depth for analytics
    useEffect(() => {
        if (!containerRef.current) return;

        const handleScroll = () => {
            if (!containerRef.current) return;

            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

            const depths: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100];
            depths.forEach(depth => {
                if (scrollPercent >= depth && !scrollDepthsTracked.current.has(depth)) {
                    scrollDepthsTracked.current.add(depth);
                    trackAboutEvent({ type: 'scroll_depth', depth });
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Track page view
    useEffect(() => {
        trackAboutEvent({ type: 'page_view', section: 'about' });
    }, []);

    // Scroll to features section
    const handleExploreClick = () => {
        const featuresSection = document.getElementById('features-title');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
    };

    return (
        <div
            ref={containerRef}
            className="about-page min-h-screen"
        >
            {/* Reached from the persona sidebars but rendered outside them, so it needs its own way
                back - otherwise the page is a dead end with a browser button as its only exit. */}
            <header className="max-w-6xl mx-auto px-4 py-4">
                <Link to="/" className="text-sm text-[var(--mid)] hover:text-[var(--hi)] underline underline-offset-4">
                    Back to the role picker
                </Link>
            </header>
            {/* Hero Section - CHAOS */}
            <AboutHero
                t={t}
                onExploreClick={handleExploreClick}
            />

            {/* Features Section - CLARITY */}
            <AboutFeatures t={t} />

            {/* Stats Section - TRUST (Evidence) */}
            <AboutStats t={t} />

            {/* Roles Section - TRUST (Personalization) */}
            <AboutRoles t={t} />

            {/* Tech Section - TRUST (Credibility) */}
            <AboutTech t={t} />

            {/* CTA Section - RESOLUTION */}
            <AboutCTA t={t} onGetStarted={onGetStarted} />
        </div>
    );
};

export default About;
