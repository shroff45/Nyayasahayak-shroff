import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Languages, Building2, Users, TrendingUp } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface AboutStatsProps {
    t: (key: string) => string;
}

interface Stat {
    id: string;
    icon: React.ReactNode;
    value: number;
    suffix: string;
    label: string;
    color: string;
}

/**
 * AboutStats - The TRUST section with animated counters
 * 
 * Killer line: "Numbers that speak louder than promises."
 * 
 * Note: These statistics are simulated for design purposes.
 * Wire to actual data source in production.
 */
const AboutStats: React.FC<AboutStatsProps> = ({ t: _t }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const [hasAnimated, setHasAnimated] = useState(false);

    const stats: Stat[] = [
        {
            id: 'cases',
            icon: <TrendingUp className="w-6 h-6" aria-hidden="true" />,
            value: 5000000,
            suffix: '+',
            label: 'Cases Analyzed',
            color: 'var(--primary-500)'
        },
        {
            id: 'languages',
            icon: <Languages className="w-6 h-6" aria-hidden="true" />,
            value: 22,
            suffix: '',
            label: 'Indian Languages',
            color: 'var(--secondary-500)'
        },
        {
            id: 'courts',
            icon: <Building2 className="w-6 h-6" aria-hidden="true" />,
            value: 2500,
            suffix: '+',
            label: 'Courts Connected',
            color: 'var(--accent-500)'
        },
        {
            id: 'satisfaction',
            icon: <Users className="w-6 h-6" aria-hidden="true" />,
            value: 98,
            suffix: '%',
            label: 'User Satisfaction',
            color: 'var(--success-600)'
        }
    ];

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top 75%',
                once: true,
                onEnter: () => setHasAnimated(true)
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    // Format large numbers in Indian style (lakhs/crores)
    const formatIndianNumber = (num: number): string => {
        if (num >= 10000000) {
            return (num / 10000000).toFixed(0) + ' Cr';
        } else if (num >= 100000) {
            return (num / 100000).toFixed(0) + ' L';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toString();
    };

    return (
        <section
            ref={sectionRef}
            className="py-20 md:py-32 px-4 relative overflow-hidden"
            aria-labelledby="stats-title"
        >
            {/* Background gradient accent */}
            <div
                className="absolute inset-0 -z-10 opacity-30"
                style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, var(--primary-500) 0%, transparent 70%)'
                }}
                aria-hidden="true"
            />

            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="chip mb-4 inline-flex">Our Impact</span>
                    <h2
                        id="stats-title"
                        className="title text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--hi)]"
                    >
                        Numbers That Speak
                    </h2>
                    <p className="text-lg text-[var(--mid)] max-w-2xl mx-auto">
                        Proven at scale across India's judicial ecosystem —
                        from High Courts to district benches, in every language that matters.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={stat.id}
                            stat={stat}
                            hasAnimated={hasAnimated}
                            prefersReducedMotion={prefersReducedMotion}
                            formatNumber={stat.id === 'cases' ? formatIndianNumber : undefined}
                            delay={index * 0.1}
                        />
                    ))}
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-[var(--faint)] mt-8 max-w-md mx-auto">
                    Statistics shown are illustrative. Actual metrics vary by deployment.
                </p>
            </div>
        </section>
    );
};

interface StatCardProps {
    stat: Stat;
    hasAnimated: boolean;
    prefersReducedMotion: boolean;
    formatNumber?: (num: number) => string;
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({
    stat,
    hasAnimated,
    prefersReducedMotion,
    formatNumber,
    delay
}) => {
    const countRef = useRef<HTMLSpanElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasAnimated || !countRef.current || !cardRef.current) return;

        if (prefersReducedMotion) {
            // No animation — show final value immediately
            if (countRef.current) {
                countRef.current.textContent = formatNumber
                    ? formatNumber(stat.value)
                    : stat.value.toString();
            }
            return;
        }

        const ctx = gsap.context(() => {
            // Card fade in
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power3.out' }
            );

            // Counter animation
            const obj = { value: 0 };
            gsap.to(obj, {
                value: stat.value,
                duration: 2,
                delay: delay + 0.3,
                ease: 'power2.out',
                onUpdate: () => {
                    if (countRef.current) {
                        const displayValue = Math.round(obj.value);
                        countRef.current.textContent = formatNumber
                            ? formatNumber(displayValue)
                            : displayValue.toLocaleString('en-IN');
                    }
                }
            });
        }, cardRef);

        return () => ctx.revert();
    }, [hasAnimated, prefersReducedMotion, stat.value, formatNumber, delay]);

    const displayValue = formatNumber ? formatNumber(stat.value) : stat.value.toLocaleString('en-IN');

    return (
        <div
            ref={cardRef}
            className="glass rounded-2xl p-6 text-center"
            style={{ opacity: prefersReducedMotion ? 1 : 0 }}
        >
            {/* Icon */}
            <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{
                    backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
                    color: stat.color
                }}
            >
                {stat.icon}
            </div>

            {/* Value */}
            <div
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 mono"
                style={{ color: stat.color }}
                aria-live="polite"
            >
                <span ref={countRef}>
                    {prefersReducedMotion || hasAnimated ? displayValue : '0'}
                </span>
                <span>{stat.suffix}</span>
            </div>

            {/* Label */}
            <p className="text-sm text-[var(--mid)]">{stat.label}</p>
        </div>
    );
};

export default AboutStats;
