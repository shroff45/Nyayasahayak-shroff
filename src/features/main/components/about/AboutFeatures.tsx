import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    BarChart3,
    FileText,
    MessageSquare,
    GitBranch,
    Clock,
    ShieldCheck
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../../services/analytics';

gsap.registerPlugin(ScrollTrigger);

interface AboutFeaturesProps {
    t: (key: string) => string;
}

interface Feature {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

/**
 * AboutFeatures - The CLARITY section showcasing capabilities
 * 
 * Killer line: "From overwhelming to understandable — in seconds."
 */
const AboutFeatures: React.FC<AboutFeaturesProps> = ({ t }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const features: Feature[] = [
        {
            id: 'triage',
            icon: <BarChart3 className="w-8 h-8" aria-hidden="true" />,
            title: 'AI Case Triage',
            description: 'Automatically prioritize cases based on urgency, complexity, and legal precedent. What took hours now takes seconds.'
        },
        {
            id: 'document',
            icon: <FileText className="w-8 h-8" aria-hidden="true" />,
            title: 'Document Analysis',
            description: 'Extract insights from any document in 22 Indian languages. OCR, translation, and legal summarization in one flow.'
        },
        {
            id: 'nyayabot',
            icon: <MessageSquare className="w-8 h-8" aria-hidden="true" />,
            title: 'NYAYABOT Assistant',
            description: 'Your 24/7 legal research assistant with grounded, cited responses. Ask in Hindi, get answers in Hindi.'
        },
        {
            id: 'mapping',
            icon: <GitBranch className="w-8 h-8" aria-hidden="true" />,
            title: 'Case Mapping',
            description: 'Visualize relationships between cases, parties, and precedents. See the forest and the trees.'
        },
        {
            id: 'timeline',
            icon: <Clock className="w-8 h-8" aria-hidden="true" />,
            title: 'Justice Timeline',
            description: 'Track case progress against national benchmarks. Identify delays before they become backlogs.'
        },
        {
            id: 'quantum',
            icon: <ShieldCheck className="w-8 h-8" aria-hidden="true" />,
            title: 'Document Verification',
            description: 'Blockchain-verified document authenticity. Every filing, every order — cryptographically secured.'
        }
    ];

    useEffect(() => {
        if (prefersReducedMotion || !sectionRef.current || !cardsRef.current) return;

        const cards = cardsRef.current.querySelectorAll('.feature-card');

        const ctx = gsap.context(() => {
            gsap.fromTo(cards,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
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
            className="py-20 md:py-32 px-4"
            aria-labelledby="features-title"
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="chip mb-4 inline-flex">What We Offer</span>
                    <h2
                        id="features-title"
                        className="title text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--hi)]"
                    >
                        From Overwhelming to Understandable
                    </h2>
                    <p className="text-lg text-[var(--mid)] max-w-2xl mx-auto">
                        AI-assisted triage, translation, and drafting — designed for India's judicial system,
                        accessible in all 22 scheduled languages.
                    </p>
                </div>

                {/* Feature Cards Grid */}
                <div
                    ref={cardsRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature) => (
                        <article
                            key={feature.id}
                            className="feature-card glass-quiet rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[var(--shadow-lg)] focus-within:ring-2 focus-within:ring-[var(--primary-500)] cursor-pointer"
                            tabIndex={0}
                            role="article"
                            aria-labelledby={`feature-${feature.id}-title`}
                            onMouseEnter={() => trackAboutEvent({ type: 'feature_card_hover', feature: feature.id })}
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary-500)]/20 to-[var(--secondary-500)]/10 flex items-center justify-center mb-4 text-[var(--primary-500)]">
                                {feature.icon}
                            </div>

                            {/* Title */}
                            <h3
                                id={`feature-${feature.id}-title`}
                                className="text-xl font-semibold text-[var(--hi)] mb-2"
                            >
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-[var(--low)] leading-relaxed">
                                {feature.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutFeatures;
