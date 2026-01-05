import React, { useState, useEffect } from 'react';
import { Plus, Clock, Users, CheckCircle, XCircle, AlertCircle, Monitor, Shield, Activity } from 'lucide-react';

interface Session {
    id: string;
    code: string;
    date: string;
    duration: string;
    maxViewers: number;
    status: 'active' | 'ended' | 'expired';
}

interface DashboardProps {
    sessionId: string;
    isSharing: boolean;
    viewerCount: number;
    logs: string[];
    onStartShare: () => void;
    onStopShare: () => void;
    onJoinClick: () => void;
    publicIP?: string;
    onHomeClick: () => void;
}

export default function Dashboard({
    sessionId,
    isSharing,
    viewerCount,
    logs,
    onStartShare,
    onStopShare,
    onJoinClick,
    publicIP = 'Fetching...',
    onHomeClick
}: DashboardProps) {
    const [performanceData, setPerformanceData] = useState<{ x: number; y: number }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPerformanceData(prev => {
                const newData = [...prev, { x: prev.length, y: 10 + Math.random() * 20 }];
                return newData.slice(-10); // Keep last 10 points
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const renderChart = () => {
        const width = 200;
        const height = 40;
        if (performanceData.length < 2) return null;

        const points = performanceData.map((d, i) =>
            `${(i / (performanceData.length - 1)) * width},${height - (d.y / 40) * height}`
        ).join(' ');

        return (
            <svg width={width} height={height} className="overflow-visible">
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
            </svg>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col relative overflow-hidden font-sans">
            {/* Mesh background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(67,56,202,0.1),_transparent)]"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]"></div>

            {/* Top bar */}
            <div className="relative z-10 bg-black/40 backdrop-blur-2xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
                    <div onClick={onHomeClick} className="cursor-pointer group flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300">
                            <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">RemoteX <span className="text-indigo-500 font-mono text-[10px] ml-1">TERMINAL.NET</span></h1>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Network Node</span>
                            <span className="text-xs font-mono text-indigo-400">{publicIP}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <button
                            onClick={onJoinClick}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 group"
                        >
                            <Users className="w-5 h-5 group-hover:text-indigo-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="relative z-10 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
                {/* Left Side: Performance & System */}
                <div className="space-y-8 flex flex-col">
                    {/* System Health Quadrant */}
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Environment Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'CPU LOAD', value: '12%', color: 'text-indigo-400' },
                                { label: 'MEM USAGE', value: '2.4GB', color: 'text-purple-400' },
                                { label: 'LATENCY', value: '42ms', color: 'text-green-400' },
                                { label: 'UPTIME', value: '04:12', color: 'text-blue-400' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-slate-600 mb-1">{stat.label}</p>
                                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AETHER FEED</span>
                                <span className="text-[9px] font-mono text-indigo-500 animate-pulse">LIVE</span>
                            </div>
                            <div className="h-20 flex flex-col justify-end">
                                {renderChart()}
                            </div>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] p-6 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Defense Shield</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">
                            Quantum-safe keys active. Peer verification required for every packet.
                        </p>
                    </div>
                </div>

                {/* Center: Main Control */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl flex-1 flex flex-col justify-center relative group overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(400px_at_50%_50%,_rgba(99,102,241,0.05),_transparent)]"></div>

                        {!isSharing ? (
                            <div className="text-center relative z-10 py-20">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                                    <Plus className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Initialize Uplink</h2>
                                <p className="text-slate-500 mb-12 max-w-sm mx-auto font-medium text-sm">Securely tunnel your local display through the RemoteX encrypted mesh.</p>
                                <button
                                    onClick={onStartShare}
                                    className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-black text-xs tracking-[0.3em] transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 flex items-center gap-3 mx-auto border border-white/10"
                                >
                                    OPEN AETHER PORT
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mb-6 text-center">ACTIVE SESSION TOKEN</p>
                                <div className="flex flex-col items-center gap-8">
                                    <div className="bg-black/60 rounded-[3rem] py-10 px-16 border border-indigo-500/30 relative group shadow-2xl">
                                        <div className="absolute inset-0 bg-indigo-500/5 blur-2xl group-hover:blur-3xl transition-all"></div>
                                        <code className="text-7xl font-mono font-black text-white tracking-[0.2em] relative z-10">{sessionId}</code>
                                    </div>

                                    <div className="flex gap-6 w-full">
                                        <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Viewers</span>
                                                <Users className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <p className="text-4xl font-black text-white">{viewerCount}</p>
                                        </div>
                                        <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frame Rate</span>
                                                <Monitor className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <p className="text-4xl font-black text-white">120<span className="text-sm font-bold text-slate-600 ml-1">FPS</span></p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onStopShare}
                                        className="mt-8 px-10 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all flex items-center gap-2 group"
                                    >
                                        <XCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        TERMINATE TRANSMISSION
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Logs */}
                <div className="flex flex-col h-full lg:h-auto">
                    <div className="bg-[#0a0f1e]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col flex-1 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Console.Log</h3>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[10px] pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="text-slate-500 animate-slide-in flex gap-3 group">
                                    <span className="text-indigo-900 group-hover:text-indigo-500 transition-colors">[{i.toString().padStart(3, '0')}]</span>
                                    <span className="text-slate-400 flex-1">{log}</span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                                    <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">IDLE_STATE</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out backwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
            `}</style>
        </div>
    );
}
