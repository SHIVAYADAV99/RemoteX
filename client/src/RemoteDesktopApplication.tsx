import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Share2, Hand, MousePointer, Keyboard, Video, VideoOff, Users, Copy, Check, WifiOff, Wifi, Settings, Maximize2, Minimize2 } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

export default function RemoteXApp() {
  const [mode, setMode] = useState('home');
  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [remoteControl, setRemoteControl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      addLog('Connected to signaling server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      addLog('Disconnected from signaling server');
      setIsConnected(false);
    });

    // WebRTC signaling handlers
    socketRef.current.on('offer', async (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => {
      addLog('Received offer from peer');
      if (peerConnectionRef.current && socketRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socketRef.current.emit('answer', {
          sessionId: data.sessionId,
          answer: answer
        });
      }
    });

    socketRef.current.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      addLog('Received answer from peer');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      addLog('Received ICE candidate');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startScreenShare = async () => {
    try {
      // Generate session ID immediately (even before socket check)
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setIsSharing(true);
      setMode('host'); // Set mode to host when starting screen share
      addLog(`📝 Session ID Generated: ${newSessionId}`);

      // Check if socket is connected
      if (!socketRef.current || !socketRef.current.connected) {
        addLog('⏳ Waiting for server connection...');
        // Try to connect automatically
        if (socketRef.current) {
          socketRef.current.connect();
          // Wait up to 5 seconds for connection
          for (let i = 0; i < 50; i++) {
            if (socketRef.current.connected) {
              addLog('✅ Server connected!');
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        if (!socketRef.current || !socketRef.current.connected) {
          addLog('❌ ERROR: Cannot connect to signaling server on port 3000.');
          addLog('💡 FIX: Run this in a new terminal: cd server && npm start');
          alert('Cannot connect to signaling server.\n\nPlease start it:\ncd server\nnpm start');
        }
      }

      addLog('🔄 Requesting screen sharing permission...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      addLog('Screen sharing permission granted');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog('Video stream assigned to preview');
      }

      // Create WebRTC peer connection
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      addLog('WebRTC peer connection created');

      // Add stream to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
        addLog('Stream tracks added to peer connection');
      }

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            sessionId: newSessionId,
            candidate: event.candidate
          });
          addLog('ICE candidate sent to server');
        }
      };

      addLog(`Screen sharing started. Session ID: ${newSessionId}`);

      // Create offer and send to server
      if (peerConnectionRef.current && socketRef.current && socketRef.current.connected) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socketRef.current.emit('create-session', {
          sessionId: newSessionId,
          offer: offer
        });
        addLog('🌐 WebRTC offer sent to signaling server');
      } else {
        addLog('⚠️ Warning: Server not connected - local preview available only');
      }

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        addLog('Screen sharing ended by user');
        stopScreenShare();
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Screen share error:', err);
      addLog(`Error starting screen share: ${errorMessage}`);
      alert(`Failed to start screen share: ${errorMessage}`);
      setIsSharing(false);
      setSessionId('');
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsSharing(false);
    setIsConnected(false);
    addLog('Screen sharing stopped');
  };

  const connectToSession = async () => {
    if (inputSessionId.length >= 6) {
      setSessionId(inputSessionId);

      // Create WebRTC peer connection for client
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event: RTCTrackEvent) => {
        console.log('Track received:', event.track.kind, event.streams);
        addLog(`Remote track received: ${event.track.kind}`);

        if (videoRef.current) {
          // Robust stream assignment
          if (event.streams && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
          } else {
            // Fallback if no stream is in the event
            const inboundStream = new MediaStream();
            inboundStream.addTrack(event.track);
            videoRef.current.srcObject = inboundStream;
          }

          // Force play
          videoRef.current.play().catch(e => console.error('Video play error:', e));
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            sessionId: inputSessionId,
            candidate: event.candidate
          });
        }
      };

      setIsConnected(true);
      addLog(`Connecting to session: ${inputSessionId}`);

      // Request to join session
      if (socketRef.current) {
        socketRef.current.emit('join-session', {
          sessionId: inputSessionId
        });
      }
    }
  };

  // Canvas rendering loop
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (remoteControl && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or better
          // Draw video frame to canvas
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      } else if (!remoteControl && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        // Debug log every 60 frames (~1 sec)
        if (Math.random() < 0.01) {
          console.log('Render debug:', {
            readyState: videoRef.current.readyState,
            paused: videoRef.current.paused,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight
          });
        }

        if (ctx && videoRef.current.readyState >= 2) {
          // Resize canvas to match video if needed, or scale video to canvas
          // Ideally we respect aspect ratio. For now, stretch to fill like before.
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (mode === 'client' && isConnected) {
      renderLoop();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mode, isConnected, remoteControl]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!remoteControl) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    addLog(`Remote click at (${Math.round(x)}, ${Math.round(y)})`);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!remoteControl) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo and header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/50 mb-6">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
            RemoteX
          </h1>
          <p className="text-xl text-slate-400">
            Next-generation remote desktop platform
          </p>
        </div>

        {/* Main action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-12">
          <button
            onClick={() => setMode('host')}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-indigo-500/50 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/20 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Host Session</h3>
              <p className="text-slate-400">Share your screen with others securely</p>
            </div>
          </button>

          <button
            onClick={() => setMode('client')}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 shadow-2xl hover:shadow-purple-500/20 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Join Session</h3>
              <p className="text-slate-400">Connect to a remote desktop</p>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="max-w-4xl w-full bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Platform Features</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm text-slate-300 font-medium">Low Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-sm text-slate-300 font-medium">Encrypted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-sm text-slate-300 font-medium">Remote Control</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🌐</div>
              <div className="text-sm text-slate-300 font-medium">Cross-Platform</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHost = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Top bar */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              stopScreenShare();
              setMode('home');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Host Session</h1>
              <p className="text-xs text-slate-400">Screen Sharing Active</p>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!isSharing ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <button
              onClick={startScreenShare}
              disabled={!isConnected}
              className={`group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-20 transition-all duration-500 shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 ${isConnected
                ? 'hover:border-indigo-500/50 animate-pulse cursor-pointer'
                : 'opacity-50 cursor-not-allowed border-slate-600/50'
                }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${isConnected
                ? 'from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/20 group-hover:to-purple-500/20'
                : 'from-slate-600/20 to-slate-700/20'
                }`}></div>
              <div className="relative flex flex-col items-center">
                <div className={`w-28 h-28 bg-gradient-to-br rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 shadow-2xl ${isConnected
                  ? 'from-indigo-500 to-purple-600 group-hover:scale-110 shadow-indigo-500/50'
                  : 'from-slate-600 to-slate-700 shadow-slate-700/50'
                  }`}>
                  <Video className="w-14 h-14 text-white animate-pulse" />
                </div>
                <h2 className={`text-4xl font-black mb-3 transition-colors duration-300 ${isConnected
                  ? 'text-white group-hover:text-indigo-300'
                  : 'text-slate-500'
                  }`}>
                  {isConnected ? 'Start Screen Share' : 'Waiting for Connection...'}
                </h2>
                <p className={`text-lg transition-colors duration-300 ${isConnected
                  ? 'text-slate-400 group-hover:text-slate-300'
                  : 'text-slate-500'
                  }`}>
                  {isConnected ? 'Click to begin sharing your screen' : 'Please wait for server connection'}
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session info card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-bold text-green-400 uppercase tracking-wider animate-pulse">SESSION ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 px-8 py-6 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                      <code className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">
                        {sessionId}
                      </code>
                    </div>
                    <button
                      onClick={copySessionId}
                      className={`px-6 py-4 rounded-2xl transition-all duration-300 flex items-center gap-3 text-white font-bold shadow-lg transform hover:scale-105 ${copied
                        ? 'bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/30'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30'
                        }`}
                    >
                      {copied ? <Check className="w-6 h-6 animate-bounce" /> : <Copy className="w-6 h-6" />}
                      <span className="text-lg">{copied ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Share this ID with others to connect</p>
                </div>

                <button
                  onClick={stopScreenShare}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-medium shadow-lg shadow-red-500/30"
                >
                  <VideoOff className="w-5 h-5" />
                  Stop Sharing
                </button>
              </div>
            </div>

            {/* Video preview */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Your Screen Preview</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span>Connected</span>
                </div>
              </div>
              <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Activity Log</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-sm font-mono text-slate-400 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/30 animate-fade-in">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClient = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top bar */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setIsConnected(false);
              setMode('home');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-300 hover:text-white"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Remote Desktop</h1>
              <p className="text-xs text-slate-400">
                {isConnected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>

          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl items-center justify-center mb-4">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Join Session</h2>
                <p className="text-slate-400">Enter the session ID to connect</p>
              </div>

              <input
                type="text"
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value.toUpperCase())}
                placeholder="SESSION ID"
                className="w-full px-6 py-4 bg-slate-900/80 border border-slate-700/50 rounded-xl text-center text-2xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all mb-4"
                maxLength={8}
              />

              <button
                onClick={connectToSession}
                disabled={inputSessionId.length < 6}
                className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 rounded-2xl transition-all duration-300 font-black text-white text-xl shadow-2xl shadow-purple-500/30 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 transform disabled:transform-none animate-pulse disabled:animate-none"
              >
                Connect to Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connection status */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-green-400 uppercase tracking-wider animate-pulse">Connected to</div>
                      <code className="text-xl font-mono font-black text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{sessionId}</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRemoteControl(!remoteControl)}
                    className={`px-5 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg ${remoteControl
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-green-500/30'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50'
                      }`}
                  >
                    <Hand className="w-5 h-5" />
                    Remote Control {remoteControl ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setIsConnected(false)}
                    className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 text-white font-medium shadow-lg shadow-red-500/30"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Remote screen */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Remote Screen</h3>
                <button className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors">
                  <Maximize2 className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Hidden video element to receive stream */}
              {/* Hidden video element to receive stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted // CRITICAL for autoplay
                className="absolute opacity-0 pointer-events-none -z-10" // invisible but rendered
                onLoadedMetadata={() => {
                  addLog(`Stream loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
                  if (videoRef.current) {
                    videoRef.current.play().catch(e => addLog(`Autoplay error: ${e.message}`));
                  }
                }}
              />

              <div
                className="relative bg-black rounded-xl overflow-hidden cursor-crosshair shadow-2xl"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
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

              {remoteControl && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <button className="group px-6 py-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-blue-600/80 hover:to-blue-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-slate-300 hover:text-white border border-slate-600/50 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/20 transform hover:scale-105">
                    <MousePointer className="w-5 h-5 group-hover:animate-bounce" />
                    <span className="font-semibold">Left Click</span>
                  </button>
                  <button className="group px-6 py-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-red-600/80 hover:to-red-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-slate-300 hover:text-white border border-slate-600/50 hover:border-red-500/50 shadow-lg hover:shadow-red-500/20 transform hover:scale-105">
                    <MousePointer className="w-5 h-5 group-hover:animate-bounce" />
                    <span className="font-semibold">Right Click</span>
                  </button>
                  <button className="group px-6 py-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-purple-600/80 hover:to-purple-700/80 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20 transform hover:scale-105">
                    <Keyboard className="w-5 h-5 group-hover:animate-bounce" />
                    <span className="font-semibold">Send Keys</span>
                  </button>
                </div>
              )}
            </div>

            {/* Activity log */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Activity Log</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-sm font-mono text-slate-400 bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/30 animate-fade-in">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`transition-all duration-500 ease-in-out ${mode === 'home' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {mode === 'home' && renderHome()}
      </div>
      <div className={`transition-all duration-500 ease-in-out ${mode === 'host' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {mode === 'host' && renderHost()}
      </div>
      <div className={`transition-all duration-500 ease-in-out ${mode === 'client' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {mode === 'client' && renderClient()}
      </div>
    </>
  );
}