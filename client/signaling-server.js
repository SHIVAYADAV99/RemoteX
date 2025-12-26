const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 3000;

// Store active sessions and offers
const sessions = {};

io.on('connection', (socket) => {
  console.log(`[SIGNAL] Client connected: ${socket.id}`);

  // Create a new session (Host)
  socket.on('create-session', (data) => {
    const { sessionId, offer } = data;
    sessions[sessionId] = {
      hostId: socket.id,
      offer: offer,
      iceCandidates: []
    };
    socket.join(sessionId);
    console.log(`[SIGNAL] Session created: ${sessionId} by host ${socket.id}`);
  });

  // Join an existing session (Client)
  socket.on('join-session', (data) => {
    const { sessionId } = data;
    const session = sessions[sessionId];

    if (session) {
      socket.join(sessionId);
      console.log(`[SIGNAL] Client ${socket.id} joined session ${sessionId}`);

      // Send the stored offer to the joining client
      socket.emit('offer', {
        sessionId: sessionId,
        offer: session.offer
      });

      // Send any stored ICE candidates
      session.iceCandidates.forEach(candidate => {
        socket.emit('ice-candidate', { candidate });
      });

    } else {
      console.log(`[SIGNAL] Session ${sessionId} not found`);
      socket.emit('error', 'Session not found');
    }
  });

  // Handle Answer
  socket.on('answer', (data) => {
    const { sessionId, answer } = data;
    const session = sessions[sessionId];

    if (session) {
      console.log(`[SIGNAL] Forwarding answer to host of session ${sessionId}`);
      io.to(session.hostId).emit('answer', { answer });
    }
  });

  // Handle ICE Candidates
  socket.on('ice-candidate', (data) => {
    const { sessionId, candidate } = data;
    const session = sessions[sessionId];

    if (session) {
      // Store candidate for future joiners if this is the host
      if (socket.id === session.hostId) {
        session.iceCandidates.push(candidate);
      }

      // Broadcast candidate to others in the room
      socket.to(sessionId).emit('ice-candidate', { candidate });
      console.log(`[SIGNAL] ICE candidate exchanged in session ${sessionId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SIGNAL] Client disconnected: ${socket.id}`);
    // Clean up sessions if host disconnects
    Object.keys(sessions).forEach(sessionId => {
      if (sessions[sessionId].hostId === socket.id) {
        delete sessions[sessionId];
        console.log(`[SIGNAL] Session ${sessionId} closed (host disconnected)`);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on http://localhost:${PORT}`);
});