import React, { useState } from 'react';
import { Monitor, Hand, MousePointer, Keyboard, Maximize2 } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import NeonButton from './ui/NeonButton';

interface ClientSessionProps {
    isConnected: boolean;
    sessionId: string;
    inputSessionId: string;
    remoteControl: boolean;
    mousePos: { x: number; y: number };
    logs: string[];
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onInputChange: (value: string) => void;
    onConnect: () => void;
    onToggleControl: () => void;
    onDisconnect: () => void;
    onCanvasClick: (e: React.MouseEvent) => void;
    onCanvasMouseMove: (e: React.MouseEvent) => void;
    onBack: () => void;
}

export default function ClientSession({
    isConnected,
    sessionId,
    inputSessionId,
    remoteControl,
    mousePos,
    logs,
    videoRef,
    canvasRef,
    onInputChange,
    onConnect,
    onToggleControl,
    onDisconnect,
    onCanvasClick,
    onCanvasMouseMove,
    onBack
}: ClientSessionProps) {
    const [showDock, setShowDock] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            {/* Top bar */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white"
                    >
                        <span>←</span>
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                            <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Remote Desktop</h1>
                            <p className="text-xs text-slate-400">
                                {isConnected ? `Connected to ${sessionId}` : 'Not Connected'}
                            </p>
                        </div>
                    </div>

                    <div className="w-24"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {!isConnected ? (
                    <div className="flex items-center justify-center min-h-[70vh]">
                        <GlassCard className="p-10 max-w-md w-full animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="inline-flex w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-purple-500/50 animate-float">
                                    <Monitor className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Join Session</h2>
                                <p className="text-slate-400">Enter the session ID to connect</p>
                            </div>

                            <input
                                type="text"
                                value={inputSessionId}
                                onChange={(e) => onInputChange(e.target.value.toUpperCase())}
                                placeholder="SESSION ID"
                                className="w-full px-6 py-4 bg-slate-900/80 border border-slate-700/50 rounded-xl text-center text-2xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all mb-4"
                                maxLength={8}
                            />

                            <NeonButton
                                onClick={onConnect}
                                disabled={inputSessionId.length < 6}
                                variant="secondary"
                                size="lg"
                                className="w-full"
                            >
                                Connect to Session
                            </NeonButton>
                        </GlassCard>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Connection status */}
                        <GlassCard variant="dark" className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                            <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-green-400 uppercase tracking-wider">Connected to</div>
                                            <code className="text-xl font-mono font-black text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{sessionId}</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <NeonButton
                                        onClick={onToggleControl}
                                        variant={remoteControl ? 'success' : 'primary'}
                                        icon={Hand}
                                        size="md"
                                    >
                                        Remote Control {remoteControl ? 'ON' : 'OFF'}
                                    </NeonButton>

                                    <NeonButton
                                        onClick={onDisconnect}
                                        variant="danger"
                                        size="md"
                                    >
                                        Disconnect
                                    </NeonButton>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Remote screen */}
                        <GlassCard variant="dark" className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Remote Screen</h3>
                                <button
                                    onClick={() => setShowDock(!showDock)}
                                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
                                >
                                    <Maximize2 className="w-5 h-5 text-slate-300" />
                                </button>
                            </div>

                            {/* Debug video element */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                controls
                                style={{ width: '200px', height: '150px', position: 'absolute', bottom: '10px', right: '10px', zIndex: 50, border: '2px solid red' }}
                                onLoadedMetadata={() => {
                                    if (videoRef.current) {
                                        videoRef.current.play().catch(e => console.error('Autoplay error:', e));
                                    }
                                }}
                            />

                            <div
                                className="relative bg-black rounded-xl overflow-hidden cursor-crosshair shadow-2xl"
                                onClick={onCanvasClick}
                                onMouseMove={onCanvasMouseMove}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={1280}
                                    height={720}
                                    className="w-full h-auto"
                                    style={{
                                        backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a), linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a)',
                                        backgroundSize: '40px 40px',
                                        backgroundPosition: '0 0, 20px 20px'
                                    }}
                                />

                                {remoteControl && (
                                    <>
                                        <div
                                            className="absolute w-10 h-10 border-4 border-purple-500 rounded-full pointer-events-none transition-all duration-100 shadow-2xl shadow-purple-500/60 animate-pulse"
                                            style={{
                                                left: mousePos.x - 20,
                                                top: mousePos.y - 20,
                                                opacity: 0.95
                                            }}
                                        />
                                        <div
                                            className="absolute w-2 h-2 bg-purple-400 rounded-full pointer-events-none transition-all duration-75 shadow-lg shadow-purple-400/80"
                                            style={{
                                                left: mousePos.x - 1,
                                                top: mousePos.y - 1
                                            }}
                                        />
                                        <div className="absolute top-4 left-4 bg-gradient-to-r from-green-600 to-green-700 px-5 py-3 rounded-full text-sm flex items-center gap-3 text-white font-bold shadow-xl animate-pulse">
                                            <MousePointer className="w-5 h-5" />
                                            Remote Control Active
                                        </div>
                                    </>
                                )}

                                {!remoteControl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Hand className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <p className="text-xl text-slate-300 font-medium">Enable Remote Control</p>
                                            <p className="text-sm text-slate-500 mt-2">Click the button above to interact</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Floating Control Dock */}
                            {remoteControl && showDock && (
                                <div className="mt-6 flex justify-center">
                                    <GlassCard variant="light" className="inline-flex items-center gap-3 px-6 py-4 animate-slide-in-left">
                                        <button className="group p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-blue-600/80 hover:to-blue-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-slate-600/50 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/20 transform hover:scale-110">
                                            <MousePointer className="w-5 h-5" />
                                            <span className="text-sm font-semibold">Left</span>
                                        </button>
                                        <button className="group p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-red-600/80 hover:to-red-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-slate-600/50 hover:border-red-500/50 shadow-lg hover:shadow-red-500/20 transform hover:scale-110">
                                            <MousePointer className="w-5 h-5" />
                                            <span className="text-sm font-semibold">Right</span>
                                        </button>
                                        <button className="group p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-purple-600/80 hover:to-purple-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20 transform hover:scale-110">
                                            <Keyboard className="w-5 h-5" />
                                            <span className="text-sm font-semibold">Keys</span>
                                        </button>
                                    </GlassCard>
                                </div>
                            )}
                        </GlassCard>

                        {/* Activity log */}
                        <GlassCard variant="dark" className="p-4">
                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Activity Log</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {logs.slice(-5).map((log, i) => (
                                    <div key={i} className="text-sm font-mono text-slate-400 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/30 animate-slide-in-right">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
}
