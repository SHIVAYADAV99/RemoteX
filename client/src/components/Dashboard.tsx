import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Clock, Users, CheckCircle, XCircle, AlertCircle, Monitor, Shield, Activity, FileText, Clipboard, Settings, Layout, Lock, Search, Download, Share, UserPlus, ShieldCheck, Zap, MessageSquare, Send, Copy, Share2, ChevronRight, MousePointer, Keyboard, Maximize2, Minimize2, Wifi } from 'lucide-react';
import { FileTransferManager } from '../services/FileTransferManager';
import { ChatManager, ChatMessage } from '../services/ChatManager';

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
    onJoinSession?: (id: string) => void;
    publicIP?: string;
    onHomeClick: () => void;
    mode?: string;
    isClientOnly?: boolean;
    socket: any;
    // Recording Props
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    systemInfo?: any;
    processes?: any[];
    onKillProcess?: (pid: string) => void;
    onRunMaintenance?: (type: string) => void;
    eventLogs?: any[];
    fleet?: any[];
    remoteCanvasRef?: React.RefObject<HTMLCanvasElement>;
    remoteControl?: boolean;
    onToggleRemoteControl?: () => void;
    onExecuteShell?: (command: string) => void;
    onSwitchMonitor?: (index: number) => void;
    onGetDetailedDiagnostics?: () => void;
    userRole?: 'Super Admin' | 'Admin / Team Lead' | 'Technician' | 'Read-Only / Auditor';
}

