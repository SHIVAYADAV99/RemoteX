import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Share2, Hand, MousePointer, Keyboard, Video, VideoOff, Users, Copy, Check, Wifi, Globe, MapPin, Activity, Zap, Shield, ArrowLeft, Settings, Maximize2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';

// Mock connection data for the global map
const mockConnections = [
  { id: 1, from: { lat: 40.7128, lng: -74.0060, city: 'New York' }, to: { lat: 51.5074, lng: -0.1278, city: 'London' } },
  { id: 2, from: { lat: 40.7128, lng: -74.0060, city: 'New York' }, to: { lat: 35.6762, lng: 139.6503, city: 'Tokyo' } },
];

export default function RemoteXApp() {
  const [mode, setMode] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeChange = (newMode: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 400); // Transition duration
  };

  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [remoteControl, setRemoteControl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [showGlobalMap, setShowGlobalMap] = useState(false);

  // OS Detection
  const [osName, setOsName] = useState('Unknown OS');

  // Use refs for mode and sessionId for socket listeners
  const modeRef = useRef(mode);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (navigator.userAgent.indexOf('Win') !== -1) setOsName('Windows');
    else if (navigator.userAgent.indexOf('Mac') !== -1) setOsName('MacOS');
    else if (navigator.userAgent.indexOf('Linux') !== -1) setOsName('Linux');
    else if (navigator.userAgent.indexOf('Android') !== -1) setOsName('Android');
    else if (navigator.userAgent.indexOf('like Mac') !== -1) setOsName('iOS');
  }, []);

  // Timeout state for connection failure
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (mode === 'client' && !isConnected) {
      timer = setTimeout(() => {
        setConnectionTimedOut(true);
      }, 10000); // 10 seconds timeout
    }
    return () => clearTimeout(timer);
  }, [mode, isConnected]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<any>(null); // SimplePeer instance
  const [socketConnected, setSocketConnected] = useState(false);
  const getInitialSignalUrl = () => {
    // If served from the server (http/https), let Socket.io determine the URL (same origin)
    if (window.location.protocol !== 'file:') {
      return window.location.origin;
    }

    // Fallback for file:// protocol (local testing without server hosting)
    return 'http://127.0.0.1:3001';
  };

  const [signalServerUrl, setSignalServerUrl] = useState(getInitialSignalUrl());

  const cleanupPeer = () => {
    if (peerRef.current) {
      console.log('🧹 Cleaning up existing peer instance');
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' as DisplayCaptureSurfaceType
        } as MediaTrackConstraints,
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsSharing(true);
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      addLog(`Screen sharing started. Session ID: ${newSessionId}`);

      // Create host room on signaling server
      if (socketRef.current) {
        socketRef.current.emit('join-room', { roomId: newSessionId, isHost: true });
        addLog(`Room created on server: ${newSessionId}`);
      }

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (err: any) {
      addLog(`Error starting screen share: ${err.message}`);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    cleanupPeer();
    setIsSharing(false);
    setIsConnected(false);
    setViewerCount(0);
    addLog('Screen sharing stopped');
  };

  const connectToSession = () => {
    if (inputSessionId.length >= 6 && socketRef.current) {
      proceedConnection();
    }
  };

  const proceedConnection = () => {
    if (inputSessionId.length >= 6 && socketRef.current) {
      setSessionId(inputSessionId);
      addLog(`Joining session: ${inputSessionId}`);
      socketRef.current.emit('join-room', { roomId: inputSessionId, isHost: false });
      console.log('🔗 Client joining room:', inputSessionId);
      setMode('client');
    }
  };

  const lastInitRef = useRef<number>(0);

  const initPeer = (userId: string, socket: Socket) => {
    const now = Date.now();
    if (now - lastInitRef.current < 1000) {
      console.log('⚠️ Skipping rapid peer initialization (guard)');
      return;
    }
    lastInitRef.current = now;

    console.log('👤 Initiating Peer connection to:', userId);
    addLog(`Initiating connection to ${userId}`);

    cleanupPeer();

    if (streamRef.current) {
      console.log('🔍 Diagnostic: SimplePeer type:', typeof SimplePeer);
      console.log('🔍 Diagnostic: global.Buffer:', !!(window as any).Buffer);
      console.log('🔍 Diagnostic: global.EventEmitter:', !!(window as any).EventEmitter);
      console.log('🔍 Diagnostic: global.process:', !!(window as any).process);
      console.log('🔍 Diagnostic: global.stream:', !!(window as any).stream);
      console.log('🔍 Diagnostic: global.util:', !!(window as any).util);
      console.log('🔍 Diagnostic: Stream state:', streamRef.current.active ? 'Active' : 'Inactive');
      console.log('🔍 Diagnostic: Stream tracks:', streamRef.current.getTracks().length);

      try {
        const peer = new SimplePeer({
          initiator: true,
          stream: streamRef.current,
          trickle: true
        }) as any;

        console.log('📡 Peer connection: ICE Gathering started');

        peer.on('signal', (signal: any) => {
          console.log(`📡 Peer signaling: Sending ${signal.type || 'ICE'} to ${userId}`);
          socket.emit('signal', { to: userId, signal });
        });

        peer.on('connect', () => {
          console.log('🤝 WebRTC Connected!');
          addLog(`Successfully connected to ${userId}`);
        });

        peer.on('error', (err: Error) => {
          console.error('Peer error:', err);
          addLog(`Peer error: ${err.message}`);
        });

        peerRef.current = peer;
        setViewerCount(1);
      } catch (err: any) {
        console.error('❌ CRITICAL: SimplePeer constructor failed:', err);
        addLog(`Connection failed: ${err.message}`);
      }
    } else {
      console.log('⚠️ No stream found when initializing peer');
    }
  };

  // Socket.IO and WebRTC Setup
  useEffect(() => {
    console.log('🔌 Initializing Socket.IO connection to:', signalServerUrl);
    const socket = io(signalServerUrl, {
      transports: ['websocket'], // Force WebSocket to avoid XHR polling issues with file://
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Connected to signaling server');
      setSocketConnected(true);
      addLog('Connected to signaling server');

      // Auto-rejoin if we have a session active
      if (sessionIdRef.current && (modeRef.current === 'host' || modeRef.current === 'client')) {
        console.log(`🔄 Auto-rejoining session: ${sessionIdRef.current}`);
        socket.emit('join-room', {
          roomId: sessionIdRef.current,
          isHost: modeRef.current === 'host'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from signaling server');
      setSocketConnected(false);
      addLog('Disconnected from signaling server');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      addLog(`Connection error: ${error.message}`);
    });

    // Handle viewer joining (when you're the host)
    socket.on('user-connected', (userId: string) => {
      if (modeRef.current === 'host') {
        initPeer(userId, socket);
      }
    });

    // Handle signaling for WebRTC
    socket.on('signal', ({ from, signal }: { from: string; signal: any }) => {
      console.log(`📡 Received signal (${signal.type || 'ICE'}) from ${from}`);

      if (!peerRef.current && modeRef.current === 'client') {
        setConnectionTimedOut(false); // Reset timeout if we get a signal
        const peer = new SimplePeer({
          initiator: false,
          trickle: true
        }) as any;

        peer.on('signal', (responseSignal: any) => {
          console.log(`📡 Peer signaling: Sending ${responseSignal.type || 'ICE'} response to ${from}`);
          socket.emit('signal', { to: from, signal: responseSignal });
        });

        peer.on('connect', () => {
          console.log('🤝 WebRTC Connected (Client)!');
          setIsConnected(true);
        });

        peer.on('stream', (remoteStream: MediaStream) => {
          console.log('🎬 Received remote stream!');
          addLog('Remote stream received');

          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.error('Play error:', e));
          }
          setIsConnected(true);
        });

        peer.on('error', (err: Error) => {
          console.error('Peer error:', err);
          addLog(`Peer error: ${err.message}`);
        });

        peer.signal(signal);
        peerRef.current = peer;
      } else if (peerRef.current) {
        (peerRef.current as any).signal(signal);
      }
    });

    socketRef.current = socket;

    return () => {
      cleanupPeer();
      socket.disconnect();
    };
  }, [signalServerUrl]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!remoteControl) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && socketRef.current) {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      socketRef.current.emit('remote-control', {
        type: 'click',
        x,
        y,
        sessionId
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (remoteControl && rect && socketRef.current) {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      socketRef.current.emit('remote-control', {
        type: 'move',
        x,
        y,
        sessionId
      });
    }
  };

  // Canvas rendering loop
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (canvasRef.current && videoRef.current && (isSharing || isConnected)) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSharing, isConnected]);

  // --- Render Functions ---

  const handleHomeClick = () => {
    handleModeChange('home');
  };

  const currentView = () => {
    if (mode === 'home') {
      return <WelcomeScreen
        onHostClick={() => handleModeChange('host')}
        onClientClick={(id) => {
          setInputSessionId(id);
          proceedConnection();
        }}
      />;
    }

    if (mode === 'host') {
      return <Dashboard
        sessionId={sessionId}
        isSharing={isSharing}
        viewerCount={viewerCount}
        logs={logs}
        onStartShare={startScreenShare}
        onStopShare={stopScreenShare}
        onJoinClick={() => handleModeChange('home')}
        onHomeClick={handleHomeClick}
      />;
    }

    if (mode === 'client') {
      return renderClient();
    }

    return null;
  };

  // Client Render with Timeout Logic
  const renderClient = () => {
    return (
      <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(67,56,202,0.1),_rgba(2,6,23,0.7))]"></div>

          <div className="relative z-10 flex flex-col h-screen">
            {!isConnected ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  {!connectionTimedOut ? (
                    <>
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 animate-pulse">
                        <Zap className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Connecting...</h2>
                      <p className="text-slate-500 max-w-xs mx-auto">Establishing secure end-to-end channel to <span className="text-indigo-400 font-mono">{sessionId}</span></p>
                    </>
                  ) : (
                    <div className="animate-fade-in p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl">
                      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <Activity className="w-10 h-10 text-red-500" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Access Denied</h2>
                      <p className="text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
                        Handshake timed out for session <span className="font-mono text-red-400 font-bold">{sessionId}</span>.
                        Ensure the host is online and sharing.
                      </p>
                      <div className="flex items-center gap-4 justify-center">
                        <button
                          onClick={() => {
                            setConnectionTimedOut(false);
                            proceedConnection();
                          }}
                          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl shadow-indigo-600/30"
                        >
                          RETRY HANDSHAKE
                        </button>
                        <button onClick={handleHomeClick} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold transition-all">
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                  {!connectionTimedOut && (
                    <button onClick={handleHomeClick} className="mt-8 text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest text-xs transition-colors underline underline-offset-8">Abort Connection Attempt</button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-black/40 backdrop-blur-2xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                      <span className="font-black text-white tracking-tight uppercase text-sm">Target: {sessionId}</span>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${networkQuality === 'good' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      networkQuality === 'poor' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      <Wifi className={`w-3 h-3 ${networkQuality !== 'good' ? 'animate-pulse' : ''}`} />
                      Signal: {networkQuality}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRemoteControl(!remoteControl)}
                      className={`px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all border ${remoteControl
                        ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <MousePointer className="w-3 h-3" />
                      Interaction: {remoteControl ? 'ACTIVE' : 'LOCKED'}
                    </button>
                    <button
                      onClick={() => setIsConnected(false)}
                      className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all"
                    >
                      DISCONNECT
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-black flex items-center justify-center relative group overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="max-h-full max-w-full object-contain shadow-2xl"
                    onMouseMove={(e) => {
                      if (!remoteControl) return;
                      handleCanvasMouseMove(e);
                    }}
                    onClick={handleCanvasClick}
                  />

                  {!remoteControl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] pointer-events-none">
                      <div className="bg-slate-900/80 border border-white/10 px-8 py-4 rounded-2xl text-center shadow-2xl">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-indigo-400 opacity-50" />
                        <p className="text-white font-black text-xs tracking-widest uppercase">Remote Control Restricted</p>
                        <p className="text-slate-500 text-[10px] mt-1 font-bold">ENABLE INTERACTION TO CONTROL TARGET</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;700;900&display=swap');
        body { font-family: 'Outfit', sans-serif; background: #020617; }
        .transition-layer {
            position: fixed; inset: 0; z-index: 100; pointer-events: none;
            background: #6366f1; opacity: 0; transition: opacity 0.4s ease-in-out;
        }
        .transition-active { opacity: 0.1; }
      `}</style>

      <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
        {currentView()}
      </div>

      <div className={`transition-layer ${isTransitioning ? 'transition-active' : ''}`}></div>

      {/* Hidden video element for WebRTC stream */}
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
    </>
  );
}

// Global Map Component (Mock)
function GlobalMapView() {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-fade-in p-12 flex items-center justify-center">
      <div className="text-white text-center">
        <Globe className="w-24 h-24 text-blue-500 mx-auto mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold mb-2">Global Network Map</h2>
        <p className="text-slate-400">Visualizing active connections (Mock Data)</p>
        {/* SVG Map would go here */}
      </div>
    </div>
  )
}