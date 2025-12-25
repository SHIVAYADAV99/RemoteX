import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Share2, Video, VideoOff, Copy, Lock } from 'lucide-react';
import io from 'socket.io-client';

export default function RemoteDesktopApp() {
  const [mode, setMode] = useState('home');
  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [logs, setLogs] = useState([]);
  
  const socketRef = useRef(null);
  const peerConnRef = useRef(null);
  const videoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const setupDoneRef = useRef(false);

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-40));
  };

  // Initialize socket connection - ONLY ONCE
  useEffect(() => {
    if (socketRef.current) return; // Already connected

    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      addLog('✅ Connected to signaling server');
    });
    socket.on('connect_error', (err) => {
      addLog(`❌ Socket.IO connect_error: ${err.message}`);
    });
    socket.on('disconnect', (reason) => {
      addLog(`❌ Disconnected from server: ${reason}`);
    });
    socket.on('error', (err) => {
      addLog(`❌ Socket.IO error: ${err.message || err}`);
    });

    socket.on('webrtc-offer', (data) => {
      addLog('📥 Received WebRTC offer');
      handleOffer(data);
    });
    socket.on('webrtc-answer', (data) => {
      addLog('📥 Received WebRTC answer');
      handleAnswer(data);
    });
    socket.on('ice-candidate', (data) => {
      addLog('📥 Received ICE candidate');
      if (peerConnRef.current && data.candidate) {
        peerConnRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((e) => {
          addLog(`❌ ICE candidate error: ${e.message}`);
        });
      }
    });
    socket.on('client-joined', (data) => {
      addLog(`👤 Client joined session! Setting up WebRTC for clientId: ${data.clientId}`);
      setupHostWebRTC(data.clientId);
    });
    socket.on('host-disconnected', () => {
      addLog('❌ Host disconnected. Session ended.');
      disconnect();
    });
    socket.on('session-expired', () => {
      addLog('❌ Session expired.');
      disconnect();
    });
    socket.on('permissions-updated', (perms) => {
      addLog(`🔒 Permissions updated: ${JSON.stringify(perms)}`);
    });

    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount
    };
  }, []);

  // HOST: Create and start sharing
  const startHostMode = () => {
    socketRef.current.emit('create-session', (res) => {
      if (res.success) {
        setSessionId(res.sessionId);
        setSessionPassword(res.password);
        addLog(`📋 Session ID: ${res.sessionId}`);
        addLog(`🔑 Password: ${res.password}`);
        setIsSharing(true);
        startScreenShare();
      } else {
        addLog(`❌ Error: ${res.error}`);
      }
    });
  };

  // Start capturing screen
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      addLog('📺 Screen captured');
      addLog('⏳ Waiting for client...');

      stream.getVideoTracks()[0].addEventListener('ended', stopHost);
    } catch (err) {
      addLog(`❌ ${err.message}`);
    }
  };

  // HOST: Setup WebRTC with client
  const setupHostWebRTC = async (clientId) => {
    try {
      if (peerConnRef.current) {
        peerConnRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
      });

      peerConnRef.current = pc;

      // Add screen tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, screenStreamRef.current);
        });
        addLog(`📹 Added ${screenStreamRef.current.getTracks().length} video track(s)`);
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current.emit('ice-candidate', {
            targetId: clientId,
            candidate: e.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        addLog(`📡 WebRTC: ${pc.connectionState}`);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('webrtc-offer', {
        targetId: clientId,
        offer: offer
      });

      addLog('✅ Offer sent to client');

    } catch (err) {
      addLog(`❌ WebRTC error: ${err.message}`);
    }
  };

  // CLIENT: Join session
  const joinSession = () => {
    if (!inputSessionId || !inputPassword) {
      addLog('❌ Enter ID and password');
      return;
    }

    socketRef.current.emit('join-session', {
      sessionId: inputSessionId.toUpperCase(),
      password: inputPassword
    }, (res) => {
      if (res.success) {
        setSessionId(inputSessionId.toUpperCase());
        setIsConnected(true);
        addLog('✅ Joined session');
        addLog('⏳ Waiting for video...');
      } else {
        addLog(`❌ ${res.error}`);
      }
    });
  };

  // Handle WebRTC offer (CLIENT receives)
  const handleOffer = async (data) => {
    try {
      if (setupDoneRef.current) return;
      setupDoneRef.current = true;

      if (!peerConnRef.current) {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
        });

        peerConnRef.current = pc;

        pc.ontrack = (e) => {
          addLog('📹 Got video track!');
          if (videoRef.current && e.streams && e.streams[0]) {
            videoRef.current.srcObject = e.streams[0];
            
            // Explicit play with proper handling
            videoRef.current.onloadedmetadata = () => {
              addLog('✅ Video loaded');
              videoRef.current.play().catch(err => {
                addLog(`❌ Play error: ${err.message}`);
              });
            };
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socketRef.current.emit('ice-candidate', {
              targetId: data.fromId,
              candidate: e.candidate
            });
          }
        };

        pc.onconnectionstatechange = () => {
          addLog(`📡 WebRTC: ${pc.connectionState}`);
        };
      }

      const pc = peerConnRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      addLog('📥 Processing offer...');

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('webrtc-answer', {
        targetId: data.fromId,
        answer: answer
      });

      addLog('✅ Answer sent');
    } catch (err) {
      addLog(`❌ Offer error: ${err.message}`);
    }
  };

  // Handle WebRTC answer (HOST receives)
  const handleAnswer = async (data) => {
    try {
      if (peerConnRef.current) {
        await peerConnRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        addLog('✅ WebRTC connected!');
      }
    } catch (err) {
      addLog(`❌ Answer error: ${err.message}`);
    }
  };

  const stopHost = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnRef.current) {
      peerConnRef.current.close();
    }
    setIsSharing(false);
    setSessionId('');
    addLog('🛑 Stopped sharing');
  };

  const disconnect = () => {
    if (peerConnRef.current) {
      peerConnRef.current.close();
    }
    setupDoneRef.current = false;
    setIsConnected(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    addLog('📋 Copied!');
  };

  // RENDER
  if (mode === 'home') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <Monitor className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Remote Desktop</h1>
          <p className="text-gray-600 mb-8">Secure WebRTC screen sharing</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setMode('host');
                startHostMode();
              }}
              className="p-8 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <Share2 className="w-12 h-12 mx-auto mb-2" />
              <div className="font-semibold">Share Screen</div>
            </button>

            <button
              onClick={() => setMode('client')}
              className="p-8 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              <Monitor className="w-12 h-12 mx-auto mb-2" />
              <div className="font-semibold">Connect</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'host') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <button onClick={() => { stopHost(); setMode('home'); }} className="mb-6 px-4 py-2 bg-gray-700 rounded">
          ← Back
        </button>

        {isSharing && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="font-bold mb-4">📋 Share With Client</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={sessionId} readOnly className="flex-1 bg-gray-700 px-4 py-2 rounded" />
                  <button onClick={() => copy(sessionId)} className="px-4 py-2 bg-indigo-600 rounded"><Copy className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={sessionPassword} readOnly className="flex-1 bg-gray-700 px-4 py-2 rounded" />
                  <button onClick={() => copy(sessionPassword)} className="px-4 py-2 bg-indigo-600 rounded"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-2">📺 Your Screen</h3>
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded bg-black" />
            </div>

            <div className="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Log</h3>
              <div className="text-xs font-mono text-gray-300 space-y-1">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <button onClick={() => { disconnect(); setMode('home'); setInputSessionId(''); setInputPassword(''); }} className="mb-6 px-4 py-2 bg-gray-700 rounded">
        ← Back
      </button>

      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full">
            <h2 className="font-bold mb-6 text-center">Enter Session Info</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value.toUpperCase())}
                placeholder="Session ID"
                className="w-full px-4 py-3 bg-gray-700 rounded text-white"
              />
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-700 rounded text-white"
              />
              <button onClick={joinSession} className="w-full py-3 bg-indigo-600 rounded hover:bg-indigo-700 font-semibold">
                Connect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Connected</span>
            </div>
            <button onClick={disconnect} className="px-4 py-2 bg-red-600 rounded">Disconnect</button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-bold mb-4">📺 Remote Screen</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded bg-black" />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Log</h3>
            <div className="text-xs font-mono text-gray-300 space-y-1">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}