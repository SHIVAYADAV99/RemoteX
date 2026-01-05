import React from 'react';
import { Loader2, Monitor } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
    subMessage?: string;
    sessionId?: string;
}

export default function LoadingOverlay({
    message = "Establishing Secure Connection",
    subMessage = "Waiting for the remote stream to initialize...",
    sessionId
}: LoadingOverlayProps) {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="relative max-w-md w-full px-6 flex flex-col items-center text-center">

                {/* Visual Elements */}
                <div className="relative mb-12">
                    <div className="absolute -inset-8 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="relative bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                        <Monitor className="w-16 h-16 text-purple-500" />
                        <div className="absolute -top-1 -right-1">
                            <span className="flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500"></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight italic">
                    {message}
                </h2>
                <div className="flex items-center gap-2 text-slate-400 font-medium mb-8">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>{subMessage}</span>
                </div>

                {sessionId && (
                    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl w-full">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Target Session</p>
                        <p className="text-xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-widest uppercase">
                            {sessionId}
                        </p>
                    </div>
                )}

                {/* Progress Indicator */}
                <div className="mt-12 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 w-1/3 animate-loading-bar"></div>
                </div>
            </div>
        </div>
    );
}