export default function Dashboard({
    sessionId,
    isSharing,
    viewerCount,
    logs,
    onStartShare,
    onStopShare,
    onJoinClick,
    onJoinSession,
    publicIP = 'Fetching...',
    onHomeClick,
    mode = 'host',
    isClientOnly = false,
    socket,
    isRecording = false,
    onStartRecording,
    onStopRecording,
    systemInfo,
    processes = [],
    onKillProcess,
    onRunMaintenance,
    eventLogs = [],
    fleet = [],
    remoteCanvasRef,
    remoteControl = false,
    onToggleRemoteControl = () => { },
    onExecuteShell,
    onSwitchMonitor,
    onGetDetailedDiagnostics,
    userRole = 'Technician'
}: DashboardProps) {
    const [performanceData, setPerformanceData] = useState<{ x: number; y: number }[]>([]);
    const [activeTab, setActiveTab] = useState<'monitor' | 'files' | 'clipboard' | 'team' | 'settings' | 'diagnostics' | 'inventory' | 'join' | 'terminal'>('inventory');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(mode === 'host' || mode === 'technician');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [interceptId, setInterceptId] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [unattendedPin, setUnattendedPin] = useState('0000');
    const [sessionHistory, setSessionHistory] = useState<Session[]>([
        { id: '1', code: 'RX-98E2', date: '2026-01-05', duration: '42m', maxViewers: 1, status: 'ended' },
        { id: '2', code: 'AB-4412', date: '2026-01-04', duration: '12m', maxViewers: 1, status: 'expired' },
        { id: '3', code: 'PQ-7701', date: '2026-01-03', duration: '05m', maxViewers: 2, status: 'ended' }
    ]);

    // File Transfer State
    const [transfers, setTransfers] = useState<{ id: string, name: string, progress: number, status: 'active' | 'complete' | 'error' }[]>([]);
    const fileManagerRef = useRef<FileTransferManager | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatManagerRef = useRef<ChatManager | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Terminal State
    const [terminalHistory, setTerminalHistory] = useState<{ cmd: string, output: string, type: 'cmd' | 'out' | 'err' }[]>([]);
    const [terminalInput, setTerminalInput] = useState('');
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [selectedMonitor, setSelectedMonitor] = useState(0);
    const [detailedData, setDetailedData] = useState<any>(null);

    // Annotation State
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const [isNativeFullScreen, setIsNativeFullScreen] = useState(false);

    const toggleFullScreen = async (val: boolean) => {
        console.log(`[RemoteX] Native Full Screen Request: ${val}`);
        try {
            if (val) {
                if (canvasWrapperRef.current?.requestFullscreen) {
                    await canvasWrapperRef.current.requestFullscreen();
                } else if ((canvasWrapperRef.current as any)?.webkitRequestFullscreen) {
                    await (canvasWrapperRef.current as any).webkitRequestFullscreen();
                }
            } else {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
            }
        } catch (err) {
            console.error('[RemoteX] Fullscreen Error:', err);
            // Fallback to local state if native fails
            setIsFullScreen(val);
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsNativeFullScreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) setIsFullScreen(false);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, []);

    useEffect(() => {
        if (socket && !fileManagerRef.current) {
            const manager = new FileTransferManager(socket);
            manager.setRoomId(sessionId || publicIP); // Use available ID

            manager.setCallbacks(
                (progress, fileId) => {
                    setTransfers(prev => {
                        const exists = prev.find(t => t.id === fileId);
                        if (exists) {
                            return prev.map(t => t.id === fileId ? { ...t, progress } : t);
                        }
                        return [...prev, { id: fileId, name: 'Unknown', progress, status: 'active' }];
                    });
                },
                (blob, fileName) => {
                    setTransfers(prev => prev.map(t => t.name === fileName ? { ...t, status: 'complete', progress: 100 } : t));
                    // Trigger download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            );
            fileManagerRef.current = manager;
        }

        if (socket && !chatManagerRef.current) {
            const chatMgr = new ChatManager(socket);
            chatMgr.setRoomId(sessionId || publicIP);
            chatMgr.onMessage((msg) => {
                setChatMessages(prev => [...prev, msg]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            });
            chatManagerRef.current = chatMgr;
        }
    }, [socket, sessionId, publicIP]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f' && activeTab === 'monitor' && isSharing) {
                toggleFullScreen(!isFullScreen);
            }
            if (e.key === 'Escape' && isFullScreen) {
                toggleFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, activeTab, isSharing]);

    useEffect(() => {
        const handler = (e: any) => {
            const result = e.detail;
            setTerminalHistory(prev => [
                ...prev,
                { cmd: '', output: result.output || '', type: result.success ? 'out' : 'err' },
                ...(result.error ? [{ cmd: '', output: result.error, type: 'err' as const }] : [])
            ]);
            setTimeout(() => terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };
        window.addEventListener('terminal-output', handler);

        const diagHandler = (e: any) => {
            setDetailedData(e.detail);
        };
        window.addEventListener('detailed-diagnostics', diagHandler);

        return () => {
            window.removeEventListener('terminal-output', handler);
            window.removeEventListener('detailed-diagnostics', diagHandler);
        };
    }, []);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || !chatManagerRef.current) return;

        const sender = mode === 'host' ? 'HOST' : 'CLIENT';
        chatManagerRef.current.sendMessage(chatInput, sender);
        setChatInput('');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && fileManagerRef.current) {
            const file = e.target.files[0];
            const tempId = Math.random().toString(36).substr(2, 9);
            // Optimistic update
            setTransfers(prev => [...prev, { id: tempId, name: file.name, progress: 0, status: 'active' }]);
            fileManagerRef.current.sendFile(file);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setPerformanceData(prev => {
                const newData = [...prev, { x: prev.length, y: 10 + Math.random() * 20 }];
                return newData.slice(-10); // Keep last 10 points
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function renderChart() {
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
    }

    function handleAdminLogin(e: React.FormEvent) {
        e.preventDefault();
        if (adminUsername === 'itadmin' && adminPassword === 'remoteX-secure') {
            setIsAdminAuthenticated(true);
            setShowAdminLogin(false);
            setLoginError('');
            setAdminUsername('');
            setAdminPassword('');
        } else {
            setLoginError('Invalid Administrator Credentials');
        }
    }

    const handleExecuteTerminalInput = (e: React.FormEvent) => {
        e.preventDefault();
        if (!terminalInput.trim() || !onExecuteShell) return;
        setTerminalHistory(prev => [...prev, { cmd: terminalInput, output: '', type: 'cmd' }]);
        onExecuteShell(terminalInput);
        setTerminalInput('');
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (!isAnnotating || !annotationCanvasRef.current) return;
        setIsDrawing(true);
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (ctx) {
            const rect = annotationCanvasRef.current.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#6366f1';
        }
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !annotationCanvasRef.current) return;
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (ctx) {
            const rect = annotationCanvasRef.current.getBoundingClientRect();
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearAnnotations = () => {
        const ctx = annotationCanvasRef.current?.getContext('2d');
        if (ctx && annotationCanvasRef.current) {
            ctx.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
        }
    };

    function handleTabClick(tabId: 'monitor' | 'files' | 'clipboard' | 'team' | 'settings' | 'diagnostics' | 'inventory' | 'join' | 'terminal') {
        // Enterprise tabs require admin authentication
        if (['files', 'clipboard', 'team', 'settings', 'diagnostics', 'inventory', 'terminal'].includes(tabId) && !isAdminAuthenticated) {
            setShowAdminLogin(true);
            return;
        }
        if (tabId === 'diagnostics' && onGetDetailedDiagnostics) {
            onGetDetailedDiagnostics();
        }
        setActiveTab(tabId);
    }

    return (
        <div className="min-h-screen bg-mesh animate-mesh text-slate-800 flex flex-col relative overflow-hidden font-sans">
            {/* Top bar (Ultra Pro Style) */}
            <div className="relative z-50 glass-morphism border-b border-white/20 py-4 px-8 shadow-xl">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div onClick={onHomeClick} className="cursor-pointer group flex items-center gap-4 transition-transform active:scale-95">
                        <div className="w-12 h-12 bg-gradient-to-tr from-[#004172] to-[#0078d4] rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:rotate-12 transition-transform">
                            <Monitor className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#004172] tracking-tighter leading-none">RemoteX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 font-black">ULTRA</span></h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Unified Command Center</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        {isSharing && (
                            <div className="flex items-center gap-4 px-5 py-2 glass-morphism rounded-2xl border-white/40 group">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> ACTIVE SESSION
                                </span>
                                <div className="flex items-center gap-3">
                                    <code className="text-sm font-black text-[#004172] tracking-widest font-mono">{sessionId}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(sessionId);
                                        }}
                                        className="p-1.5 hover:bg-white rounded-xl transition-all active:scale-90"
                                        title="Copy Token"
                                    >
                                        <Copy className="w-4 h-4 text-indigo-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/50 shadow-inner group focus-within:ring-2 ring-indigo-500/20 transition-all">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                            <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-xs text-slate-600 w-64 placeholder:text-slate-400 font-bold" />
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex items-center gap-4 group cursor-pointer p-1 hover:bg-white/50 rounded-2xl transition-all">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                                {adminUsername ? adminUsername[0].toUpperCase() : 'A'}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-xs font-black text-[#004172] uppercase tracking-wider leading-none">{adminUsername || 'Admin User'}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{userRole}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content (Ultra Layout) */}
            <div className="relative z-10 w-full flex-1 flex min-h-0 bg-white/30 backdrop-blur-md">
                {/* Enterprise Sidebar (High Fidelity) */}
                <div className="w-72 bg-white/80 backdrop-blur-3xl border-r border-white/50 flex flex-col animate-slide-in-left shadow-2xl z-20">
                    <div className="p-8">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 px-4 flex items-center gap-3">
                            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                            Command Center
                        </h2>
                        <div className="flex flex-col gap-2">
                            {[
                                { id: 'inventory', icon: ShieldCheck, label: 'Computers', clientAccessible: false, minRole: 'Technician' },
                                { id: 'join', icon: Plus, label: 'Remote Support', clientAccessible: true, minRole: 'Technician' },
                                { id: 'monitor', icon: Layout, label: 'Current Session', clientAccessible: true, minRole: 'Read-Only / Auditor' },
                                { id: 'diagnostics', icon: Activity, label: 'Health Stats', clientAccessible: false, minRole: 'Technician' },
                                { id: 'files', icon: FileText, label: 'Shared Files', clientAccessible: false, minRole: 'Technician' },
                                { id: 'clipboard', icon: Clipboard, label: 'Sync Buffer', clientAccessible: false, minRole: 'Technician' },
                                { id: 'team', icon: Users, label: 'Users & Access', clientAccessible: false, minRole: 'Admin / Team Lead' },
                                { id: 'terminal', icon: Keyboard, label: 'Remote Terminal', clientAccessible: false, minRole: 'Technician' },
                                { id: 'settings', icon: Settings, label: 'Preferences', clientAccessible: false, minRole: 'Super Admin' }
                            ]
                                .filter(tab => {
                                    if (mode === 'host' || mode === 'technician') {
                                        const roleHierarchy = ['Read-Only / Auditor', 'Technician', 'Admin / Team Lead', 'Super Admin'];
                                        const userRank = roleHierarchy.indexOf(userRole);
                                        const requiredRank = roleHierarchy.indexOf(tab.minRole);
                                        return userRank >= requiredRank;
                                    }
                                    if (isClientOnly && !tab.clientAccessible) return false;
                                    return true;
                                })
                                .map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabClick(tab.id as any)}
                                        className={`group flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 relative ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/30 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
                                            : 'text-slate-500 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <tab.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                        <span className={`text-[13px] font-black tracking-widest uppercase opacity-80 ${activeTab === tab.id ? 'text-indigo-700' : 'group-hover:text-slate-900'}`}>{tab.label}</span>
                                        {activeTab === tab.id && (
                                            <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                        </div>

                    </div>
                </div>

                {/* Admin Login Trigger (LogMeIn Style) */}
                {!isAdminAuthenticated && !isClientOnly && (
                    <div className="mt-auto p-6 border-t border-slate-100">
                        <button
                            onClick={() => setShowAdminLogin(true)}
                            className="w-full py-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-3 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-xs"
                        >
                            <Lock className="w-4 h-4" />
                            UNLOCK ADMIN CONSOLE
                        </button>
                    </div>
                )}
            </div>

            {/* Main View Transition Area */}
            <div className="flex-1 overflow-hidden flex flex-col gap-8 min-h-0">
                {activeTab === 'join' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-10 flex flex-col items-center justify-center">
                        <div className="max-w-xl w-full glass-morphism rounded-[3rem] p-12 shadow-2xl border-white/40 flex flex-col items-center text-center relative overflow-hidden bento-card group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] flex items-center justify-center mb-10 border border-indigo-100 shadow-inner group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-12 h-12 text-indigo-600" />
                            </div>

                            <h2 className="text-3xl font-black text-[#004172] mb-4 tracking-tighter uppercase">Intercept Protocol</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-12 max-w-sm leading-loose">
                                Enter the secure 8-character handshake code provided by the remote node to establish an authorized uplink.
                            </p>

                            <div className="flex justify-center gap-4 mb-14 drop-shadow-2xl">
                                {[...Array(8)].map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        maxLength={1}
                                        value={interceptId[i] || ''}
                                        onChange={(e) => {
                                            const char = e.target.value.toUpperCase().slice(-1);
                                            if (!char.match(/[A-Z0-9]/) && char !== '') return;
                                            const newId = interceptId.split('');
                                            newId[i] = char;
                                            setInterceptId(newId.join(''));
                                            if (char && i < 7) {
                                                const next = (e.currentTarget.parentElement?.children[i + 1] as HTMLInputElement);
                                                if (next) next.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !interceptId[i] && i > 0) {
                                                const prev = (e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement);
                                                if (prev) prev.focus();
                                            }
                                        }}
                                        className={`w-14 h-20 border-2 transition-all duration-300 rounded-2xl text-center font-mono text-3xl font-black outline-none
                                                ${interceptId[i]
                                                ? 'border-indigo-400 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-500/10'
                                                : 'border-slate-100 bg-slate-50 text-slate-300'
                                            } focus:border-[#004172] focus:bg-white focus:scale-110 focus:shadow-2xl focus:shadow-indigo-500/20`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => onJoinSession?.(interceptId)}
                                disabled={interceptId.length < 8}
                                className={`w-full py-6 rounded-3xl font-black text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-2xl uppercase
                                        ${interceptId.length < 8
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
                                        : 'bg-[#004172] hover:bg-black text-white active:scale-[0.98] shadow-blue-900/20'
                                    }`}
                            >
                                INITIATE UPLINK
                                <Zap className="w-4 h-4 fill-white animate-pulse" />
                            </button>
                        </div>

                        <div className="mt-16 flex items-center gap-20 opacity-40">
                            <div className="flex items-center gap-3">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">AES-256 Handshake</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Authorized Vector</span>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'monitor' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-10 space-y-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-[#004172] tracking-tighter">Mission Control</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Live End-to-End Uplink</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-6 py-2 glass-morphism rounded-2xl flex items-center gap-3 border-white/50">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Signal Integrity: 100%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Session Card */}
                            <div className="lg:col-span-2 glass-morphism rounded-[3rem] shadow-2xl border-white/40 p-1 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[550px] group bento-card">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                                {!isSharing ? (
                                    <div className="max-w-md p-12">
                                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Share2 className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Handshake Pending</h3>
                                        <p className="text-xs text-slate-500 mb-12 font-semibold leading-relaxed tracking-wide px-4 uppercase opacity-60">Authentication tunnel established, awaiting remote authorization</p>

                                        <div className="relative group/token">
                                            <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover/token:opacity-100 transition-opacity"></div>
                                            <div className="relative w-full py-8 bg-slate-900/5 rounded-[2rem] border-2 border-dashed border-slate-200 font-bold text-indigo-600 font-mono tracking-[0.4em] text-4xl shadow-inner flex items-center justify-center gap-4">
                                                {sessionId || '••••••••'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col p-4">
                                        <div
                                            ref={canvasWrapperRef}
                                            className={`flex-1 bg-slate-950 overflow-hidden relative shadow-2xl ring-1 ring-white/20 rounded-[2.5rem] transition-all duration-500 ${isNativeFullScreen || isFullScreen ? '!rounded-none' : ''}`}
                                        >
                                            {isSharing && (
                                                <>
                                                    <canvas
                                                        ref={remoteCanvasRef}
                                                        className="w-full h-full object-contain cursor-none"
                                                        width={1920}
                                                        height={1080}
                                                    />
                                                    {isAnnotating && (
                                                        <canvas
                                                            ref={annotationCanvasRef}
                                                            onMouseDown={startDrawing}
                                                            onMouseMove={draw}
                                                            onMouseUp={stopDrawing}
                                                            onMouseLeave={stopDrawing}
                                                            className="absolute inset-0 w-full h-full object-contain cursor-crosshair z-10"
                                                            width={1920}
                                                            height={1080}
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {/* Remote Overlay / HUD */}
                                            {(isNativeFullScreen || isFullScreen) && (
                                                <div className="absolute top-10 left-10 flex items-center gap-4 animate-fade-in-left z-[10000]">
                                                    <div className="px-6 py-2 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                                        CINEMATIC UPLINK ACTIVE
                                                    </div>
                                                    <div className="px-6 py-2 bg-indigo-600/40 backdrop-blur-2xl rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-2xl">
                                                        {systemInfo?.system?.hostname || 'REMOTE NODE'} • 60FPS
                                                    </div>
                                                    <button
                                                        onClick={() => toggleFullScreen(false)}
                                                        className="px-8 py-2 bg-rose-600 hover:bg-rose-700 backdrop-blur-2xl rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-2xl active:scale-95 group"
                                                    >
                                                        <Minimize2 className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                                        EXIT THEATER
                                                    </button>
                                                </div>
                                            )}

                                            {!isNativeFullScreen && !isFullScreen && (
                                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                                    <div className="px-4 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        STREAMING LIVE
                                                    </div>
                                                    <div className="px-4 py-1.5 bg-indigo-600/40 backdrop-blur-xl rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                        1080P • 60FPS
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mouse control indicator */}
                                            {(isNativeFullScreen || isFullScreen) && remoteControl && (
                                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-indigo-600/20 backdrop-blur-3xl rounded-[2rem] border border-white/10 text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4 animate-slide-up shadow-2xl z-[10000]">
                                                    <MousePointer className="w-5 h-5 animate-bounce" />
                                                    DIRECT INTERFACE ACTIVE
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 flex items-center justify-between px-6 pb-2">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={onToggleRemoteControl}
                                                    className={`p-4 rounded-2xl transition-all border-2 group/btn ${remoteControl ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-600/30' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 shadow-md'}`}
                                                >
                                                    <MousePointer className={`w-5 h-5 ${remoteControl ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
                                                </button>

                                                {/* Monitor Switcher Mini-Dock */}
                                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 shadow-inner">
                                                    {[0, 1, 2].map((idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedMonitor(idx);
                                                                onSwitchMonitor?.(idx);
                                                            }}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${selectedMonitor === idx ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                                                            title={`Switch to Monitor ${idx + 1}`}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => toggleFullScreen(true)}
                                                    className="p-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-md active:scale-95"
                                                    title="Full Screen Mode (F)"
                                                >
                                                    <Maximize2 className="w-5 h-5 hover:scale-110 transition-transform" />
                                                </button>

                                                <button
                                                    onClick={() => setIsAnnotating(!isAnnotating)}
                                                    className={`p-4 rounded-2xl transition-all border-2 group/btn ${isAnnotating ? 'bg-amber-500 text-white border-amber-400 shadow-xl shadow-amber-600/30' : 'bg-white text-slate-600 border-slate-100 hover:border-amber-200 shadow-md'}`}
                                                    title="Whiteboard Annotation"
                                                >
                                                    <Plus className={`w-5 h-5 ${isAnnotating ? 'rotate-45' : 'group-hover:scale-110 transition-transform'}`} />
                                                </button>

                                                {isAnnotating && (
                                                    <button
                                                        onClick={clearAnnotations}
                                                        className="p-4 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-2xl hover:bg-rose-100 transition-all shadow-md active:scale-95 animate-fade-in"
                                                        title="Clear Annotations"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                )}

                                                <button className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-300 cursor-not-allowed shadow-inner">
                                                    <Keyboard className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={onStopShare}
                                                className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-[11px] tracking-[0.3em] transition-all shadow-xl shadow-rose-500/30 active:scale-95 uppercase"
                                            >
                                                TERMINATE UPLINK
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Metrics Side */}
                            <div className="space-y-8">
                                <div className="glass-morphism rounded-[2.5rem] shadow-xl border-white/50 p-8 bento-card">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-indigo-500" />
                                        Live Telemetry
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: 'CPU LOAD', value: systemInfo ? `${systemInfo.cpu.usage}%` : '24%', color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                                            { label: 'MEMORY', value: systemInfo ? `${systemInfo.memory.usage}%` : '4.8GB', color: 'text-purple-600', bg: 'bg-purple-50/50' },
                                            { label: 'LATENCY', value: '18ms', color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                                            { label: 'UPLINK', value: '42Mb/s', color: 'text-blue-600', bg: 'bg-blue-50/50' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} p-6 rounded-[1.5rem] border border-white shadow-sm hover:-translate-y-1 transition-transform duration-300`}>
                                                <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">{stat.label}</p>
                                                <p className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden group bento-card">
                                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                            <Shield className="w-6 h-6 text-indigo-200" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em]">AES-256 ACTIVE</h3>
                                    </div>
                                    <p className="text-xs text-indigo-100/60 leading-relaxed font-semibold uppercase tracking-wider mb-6">Military-grade encryption tunnel is active. Security perimeter verified.</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-400 w-[85%] animate-pulse"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-300">SAFE</span>
                                    </div>
                                </div>

                                <div className="glass-morphism rounded-[2.5rem] shadow-xl border-white/50 p-8 flex-1 flex flex-col items-center justify-center text-center bento-card">
                                    <div className="flex items-center justify-between w-full mb-8">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Peers</h3>
                                        <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full text-[12px] font-black text-indigo-600 border border-indigo-100">{viewerCount}</div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6 opacity-40">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-inner">
                                            <Users className="w-8 h-8 text-slate-400 font-black" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Secure Room Isolation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                            <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Shared Files</h2>
                                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Secure Transfer Tunnel</p>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    UPLOAD FILE
                                </button>
                            </div>

                            <div className="p-8 flex-1 overflow-y-auto">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                                {transfers.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No active transfers</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {transfers.map((file) => (
                                            <div key={file.id} className="bg-slate-50 border border-slate-200 p-5 rounded-xl group relative overflow-hidden">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                        {file.status === 'complete' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Activity className="w-5 h-5 text-blue-500 animate-pulse" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{file.progress}%</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800 truncate mb-1">{file.name}</h4>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase">{file.status}</p>

                                                <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Session History (Audit Log) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Session Audit</h3>
                                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">Export Logs</button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {sessionHistory.map((sess) => (
                                        <div key={sess.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${sess.status === 'ended' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-500'}`}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{sess.code}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{sess.date} • {sess.duration}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{sess.maxViewers} Viewer{sess.maxViewers > 1 ? 's' : ''}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${sess.status === 'ended' ? 'text-slate-400' : 'text-rose-400'}`}>{sess.status}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-4 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors border-t border-slate-100">
                                    View Full Audit History
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'clipboard' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Clipboard Sync</h2>
                                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Remote Buffer Management</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encrypted Hub</span>
                                    </div>
                                </div>
                                <div className="p-8 flex-1">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px] font-mono text-sm text-slate-600">
                                            // Awaiting clipboard synchronization packet...
                                    </div>
                                    <div className="mt-6 flex gap-4">
                                        <button className="flex-1 py-3 bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Push to Remote</button>
                                        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Clear Buffer</button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 cursor-pointer transition-all">
                                            <p className="text-[9px] text-slate-400 font-bold mb-1">02:45:0{i} PM</p>
                                            <p className="text-[11px] text-slate-700 font-medium truncate">Copied system diagnostic report...</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'diagnostics' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-10 space-y-10">
                        <div className="glass-morphism rounded-[3rem] shadow-2xl border-white/40 overflow-hidden relative bento-card">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>

                            <div className="bg-white/40 backdrop-blur-xl border-b border-white/20 p-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-[#004172] tracking-tighter">Diagnostic Analytics</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Nodal Resource Utilization</p>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-2 glass-morphism border-white/60 rounded-full">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Healthy Flow</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-white/20">
                                <div className="p-10 space-y-8 group">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Monitor className="w-5 h-5 text-indigo-600" /></div>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Processing</span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{systemInfo?.cpu.model || 'Unified Processor'}</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Load</p>
                                            <p className="text-3xl font-black text-[#004172] tracking-tighter">{systemInfo?.cpu.usage || 0}%</p>
                                        </div>
                                        <div className="h-2.5 bg-slate-900/5 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-out" style={{ width: `${systemInfo?.cpu.usage || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-8 group">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-purple-600" /></div>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Memory Plane</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Physical</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight">{systemInfo?.memory.total || 16} GB</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilized</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight">{systemInfo?.memory.used || 0} GB</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bandwidth</p>
                                            <p className="text-3xl font-black text-purple-600 tracking-tighter">{systemInfo?.memory.usage || 0}%</p>
                                        </div>
                                        <div className="h-2.5 bg-slate-900/5 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out" style={{ width: `${systemInfo?.memory.usage || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-8 group">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="w-5 h-5 text-emerald-600" /></div>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Environment</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between bg-white/40 p-3 rounded-xl border border-white">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</span>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{systemInfo?.system.platform || 'OS'} Node</span>
                                        </div>
                                        <div className="flex justify-between bg-white/40 p-3 rounded-xl border border-white">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime</span>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{systemInfo?.system.uptime || 0} Hours</span>
                                        </div>
                                        <div className="flex justify-between bg-white/40 p-3 rounded-xl border border-white">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kernel</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600 truncate ml-4">{systemInfo?.system.release || 'v1.0.0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="glass-morphism rounded-[3rem] shadow-2xl border-white/40 overflow-hidden flex flex-col h-[500px] bento-card relative">
                                <div className="bg-white/40 backdrop-blur-xl border-b border-white/20 p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 rounded-2xl"><Zap className="w-5 h-5 text-amber-600" /></div>
                                        <h3 className="text-sm font-black text-[#004172] uppercase tracking-[0.3em]">Core Processes</h3>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 pb-4">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-white/60 backdrop-blur-md z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Process</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PID</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ram</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">State</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {processes.map((proc, idx) => (
                                                <tr key={idx} className="group hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                                                    <td className="px-6 py-4 bg-white/30 group-hover:bg-white rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 text-[11px] font-black text-slate-900 truncate max-w-[150px] uppercase tracking-tight">{proc.name}</td>
                                                    <td className="px-6 py-4 bg-white/30 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-[11px] font-mono font-bold text-slate-400 tracking-widest">{proc.pid}</td>
                                                    <td className="px-6 py-4 bg-white/30 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-[11px] font-black text-indigo-500 tracking-tighter">{proc.mem}</td>
                                                    <td className="px-6 py-4 bg-white/30 group-hover:bg-white rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 text-right">
                                                        <button
                                                            onClick={() => onKillProcess?.(proc.pid)}
                                                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            TERM
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass-morphism rounded-[3rem] shadow-2xl border-white/40 overflow-hidden flex flex-col h-[500px] bento-card relative">
                                <div className="bg-white/40 backdrop-blur-xl border-b border-white/20 p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl"><FileText className="w-5 h-5 text-indigo-600" /></div>
                                        <h3 className="text-sm font-black text-[#004172] uppercase tracking-[0.3em]">Audit Stream</h3>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {eventLogs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                                            <Activity className="w-12 h-12 text-slate-400" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Tuning Audit Frequency...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {eventLogs.map((log, i) => (
                                                <div key={i} className="px-6 py-5 bg-white/30 hover:bg-white rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-start gap-6 group">
                                                    <div className="text-[9px] font-black text-slate-400 w-20 pt-1 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{log.time}</div>
                                                    <div className="flex-1">
                                                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">{log.source}</div>
                                                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2">{log.message}</p>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${log.type === 'Error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                        {log.type}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {detailedData && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in mt-10">
                                <div className="glass-morphism rounded-[3rem] shadow-2xl border-white/40 p-8 bento-card">
                                    <h3 className="text-sm font-black text-[#004172] uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                                        <div className="p-2 bg-indigo-50 rounded-lg"><Monitor className="w-4 h-4 text-indigo-600" /></div>
                                        Storage Architecture
                                    </h3>
                                    <div className="space-y-6">
                                        {detailedData.disk && detailedData.disk.map((d: any, i: number) => (
                                            <div key={i} className="bg-white/40 p-6 rounded-[2rem] border border-white">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate">{d.device}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{d.type} • {d.mount}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-indigo-600 shrink-0">{(d.size / (1024 ** 3)).toFixed(1)} GB</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-900/5 rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-indigo-500 w-3/4 rounded-full opacity-60"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-morphism rounded-[3rem] shadow-2xl border-white/40 p-8 bento-card">
                                    <h3 className="text-sm font-black text-[#004172] uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                                        <div className="p-2 bg-purple-50 rounded-lg"><Wifi className="w-4 h-4 text-purple-600" /></div>
                                        Network Interfaces
                                    </h3>
                                    <div className="space-y-4">
                                        {detailedData.net && detailedData.net.map((n: any, i: number) => (
                                            <div key={i} className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${n.operstate === 'up' ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full ${n.operstate === 'up' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{n.iface}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{n.ip4 || 'No IPV4'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{n.speed ? `${n.speed} MB/S` : 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col m-8">
                        <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Users & Access</h2>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Technician Groups & Permissions</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#004172] text-white rounded-lg text-xs font-bold hover:bg-[#002a4a] transition-all">
                                    <UserPlus className="w-4 h-4" />
                                    PROVISION TECHNICIAN
                                </button>
                            </div>
                        </div>
                        <div className="p-12 text-center opacity-40">
                            <Users className="w-16 h-16 mx-auto mb-6 text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Enterprise Directory</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">Team management is currently restricted to Super Admins. Please consult the <span className="text-indigo-600 font-bold">Admin Guide</span> for role assignment.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="flex-1 glass-morphism rounded-[3rem] shadow-2xl border-white/40 overflow-hidden animate-fade-in flex flex-col m-10 relative">
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <div className="bg-white/40 backdrop-blur-xl border-b border-white/20 p-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-[#004172] tracking-tight">Enterprise Fleet</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Global Asset Inventory</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
                                    <Plus className="w-4 h-4 text-blue-500" />
                                    PROVISION DEVICE
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <table className="w-full text-left border-separate border-spacing-y-3 px-4">
                                <thead>
                                    <tr>
                                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Endpoint Node</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Environment</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Uptime</th>
                                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Channel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fleet.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-6 opacity-30">
                                                    <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-inner">
                                                        <Monitor className="w-10 h-10 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-500 uppercase tracking-[0.5em]">Inventory Empty</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        fleet.map((device) => (
                                            <tr key={device.deviceId} className="group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                                <td className="px-8 py-6 bg-white/50 group-hover:bg-white rounded-l-3xl border-y border-l border-transparent group-hover:border-slate-100">
                                                    <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></div>
                                                </td>
                                                <td className="px-6 py-4 bg-white/50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
                                                            <Monitor className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 tracking-tight">{device.hostname}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest mt-0.5">ID: {device.deviceId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 bg-white/50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100">
                                                    <span className="text-[11px] font-black text-slate-600 flex items-center gap-2 uppercase tracking-widest">
                                                        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                        {device.os}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 bg-white/50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100">
                                                    <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                                                        {device.uptime}H SYNC
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 bg-white/50 group-hover:bg-white rounded-r-3xl border-y border-r border-transparent group-hover:border-slate-100 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => {
                                                                if (userRole === 'Read-Only / Auditor') return;
                                                                onJoinSession?.(device.deviceId);
                                                            }}
                                                            disabled={userRole === 'Read-Only / Auditor'}
                                                            className={`px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-2xl transition-all flex items-center gap-2
                                                                        ${userRole === 'Read-Only / Auditor' ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-500/40 active:scale-95'}`}
                                                        >
                                                            <Zap className={`w-3.5 h-3.5 ${userRole === 'Read-Only / Auditor' ? 'text-slate-300' : 'fill-white animate-pulse'}`} />
                                                            {userRole === 'Read-Only / Auditor' ? 'VIEW ONLY' : 'CONNECT'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="flex-1 overflow-y-auto animate-fade-in p-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200 p-6">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Preferences</h2>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Device & Security Configuration</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100">
                                <div className="p-8 space-y-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Security & Deployment</h3>
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Unattended Access PIN</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter 4-digit PIN"
                                                        maxLength={4}
                                                        value={unattendedPin}
                                                        onChange={(e) => setUnattendedPin(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm font-bold tracking-[0.5em] focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed">This PIN allows authorized admins to connect without local intervention. Keep it confidential.</p>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">Enforce MFA</p>
                                                        <p className="text-[9px] text-slate-500">Require multi-factor for all logins</p>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center px-1">
                                                    <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">System Identity</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Computer Description</label>
                                                <input
                                                    type="text"
                                                    defaultValue={systemInfo ? systemInfo.system.hostname : 'Remote Machine'}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="pt-4 mt-4 border-t border-slate-100">
                                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">Central Registration</p>
                                                    <p className="text-[11px] text-indigo-600/80 leading-relaxed">This device is managed by <strong>RemoteX Central</strong>. Changes to global policy must be made in the admin portal.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-lg text-xs font-bold transition-all shadow-md">
                                        SAVE PREFERENCES
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'terminal' && (
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden animate-fade-in animate-slide-up m-8">
                        <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                                    <Keyboard className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Remote Shell</h3>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Interactive CLI Interface</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Connected</span>
                                </div>
                                <button
                                    onClick={() => setTerminalHistory([])}
                                    className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/20 text-[9px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Clear Buffer
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-2 custom-scrollbar bg-slate-950">
                            <div className="text-indigo-400/60 mb-6 border-b border-white/5 pb-4">
                                <p>RemoteX Terminal [Version 1.0.420]</p>
                                <p>(c) 2026 RemoteX. All rights reserved.</p>
                                <p className="mt-2 text-rose-500/60 font-bold">WARNING: ADMINISTRATIVE SHELL - EXECUTE WITH CAUTION</p>
                            </div>

                            {terminalHistory.map((item, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    {item.cmd && (
                                        <div className="flex gap-3 text-emerald-400 mt-4">
                                            <span className="opacity-40">node@remote:~$</span>
                                            <span className="font-bold">{item.cmd}</span>
                                        </div>
                                    )}
                                    {item.output && (
                                        <pre className={`whitespace-pre-wrap pl-6 py-2 leading-relaxed font-mono ${item.type === 'err' ? 'text-rose-400' : 'text-slate-300'}`}>
                                            {item.output}
                                        </pre>
                                    )}
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>

                        <form onSubmit={handleExecuteTerminalInput} className="p-6 bg-slate-900 border-t border-white/5 flex gap-4">
                            <div className="flex-1 relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <span className="text-indigo-500 font-bold">$</span>
                                </div>
                                <input
                                    type="text"
                                    value={terminalInput}
                                    onChange={(e) => setTerminalInput(e.target.value)}
                                    placeholder="Enter shell command..."
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-4 pl-10 pr-6 text-indigo-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                            >
                                Run
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
            {/* Admin Login Modal (LogMeIn Style) */}
            {showAdminLogin && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl border border-slate-200 animate-slide-up">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#004172] rounded-xl flex items-center justify-center shadow-lg">
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#004172] tracking-tight">Administrator Login</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verify Identity to Proceed</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAdminLogin(false);
                                    setLoginError('');
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Username</label>
                                <input
                                    type="text"
                                    value={adminUsername}
                                    onChange={(e) => setAdminUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#004172] focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    placeholder="Enter admin ID"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#004172] focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {loginError && (
                                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold">{loginError}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#004172] hover:bg-[#002a4a] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Authenticate
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in-left {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-left { animation: fade-in-left 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
                .animate-fade-in { animation: fade-in 0.4s ease-out backwards; }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div >
    );
}
