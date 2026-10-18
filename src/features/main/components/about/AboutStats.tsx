import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Languages, Hash, HardDrive, BookOpen } from 'lucide-react';
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
    /** How a reader checks the number. Required on purpose: an uncheckable one does not get in. */
    how: string;
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

    // Four numbers, all of them about this repository rather than about anyone's cases, and
    // each one carrying the command or file that proves it. The version this replaces showed
    // 5,000,000+ Cases Analyzed, 2,500+ Courts Connected and 98% User Satisfaction under a
    // comment admitting the statistics were "simulated for design purposes" - three counters
    // animating up to numbers nobody could check, next to a disclaimer saying exactly that.
    const stats: Stat[] = [
        {
            id: 'languages',
            icon: <Languages className="w-6 h-6" aria-hidden="true" />,
            value: 23,
            suffix: '',
            label: 'Interface languages, English fallback',
            how: 'grep -c "^export const .*Translations" src/features/main/constants/localization.ts - every table after the first is typed against English, so a key missing from one is a build failure, not a blank screen. The switcher that uses them is in the citizen layout; several admin routes are pinned to English by their wrapper, and this page is one of them.',
            color: 'var(--secondary-500)'
        },
        {
            id: 'requests',
            icon: <Hash className="w-6 h-6" aria-hidden="true" />,
            value: 0,
            suffix: '',
            label: 'Requests made by the integrity path',
            how: 'sha256.ts, merkle.ts, store.ts, ledger.ts and akhandLedger.ts contain no fetch, no XHR and no beacon. The digest, the journal and the certificate are produced in this tab, offline.',
            color: 'var(--primary-500)'
        },
        {
            id: 'maxbytes',
            icon: <HardDrive className="w-6 h-6" aria-hidden="true" />,
            value: 64,
            suffix: ' MB',
            label: 'Largest file the checker will read',
            how: 'MAX_INLINE_BYTES in src/core/trust/sha256.ts. A bigger file is refused outright - it is never sampled, hashed partially, or quietly skipped.',
            color: 'var(--accent-500)'
        },
        {
            id: 'claims',
            icon: <BookOpen className="w-6 h-6" aria-hidden="true" />,
            value: 27,
            suffix: '',
            label: 'Claims the repo checks about itself',
            how: 'node tools/ledger_repro.cjs - it mounts the real screens, reads the real ledger, and fails when a sentence in this app stops matching its code.',
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
                    <span className="chip mb-4 inline-flex">Local by design</span>
                    <h2
                        id="stats-title"
                        className="title text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--hi)]"
                    >
                        Four Numbers You Can Check
                    </h2>
                    <p className="text-lg text-[var(--mid)] max-w-2xl mx-auto">
                        There is no analytics pipe that could know how many cases this software has
                        touched, so nothing on this page pretends to. Each number below describes this
                        codebase, and the line under it says where to verify it.
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
                            delay={index * 0.1}
                        />
                    ))}
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-[var(--faint)] mt-8 max-w-md mx-auto">
                    If a future build puts a number on this page that nobody can check, the harness
                    in tools/ledger_repro.cjs is what fails - it renders this section.
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
            {/* The check, printed on the card: a number nobody can verify does not belong on this page. */}
            <p className="mt-3 text-xs leading-relaxed text-[var(--faint)] break-words">{stat.how}</p>
        </div>
    );
};

export default AboutStats;
