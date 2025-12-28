// src/shared/styles/designTokens.ts
// NyayaSahayak Design System - Centralized Design Tokens
// Ensures consistent styling across the entire citizen portal

export const colors = {
    // Primary brand colors (Justice theme)
    primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981', // Main emerald
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
    },

    // Dark theme backgrounds
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b', // Main card background
        900: '#0f172a', // Main page background
        950: '#020617',
    },

    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Accent colors for features
    accent: {
        justice: '#10b981',   // Emerald for justice
        welfare: '#06b6d4',   // Cyan for welfare
        safety: '#ef4444',    // Red for emergency
        ai: '#8b5cf6',        // Purple for AI features
    }
};

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
};

export const borderRadius = {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',
};

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: {
        emerald: '0 0 20px rgba(16, 185, 129, 0.3)',
        cyan: '0 0 20px rgba(6, 182, 212, 0.3)',
        amber: '0 0 20px rgba(245, 158, 11, 0.3)',
    }
};

export const typography = {
    fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        hindi: '"Noto Sans Devanagari", sans-serif',
    },
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    }
};

export const animation = {
    duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
    },
    easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
};

// Glassmorphism presets for dark theme
export const glass = {
    card: {
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(51, 65, 85, 0.5)',
    },
    panel: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51, 65, 85, 0.3)',
    }
};

// CSS class helpers
export const cssClasses = {
    card: 'bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl',
    panel: 'bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl',
    button: {
        primary: 'px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5',
        secondary: 'px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all',
        danger: 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all',
    },
    input: 'w-full p-4 rounded-xl bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-white placeholder-slate-500 transition-all',
};

export default {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    animation,
    glass,
    cssClasses,
};
