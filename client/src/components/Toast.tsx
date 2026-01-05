import React, { useEffect, useState } from 'react';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        info: <Info className="w-5 h-5 text-blue-400" />,
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />
    };

    const colors = {
        info: 'border-blue-500/30 bg-blue-500/10',
        success: 'border-green-500/30 bg-green-500/10',
        error: 'border-red-500/30 bg-red-500/10'
    };

    return (
        <div className={`
            fixed top-10 left-1/2 -translate-x-1/2 z-[200]
            flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl
            transition-all duration-300
            ${colors[type]}
            ${isExiting ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-slide-in-top'}
        `}>
            {icons[type]}
            <p className="text-sm font-bold text-white whitespace-nowrap tracking-wide">{message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(onClose, 300);
                }}
                className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-slate-400" />
            </button>
        </div>
    );
}
