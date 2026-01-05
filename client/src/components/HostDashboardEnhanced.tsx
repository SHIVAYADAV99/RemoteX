import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Users, X, Volume2, VolumeX, UserX, Pause, ChevronRight, ChevronLeft, Monitor } from 'lucide-react';

interface Viewer {
    id: string;
    name: string;
    hasControl: boolean;
    isMuted: boolean;
}

interface HostDashboardEnhancedProps {
    isSharing: boolean;
    sessionId: string;
    viewerCount: number;
    videoRef: React.RefObject<HTMLVideoElement>;
    hostIPs?: string[];
    publicIP?: string;
    onStartShare: () => void;
    onStopShare: () => void;
    onBack: () => void;
}

export default function HostDashboardEnhanced({
    isSharing,
    sessionId,
    viewerCount,
    videoRef,
    hostIPs = [],
    publicIP = 'Fetching...',
    onStartShare,
    onStopShare,
    onBack
}: HostDashboardEnhancedProps) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    // Mock viewers
    const [viewers, setViewers] = useState<Viewer[]>([
        { id: '1', name: 'Viewer #1', hasControl: true, isMuted: false },
        { id: '2', name: 'Viewer #2', hasControl: false, isMuted: false },
    ]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const toggleViewerControl = (viewerId: string) => {
        setViewers(viewers.map(v =>
            v.id === viewerId ? { ...v, hasControl: !v.hasControl } : v
        ));
    };

    const toggleViewerMute = (viewerId: string) => {
        setViewers(viewers.map(v =>
            v.id === viewerId ? { ...v, isMuted: !v.isMuted } : v
        ));
    };

    const removeViewer = (viewerId: string) => {
        setViewers(viewers.filter(v => v.id !== viewerId));
    };

    if (!isSharing) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
                {/* World Map Overlay */}
                <div className="world-map-overlay bg-world-map"></div>

                {/* Ultra-premium mesh background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(67,56,202,0.1),_rgba(2,6,23,0.7))]"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>

                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 text-slate-300 hover:text-white backdrop-blur-xl z-10"
                >
                    ← Back
                </button>

                <button
                    onClick={onStartShare}
                    className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-24 hover:border-purple-500/30 transition-all duration-500 shadow-2xl hover:shadow-purple-500/20 hover:scale-105 transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-500"></div>
                    <div className="relative text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-indigo-500/40 group-hover:animate-glow-pulse">
                            <Monitor className="w-16 h-16 text-white" />
                        </div>
                        <h2 className="text-6xl font-black text-white mb-4 tracking-tighter uppercase transition-all group-hover:tracking-tight">Host Now</h2>
                        <p className="text-xl text-indigo-200 font-medium tracking-wide">Share your screen securely</p>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Full-screen dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95"></div>

            {/* Hidden video element for WebRTC */}
            <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

            {/* Floating glass toolbar */}
            <div className="absolute top-6 left-6 bg-slate-900/60 backdrop-blur-2xl border border-purple-500/30 rounded-2xl px-6 py-4 shadow-2xl z-20 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Viewers</p>
                        <p className="text-xl font-black text-white">{viewerCount}</p>
                    </div>
                </div>

                <div className="w-px h-10 bg-slate-700/50"></div>

                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`p-3 rounded-xl transition-all duration-200 ${isPaused ? 'bg-yellow-600/20 text-yellow-400' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                        }`}
                    title={isPaused ? 'Resume' : 'Pause Sharing'}
                >
                    <Pause className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300"
                    title="Toggle Sidebar"
                >
                    {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>

            {/* Collapsible sidebar - connected users */}
            {sidebarOpen && (
                <div className="absolute top-6 left-6 mt-24 w-80 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl z-20 animate-slide-in-left">
                    <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Connected Users</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {viewers.map((viewer) => (
                            <div key={viewer.id} className="bg-slate-950/50 rounded-xl p-4 border border-slate-700/30">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-semibold text-white">{viewer.name}</span>
                                    <button
                                        onClick={() => removeViewer(viewer.id)}
                                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors text-red-400"
                                        title="Remove Viewer"
                                    >
                                        <UserX className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleViewerControl(viewer.id)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${viewer.hasControl
                                            ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {viewer.hasControl ? 'Control ON' : 'Control OFF'}
                                    </button>
                                    <button
                                        onClick={() => toggleViewerMute(viewer.id)}
                                        className={`p-2 rounded-lg transition-all ${viewer.isMuted
                                            ? 'bg-red-600/20 text-red-400'
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                            }`}
                                        title={viewer.isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {viewer.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Centered session info */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
                <div className="max-w-2xl w-full animate-fade-in">
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-12 shadow-2xl shadow-indigo-500/10 group hover:border-indigo-500/20 transition-all duration-500 mb-8">
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

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Session Code</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-950/80 border border-slate-700/50 rounded-2xl px-6 py-5">
                                    <code className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-widest">
                                        {sessionId}
                                    </code>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(sessionId)}
                                    className={`px-6 py-5 rounded-2xl transition-all duration-300 flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 ${copiedCode ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white'
                                        }`}
                                >
                                    {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Local Network Address (Recommended for Same WiFi) */}
                        {hostIPs.length > 0 && (
                            <div className="mb-4 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between group">
                                <div>
                                    <label className="block text-[10px] font-black text-green-400 mb-1 uppercase tracking-[0.2em]">Local Network (Same WiFi)</label>
                                    <code className="text-sm font-mono text-white">http://{hostIPs[0]}:3001</code>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`http://${hostIPs[0]}:3001`)}
                                    className="text-xs text-green-400 hover:text-green-200 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                >
                                    COPY
                                </button>
                            </div>
                        )}

                        {/* Public Address (Real Remote) */}
                        {publicIP && publicIP !== 'Fetching...' && (
                            <div className="mb-6 p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Public Address (Remote)</label>
                                        <span className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 text-[8px] rounded uppercase font-bold border border-indigo-500/20">Needs Port Forward 3001</span>
                                    </div>
                                    <code className="text-sm font-mono text-white">http://{publicIP}:3001</code>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`http://${publicIP}:3001`)}
                                    className="text-xs text-indigo-400 hover:text-indigo-200 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                >
                                    COPY
                                </button>
                            </div>
                        )}

                        {/* Quick Tip for Tunnels */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">💡 Professional Tip</p>
                            <p className="text-xs text-slate-400">
                                Testing across different networks? Use <code className="text-purple-400">npx localtunnel --port 3001</code> for an instant public URL.
                            </p>
                        </div>

                        <p className="text-sm text-slate-500 mt-6 text-center">
                            Share this code with viewers to connect
                        </p>
                    </div>

                    <button
                        onClick={onStopShare}
                        className="w-full px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-bold shadow-lg shadow-red-500/30 hover:scale-105 transform"
                    >
                        <X className="w-6 h-6" />
                        Stop Sharing
                    </button>
                </div>
            </div>
        </div>
    );
}
