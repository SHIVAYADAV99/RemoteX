import React from 'react';
import { Monitor, Share2, Zap, Lock, Gamepad2, Globe } from 'lucide-react';

interface WelcomeScreenProps {
    onHostClick: () => void;
    onClientClick: (id: string) => void;
    publicIP?: string;
}

export default function WelcomeScreen({ onHostClick, onClientClick, publicIP = 'Fetching...' }: WelcomeScreenProps) {
    const [localInputId, setLocalInputId] = React.useState('');
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleCharChange = (index: number, value: string) => {
        const char = value.toUpperCase().slice(-1);
        if (!char.match(/[A-Z0-9]/) && char !== '') return;

        const newId = localInputId.split('');
        newId[index] = char;
        const finalId = newId.join('');
        setLocalInputId(finalId);

        if (char && index < 7) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !localInputId[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 relative overflow-hidden flex items-center justify-center font-sans">
            {/* Dynamic Mouse Glow */}
            <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 80%)`
                }}
            ></div>

            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="world-map-overlay bg-world-map opacity-[0.03] scale-110"></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-6xl w-full">
                {/* Brand Section */}
                <div className="mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] shadow-2xl shadow-indigo-500/40 mb-8 animate-float relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all"></div>
                        <Monitor className="w-10 h-10 text-white relative z-10" />
                    </div>
                    <h1 className="text-7xl font-black text-white mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                        RemoteX
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-indigo-500"></span>
                        <p className="text-sm text-indigo-300 font-bold uppercase tracking-[0.4em]">AETHER-STREAMS v2.5</p>
                        <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-indigo-500"></span>
                    </div>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16 items-stretch">
                    {/* Host Panel */}
                    <div className="md:col-span-2 group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative h-full bg-[#0a0f1e]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all duration-500">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                                <Share2 className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Initialize Host</h3>
                            <p className="text-slate-500 text-xs mb-8 max-w-[200px] leading-relaxed">Broadcast your workspace to the encrypted aether-net instantly.</p>

                            <button
                                onClick={onHostClick}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2 group/btn"
                            >
                                START SESSION
                                <Zap className="w-3 h-3 group-hover/btn:animate-pulse" />
                            </button>
                        </div>
                    </div>

                    {/* Join Panel */}
                    <div className="md:col-span-3 group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative h-full bg-[#0a0f1e]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all duration-500">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Intercept Session</h3>
                            <p className="text-slate-500 text-xs mb-8 leading-relaxed">Enter the unique 8-character hash key to connect.</p>

                            <div className="w-full space-y-6">
                                {/* Character Grid Input */}
                                <div className="flex justify-center gap-2">
                                    {[...Array(8)].map((_, i) => (
                                        <input
                                            key={i}
                                            ref={el => inputRefs.current[i] = el}
                                            type="text"
                                            value={localInputId[i] || ''}
                                            onChange={(e) => handleCharChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className={`w-10 h-14 bg-black/40 border ${localInputId[i] ? 'border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/10 text-slate-600'} rounded-xl text-center font-mono text-xl font-black outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`}
                                            maxLength={1}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => onClientClick(localInputId)}
                                    disabled={localInputId.length < 8}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all shadow-xl
                                        ${localInputId.length < 8
                                            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95 border border-indigo-400/20'
                                        }`}
                                >
                                    ESTABLISH UPLINK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Stats Interface */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in opacity-60 hover:opacity-100 transition-opacity">
                    {[
                        { icon: Zap, label: '0.04ms', sub: 'Latency Delay' },
                        { icon: Lock, label: 'AES-256', sub: 'Encrypted' },
                        { icon: Globe, label: 'Auto', sub: 'Server Mesh' },
                        { icon: Monitor, label: '120 FPS', sub: 'Liquid Stream' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 text-left group hover:bg-white/10 transition-all cursor-default">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/10 group-hover:border-indigo-500/30">
                                <item.icon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-fade-in { animation: fadeIn 1s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
