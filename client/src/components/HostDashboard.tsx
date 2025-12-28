import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Users, X } from 'lucide-react';

interface HostDashboardProps {
    isSharing: boolean;
    sessionId: string;
    sessionPassword: string;
    viewerCount: number;
    videoRef: React.RefObject<HTMLVideoElement>;
    onStartShare: () => void;
    onStopShare: () => void;
    onBack: () => void;
}

export default function HostDashboard({
    isSharing,
    sessionId,
    sessionPassword,
    viewerCount,
    videoRef,
    onStartShare,
    onStopShare,
    onBack
}: HostDashboardProps) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const copyToClipboard = (text: string, type: 'code' | 'password') => {
        navigator.clipboard.writeText(text);
        if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } else {
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    if (!isSharing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white backdrop-blur-xl"
                >
                    ← Back
                </button>
                <button
                    onClick={onStartShare}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-20 hover:border-purple-400/60 transition-all duration-500 shadow-2xl hover:shadow-purple-500/40 hover:scale-105"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all duration-500"></div>
                    <div className="relative text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/50 animate-pulse">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-5xl font-black text-white mb-4">Start Screen Share</h2>
                        <p className="text-xl text-purple-200">Click to begin hosting</p>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Full-screen dark overlay with preview thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95"></div>

            {/* Live preview thumbnail - top right */}
            <div className="absolute top-6 right-6 w-80 bg-black/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl z-10">
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
                    <p className="text-xs text-slate-400 font-semibold">Your Screen Preview</p>
                </div>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                />
            </div>

            {/* Centered session info */}
            <div className="relative z-20 flex items-center justify-center min-h-screen p-6">
                <div className="max-w-2xl w-full">
                    {/* Session Code Box */}
                    <div className="bg-slate-900/60 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl p-12 shadow-2xl shadow-purple-500/20 mb-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Session Active</h2>
                            <div className="flex items-center justify-center gap-2">
                                <div className="relative">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                </div>
                                <p className="text-green-400 font-semibold">
                                    {viewerCount === 0 ? 'Waiting for viewers...' : `${viewerCount} viewer${viewerCount !== 1 ? 's' : ''} connected`}
                                </p>
                            </div>
                        </div>

                        {/* Session Code */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Session Code</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-950/80 border border-slate-700/50 rounded-2xl px-6 py-5">
                                    <code className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-widest">
                                        {sessionId}
                                    </code>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(sessionId, 'code')}
                                    className={`px-6 py-5 rounded-2xl transition-all duration-300 flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 ${copiedCode
                                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white'
                                        }`}
                                >
                                    {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-950/80 border border-slate-700/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                                    <code className="text-2xl font-mono font-bold text-white tracking-wider">
                                        {showPassword ? sessionPassword : '••••••••'}
                                    </code>
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(sessionPassword, 'password')}
                                    className={`px-6 py-5 rounded-2xl transition-all duration-300 flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 ${copiedPassword
                                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                            : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white'
                                        }`}
                                >
                                    {copiedPassword ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 mt-6 text-center">
                            Share both the code and password with viewers to connect
                        </p>
                    </div>

                    {/* Stop Sharing Button */}
                    <button
                        onClick={onStopShare}
                        className="w-full px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-bold shadow-lg shadow-red-500/30 hover:scale-105 transform"
                    >
                        <X className="w-6 h-6" />
                        Stop Sharing
                    </button>
                </div>
            </div>

            {/* Viewer count badge - bottom left */}
            {viewerCount > 0 && (
                <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3 animate-slide-in-left">
                    <Users className="w-6 h-6 text-purple-400" />
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Active Viewers</p>
                        <p className="text-2xl font-black text-white">{viewerCount}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
