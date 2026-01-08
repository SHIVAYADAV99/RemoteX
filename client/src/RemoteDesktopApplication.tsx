import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Share2, Hand, MousePointer, Keyboard, Video, VideoOff, Users, Copy, Check, Wifi, Globe, MapPin, Activity, Zap, Shield, ArrowLeft, Settings, Maximize2, XCircle, UserPlus, Info, Lock, ShieldCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { RecordingManager } from './services/RecordingManager';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';

// Pure Utilities
function generateSessionId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getInitialSignalUrl() {
  // ===============================================
  // LAN NETWORK SUPPORT
  // ===============================================

  // 1. Check environment variable first (for production)
  const signalServerUrl = (import.meta as any).env?.VITE_SIGNAL_SERVER_URL;
  if (signalServerUrl) {
    console.log('[RemoteX] Using configured signal server:', signalServerUrl);
    return signalServerUrl;
  }

  // 2. If running in browser (not file://)
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    const hostname = window.location.hostname;

    // 3. If accessing from LAN IP (e.g., 192.168.1.50:5173)
    // Use the same host for signaling server on port 3001
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const lanServerUrl = `http://${hostname}:3001`;
      console.log('[RemoteX] LAN mode detected. Signal server:', lanServerUrl);
      return lanServerUrl;
    }

    // 4. Localhost access - use port 3001 on same origin
    const localhostUrl = window.location.origin.replace(':5173', ':3001');
    console.log('[RemoteX] Localhost mode. Signal server:', localhostUrl);
    return localhostUrl;
  }

  // 5. Fallback for Electron file:// protocol
  console.log('[RemoteX] Electron mode. Signal server: http://127.0.0.1:3001');
  return 'http://127.0.0.1:3001';
}

