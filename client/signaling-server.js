console.log('Starting signaling server script...');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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

const PORT = 3001; // Changed to 3001 to avoid EADDRINUSE

// Store active sessions and offers
const sessions = {};

io.on('connection', (socket) => {
  console.log(`[SIGNAL] Client connected: ${socket.id}`);

  // Create a new session (Host)
  socket.on('create-session', (data) => {
    const { sessionId, password, offer } = data;
    console.log(`[SIGNAL] 🎬 Creating session ${sessionId} for host ${socket.id}`);

    sessions[sessionId] = {
      hostId: socket.id,
      password: password,
      offer: offer,
      iceCandidates: []
    };

    socket.join(sessionId);
    console.log(`[SIGNAL] ✅ Session ${sessionId} created successfully`);
  });

  // Join a session (Client)
  socket.on('join-session', (data) => {
    const { sessionId } = data;
    const session = sessions[sessionId];

    if (session) {
      console.log(`[SIGNAL] 👤 Client ${socket.id} joining session ${sessionId}`);
      socket.join(sessionId);

      // Send the stored offer to the new client
      console.log(`[SIGNAL] 📤 Sending offer to client ${socket.id}`);
      socket.emit('offer', {
        sessionId: sessionId,
        offer: session.offer
      });

      // Send any stored ICE candidates
      console.log(`[SIGNAL] 🧊 Sending ${session.iceCandidates.length} ICE candidates to client`);
      session.iceCandidates.forEach(candidate => {
        socket.emit('ice-candidate', { candidate });
      });

      // Update viewer count
      const viewers = io.sockets.adapter.rooms.get(sessionId);
      const count = viewers ? viewers.size - 1 : 0; // -1 for host
      io.to(sessionId).emit('viewer-count', count);
      console.log(`[SIGNAL] 📊 Viewer count for ${sessionId}: ${count}`);
    } else {
      console.error(`[SIGNAL] ❌ Session not found: ${sessionId}`);
      socket.emit('error', 'Session not found');
    }
  });

  socket.on('answer', (data) => {
    const { sessionId, answer } = data;
    const session = sessions[sessionId];
    if (session) {
      console.log(`[SIGNAL] ✅ Broadcasting answer for session ${sessionId} to host ${session.hostId}`);
      // Send answer to the host
      socket.to(session.hostId).emit('answer', { answer });
    } else {
      console.error(`[SIGNAL] ❌ Session not found for answer: ${sessionId}`);
    }
  });

  socket.on('ice-candidate', (data) => {
    const { sessionId, candidate } = data;
    const session = sessions[sessionId];
    if (session) {
      console.log(`[SIGNAL] 🧊 Relaying ICE candidate in ${sessionId}`);
      // Store candidate if it's valid
      if (candidate) {
        session.iceCandidates.push(candidate);
      }
      // Broadcast to all other peers in the session
      // WRAP the candidate in an object to match the client's expected { candidate } format
      socket.to(sessionId).emit('ice-candidate', { candidate });
    }
  });

  // Remote input relay (client -> host)
  socket.on('remote-input', (data) => {
    const { sessionId, type, x, y, button, key, modifiers } = data;
    const session = sessions[sessionId];
    if (session) {
      console.log(`[SIGNAL] 🎮 Relaying remote input (${type}) in session ${sessionId}`);
      // Send to host only
      socket.to(session.hostId).emit('remote-input', { type, x, y, button, key, modifiers });
    }
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach(sessionId => {
      const session = sessions[sessionId];
      if (session) {
        const viewers = io.sockets.adapter.rooms.get(sessionId);
        const count = viewers ? viewers.size - 2 : 0;
        socket.to(sessionId).emit('viewer-count', count < 0 ? 0 : count);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`[SIGNAL] 🔌 Client disconnected: ${socket.id}`);
    Object.keys(sessions).forEach(sessionId => {
      if (sessions[sessionId].hostId === socket.id) {
        delete sessions[sessionId];
        console.log(`[SIGNAL] 🗑️ Session ${sessionId} closed (host disconnected)`);
        socket.to(sessionId).emit('session-closed');
      }
    });
  });

});

server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on http://localhost:${PORT}`);
});