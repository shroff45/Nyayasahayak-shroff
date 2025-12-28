// src/shared/components/common/KeyboardHint.tsx  
// NyayaSahayak Keyboard Accessibility Hints
// Shows keyboard shortcuts for power users

import React from 'react';

interface KeyboardHintProps {
    keys: string[];
    description: string;
    className?: string;
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({ keys, description, className = '' }) => (
    <div className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}>
        <div className="flex gap-1">
            {keys.map((key, i) => (
                <React.Fragment key={key}>
                    <kbd className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-md font-mono text-slate-300 shadow-sm">
                        {key}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-slate-500">+</span>}
                </React.Fragment>
            ))}
        </div>
        <span className="text-slate-500">{description}</span>
    </div>
);

// Common keyboard shortcuts display
export const KeyboardShortcuts: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            ⌨️ Keyboard Shortcuts
        </h3>
        <div className="space-y-3">
            <KeyboardHint keys={['/']} description="Focus search" />
            <KeyboardHint keys={['Esc']} description="Close modal" />
            <KeyboardHint keys={['Ctrl', 'K']} description="Quick command" />
            <KeyboardHint keys={['Tab']} description="Navigate" />
            <KeyboardHint keys={['Enter']} description="Submit" />
        </div>
    </div>
);

export default KeyboardHint;
