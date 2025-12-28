import React, { useState } from 'react';
import { Monitor } from 'lucide-react';

interface JoinSessionScreenProps {
    inputSessionId: string;
    inputPassword: string;
    onSessionIdChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onConnect: () => void;
    onBack: () => void;
}

export default function JoinSessionScreen({
    inputSessionId,
    inputPassword,
    onSessionIdChange,
    onPasswordChange,
    onConnect,
    onBack
}: JoinSessionScreenProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden flex items-center justify-center">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <button
                onClick={onBack}
                className="absolute top-6 left-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white backdrop-blur-xl z-10"
            >
                ← Back
            </button>

            {/* Centered card */}
            <div className="relative z-10 max-w-md w-full mx-6 animate-fade-in">
                <div className="bg-slate-900/60 backdrop-blur-2xl border-2 border-indigo-500/30 rounded-3xl p-10 shadow-2xl shadow-indigo-500/20">
                    {/* Icon + Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-indigo-500/50 animate-float">
                            <Monitor className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">Join Session</h2>
                        <p className="text-indigo-200">Enter credentials to connect</p>
                    </div>

                    {/* Session Code Input */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                            Session Code
                        </label>
                        <input
                            type="text"
                            value={inputSessionId}
                            onChange={(e) => onSessionIdChange(e.target.value.toUpperCase())}
                            placeholder="XXXXXXXX"
                            className="w-full px-6 py-4 bg-slate-950/80 border border-slate-700/50 rounded-xl text-center text-2xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase"
                            maxLength={8}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            type="password"
                            value={inputPassword}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-6 py-4 bg-slate-950/80 border border-slate-700/50 rounded-xl text-center text-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={onConnect}
                        disabled={inputSessionId.length < 6 || inputPassword.length < 4}
                        className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-2xl transition-all duration-300 font-black text-white text-xl shadow-2xl shadow-indigo-500/30 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 transform disabled:transform-none relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        <span className="relative">Connect to Session</span>
                    </button>

                    {/* Help Link */}
                    <div className="mt-6 text-center">
                        <a href="#" className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                            Need help? →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
