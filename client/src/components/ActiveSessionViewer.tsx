import React, { useState, useEffect } from 'react';
import { Hand, MousePointer, Keyboard, Maximize, Minimize, Play, Pause, ZoomIn, ZoomOut, X } from 'lucide-react';

interface ActiveSessionViewerProps {
    sessionId: string;
    remoteControl: boolean;
    mousePos: { x: number; y: number };
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onToggleControl: () => void;
    onDisconnect: () => void;
    onCanvasClick: (e: React.MouseEvent) => void;
    onCanvasMouseMove: (e: React.MouseEvent) => void;
}

export default function ActiveSessionViewer({
    sessionId,
    remoteControl,
    mousePos,
    videoRef,
    canvasRef,
    onToggleControl,
    onDisconnect,
    onCanvasClick,
    onCanvasMouseMove
}: ActiveSessionViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [sessionTime, setSessionTime] = useState(0);
    const [latency, setLatency] = useState(0);

    // Session timer
    useEffect(() => {
        const timer = setInterval(() => {
            setSessionTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulate latency (in real app, measure actual RTT)
    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(Math.floor(Math.random() * 20) + 15); // 15-35ms
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Full-screen remote desktop feed */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="relative w-full h-full flex items-center justify-center"
                    onClick={onCanvasClick}
                    onMouseMove={onCanvasMouseMove}
                >
                    {/* Debug video element */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ display: 'none' }}
                    />

                    {/* Canvas for rendering */}
                    <canvas
                        ref={canvasRef}
                        width={1920}
                        height={1080}
                        className="max-w-full max-h-full"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            cursor: remoteControl ? 'none' : 'default'
                        }}
                    />

                    {/* Remote control cursor overlay */}
                    {remoteControl && (
                        <>
                            <div
                                className="absolute w-8 h-8 border-2 border-purple-500 rounded-full pointer-events-none transition-all duration-75 shadow-2xl shadow-purple-500/60"
                                style={{
                                    left: mousePos.x - 16,
                                    top: mousePos.y - 16,
                                }}
                            />
                            <div
                                className="absolute w-2 h-2 bg-purple-400 rounded-full pointer-events-none shadow-lg shadow-purple-400/80"
                                style={{
                                    left: mousePos.x - 1,
                                    top: mousePos.y - 1
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Top-right: Latency + Session Timer */}
            <div className="absolute top-6 right-6 flex items-center gap-4 z-30">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${latency < 25 ? 'bg-green-500' : latency < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="text-white font-mono text-sm">{latency}ms</span>
                    </div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2 shadow-lg">
                    <span className="text-white font-mono text-sm">{formatTime(sessionTime)}</span>
                </div>
            </div>

            {/* Semi-transparent bottom control bar (glass effect) */}
            <div className="absolute bottom-0 left-0 right-0 z-30">
                <div className="bg-slate-900/60 backdrop-blur-2xl border-t border-slate-700/50 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {/* Left controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-white hover:scale-110 transform"
                                title={isPaused ? 'Resume' : 'Pause'}
                            >
                                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                            </button>

                            <button
                                onClick={onToggleControl}
                                className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold hover:scale-105 transform ${remoteControl
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                                    }`}
                                title="Toggle Remote Control"
                            >
                                <Hand className="w-5 h-5" />
                                {remoteControl ? 'Control ON' : 'Control OFF'}
                            </button>
                        </div>

                        {/* Center - Session Info */}
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Connected to</p>
                            <code className="text-lg font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {sessionId}
                            </code>
                        </div>

                        {/* Right controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-white hover:scale-110 transform"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            <span className="text-white font-mono text-sm min-w-[4rem] text-center">{zoom}%</span>

                            <button
                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-white hover:scale-110 transform"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-white hover:scale-110 transform"
                                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>

                            <button
                                onClick={onDisconnect}
                                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-500/30 hover:scale-105 transform"
                                title="Disconnect"
                            >
                                <X className="w-5 h-5" />
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating toolbar for remote control (when enabled) */}
            {remoteControl && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 animate-slide-in-left">
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-purple-500/30 rounded-2xl px-6 py-4 shadow-2xl shadow-purple-500/20 flex items-center gap-4">
                        <button className="px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all duration-200 text-white font-semibold flex items-center gap-2 hover:scale-110 transform">
                            <MousePointer className="w-4 h-4" />
                            Left Click
                        </button>
                        <button className="px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 text-white font-semibold flex items-center gap-2 hover:scale-110 transform">
                            <MousePointer className="w-4 h-4" />
                            Right Click
                        </button>
                        <button className="px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all duration-200 text-white font-semibold flex items-center gap-2 hover:scale-110 transform">
                            <Keyboard className="w-4 h-4" />
                            Send Keys
                        </button>
                    </div>
                </div>
            )}

            {/* Remote Control Active Indicator */}
            {remoteControl && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 rounded-full text-white font-bold shadow-xl shadow-purple-500/30 flex items-center gap-3 z-30 animate-pulse">
                    <MousePointer className="w-5 h-5" />
                    Remote Control Active
                </div>
            )}
        </div>
    );
}
