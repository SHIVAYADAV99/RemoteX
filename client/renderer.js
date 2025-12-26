const socket = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
  timeout: 20000,
  reconnectionAttempts: 5
});
let peer = null;
const peers = {}; // host: map of viewerId -> SimplePeer
let localStream = null;
let currentRoomId = null;
let isHost = false;

// DOM Elements
const shareBtn = document.getElementById('shareBtn');
const joinBtn = document.getElementById('joinBtn');
const joinRoomId = document.getElementById('joinRoomId');
const roomInfo = document.getElementById('roomInfo');
const roomIdDisplay = document.getElementById('roomId');
const copyBtn = document.getElementById('copyBtn');
const remoteControlToggle = document.getElementById('remoteControlToggle');
const remoteVideo = document.getElementById('remoteVideo');
const disconnectBtn = document.getElementById('disconnectBtn');
const status = document.getElementById('status');
const videoStatus = document.getElementById('videoStatus');
const info = document.getElementById('info');

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Update UI status
function updateStatus(text, connected = false) {
  status.textContent = text;
  if (connected) {
    status.classList.add('connected');
  } else {
    status.classList.remove('connected');
  }
}

// Share screen (Host)
shareBtn.addEventListener('click', async () => {
  console.log('Share button clicked');
  try {
    console.log('window.electron present:', !!window.electron);
    if (!window.electron || typeof window.electron.getSources !== 'function') {
      console.error('electron.getSources not available');
      alert('Screen capture unavailable: preload API missing');
      return;
    }

    console.log('Getting sources...');
    const sources = await window.electron.getSources();
    
    console.log('Sources:', sources);
    
    if (sources.length === 0) {
      alert('No sources available');
      return;
    }

    const source = sources[0];
    console.log('Using source:', source.name);
    
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080
        }
      }
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Got local stream');
    
    currentRoomId = generateRoomId();
    isHost = true;
    
    socket.emit('join-room', currentRoomId);
    
    roomIdDisplay.textContent = currentRoomId;
    roomInfo.classList.remove('hidden');
    if (remoteControlToggle) remoteControlToggle.checked = true; // default enabled
    shareBtn.disabled = true;
    shareBtn.textContent = 'Sharing...';
    
    updateStatus('Waiting for connection...', false);
    videoStatus.textContent = 'Waiting for viewer...';

    // When host stops sharing (user stops screen capture), reset UI
    try {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.addEventListener('ended', () => {
          console.log('Host stream ended');
          // notify viewers? For compat, just reset UI
          isHost = false;
          localStream = null;
          roomInfo.classList.add('hidden');
          shareBtn.disabled = false;
          shareBtn.textContent = 'Share Screen';
          updateStatus('Disconnected', false);
        });
      }
    } catch (e) {
      console.warn('Failed to attach ended handler:', e);
    }
    
    info.innerHTML = `
      <p><strong>Status:</strong> Hosting</p>
      <p><strong>Room:</strong> ${currentRoomId}</p>
      <p><strong>Stream:</strong> Active</p>
    `;
  
  joinBtn.disabled = true;
  joinRoomId.disabled = true;
  if (remoteControlToggle) remoteControlToggle.disabled = true;
  } catch (error) {
    console.error('Error sharing screen:', error);
    alert('Failed to share screen: ' + (error && error.message ? error.message : error));
  }
});

// Copy room ID
copyBtn.addEventListener('click', () => {
  const roomId = currentRoomId || roomIdDisplay.textContent || '';
  if (!roomId) return;
  navigator.clipboard.writeText(roomId);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = 'Copy ID';
  }, 2000);
});

// Join room (Viewer)
joinBtn.addEventListener('click', () => {
  const raw = joinRoomId.value || '';
  const roomId = raw.trim().toUpperCase();
  if (!roomId) {
    alert('Please enter a room ID');
    return;
  }

  console.log('Joining room:', roomId);
  currentRoomId = roomId;
  isHost = false;
  socket.emit('join-room', roomId);

  updateStatus('Connecting...', false);
  videoStatus.textContent = 'Connecting to host...';

  info.innerHTML = `
    <p><strong>Status:</strong> Joining</p>
    <p><strong>Room:</strong> ${roomId}</p>
  `;

  joinBtn.disabled = true;
  joinRoomId.disabled = true;
  if (disconnectBtn) {
    disconnectBtn.style.display = 'inline-block';
  }
});

