import React, { useState } from 'react';
import { Monitor, Settings, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface JoinSessionScreenProps {
    inputSessionId: string;
    onSessionIdChange: (value: string) => void;
    onConnect: () => void;
    onBack: () => void;
    serverUrl: string;
    onServerUrlChange: (value: string) => void;
    socketConnected: boolean;
    socketError?: string | null;
}

export default function JoinSessionScreen({
    inputSessionId,
    onSessionIdChange,
    onConnect,
    onBack,
    serverUrl,
    onServerUrlChange,
    socketConnected,
    socketError = null
}: JoinSessionScreenProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
            {/* World Map Overlay */}
            <div className="world-map-overlay bg-world-map"></div>

            {/* Ultra-premium mesh background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(67,56,202,0.1),_rgba(2,6,23,0.7))]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <button
                onClick={onBack}
                className="absolute top-6 left-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white backdrop-blur-xl z-10"
            >
                ← Back
            </button>

            {/* Centered card */}
            <div className="relative z-10 max-w-md w-full mx-6 animate-fade-in">
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/10 group hover:border-indigo-500/20 transition-all duration-500">
                    {/* Icon + Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-indigo-500/50 animate-float">
                            <Monitor className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">Join Session</h2>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : socketError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                            <p className="text-indigo-200 text-sm">
                                {socketConnected ? 'Signaling Server Connected' :
                                    socketError ? `Error: ${socketError}` : 'Connecting to Signaling Server...'}
                            </p>
                        </div>
                        {socketError && (
                            <div className="mt-4 p-5 bg-slate-950/60 border border-amber-500/30 rounded-3xl animate-shake">
                                <p className="text-xs text-amber-400 font-black mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <AlertCircle className="w-4 h-4" />
                                    Choose Connection Path
                                </p>

                                <div className="space-y-4">
                                    {/* Path A: Same WiFi */}
                                    <div className="bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
                                        <p className="text-[10px] font-black text-green-400 uppercase mb-1">Method A: Same WiFi (LAN)</p>
                                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                                            Enter the <b>192.168.x.x</b> address shown on the host laptop.
                                        </p>
                                        <button
                                            onClick={() => setShowAdvanced(true)}
                                            className="w-full text-[9px] bg-green-500/10 hover:bg-green-500/20 text-green-400 py-1.5 rounded-lg border border-green-500/20 transition-all font-bold uppercase"
                                        >
                                            Enter LAN IP
                                        </button>
                                    </div>

                                    {/* Method B: Tunnel */}
                                    <div className="bg-purple-500/5 p-3 rounded-2xl border border-purple-500/10">
                                        <p className="text-[10px] font-black text-purple-400 uppercase mb-1">Method B: Different Network (Tunnel)</p>
                                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                                            Run <code className="text-purple-300">npx localtunnel --port 3001</code> on host laptop and use that URL.
                                        </p>
                                        <button
                                            onClick={() => setShowAdvanced(true)}
                                            className="w-full text-[9px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-1.5 rounded-lg border border-purple-500/20 transition-all font-bold uppercase"
                                        >
                                            Enter Tunnel URL
                                        </button>
                                    </div>

                                    {/* Path C: Direct ISP (No Tunnel) */}
                                    <div className="bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10">
                                        <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Method C: Direct ISP (Public IP)</p>
                                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                                            For direct WAN connection, your router <b>MUST</b> forward <b>Port 3001</b> to this laptop.
                                        </p>
                                        <button
                                            onClick={() => setShowAdvanced(true)}
                                            className="w-full text-[9px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-1.5 rounded-lg border border-orange-500/20 transition-all font-bold uppercase"
                                        >
                                            Enter Public IP
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest pl-1 transition-colors"
                        >
                            <Settings className="w-3 h-3" />
                            Advanced Settings
                            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>

                    {/* Signaling Server Input (Collapsible) */}
                    {showAdvanced && (
                        <div className="mb-5 p-4 bg-slate-950/40 rounded-2xl border border-indigo-500/10 animate-fade-in">
                            <label className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-widest pl-1">
                                Signaling Server URL
                            </label>
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => onServerUrlChange(e.target.value)}
                                placeholder="http://192.168.1.XX:3001"
                                className="w-full px-4 py-2 bg-transparent border-none rounded-lg text-sm font-mono text-indigo-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                            />
                            {serverUrl.includes('127.0.0.1') && (
                                <p className="mt-2 text-[10px] text-amber-500/80 italic pl-1 leading-tight">
                                    ⚠️ 127.0.0.1 is for local testing. Use the host's LAN IP (e.g. 192.168.x.x) if connecting from another laptop on the same WiFi.
                                </p>
                            )}
                            {serverUrl !== '' && !serverUrl.includes('127.0.0.1') && !serverUrl.includes('192.168') && !serverUrl.includes('localhost') && (
                                <p className="mt-2 text-[10px] text-indigo-400 italic pl-1 leading-tight">
                                    🌐 Connecting via Internet? Ensure Port 3001 is forwarded on the host's router, or use an <code className="text-purple-400">npx localtunnel</code> URL.
                                </p>
                            )}
                        </div>
                    )}

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


                    {/* Connect Button */}
                    <button
                        onClick={onConnect}
                        disabled={inputSessionId.length < 6 || !socketConnected}
                        className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 rounded-2xl transition-all duration-500 font-black text-white text-xl shadow-xl shadow-indigo-500/20 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 transform disabled:transform-none relative overflow-hidden group tracking-wider"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">
                            {!socketConnected ? "Waiting for Server..." : "Connect to Session"}
                        </span>
                    </button>

                    {/* Help Link & Quick Fixes */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => onServerUrlChange('http://127.0.0.1:3001')}
                                className="text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                            >
                                Try Localhost
                            </button>
                            <span className="text-slate-700">|</span>
                            <a href="#" className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
                                Need help?
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
