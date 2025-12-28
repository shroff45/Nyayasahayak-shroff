import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Scale, Shield, User, ChevronRight } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { trackAboutEvent } from '../../../../services/analytics';

gsap.registerPlugin(ScrollTrigger);

interface AboutRolesProps {
    t: (key: string) => string;
    onRoleClick?: (role: 'judge' | 'police' | 'citizen') => void;
}

interface Role {
    id: 'judge' | 'police' | 'citizen';
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    features: string[];
    gradient: string;
    accentColor: string;
}

/**
 * AboutRoles - The TRUST section showing purpose-built portals
 * 
 * Killer line: "Whether you serve the court, enforce the law, or seek justice — we built this for you."
 */
const AboutRoles: React.FC<AboutRolesProps> = ({ t: _t, onRoleClick }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const [activeRole, setActiveRole] = useState<string | null>(null);

    const roles: Role[] = [
        {
            id: 'judge',
            icon: <Scale className="w-10 h-10" aria-hidden="true" />,
            title: 'For Judges',
            subtitle: 'Decide with clarity',
            features: [
                'AI-Assisted Draft Judgments',
                'Adjournment Risk Analysis',
                'Vipaksh Adversarial Audit',
                'Judicial Wellness Tracking'
            ],
            gradient: 'from-[var(--primary-700)] to-[var(--primary-500)]',
            accentColor: 'var(--primary-500)'
        },
        {
            id: 'police',
            icon: <Shield className="w-10 h-10" aria-hidden="true" />,
            title: 'For Police',
            subtitle: 'Enforce with precision',
            features: [
                'Intelligent FIR Filing',
                'BNS Section Navigator',
                'Automated Summons Generation',
                'Evidence Chain Tracking'
            ],
            gradient: 'from-[var(--secondary-700)] to-[var(--secondary-500)]',
            accentColor: 'var(--secondary-500)'
        },
        {
            id: 'citizen',
            icon: <User className="w-10 h-10" aria-hidden="true" />,
            title: 'For Citizens',
            subtitle: 'Access justice easily',
            features: [
                'Voice-Based Case Filing',
                'NyayaPath Step-by-Step Guidance',
                'Real-Time Case Tracking',
                'Visual Legal Explainers'
            ],
            gradient: 'from-[var(--accent-500)] to-[var(--accent-400)]',
            accentColor: 'var(--accent-500)'
        }
    ];

    useEffect(() => {
        if (prefersReducedMotion || !sectionRef.current || !cardsRef.current) return;

        const cards = cardsRef.current.querySelectorAll('.role-card');

        const ctx = gsap.context(() => {
            gsap.fromTo(cards,
                { opacity: 0, y: 50, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.7,
                    stagger: 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                        once: true
                    }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    const handleRoleClick = (roleId: 'judge' | 'police' | 'citizen') => {
        trackAboutEvent({ type: 'role_tab_switch', role: roleId });
        onRoleClick?.(roleId);
    };

    return (
        <section
            ref={sectionRef}
            className="py-20 md:py-32 px-4"
            aria-labelledby="roles-title"
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="chip mb-4 inline-flex">Built For Everyone</span>
                    <h2
                        id="roles-title"
                        className="title text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--hi)]"
                    >
                        Purpose-Built Portals
                    </h2>
                    <p className="text-lg text-[var(--mid)] max-w-3xl mx-auto">
                        Whether you serve the court, enforce the law, or seek justice —
                        we built this for you. Each portal tailored to your workflow,
                        available in <strong className="text-[var(--hi)]">22 Indian languages</strong>.
                    </p>
                </div>

                {/* Role Cards */}
                <div
                    ref={cardsRef}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                >
                    {roles.map((role) => (
                        <article
                            key={role.id}
                            className={`role-card glass rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer group
                                ${activeRole === role.id ? 'ring-2 ring-offset-2' : ''}
                                hover:translate-y-[-8px] hover:shadow-[var(--shadow-xl)]
                                focus-within:ring-2 focus-within:ring-offset-2`}
                            style={{
                                '--ring-color': role.accentColor,
                                '--tw-ring-color': role.accentColor,
                                '--tw-ring-offset-color': 'var(--bg0)'
                            } as React.CSSProperties}
                            tabIndex={0}
                            role="button"
                            aria-label={`${role.title}: ${role.features.join(', ')}`}
                            onClick={() => handleRoleClick(role.id)}
                            onMouseEnter={() => setActiveRole(role.id)}
                            onMouseLeave={() => setActiveRole(null)}
                            onFocus={() => setActiveRole(role.id)}
                            onBlur={() => setActiveRole(null)}
                        >
                            {/* Gradient Header */}
                            <div className={`bg-gradient-to-br ${role.gradient} p-6 pb-8`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                        {role.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{role.title}</h3>
                                        <p className="text-white/80 text-sm">{role.subtitle}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Features List */}
                            <div className="p-6 -mt-4">
                                <div className="bg-[var(--bg0)] rounded-2xl p-4 shadow-[var(--shadow-md)]">
                                    <ul className="space-y-3">
                                        {role.features.map((feature, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center gap-3 text-[var(--mid)]"
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: role.accentColor }}
                                                    aria-hidden="true"
                                                />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Explore Link */}
                                    <div
                                        className="mt-4 pt-4 border-t border-[var(--stroke)] flex items-center justify-between text-sm font-medium group-hover:text-[var(--primary-500)] transition-colors"
                                        style={{ color: role.accentColor }}
                                    >
                                        <span>Explore Dashboard</span>
                                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutRoles;
