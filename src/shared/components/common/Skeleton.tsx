// src/shared/components/common/Skeleton.tsx
// NyayaSahayak Premium Skeleton Loaders
// Beautiful loading states for better perceived performance

import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    count = 1
}) => {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%]';

    const variantClasses = {
        text: 'h-4 rounded-lg',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
        card: 'rounded-2xl p-6 bg-slate-800/60 border border-slate-700',
    };

    const style = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '100px'),
    };

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    ));

    return <>{elements}</>;
};

// Pre-built skeleton patterns for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={12} />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
        </div>
    </div>
);

export const SkeletonChat: React.FC = () => (
    <div className="space-y-4 p-4">
        {/* Bot message */}
        <div className="flex gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 max-w-md space-y-2">
                <Skeleton variant="rectangular" height={60} className="rounded-2xl rounded-bl-none" />
            </div>
        </div>
        {/* User message */}
        <div className="flex gap-3 justify-end">
            <div className="max-w-md">
                <Skeleton variant="rectangular" height={40} className="rounded-2xl rounded-br-none bg-emerald-900/50" />
            </div>
        </div>
        {/* Bot message */}
        <div className="flex gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 max-w-md space-y-2">
                <Skeleton variant="rectangular" height={80} className="rounded-2xl rounded-bl-none" />
            </div>
        </div>
    </div>
);

export const SkeletonDashboard: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export default Skeleton;