// Disconnect handler (viewer or host)
if (disconnectBtn) {
  disconnectBtn.addEventListener('click', () => {
    console.log('Disconnect clicked');
    // Notify server we are leaving
    if (currentRoomId) socket.emit('leave-room', { roomId: currentRoomId });

    // Close peer(s)
    try {
      if (peer) {
        peer.destroy();
        peer = null;
      }
      Object.values(peers).forEach(p => p.destroy && p.destroy());
      Object.keys(peers).forEach(k => delete peers[k]);
    } catch (e) { console.warn('Error closing peers', e); }

    // Reset UI
    currentRoomId = null;
    isHost = false;
    joinBtn.disabled = false;
    joinRoomId.disabled = false;
    if (remoteControlToggle) remoteControlToggle.disabled = false;
    if (roomIdDisplay) roomIdDisplay.textContent = '';
    if (disconnectBtn) disconnectBtn.style.display = 'none';
    remoteVideo.srcObject = null;
    updateStatus('Disconnected', false);
  });
}

socket.on('connect', () => {
  console.log('Connected to signaling server');
});

// Remote control toggle handler (host only)
if (remoteControlToggle) {
  remoteControlToggle.addEventListener('change', () => {
    const enabled = !!remoteControlToggle.checked;
    console.log('[UI] Remote control toggled:', enabled);
    // Send permission update to server (host must be connected and recognized)
    socket.emit('update-permissions', { permissions: { controlMouse: enabled, controlKeyboard: enabled } }, (res) => {
      if (res && res.success) {
        console.log('[UI] Permissions updated on server');
      } else {
        console.warn('[UI] Failed to update permissions', res);
      }
    });
  });
}

socket.on('host-disconnected', () => {
  console.log('Host disconnected');
  updateStatus('Host disconnected', false);
  videoStatus.style.display = 'block';
  videoStatus.textContent = 'No stream';
  remoteVideo.srcObject = null;
});

socket.io.on('reconnect_attempt', (attempt) => {
  console.log('Socket reconnect attempt', attempt);
});

socket.io.on('upgradeError', (err) => {
  console.error('Socket upgradeError:', err);
});

