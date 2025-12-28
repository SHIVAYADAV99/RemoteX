import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function NeonButton({
    children,
    onClick,
    icon: Icon,
    variant = 'primary',
    disabled = false,
    className = '',
    size = 'md'
}: NeonButtonProps) {
    const variants = {
        primary: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30',
        secondary: 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/30',
        danger: 'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-500/30',
        success: 'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-green-500/30'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        bg-gradient-to-r ${variants[variant]}
        ${sizes[size]}
        rounded-2xl font-bold text-white
        transition-all duration-300 transform
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        shadow-lg flex items-center gap-2 justify-center
        ${className}
      `}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
}
