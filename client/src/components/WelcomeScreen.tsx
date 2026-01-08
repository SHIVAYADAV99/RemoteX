import React from 'react';
import { Monitor, Share2, Zap, Lock, Globe, Shield, ArrowRight, XCircle, AlertCircle, Activity, ShieldCheck, UserPlus } from 'lucide-react';

interface WelcomeScreenProps {
    onHostClick: (id?: string, pass?: string) => boolean;
    onClientClick: (id: string) => void;
    publicIP?: string;
    clientOnly?: boolean;
    consoleType?: string;
}

export default function WelcomeScreen({
    onHostClick,
    onClientClick,
    publicIP = 'Fetching...',
    clientOnly = false,
    consoleType = 'UNDEFINED'
}: WelcomeScreenProps) {
    const [localInputId, setLocalInputId] = React.useState('');
    const [showLogin, setShowLogin] = React.useState(false);
    const [showClientInput, setShowClientInput] = React.useState(false);
    const [id, setId] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleLogin = () => {
        const success = onHostClick(id, password);
        if (success) {
            setError('');
        } else {
            setError('Invalid Technician ID or Password');
        }
    };

    const renderClientInputView = () => (
        <div className="min-h-screen bg-mesh animate-mesh flex items-center justify-center p-6 font-sans">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-float-subtle"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-float-subtle" style={{ animationDelay: '-3s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in">
                <div className="glass-morphism rounded-[3rem] p-12 text-center border-white/40 shadow-2xl relative overflow-hidden group">
                    <button onClick={() => setShowClientInput(false)} className="absolute top-8 left-8 p-2 bg-white/50 hover:bg-white rounded-xl transition-all border border-white/20 group/back">
                        <ArrowRight className="w-4 h-4 rotate-180 text-slate-400 group-hover:text-blue-600" />
                    </button>

                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/20 transform group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Enter Token</h2>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="px-3 py-1 bg-blue-50/50 backdrop-blur-md rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">Encrypted Handshake</div>
                    </div>

                    <div className="space-y-8 max-w-sm mx-auto">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Secure Session Token</label>
                            <div className="p-1 bg-slate-900/5 rounded-3xl border border-white/50 shadow-inner">
                                <input
                                    type="text"
                                    value={localInputId}
                                    onChange={(e) => setLocalInputId(e.target.value.toUpperCase().slice(0, 8))}
                                    placeholder="•••• ••••"
                                    className="w-full py-5 bg-transparent text-center font-mono text-3xl font-black text-[#004172] tracking-[0.4em] outline-none placeholder:text-slate-300"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && localInputId.length >= 6 && onClientClick(localInputId)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => onClientClick(localInputId)}
                            disabled={localInputId.length < 6}
                            className={`w-full py-6 rounded-3xl font-black text-xs tracking-[0.25em] flex items-center justify-center gap-4 transition-all shadow-2xl uppercase
                                ${localInputId.length < 6
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-blue-500/40 active:scale-[0.97]'
                                }`}
                        >
                            CONNECT TO NODE
                            <Zap className="w-4 h-4 fill-white animate-pulse" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (clientOnly || showClientInput) {
        return renderClientInputView();
    }

    if (showLogin) {
        return (
            <div className="min-h-screen bg-mesh animate-mesh flex items-center justify-center p-6 font-sans">
                <div className="relative z-10 w-full max-w-md animate-fade-in">
                    <div className="glass-morphism rounded-[3.5rem] p-12 border-white/30 shadow-2xl">
                        <button onClick={() => setShowLogin(false)} className="mb-10 flex items-center gap-3 text-slate-400 hover:text-[#004172] transition-all font-black text-[10px] uppercase tracking-widest group">
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:-translate-x-1 transition-transform">
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </div>
                            PORTAL GATEWAY
                        </button>

                        <div className="text-center mb-12">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-slate-100 shadow-slate-900/20">
                                <Shield className="w-12 h-12 text-indigo-400" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
                            <p className="text-slate-400 text-[10px] mt-3 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                Secure Credential Vault
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Technician ID</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                        placeholder="Admin/Tech ID"
                                        className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-3xl pl-16 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Master Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="••••••••"
                                        className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-3xl pl-16 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-200"
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase tracking-wider animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleLogin}
                                className="w-full py-6 mt-8 bg-slate-900 hover:bg-black text-white rounded-3xl font-black tracking-[0.3em] uppercase text-[11px] shadow-2xl hover:shadow-slate-900/40 active:scale-[0.97] transition-all"
                            >
                                AUTHORIZE SESSION
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh animate-mesh flex items-center justify-center p-6 font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl">
                {/* Visual Branding */}
                <div className="flex flex-col items-center mb-24 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#004172] to-[#0078d4] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-900/30 mb-8 border border-white/20">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-6xl font-black text-[#004172] tracking-tighter leading-none mb-3">RemoteX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">ULTRA</span></h1>
                        <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.6em] ml-2">Secure Managed Support Framework</p>
                    </div>
                </div>

                {/* Main Gateway Rails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch px-4">

                    {/* Admin Rail - ONLY in Admin Console or Undefined */}
                    {consoleType !== 'CUSTOMER' && (
                        <div className="glass-morphism rounded-[4rem] p-14 flex flex-col items-center text-center animate-fade-in border-white group relative bento-card">
                            <div className="absolute top-10 right-10 px-4 py-1.5 bg-indigo-500/10 text-[10px] font-black text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-[0.2em] backdrop-blur-md">Admin Portal</div>

                            <div className="w-28 h-28 bg-indigo-50/50 rounded-[2.5rem] flex items-center justify-center mb-10 border-2 border-white ring-8 ring-indigo-50/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Monitor className="w-14 h-14 text-indigo-600" />
                            </div>

                            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Technician Console</h2>
                            <p className="text-slate-500/80 text-sm mb-14 max-w-xs leading-relaxed font-semibold">Enterprise dashboard for fleet management, diagnostics, and session orchestration.</p>

                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full py-7 bg-slate-900 hover:bg-black text-white rounded-[2.2rem] font-black text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98] uppercase"
                            >
                                <Lock className="w-4 h-4 text-indigo-400" />
                                AUTHORIZE CONSOLE
                            </button>
                        </div>
                    )}

                    {/* Client Rail - ONLY in Customer Console or Undefined */}
                    {consoleType !== 'ADMIN' && (
                        <div className="glass-morphism rounded-[4rem] p-14 flex flex-col items-center text-center animate-fade-in border-white group relative bento-card" style={{ animationDelay: '0.1s' }}>
                            <div className="absolute top-10 right-10 px-4 py-1.5 bg-emerald-500/10 text-[10px] font-black text-emerald-700 rounded-full border border-emerald-200 uppercase tracking-[0.2em] backdrop-blur-md">Public Node</div>

                            <div className="w-28 h-28 bg-emerald-50/50 rounded-[2.5rem] flex items-center justify-center mb-10 border-2 border-white ring-8 ring-emerald-50/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                <UserPlus className="w-14 h-14 text-emerald-600" />
                            </div>

                            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Receive Support</h2>
                            <p className="text-slate-500/80 text-sm mb-14 max-w-xs leading-relaxed font-semibold">Immediate session entry point for users requiring technical assistance.</p>

                            <div className="w-full space-y-4">
                                <button
                                    onClick={() => setShowClientInput(true)}
                                    className="w-full py-7 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-[2.2rem] font-black text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-emerald-500/20 active:scale-[0.98] uppercase"
                                >
                                    <Zap className="w-5 h-5 fill-white animate-pulse" />
                                    START SUPPORT SESSION
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Precision Indicators */}
                <div className="mt-24 flex flex-wrap justify-center gap-16 text-slate-400/50 grayscale hover:grayscale-0 transition-all duration-700 font-black">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-[0.4em]">Sub-10ms Latency</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-[0.4em]">AES-256 GCM</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-[0.4em]">SD-WAN Fabric</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
