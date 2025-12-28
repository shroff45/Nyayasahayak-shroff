// src/shared/components/accessibility/SkipLink.tsx
// NyayaSahayak - Accessibility Skip Link for Keyboard Users
// Per WCAG 2.1 AA Compliance

import React from 'react';

interface SkipLinkProps {
    targetId: string;
    label?: string;
}

/**
 * Skip Link for keyboard users to bypass navigation
 * Visible only on focus - WCAG 2.1 AA compliant
 */
const SkipLink: React.FC<SkipLinkProps> = ({
    targetId,
    label = 'Skip to main content'
}) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className="
                sr-only focus:not-sr-only
                focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
                focus:px-4 focus:py-2 focus:rounded-xl
                focus:bg-slate-900 focus:text-white focus:font-bold
                focus:border focus:border-emerald-500
                focus:shadow-lg focus:shadow-emerald-500/30
                focus:outline-none focus:ring-2 focus:ring-emerald-400
                transition-all
            "
        >
            {label}
        </a>
    );
};

export default SkipLink;
