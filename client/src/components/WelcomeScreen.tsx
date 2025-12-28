import React from 'react';
import { Monitor, Share2, Zap, Lock, Gamepad2, Globe } from 'lucide-react';

interface WelcomeScreenProps {
    onHostClick: () => void;
    onClientClick: () => void;
}

export default function WelcomeScreen({ onHostClick, onClientClick }: WelcomeScreenProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden flex items-center justify-center">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-6xl w-full">
                {/* Logo + Tagline */}
                <div className="mb-16 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-2xl shadow-purple-500/50 mb-6 animate-float">
                        <Monitor className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-7xl font-black text-white mb-4 tracking-tight">
                        RemoteX
                    </h1>
                    <p className="text-2xl text-purple-200 font-light">
                        Next-gen remote desktop
                    </p>
                </div>

                {/* Two large glowing cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Host Session Card */}
                    <button
                        onClick={onHostClick}
                        className="group relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-12 hover:border-purple-400/60 transition-all duration-500 shadow-2xl hover:shadow-purple-500/40 hover:scale-105 transform"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all duration-500"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-purple-500/10 blur-xl"></div>
                        </div>
                        <div className="relative">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/50">
                                <Share2 className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-4xl font-black text-white mb-3">Host Session</h3>
                            <p className="text-purple-200 text-lg">Share your screen securely</p>
                        </div>
                    </button>

                    {/* Join Session Card */}
                    <button
                        onClick={onClientClick}
                        className="group relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-blue-800/20 backdrop-blur-xl border-2 border-indigo-500/30 rounded-3xl p-12 hover:border-indigo-400/60 transition-all duration-500 shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 transform"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-blue-600/0 group-hover:from-indigo-500/20 group-hover:to-blue-600/20 transition-all duration-500"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
                        </div>
                        <div className="relative">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/50">
                                <Monitor className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-4xl font-black text-white mb-3">Join Session</h3>
                            <p className="text-indigo-200 text-lg">Connect to remote desktop</p>
                        </div>
                    </button>
                </div>

                {/* Feature badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                        <Zap className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <p className="text-white font-semibold">Low Latency</p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                        <Lock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <p className="text-white font-semibold">Encrypted</p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                        <Gamepad2 className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <p className="text-white font-semibold">Remote Control</p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                        <Globe className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <p className="text-white font-semibold">Cross-Platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
