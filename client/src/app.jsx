import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Share2, Hand, MousePointer, Keyboard, Video, VideoOff, Users, Copy, Check } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState('home'); // home, host, client
  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [remoteControl, setRemoteControl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logs, setLogs] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startScreenShare = async () => {
    try {
      // Request screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: 'always',
          displaySurface: 'monitor'
        },
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

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (err) {
      addLog(`Error starting screen share: ${err.message}`);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsSharing(false);
    setIsConnected(false);
    addLog('Screen sharing stopped');
  };

  const connectToSession = () => {
    if (inputSessionId.length >= 6) {
      setSessionId(inputSessionId);
      setIsConnected(true);
      addLog(`Connected to session: ${inputSessionId}`);
      
      // Simulate receiving stream
      setTimeout(() => {
        addLog('Stream received from host');
      }, 1000);
    }
  };

  const handleCanvasClick = (e) => {
    if (!remoteControl) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    addLog(`Remote click at (${Math.round(x)}, ${Math.round(y)})`);
    
    // Send to Electron if available
    if (window.electronAPI) {
      window.electronAPI.sendMouseClick({ x, y, button: 'left' });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!remoteControl) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    // Send to Electron if available
    if (window.electronAPI) {
      window.electronAPI.sendMouseMove({ x, y });
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-center mb-6">
          <Monitor className="w-16 h-16 text-indigo-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
          Remote Desktop
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Share your screen or connect to a remote desktop
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('host')}
            className="flex flex-col items-center justify-center p-8 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Share2 className="w-12 h-12 mb-3" />
            <span className="text-xl font-semibold">Share Screen</span>
            <span className="text-sm opacity-90 mt-2">Let others view your screen</span>
          </button>

          <button
            onClick={() => setMode('client')}
            className="flex flex-col items-center justify-center p-8 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Monitor className="w-12 h-12 mb-3" />
            <span className="text-xl font-semibold">Connect</span>
            <span className="text-sm opacity-90 mt-2">View a shared screen</span>
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Features
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Real-time screen sharing</li>
            <li>• Remote control capabilities</li>
            <li>• Secure peer-to-peer connection</li>
            <li>• Cross-platform support</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderHost = () => (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              stopScreenShare();
              setMode('home');
            }}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Screen Sharing Host
          </h1>

          <div className="w-24" />
        </div>

        {!isSharing ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <button
              onClick={startScreenShare}
              className="flex flex-col items-center justify-center p-12 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-2xl"
            >
              <Video className="w-20 h-20 mb-4" />
              <span className="text-2xl font-semibold">Start Sharing</span>
              <span className="text-sm opacity-90 mt-2">Click to share your screen</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Session ID</h3>
                  <div className="flex items-center gap-3">
                    <code className="text-2xl font-mono bg-gray-700 px-4 py-2 rounded-lg">
                      {sessionId}
                    </code>
                    <button
                      onClick={copySessionId}
                      className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Share this ID with others to let them connect
                  </p>
                </div>

                <button
                  onClick={stopScreenShare}
                  className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <VideoOff className="w-5 h-5" />
                  Stop Sharing
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Screen</h3>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Activity Log</h3>
              <div className="space-y-1 text-xs font-mono text-gray-300">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClient = () => (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setIsConnected(false);
              setMode('home');
            }}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Remote Desktop Viewer
          </h1>

          <div className="w-24" />
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Connect to Session
              </h2>
              <input
                type="text"
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value.toUpperCase())}
                placeholder="Enter Session ID"
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-center text-xl font-mono tracking-wider mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={8}
              />
              <button
                onClick={connectToSession}
                disabled={inputSessionId.length < 6}
                className="w-full px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Connect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold">Connected to {sessionId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRemoteControl(!remoteControl)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      remoteControl 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    Remote Control {remoteControl ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setIsConnected(false)}
                    className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Remote Screen</h3>
              <div 
                className="relative bg-black rounded-lg overflow-hidden cursor-crosshair"
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
                      className="absolute w-6 h-6 border-2 border-red-500 rounded-full pointer-events-none transition-all duration-75"
                      style={{ 
                        left: mousePos.x - 12, 
                        top: mousePos.y - 12,
                        opacity: 0.8
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      Remote Control Active
                    </div>
                  </>
                )}

                {!remoteControl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center">
                      <Hand className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Enable Remote Control to interact</p>
                    </div>
                  </div>
                )}
              </div>

              {remoteControl && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    Left Click
                  </button>
                  <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    Right Click
                  </button>
                  <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Send Keys
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Activity Log</h3>
              <div className="space-y-1 text-xs font-mono text-gray-300">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
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
      {mode === 'home' && renderHome()}
      {mode === 'host' && renderHost()}
      {mode === 'client' && renderClient()}
    </>
  );
}