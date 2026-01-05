import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, ChevronRight, Sparkles, CheckCircle2, User, Play, Monitor } from 'lucide-react';
import GlassCard from './ui/GlassCard';

interface OnboardingAssistantProps {
    mode: 'home' | 'host' | 'client';
    isConnected: boolean;
    isSharing: boolean;
}

interface Step {
    id: string;
    text: string;
    completed: boolean;
    action?: () => void;
}

export default function OnboardingAssistant({ mode, isConnected, isSharing }: OnboardingAssistantProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState<{ type: 'ai' | 'user'; text: string }[]>([
        { type: 'ai', text: "Hi! I'm your RemoteX AI Assistant. I can help you get started." }
    ]);
    const [minimized, setMinimized] = useState(false);

    // Context-aware suggestions
    useEffect(() => {
        let newMessage = '';

        if (mode === 'home') {
            newMessage = "Would you like to Host a session or Join one? I can guide you through both.";
        } else if (mode === 'host' && !isSharing) {
            newMessage = "Click 'Start Sharing' to generate a secure Session ID. You can share this ID with your remote partner.";
        } else if (mode === 'host' && isSharing) {
            newMessage = "Great! You are live. Share the Session ID shown above. I'll notify you when someone connects.";
        } else if (mode === 'client' && !isConnected) {
            newMessage = "Enter the 8-digit Session ID provided by the host. If you're on the same network, ask for the LAN IP.";
        } else if (isConnected) {
            newMessage = "Connection established! You can now view the remote screen. Use the toolbar to specific controls.";
        }

        if (newMessage && messages[messages.length - 1]?.text !== newMessage) {
            // Simulate typing delay
            setTimeout(() => {
                setMessages(prev => [...prev, { type: 'ai', text: newMessage }]);
            }, 800);
        }
    }, [mode, isConnected, isSharing]);

    const scrollToBottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (minimized) {
        return (
            <button
                onClick={() => setMinimized(false)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform z-50 animate-bounce-slow"
            >
                <Sparkles className="w-6 h-6 text-white" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 z-50 perspective-1000">
            <GlassCard className="flex flex-col overflow-hidden shadow-2xl border-purple-500/30" variant="dark">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-indigo-100">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMinimized(true)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                        >
                            <span className="sr-only">Minimize</span>
                            <div className="w-4 h-0.5 bg-current rounded-full"></div>
                        </button>
                        <button
                            onClick={() => setIsOpen(false)} // In a real app, maybe completely hide
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-900/40 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                                    } shadow-md`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={scrollToBottomRef} />
                </div>

                {/* Quick Actions (Contextual) */}
                <div className="p-3 bg-slate-900/60 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider px-1">Suggested Actions</p>
                    <div className="space-y-2">
                        {mode === 'home' && (
                            <>
                                <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-xs text-slate-300 flex items-center gap-2 transition-colors border border-slate-700/50 hover:border-indigo-500/30">
                                    <Monitor className="w-3 h-3 text-indigo-400" />
                                    How do I host a session?
                                </button>
                                <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-xs text-slate-300 flex items-center gap-2 transition-colors border border-slate-700/50 hover:border-indigo-500/30">
                                    <Play className="w-3 h-3 text-pink-400" />
                                    How do I join a session?
                                </button>
                            </>
                        )}
                        {mode === 'client' && (
                            <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-xs text-slate-300 flex items-center gap-2 transition-colors border border-slate-700/50 hover:border-indigo-500/30">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                I need a secure connection
                            </button>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
