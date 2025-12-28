import React, { useState } from 'react';
import { Plus, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Session {
    id: string;
    code: string;
    date: string;
    duration: string;
    maxViewers: number;
    status: 'active' | 'ended' | 'expired';
}

interface DashboardProps {
    onNewSession: () => void;
    onHostClick: () => void;
    onJoinClick: () => void;
}

export default function Dashboard({ onNewSession, onHostClick, onJoinClick }: DashboardProps) {
    // Mock session history
    const [sessions] = useState<Session[]>([
        { id: '1', code: 'ABC123XY', date: '2025-12-26 14:30', duration: '45:23', maxViewers: 3, status: 'ended' },
        { id: '2', code: 'XYZ789AB', date: '2025-12-25 10:15', duration: '1:23:45', maxViewers: 5, status: 'ended' },
        { id: '3', code: 'DEF456CD', date: '2025-12-24 16:45', duration: '12:08', maxViewers: 1, status: 'expired' },
        { id: '4', code: 'GHI789EF', date: '2025-12-23 09:20', duration: '2:15:30', maxViewers: 2, status: 'ended' },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'ended': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'expired': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'ended': return <XCircle className="w-4 h-4" />;
            case 'expired': return <AlertCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Top bar */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">RemoteX Dashboard</h1>
                        <p className="text-sm text-slate-400">Manage your remote sessions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onJoinClick}
                            className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-white font-semibold"
                        >
                            Join Session
                        </button>
                        <button
                            onClick={onHostClick}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all duration-200 text-white font-bold shadow-lg shadow-purple-500/30 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Session grid */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Recent Sessions</h2>
                    <p className="text-slate-400">Your session history and analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 transform shadow-xl"
                        >
                            {/* Session Code */}
                            <div className="mb-4">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Session Code</p>
                                <code className="text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                    {session.code}
                                </code>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{session.date}</span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-950/50 rounded-xl p-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                                    <p className="text-lg font-bold text-white">{session.duration}</p>
                                </div>
                                <div className="bg-slate-950/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Max Viewers</p>
                                            <p className="text-lg font-bold text-white">{session.maxViewers}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(session.status)}`}>
                                {getStatusIcon(session.status)}
                                <span className="text-sm font-semibold capitalize">{session.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
