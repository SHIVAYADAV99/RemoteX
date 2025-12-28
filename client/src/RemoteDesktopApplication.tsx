import React, { useState, useRef, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import HostDashboardEnhanced from './components/HostDashboardEnhanced';
import JoinSessionScreen from './components/JoinSessionScreen';
import ActiveSessionViewerEnhanced from './components/ActiveSessionViewerEnhanced';

// TypeScript declaration for Electron IPC
declare global {
  interface Window {
    electron?: {
      getSources: () => Promise<any[]>;
      sendMouseMove: (pos: { x: number; y: number }) => Promise<{ success: boolean; error?: string }>;
      sendMouseClick: (pos: { x: number; y: number; button?: string }) => Promise<{ success: boolean; error?: string }>;
      sendKey: (data: { key: string; modifiers?: string[] }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export default function RemoteXApp() {
  const [mode, setMode] = useState('dashboard'); // 'dashboard' | 'home' | 'host' | 'join' | 'viewer'
  const [isSharing, setIsSharing] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [remoteControl, setRemoteControl] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewerCount, setViewerCount] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);


  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    // Initialize socket connection ONCE
    if (!socketRef.current) {
      console.log('📡 Initializing persistent socket connection...');
      socketRef.current = io('http://127.0.0.1:3001', {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to signaling server');
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Disconnected from signaling server');
      });

      // WebRTC signaling handlers - persistently active
      socketRef.current.on('offer', async (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => {
        console.log('📨 Received offer from server for session:', data.sessionId);

        // Ensure peer connection exists if we're joining
        if (!peerConnectionRef.current) {
          console.log('🔄 Creating PeerConnection on demand for incoming offer');
          createPeerConnection(data.sessionId);
        }

        if (peerConnectionRef.current && socketRef.current) {
          try {
            console.log('🔄 Setting remote description (offer)');
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));

            console.log('📝 Creating answer');
            const answer = await peerConnectionRef.current.createAnswer();

            console.log('🔄 Setting local description (answer)');
            await peerConnectionRef.current.setLocalDescription(answer);

            console.log('📤 Sending answer to server');
            socketRef.current.emit('answer', {
              sessionId: data.sessionId,
              answer: answer
            });
          } catch (err) {
            console.error('❌ Error handling offer:', err);
          }
        }
      });

      socketRef.current.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
        console.log('📨 Received answer from server');
        if (peerConnectionRef.current) {
          try {
            console.log('🔄 Setting remote description (answer)');
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('✅ Answer set successfully');
          } catch (err) {
            console.error('❌ Error setting answer:', err);
          }
        }
      });

      socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
        if (data.candidate && peerConnectionRef.current) {
          console.log('🧊 Received ICE candidate');
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('✅ ICE candidate added');
          } catch (err) {
            console.error('❌ Error adding ICE candidate:', err);
          }
        } else if (!data.candidate) {
          console.log('🧊 Received end-of-candidates signal');
        }
      });


      // Remote input handler for HOST
      socketRef.current.on('remote-input', async (data: { type: string; x?: number; y?: number; button?: string; key?: string; modifiers?: string[] }) => {
        // Use modeRef to ensure we have the latest mode
        if (modeRef.current === 'host' && window.electron) {
          try {
            if (data.type === 'mousemove' && data.x !== undefined && data.y !== undefined) {
              await window.electron.sendMouseMove({ x: data.x, y: data.y });
            } else if (data.type === 'mouseclick' && data.x !== undefined && data.y !== undefined) {
              await window.electron.sendMouseClick({ x: data.x, y: data.y, button: data.button });
            } else if (data.type === 'keypress' && data.key) {
              await window.electron.sendKey({ key: data.key, modifiers: data.modifiers });
            }
          } catch (err) {
            console.error('Remote input error:', err);
          }
        }
      });

      // Viewer count updates
      socketRef.current.on('viewer-count', (count: number) => {
        setViewerCount(count);
      });
    }

    return () => {
      // Don't disconnect!
    };
  }, []); // Persistent

  const createPeerConnection = (targetSessionId: string) => {
    console.log('🛠️ Creating PeerConnection...');
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate to server');
        socketRef.current.emit('ice-candidate', {
          sessionId: targetSessionId,
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current.ontrack = (event: RTCTrackEvent) => {
      console.log('📹 Received remote track:', event.track.kind);

      const video = videoRef.current;
      if (!video) {
        console.log('⚠️ Video element not available yet');
        return;
      }

      // Assign stream
      if (event.streams && event.streams[0]) {
        console.log('✅ Attaching stream to video element');
        setRemoteStream(event.streams[0]);
        if (video) video.srcObject = event.streams[0];
      } else {
        console.log('⚠️ Creating new stream from track');
        const inboundStream = new MediaStream();
        inboundStream.addTrack(event.track);
        setRemoteStream(inboundStream);
        if (video) video.srcObject = inboundStream;
      }

      video.play().catch(e => console.error('❌ Video play error:', e));
    };

    return peerConnectionRef.current;
  };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const startScreenShare = async () => {
    try {
      const newSessionId = generateSessionId();
      const newPassword = generatePassword();
      setSessionId(newSessionId);
      setSessionPassword(newPassword);
      setIsSharing(true);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }

      peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            sessionId: newSessionId,
            candidate: event.candidate
          });
        }
      };

      if (peerConnectionRef.current && socketRef.current && socketRef.current.connected) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socketRef.current.emit('create-session', {
          sessionId: newSessionId,
          password: newPassword,
          offer: offer
        });
      }

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (err) {
      console.error('Screen share error:', err);
      alert(`Failed to start screen share: ${err}`);
      setIsSharing(false);
      setSessionId('');
      setSessionPassword('');
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
    setMode('dashboard');
  };

  const connectToSession = async () => {
    if (inputSessionId.length >= 6 && inputPassword.length >= 4) {
      console.log('📡 Starting connection to session:', inputSessionId);
      setSessionId(inputSessionId);

      // Create peer connection using the shared helper
      createPeerConnection(inputSessionId);

      if (socketRef.current) {
        console.log('📡 Emitting join-session event');
        socketRef.current.emit('join-session', {
          sessionId: inputSessionId,
          password: inputPassword
        });
        setMode('viewer');
      }
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;

    const renderLoop = () => {
      if (videoRef.current && canvasRef.current && mode === 'viewer') {
        const ctx = canvasRef.current.getContext('2d');
        const video = videoRef.current;

        // Ensure stream is attached if it's available and not yet set
        if (remoteStream && video.srcObject !== remoteStream) {
          console.log('🔗 Attaching remoteStream to video element in render loop');
          video.srcObject = remoteStream;
          video.play().catch(e => console.error('❌ Play error in loop:', e));
        }

        // Log every 60 frames
        if (frameCount % 60 === 0) {
          console.log('Canvas render loop:', {
            videoReadyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            hasContext: !!ctx,
            remoteStreamActive: remoteStream?.active,
            videoSrc: video.srcObject ? 'Attached' : 'Empty'
          });
        }

        if (ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
          ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
          if (frameCount === 0) console.log('✅ First frame drawn!');
        } else if (frameCount % 60 === 0) {
          console.warn('⚠️ Video not ready for drawing (readyState:', video.readyState, ')');
        }

        frameCount++;
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (mode === 'viewer') {
      console.log('🎬 Starting canvas rendering loop for viewer');
      renderLoop();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mode, remoteStream]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!remoteControl || !socketRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    socketRef.current.emit('remote-input', {
      sessionId: sessionId,
      type: 'mouseclick',
      x: x,
      y: y,
      button: 'left'
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!remoteControl || !socketRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    socketRef.current.emit('remote-input', {
      sessionId: sessionId,
      type: 'mousemove',
      x: x,
      y: y
    });
  };

  return (
    <>
      {mode === 'dashboard' && (
        <Dashboard
          onNewSession={() => setMode('host')}
          onHostClick={() => setMode('host')}
          onJoinClick={() => setMode('join')}
        />
      )}

      {mode === 'home' && (
        <WelcomeScreen
          onHostClick={() => setMode('host')}
          onClientClick={() => setMode('join')}
        />
      )}

      {mode === 'host' && (
        <HostDashboardEnhanced
          isSharing={isSharing}
          sessionId={sessionId}
          sessionPassword={sessionPassword}
          viewerCount={viewerCount}
          videoRef={videoRef}
          onStartShare={startScreenShare}
          onStopShare={stopScreenShare}
          onBack={() => {
            stopScreenShare();
            setMode('dashboard');
          }}
        />
      )}

      {mode === 'join' && (
        <JoinSessionScreen
          inputSessionId={inputSessionId}
          inputPassword={inputPassword}
          onSessionIdChange={setInputSessionId}
          onPasswordChange={setInputPassword}
          onConnect={connectToSession}
          onBack={() => setMode('dashboard')}
        />
      )}

      {mode === 'viewer' && (
        <ActiveSessionViewerEnhanced
          sessionId={sessionId}
          remoteControl={remoteControl}
          mousePos={mousePos}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onToggleControl={() => setRemoteControl(!remoteControl)}
          onDisconnect={() => {
            setMode('dashboard');
            setRemoteControl(false);
          }}
          onCanvasClick={handleCanvasClick}
          onCanvasMouseMove={handleCanvasMouseMove}
        />
      )}
    </>
  );
}