socket.on('user-connected', (userId) => {
  console.log('👤 User connected:', userId);
  console.log('isHost:', isHost, 'localStream:', localStream);
  
  if (isHost && localStream) {
    console.log('Creating peer as initiator');
    console.log('Stream tracks:', localStream.getTracks());
    const p = new SimplePeer({
      initiator: true,
      stream: localStream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peers[userId] = p;

    p.on('signal', (signal) => {
      console.log('📡 Sending signal to viewer:', userId);
      socket.emit('signal', { to: userId, signal: signal });
    });

    p.on('error', (err) => {
      console.error('❌ Peer error for', userId, err);
    });

    p.on('connect', () => {
      console.log('✅ Peer data channel connected to viewer', userId);
    });

    p.on('close', () => {
      console.log('⚠️ Peer connection closed for', userId);
      delete peers[userId];
      const count = Object.keys(peers).length;
      info.innerHTML = `\n        <p><strong>Status:</strong> Connected</p>\n        <p><strong>Room:</strong> ${currentRoomId}</p>\n        <p><strong>Viewers:</strong> ${count}</p>\n        <p><strong>Streaming:</strong> ${localStream.getVideoTracks()[0].label}</p>\n      `;
    });

    const count = Object.keys(peers).length;
    updateStatus('Connected', true);
    videoStatus.textContent = 'Viewer connected';
    info.innerHTML = `\n      <p><strong>Status:</strong> Connected</p>\n      <p><strong>Room:</strong> ${currentRoomId}</p>\n      <p><strong>Viewers:</strong> ${count}</p>\n      <p><strong>Streaming:</strong> ${localStream.getVideoTracks()[0].label}</p>\n    `;
  } else {
    console.log('⚠️ Cannot create peer - missing requirements');
  }
});

// Handle remote-control messages on host
socket.on('remote-control', async ({ fromId, command }) => {
  console.log('[REMOTE] Received control command from', fromId, command);
  if (!isHost) return;

  try {
    if (command.type === 'mouse') {
      // Expect normalized coords (0..1) relative to host screen; map to screen size
      const { x, y, action } = command;
      // If possible, use electron bridge
      if (window.electron && window.electron.sendMouseMove) {
        // Multiply by screen size if provided, otherwise assume absolute
        await window.electron.sendMouseMove({ x: x, y: y });
      }
      if (action === 'click' && window.electron && window.electron.sendMouseClick) {
        await window.electron.sendMouseClick({ x: x, y: y, button: 'left' });
      }
    } else if (command.type === 'keyboard') {
      const { key, modifiers } = command;
      if (window.electron && window.electron.sendKey) {
        await window.electron.sendKey({ key, modifiers });
      }
    }
  } catch (err) {
    console.error('[REMOTE] Failed to execute control command:', err);
  }
});

socket.on('signal', (data) => {
  console.log('Received signal from:', data.from);
  console.log('Current peer state:', peer ? 'exists' : 'null', 'isHost:', isHost);
  
  if (isHost) {
    const p = peers[data.from];
    if (p) {
      console.log('Host: forwarding signal to peer', data.from);
      p.signal(data.signal);
    } else {
      console.warn('Host: received signal for unknown peer', data.from);
    }
    return;
  }

  if (!peer && !isHost) {
    console.log('Creating peer as receiver');
    
    peer = new SimplePeer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    peer.on('signal', (signal) => {
      console.log('Sending signal back to host');
      socket.emit('signal', {
        to: data.from,
        signal: signal
      });
    });
    
    peer.on('stream', (stream) => {
      console.log('🎉 RECEIVED STREAM!', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Audio tracks:', stream.getAudioTracks());
      
      remoteVideo.srcObject = stream;
      remoteVideo.classList.add('active');
      
      console.log('Video element:', remoteVideo);
      console.log('Video ready state:', remoteVideo.readyState);
      
      remoteVideo.play()
        .then(() => console.log('✅ Video playing'))
        .catch(err => console.error('❌ Error playing video:', err));
      
      videoStatus.style.display = 'none';
      updateStatus('Connected', true);
      
      info.innerHTML = `
        <p><strong>Status:</strong> Connected</p>
        <p><strong>Room:</strong> ${currentRoomId}</p>
        <p><strong>Stream:</strong> Receiving</p>
        <p><strong>Tracks:</strong> ${stream.getVideoTracks().length} video</p>
      `;
    });
    
    peer.on('error', (err) => {
      console.error('❌ Peer error:', err);
      alert('Connection error: ' + err.message);
    });
    
    peer.on('connect', () => {
      console.log('✅ Peer data channel connected');
    });
    
    peer.on('close', () => {
      console.log('⚠️ Peer connection closed');
    });
    
    console.log('Signaling peer with received data');
    peer.signal(data.signal);
  } else if (peer) {
    console.log('Peer already exists, signaling with new data');
    peer.signal(data.signal);
  } else {
    console.log('⚠️ Ignoring signal - isHost is true');
  }
});

// Viewer: capture clicks and mouse moves on the remote video to send remote-control events
let lastMoveTs = 0;
remoteVideo.addEventListener('click', (e) => {
  if (isHost) return; // host shouldn't send control to itself
  const rect = remoteVideo.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  socket.emit('remote-control', { command: { type: 'mouse', x: nx, y: ny, action: 'click' } });
  console.log('[REMOTE] Sent click at', nx, ny);
});

remoteVideo.addEventListener('mousemove', (e) => {
  if (isHost) return;
  const now = Date.now();
  if (now - lastMoveTs < 50) return; // throttle
  lastMoveTs = now;
  const rect = remoteVideo.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  socket.emit('remote-control', { command: { type: 'mouse', x: nx, y: ny, action: 'move' } });
});

// Viewer: keyboard events when video focused
window.addEventListener('keydown', (e) => {
  if (isHost) return;
  // Simple mapping: send key and modifier list
  const modifiers = [];
  if (e.shiftKey) modifiers.push('shift');
  if (e.ctrlKey) modifiers.push('control');
  if (e.altKey) modifiers.push('alt');
  socket.emit('remote-control', { command: { type: 'keyboard', key: e.key, modifiers } });
});

// Pointer overlay helpers (fallback when robotjs not installed)
function ensurePointerOverlay() {
  if (document.getElementById('remote-pointer-overlay')) return;
  const el = document.createElement('div');
  el.id = 'remote-pointer-overlay';
  el.style.position = 'absolute';
  el.style.width = '16px';
  el.style.height = '16px';
  el.style.background = 'rgba(255,0,0,0.9)';
  el.style.borderRadius = '50%';
  el.style.zIndex = 99999;
  el.style.pointerEvents = 'none';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.transition = 'opacity 120ms ease, transform 80ms ease';
  el.style.opacity = '0';
  document.body.appendChild(el);
}

function showRemotePointer(normX, normY) {
  ensurePointerOverlay();
  const el = document.getElementById('remote-pointer-overlay');
  // position relative to host video element if available, otherwise viewport
  const target = document.querySelector('video');
  let left = window.innerWidth * normX;
  let top = window.innerHeight * normY;
  if (target && target.getBoundingClientRect) {
    const r = target.getBoundingClientRect();
    left = r.left + r.width * normX;
    top = r.top + r.height * normY;
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 600);
}

function simulatePointerClick(normX, normY) {
  showRemotePointer(normX, normY);
  const el = document.getElementById('remote-pointer-overlay');
  if (!el) return;
  el.style.transform = 'translate(-50%, -50%) scale(0.85)';
  setTimeout(() => { el.style.transform = 'translate(-50%, -50%) scale(1)'; }, 120);
}

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  updateStatus('Connection Error', false);
});

console.log('Remote Desktop App Initialized');
// End of renderer.js