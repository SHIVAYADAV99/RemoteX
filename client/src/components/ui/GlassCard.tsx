import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'dark' | 'light';
}

export default function GlassCard({ children, className = '', variant = 'default' }: GlassCardProps) {
    const variants = {
        default: 'bg-slate-800/40 border-slate-700/50',
        dark: 'bg-slate-900/60 border-slate-800/50',
        light: 'bg-slate-700/30 border-slate-600/40'
    };

    return (
        <div className={`backdrop-blur-xl border rounded-3xl shadow-2xl ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
}
