const socket = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
  timeout: 20000,
  reconnectionAttempts: 5
});
let peer = null;
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
const remoteVideo = document.getElementById('remoteVideo');
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
  try {
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
    shareBtn.disabled = true;
    shareBtn.textContent = 'Sharing...';
    
    updateStatus('Waiting for connection...', false);
    videoStatus.textContent = 'Waiting for viewer...';
    
    info.innerHTML = `
      <p><strong>Status:</strong> Hosting</p>
      <p><strong>Room:</strong> ${currentRoomId}</p>
      <p><strong>Stream:</strong> Active</p>
    `;
  } catch (error) {
    console.error('Error sharing screen:', error);
    alert('Failed to share screen: ' + error.message);
  }
});

// Join room (Viewer)
joinBtn.addEventListener('click', () => {
  const roomId = joinRoomId.value.trim();
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
});

// Copy room ID
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentRoomId);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = 'Copy ID';
  }, 2000);
});

// Socket events
socket.on('connect', () => {
  console.log('Connected to signaling server');
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
    
    peer = new SimplePeer({
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
    
    peer.on('signal', (signal) => {
      console.log('📡 Sending signal to viewer:', userId);
      socket.emit('signal', {
        to: userId,
        signal: signal
      });
    });
    
    peer.on('error', (err) => {
      console.error('❌ Peer error:', err);
      alert('Connection error: ' + err.message);
    });
    
    peer.on('connect', () => {
      console.log('✅ Peer data channel connected to viewer');
    });
    
    peer.on('close', () => {
      console.log('⚠️ Peer connection closed');
    });
    
    updateStatus('Connected', true);
    videoStatus.textContent = 'Viewer connected';
    
    info.innerHTML = `
      <p><strong>Status:</strong> Connected</p>
      <p><strong>Room:</strong> ${currentRoomId}</p>
      <p><strong>Viewers:</strong> 1</p>
      <p><strong>Streaming:</strong> ${localStream.getVideoTracks()[0].label}</p>
    `;
  } else {
    console.log('⚠️ Cannot create peer - missing requirements');
  }
});

socket.on('signal', (data) => {
  console.log('Received signal from:', data.from);
  console.log('Current peer state:', peer ? 'exists' : 'null', 'isHost:', isHost);
  
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

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  updateStatus('Connection Error', false);
});

console.log('Remote Desktop App Initialized');