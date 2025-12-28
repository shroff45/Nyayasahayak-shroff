import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutHero from './about/AboutHero';
import AboutFeatures from './about/AboutFeatures';
import AboutStats from './about/AboutStats';
import AboutRoles from './about/AboutRoles';
import AboutTech from './about/AboutTech';
import AboutCTA from './about/AboutCTA';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../services/analytics';

gsap.registerPlugin(ScrollTrigger);

interface AboutProps {
    t: (key: string) => string;
}

/**
 * About - Premium landing page showcasing NyayaSahayak
 * 
 * Narrative Arc: Chaos → Clarity → Trust
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
const About: React.FC<AboutProps> = ({ t }) => {
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
            <AboutCTA t={t} />
        </div>
    );
};

export default About;
