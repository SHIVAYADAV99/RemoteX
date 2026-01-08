console.log('Starting signaling server script...');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);

// DEBUG LOGGING: Print every request that hits the server
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Simple health check
app.get('/', (req, res) => {
  res.send('RemoteX Server is Running!');
});

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;

// Store active sessions and offers
const sessions = {};
// Store persistent device metadata (FLEET MANAGEMENT)
const deviceInventory = {};

io.on('connection', (socket) => {
  console.log(`[SIGNAL] Client connected: ${socket.id}`);

  // Create or Join a session/room
  socket.on('join-room', (data) => {
    // Handle both string (legacy) and object inputs
    const roomId = typeof data === 'string' ? data : data.roomId;
    const isHost = typeof data === 'object' ? data.isHost : false;

    console.log(`[SIGNAL] 👤 Socket ${socket.id} joining room: ${roomId} (Host: ${isHost})`);
    socket.join(roomId);

    if (!sessions[roomId]) {
      console.log(`[SIGNAL] 🎬 Creating new session for host: ${socket.id}`);
      sessions[roomId] = {
        hostId: socket.id,
        viewers: new Set()
      };
    } else {
      if (isHost) {
        console.log(`[SIGNAL] 🔄 Host re-connected/re-claiming room: ${roomId}`);
        sessions[roomId].hostId = socket.id;
        // Notify re-joining host of all current viewers
        sessions[roomId].viewers.forEach(vId => {
          socket.emit('user-connected', vId);
        });
      } else {
        // It's a viewer
        if (!sessions[roomId].viewers.has(socket.id)) {
          console.log(`[SIGNAL] 👥 Viewer joining existing room: ${roomId}`);
          sessions[roomId].viewers.add(socket.id);

          // Notify Host ONLY with one event
          if (sessions[roomId].hostId) {
            console.log(`[SIGNAL] 📢 Notifying Host ${sessions[roomId].hostId} about new viewer`);
            io.to(sessions[roomId].hostId).emit('user-connected', socket.id);
          }
        }
      }
    }

    // Update viewer count for the room
    const room = io.sockets.adapter.rooms.get(roomId);
    const count = room ? room.size - 1 : 0;
    io.to(roomId).emit('viewer-count', count);
  });

  // Generic Signal Relay for SimplePeer
  socket.on('signal', (data) => {
    const { to, signal } = data;
    if (to) {
      console.log(`[SIGNAL] 📡 Relay signal (${signal.type || 'ICE'}) from ${socket.id} to ${to}`);
      io.to(to).emit('signal', { from: socket.id, signal });
    }
  });

  socket.on('offer', (data) => {
    const { sessionId, offer, viewerId } = data;
    console.log(`[SIGNAL] 📤 OFFER relay: from ${socket.id} to ${viewerId || 'room ' + sessionId}`);
    if (viewerId) {
      socket.to(viewerId).emit('offer', { sessionId, offer });
    } else {
      socket.to(sessionId).emit('offer', { sessionId, offer });
    }
  });

  socket.on('answer', (data) => {
    const { sessionId, answer } = data;
    const session = sessions[sessionId];
    if (session) {
      console.log(`[SIGNAL] 📥 ANSWER relay: from ${socket.id} to host ${session.hostId}`);
      socket.to(session.hostId).emit('answer', { answer });
    } else {
      console.warn(`[SIGNAL] ⚠️ ANSWER received for unknown session ${sessionId}`);
    }
  });

  socket.on('ice-candidate', (data) => {
    const { sessionId, candidate, targetId } = data;
    // If targetId is specified, send only to them, otherwise broadcast
    if (targetId) {
      socket.to(targetId).emit('ice-candidate', { candidate });
    } else {
      socket.to(sessionId).emit('ice-candidate', { candidate });
    }
  });

  socket.on('remote-input', (data) => {
    const { sessionId, ...inputData } = data;
    const session = sessions[sessionId];
    if (session) {
      socket.to(session.hostId).emit('remote-input', inputData);
    }
  });

  // Enterprise Feature Relays (Phase 2 & 3)
  socket.on('clipboard-sync', ({ content, roomId }) => {
    socket.to(roomId).emit('clipboard-sync', { content });
  });

  socket.on('file-transfer', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('file-transfer', data);
  });

  socket.on('chat-message', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('chat-message', data);
  });

  socket.on('system-info', (data) => {
    const { roomId, info } = data;
    socket.to(roomId).emit('system-info', info);
  });

  socket.on('process-list', (data) => {
    const { roomId, processes } = data;
    socket.to(roomId).emit('process-list', { processes });
  });

  socket.on('system-event-logs', (data) => {
    const { roomId, logs } = data;
    socket.to(roomId).emit('system-event-logs', { logs });
  });

  socket.on('kill-process-request', (data) => {
    // This could be just a pid string or an object {pid, roomId}
    const pid = typeof data === 'string' ? data : data.pid;
    const roomId = typeof data === 'object' ? data.roomId : null;
    if (roomId) {
      socket.to(roomId).emit('kill-process-request', pid);
    }
  });

  socket.on('run-maintenance-request', (data) => {
    const type = typeof data === 'string' ? data : data.type;
    const roomId = typeof data === 'object' ? data.roomId : null;
    if (roomId) {
      socket.to(roomId).emit('run-maintenance-request', type);
    }
  });

  // --- LOGMEIN PIVOT: FLEET MANAGEMENT ---

  socket.on('device-register', (data) => {
    const { deviceId, hostname, os, platform, uptime } = data;
    console.log(`[FLEET] 📝 Registering device: ${hostname} (${deviceId})`);

    deviceInventory[deviceId] = {
      deviceId,
      hostname,
      os,
      platform,
      uptime,
      lastSeen: new Date().toISOString(),
      socketId: socket.id,
      status: 'online'
    };

    // Broadcast update to all clients watching the inventory
    io.emit('fleet-update', Object.values(deviceInventory));
  });

  socket.on('get-fleet-list', () => {
    socket.emit('fleet-update', Object.values(deviceInventory));
  });

  socket.on('disconnect', () => {
    console.log(`[SIGNAL] Client disconnected: ${socket.id}`);

    // Update fleet status
    Object.keys(deviceInventory).forEach(dId => {
      if (deviceInventory[dId].socketId === socket.id) {
        console.log(`[FLEET] 💤 Device offline: ${deviceInventory[dId].hostname}`);
        deviceInventory[dId].status = 'offline';
        deviceInventory[dId].socketId = null;
        io.emit('fleet-update', Object.values(deviceInventory));
      }
    });

    Object.keys(sessions).forEach(roomId => {
      const session = sessions[roomId];
      if (session.hostId === socket.id) {
        // Only delete if the hostId hasn't been re-claimed by a new socket
        console.log(`[SIGNAL] 🏁 Host ${socket.id} disconnected from room ${roomId}`);
        delete sessions[roomId];
        io.to(roomId).emit('session-closed');
      } else if (session.viewers.has(socket.id)) {
        console.log(`[SIGNAL] 👤 Viewer ${socket.id} left room ${roomId}`);
        session.viewers.delete(socket.id);
        const room = io.sockets.adapter.rooms.get(roomId);
        const count = room ? room.size - 1 : 0;
        io.to(roomId).emit('viewer-count', count);
      }
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`💡 Tip: Close any other instances of RemoteX or use 'netstat -ano | findstr :${PORT}' to find the process.\n`);
  } else {
    console.error(`\n❌ SERVER ERROR:`, err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  console.log(`\n========================================`);
  console.log(`🚀 RemoteX Signaling Server is ACTIVE`);
  console.log(`========================================`);
  console.log(`\n📡 Listening on:`);
  console.log(`   - Local: http://127.0.0.1:${PORT}`);

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   - LAN:   http://${iface.address}:${PORT}`);
      }
    }
  }

  console.log(`\n🔒 Port Status: PORT ${PORT} OPEN`);
  console.log(`\n[ANYDESK MODE] To use this over the internet:`);
  console.log(`1. Forward Port ${PORT} in your router settings.`);
  console.log(`2. OR use a tool like 'lt --port ${PORT}' for a public URL.`);
  console.log(`\n========================================\n`);
  console.log(`[LOGS] Waiting for connections...\n`);
});