export default function RemoteXApp() {
  const params = new URLSearchParams(window.location.search);

  // ===============================================
  // ROLE-BASED CONSOLE SEPARATION (Security Boundary)
  // ===============================================
  // Determine console type from URL - this is locked for the session
  const consoleType = params.get('mode') === 'client' ? 'CUSTOMER' :
    params.get('mode') === 'admin' ? 'ADMIN' :
      'UNDEFINED';

  const sessionIdFromUrl = params.get('session') || '';
  const isClientOnly = consoleType === 'CUSTOMER';
  const isAdminOnly = consoleType === 'ADMIN';

  // Mode state - locked based on console type
  const [mode, setMode] = useState<'home' | 'technician' | 'customer'>(() => {
    if (consoleType === 'CUSTOMER' && sessionIdFromUrl) return 'customer';
    if (consoleType === 'ADMIN') return 'home'; // Admin starts at login screen
    return 'home'; // Fallback for direct access (should show console selector)
  });

  useEffect(() => {
    if (consoleType === 'CUSTOMER' && sessionIdFromUrl && mode === 'customer') {
      setInputSessionId(sessionIdFromUrl);
      setSessionId(sessionIdFromUrl);
    }
  }, []);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [remoteControl, setRemoteControl] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [pendingConnection, setPendingConnection] = useState<{ userId: string } | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  const [allowMouseControl, setAllowMouseControl] = useState(true);
  const [allowKeyboardControl, setAllowKeyboardControl] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [userRole, setUserRole] = useState<'Super Admin' | 'Admin / Team Lead' | 'Technician' | 'Read-Only / Auditor'>('Technician');

  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const recordingManagerRef = useRef<RecordingManager>(new RecordingManager());
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const modeRef = useRef(mode);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
    if (sessionId && socketRef.current && socketConnected) {
      socketRef.current.emit('join-room', sessionId);
      addLog(`Joined room: ${sessionId}`);
    }
  }, [sessionId, socketConnected]);

  function addLog(message: string) {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }

  function handleModeChange(newMode: 'home' | 'technician' | 'customer') {
    // ===============================================
    // CONSOLE SEPARATION ENFORCEMENT
    // ===============================================
    // Prevent mode switching across console boundaries
    if (consoleType === 'CUSTOMER' && newMode !== 'customer') {
      console.warn('[RemoteX Security] Customer console cannot access admin modes');
      return;
    }
    if (consoleType === 'ADMIN' && newMode === 'customer') {
      console.warn('[RemoteX Security] Admin console cannot access customer mode');
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 400);
  }

  useEffect(() => {
    if (mode === 'technician' && !sessionId) {
      const newId = generateSessionId();
      setSessionId(newId);
      addLog(`Technician Console initialized. Session ID: ${newId}`);
    }
  }, [mode]);

  // System Info Polling (Customer Only)
  useEffect(() => {
    if (mode !== 'customer') return;
    const poll = async () => {
      if ((window as any).electron?.getSystemInfo) {
        try {
          const info = await (window as any).electron.getSystemInfo();
          setSystemInfo(info);
          if (socketRef.current && sessionId) {
            socketRef.current.emit('system-info', { info, roomId: sessionId });
          }
          if ((window as any).electron?.getProcesses) {
            const procList = await (window as any).electron.getProcesses();
            setProcesses(procList);
            if (socketRef.current && sessionId) socketRef.current.emit('process-list', { processes: procList, roomId: sessionId });
          }
          if ((window as any).electron?.getEventLogs) {
            const logs = await (window as any).electron.getEventLogs();
            setEventLogs(logs);
            if (socketRef.current && sessionId) socketRef.current.emit('system-event-logs', { logs, roomId: sessionId });
          }
        } catch (err) { console.error('System info error:', err); }
      }
    };
    const interval = setInterval(poll, 5000);
    poll();
    return () => clearInterval(interval);
  }, [mode, sessionId, socketConnected]);

  // Screen sharing auto-start for customer
  useEffect(() => {
    if (mode === 'customer' && isConnected && !isSharing) {
      startScreenShare();
    }
  }, [mode, isConnected, isSharing]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (mode === 'customer' && !isConnected && sessionId) {
      timer = setTimeout(() => { setConnectionTimedOut(true); }, 15000);
    }
    return () => clearTimeout(timer);
  }, [mode, isConnected, sessionId]);

  function cleanupPeer() {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  }

  async function startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' as DisplayCaptureSurfaceType } as MediaTrackConstraints,
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute local stream to prevent feedback
      }
      setIsSharing(true);
      const targetId = sessionId || sessionIdRef.current;
      if (socketRef.current && targetId) {
        socketRef.current.emit('join-room', targetId);
        addLog(`Customer broadcast active: ${targetId}`);
      }
      if (peerRef.current && stream) {
        peerRef.current.addStream(stream);
      }
      stream.getVideoTracks()[0].addEventListener('ended', stopScreenShare);
    } catch (err: any) { addLog(`Error: ${err.message}`); }
  }

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    cleanupPeer();
    if (socketRef.current && sessionId) {
      socketRef.current.emit('leave-room', { roomId: sessionId });
    }
    setIsSharing(false);
    setIsConnected(false);
    setViewerCount(0);
    addLog('Session ended');
  };

  const proceedConnection = (overrideId?: string) => {
    const targetId = overrideId || inputSessionId;
    if (targetId.length >= 6 && socketRef.current) {
      setSessionId(targetId);
      socketRef.current.emit('join-room', targetId);
      addLog(`Joining session: ${targetId}`);
      // Start sharing immediately upon joining so stream is ready for peer
      startScreenShare();
    }
  };

  const initPeer = (userId: string, socket: Socket) => {
    cleanupPeer();
    try {
      const peer = new SimplePeer({
        initiator: true,
        stream: mode === 'customer' ? streamRef.current : null,
        trickle: true
      }) as any;

      peer.on('signal', (signal: any) => socket.emit('signal', { to: userId, signal }));
      peer.on('connect', () => {
        addLog(`🤝 WebRTC Handshake Complete with ${userId}`);
        setIsConnected(true);
      });
      peer.on('stream', (remoteStream: MediaStream) => {
        remoteStreamRef.current = remoteStream;
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.muted = false;
          videoRef.current.play().catch(console.error);
        }
        setIsConnected(true);
      });
      peer.on('error', (err: any) => addLog(`Peer error: ${err.message}`));
      peerRef.current = peer;
      setViewerCount(1);
    } catch (err: any) { addLog(`Failed: ${err.message}`); }
  };

  useEffect(() => {
    const socket = io(getInitialSignalUrl(), { transports: ['websocket'], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setIsReconnecting(false);
      if (sessionIdRef.current) {
        socket.emit('join-room', sessionIdRef.current);
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setIsReconnecting(true);
    });

    socket.on('user-connected', (userId: string) => {
      if (modeRef.current === 'technician') {
        setPendingConnection({ userId });
        addLog(`Request from: ${userId}`);
      }
    });

    socket.on('connection-rejected', () => {
      if (modeRef.current === 'customer') {
        setIsRejected(true);
        addLog('Rejected by host');
      }
    });

    socket.on('signal', ({ from, signal }: any) => {
      if (!peerRef.current && modeRef.current === 'customer') {
        setConnectionTimedOut(false);
        const peer = new SimplePeer({ initiator: false, stream: streamRef.current || undefined, trickle: true }) as any;
        peer.on('signal', (sig: any) => socket.emit('signal', { to: from, signal: sig }));
        peer.on('connect', () => setIsConnected(true));
        peer.signal(signal);
        peerRef.current = peer;
      } else if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    socket.on('system-info', setSystemInfo);
    socket.on('process-list', (data: any) => setProcesses(data.processes));
    socket.on('system-event-logs', (data: any) => setEventLogs(data.logs));
    socket.on('fleet-update', setFleet);

    socket.on('kill-process-request', async (data: any) => {
      if (modeRef.current === 'customer' && (window as any).electron?.killProcess) {
        await (window as any).electron.killProcess(data.pid);
      }
    });

    socket.on('run-maintenance-request', async (type: string) => {
      if (modeRef.current === 'customer' && (window as any).electron?.runMaintenanceScript) {
        await (window as any).electron.runMaintenanceScript(type);
      }
    });

    socket.on('get-detailed-diagnostics-request', async (data: any) => {
      if (modeRef.current === 'customer' && (window as any).electron?.getDetailedDiagnostics) {
        const details = await (window as any).electron.getDetailedDiagnostics();
        socket.emit('detailed-diagnostics-result', { details, roomId: data.roomId });
      }
    });

    socket.on('detailed-diagnostics-result', (data: any) => {
      if (modeRef.current === 'technician') {
        window.dispatchEvent(new CustomEvent('detailed-diagnostics', { detail: data.details }));
      }
    });

    socket.on('remote-control', (data: any) => {
      if (modeRef.current === 'customer' && (window as any).electron?.remoteControl) {
        (window as any).electron.remoteControl(data);
      }
    });

    socket.on('execute-shell-request', async (data: any) => {
      if (modeRef.current === 'customer' && (window as any).electron?.executeShellCommand) {
        const result = await (window as any).electron.executeShellCommand(data.command);
        socket.emit('terminal-command-result', { result, roomId: data.roomId });
      }
    });

    socket.on('switch-monitor-request', async (data: any) => {
      if (modeRef.current === 'customer' && (window as any).electron?.switchMonitor) {
        (window as any).electron.switchMonitor(data.index);
        // Re-start screen share to target new source
        await startScreenShare();
        addLog(`Switched to monitor ${data.index}`);
      }
    });

    socket.on('terminal-command-result', (data: any) => {
      // Technicians receive this
      if (modeRef.current === 'technician') {
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: data.result }));
      }
    });

    const register = async () => {
      if (modeRef.current === 'customer' && (window as any).electron?.getMachineId) {
        const deviceId = await (window as any).electron.getMachineId();
        const sys = (window as any).electron?.getSystemInfo ? await (window as any).electron.getSystemInfo() : null;
        if (sys) {
          socket.emit('device-register', {
            deviceId,
            hostname: sys.system.hostname,
            os: `${sys.system.platform} ${sys.system.release}`,
            platform: sys.system.platform,
            uptime: sys.system.uptime
          });
        }
      }
      socket.emit('get-fleet-list');
    };
    register();

    return () => { cleanupPeer(); socket.disconnect(); };
  }, []);

  const handleAcceptConnection = () => {
    if (pendingConnection && socketRef.current) {
      initPeer(pendingConnection.userId, socketRef.current);
      socketRef.current.emit('update-permissions', {
        permissions: { controlMouse: allowMouseControl, controlKeyboard: allowKeyboardControl, viewScreen: true }
      });
      setPendingConnection(null);
    }
  };

  const handleDeclineConnection = () => {
    if (pendingConnection && socketRef.current) {
      socketRef.current.emit('reject-connection', { to: pendingConnection.userId });
      setPendingConnection(null);
    }
  };

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (canvasRef.current && videoRef.current && (isSharing || isConnected)) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [isSharing, isConnected]);

  const handleHomeClick = () => {
    setIsRejected(false);
    handleModeChange('home');
  };

  const handleKillProcess = (pid: string) => {
    if (socketRef.current && sessionId) socketRef.current.emit('kill-process-request', { pid, roomId: sessionId });
  };

  const handleExecuteShell = (command: string) => {
    if (socketRef.current && sessionId) socketRef.current.emit('execute-shell-request', { command, roomId: sessionId });
  };

  const handleSwitchMonitor = (index: number) => {
    if (socketRef.current && sessionId) socketRef.current.emit('switch-monitor-request', { index, roomId: sessionId });
  };

  const handleGetDetailedDiagnostics = () => {
    if (socketRef.current && sessionId) socketRef.current.emit('get-detailed-diagnostics-request', { roomId: sessionId });
  };

  const handleRunMaintenance = (type: string) => {
    if (socketRef.current && sessionId) socketRef.current.emit('run-maintenance-request', { type, roomId: sessionId });
  };

  const handleStartRecording = () => {
    if (remoteStreamRef.current) {
      recordingManagerRef.current.startRecording(remoteStreamRef.current);
      setIsRecording(true);
      addLog('Recording started');
    }
  };

  const handleStopRecording = () => {
    recordingManagerRef.current.stopRecording();
    setIsRecording(false);
    addLog('Recording saved');
  };

  // --- Sub-renders ---

  const renderCustomerView = () => (
    <div className="min-h-screen bg-mesh animate-mesh flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-float-subtle"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-float-subtle" style={{ animationDelay: '-3s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="glass-morphism rounded-[3rem] p-12 text-center border-white/40 shadow-2xl relative overflow-hidden group">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/20 transform group-hover:scale-110 transition-transform duration-500">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
            {isConnected ? 'Support Active' : 'Uplink Pending'}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`px-4 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white flex items-center gap-2 ${isConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
              {isConnected ? 'LIVE CHANNEL' : 'AUTHENTICATING'}
            </div>
          </div>

          <p className="text-slate-500 text-sm mb-12 leading-relaxed font-semibold px-4">
            {isConnected
              ? 'A certified technician has established a secure tunnel and is now providing remote assistance.'
              : `Awaiting technician handshake on authorized session: ${sessionId || inputSessionId}`}
          </p>

          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border-2 border-dashed transition-all duration-500 ${isConnected ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Protocol</p>
              <p className={`font-mono text-lg font-black tracking-widest ${isConnected ? 'text-emerald-700' : 'text-slate-400'}`}>
                {sessionId || inputSessionId || 'Handshake'}
              </p>
            </div>

            <button
              onClick={stopScreenShare}
              className="w-full py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-[2rem] font-black text-[11px] tracking-[0.3em] transition-all shadow-xl shadow-rose-500/30 active:scale-[0.97] uppercase"
            >
              TERMINATE UPLINK
            </button>
          </div>
        </div>

        <div className="mt-12 flex justify-center items-center gap-3 text-slate-400 font-bold opacity-60">
          <Lock className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.3em]">End-to-End Encrypted Tunnel</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {mode === 'technician' ? (
          <Dashboard
            sessionId={sessionId}
            isSharing={isConnected}
            viewerCount={viewerCount}
            logs={logs}
            onStartShare={() => { }}
            onStopShare={stopScreenShare}
            onJoinClick={() => { }}
            onJoinSession={() => { }}
            onHomeClick={handleHomeClick}
            mode="technician"
            socket={socketRef.current}
            userRole={userRole}
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            systemInfo={systemInfo}
            processes={processes}
            onKillProcess={handleKillProcess}
            onRunMaintenance={handleRunMaintenance}
            onExecuteShell={handleExecuteShell}
            onSwitchMonitor={handleSwitchMonitor}
            onGetDetailedDiagnostics={handleGetDetailedDiagnostics}
            eventLogs={eventLogs}
            remoteCanvasRef={canvasRef}
            remoteControl={remoteControl}
            onToggleRemoteControl={() => setRemoteControl(!remoteControl)}
          />
        ) : mode === 'customer' ? (
          renderCustomerView()
        ) : (
          <WelcomeScreen
            consoleType={consoleType}
            onHostClick={(id, pass) => {
              // ===============================================
              // ADMIN CONSOLE AUTHENTICATION
              // ===============================================
              // Only available in Admin Console (not Customer Console)
              if (consoleType !== 'ADMIN' && consoleType !== 'UNDEFINED') {
                console.warn('[RemoteX Security] Host mode not available in Customer Console');
                return false;
              }

              // Enterprise RBAC Credentials
              if (id === 'admin' && pass === 'admin123') {
                setUserRole('Super Admin');
                handleModeChange('technician');
                return true;
              }
              if (id === 'lead' && pass === 'lead123') {
                setUserRole('Admin / Team Lead');
                handleModeChange('technician');
                return true;
              }
              if (id === 'tech' && pass === 'tech123') {
                setUserRole('Technician');
                handleModeChange('technician');
                return true;
              }
              if (id === 'audit' && pass === 'audit123') {
                setUserRole('Read-Only / Auditor');
                handleModeChange('technician');
                return true;
              }
              return false;
            }}
            onClientClick={(id) => {
              // ===============================================
              // CUSTOMER CONSOLE SESSION JOIN
              // ===============================================
              // Only available in Customer Console or fallback mode
              if (consoleType === 'ADMIN') {
                console.warn('[RemoteX Security] Session join not available in Admin Console');
                return;
              }

              setInputSessionId(id);
              handleModeChange('customer');
              proceedConnection(id);
            }}
            publicIP={sessionId}
            clientOnly={isClientOnly}
          />
        )}
      </div>

      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      {pendingConnection && mode === 'technician' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <UserPlus className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Incoming Support Request</h2>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
              A customer is requesting access (ID: <span className="font-mono font-black text-indigo-600">{pendingConnection.userId}</span>).
              Do you want to allow them to view and control your screen?
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MousePointer className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Allow Mouse Control</span>
                </div>
                <button onClick={() => setAllowMouseControl(!allowMouseControl)} className={`w-10 h-5 rounded-full relative ${allowMouseControl ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${allowMouseControl ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Allow Keyboard Input</span>
                </div>
                <button onClick={() => setAllowKeyboardControl(!allowKeyboardControl)} className={`w-10 h-5 rounded-full relative ${allowKeyboardControl ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${allowKeyboardControl ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleDeclineConnection} className="flex-1 py-4 bg-slate-50 hover:bg-rose-50 text-slate-500 rounded-2xl font-bold transition-all">DECLINE</button>
              <button onClick={handleAcceptConnection} className="flex-1 py-4 bg-[#004172] hover:bg-[#002a4a] text-white rounded-2xl font-bold transition-all shadow-lg">ACCEPT</button>
            </div>
          </div>
        </div>
      )}

      {isReconnecting && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
          <Wifi className="w-16 h-16 text-amber-500 animate-bounce" />
          <h2 className="text-2xl font-black text-white mt-8 uppercase">Connection Lost</h2>
          <p className="text-slate-400 mt-2 font-mono text-xs">ATTEMPTING SATELLITE HANDSHAKE RECOVERY...</p>
        </div>
      )}
    </>
  );
}