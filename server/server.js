const express = require('express');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Use HTTP for development, HTTPS for production
const USE_HTTPS = process.env.NODE_ENV === 'production';
let server;

if (USE_HTTPS && fs.existsSync('server-cert.pem')) {
  server = https.createServer({
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-cert.pem')
  }, app);
} else {
  server = http.createServer(app);
  console.log('⚠️  Running in HTTP mode (development only)');
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active sessions
const sessions = new Map();
const connections = new Map(); // socket.id -> session info

// Security settings
const MAX_CLIENTS_PER_SESSION = 5;
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_MIN_LENGTH = 8;

// Generate secure session ID
function generateSessionId() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Generate secure password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Security logger
class SecurityLogger {
  log(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };
    console.log(`[SECURITY] ${event}:`, data);
    
    // In production, write to file or database
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync('security.log', JSON.stringify(logEntry) + '\n');
    }
  }
}

const logger = new SecurityLogger();

// Cleanup expired sessions
function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.created > SESSION_TIMEOUT) {
      logger.log('session-expired', { sessionId });
      sessions.delete(sessionId);
      
      // Notify all participants
      if (session.host) {
        io.to(session.host).emit('session-expired');
      }
      session.clients.forEach(clientId => {
        io.to(clientId).emit('session-expired');
      });
    }
  }
}

setInterval(cleanupSessions, 5 * 60 * 1000); // Check every 5 minutes

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  socket.onAny((event, ...args) => {
    console.log(`[SOCKET.IO] Event: ${event}, Args:`, args);
  });
  socket.on('error', (err) => {
    console.error(`[SOCKET.IO] Error: ${err.message || err}`);
  });

  // Backwards-compat: simple room-based signaling (for renderer.js / SimplePeer)
  socket.on('join-room', (roomId) => {
    try {
      socket.join(roomId);
      console.log(`[COMPAT] ${socket.id} joined room ${roomId}`);

      // If a formal session exists, add as client
      const sess = sessions.get(roomId);
      if (sess) {
        sess.clients.push(socket.id);
        connections.set(socket.id, { role: 'client', sessionId: roomId });
        console.log(`[COMPAT] Added client ${socket.id} to existing session ${roomId}`);
        // Notify host
        io.to(sess.host).emit('client-joined', { clientId: socket.id, totalClients: sess.clients.length });
        socket.to(roomId).emit('user-connected', socket.id);
        return;
      }

      // Otherwise create a lightweight session with this socket as host
      const session = {
        id: roomId,
        host: socket.id,
        passwordHash: null,
        clients: [],
        created: Date.now(),
        permissions: {
          viewScreen: true,
          controlMouse: true,
          controlKeyboard: true
        }
      };
      sessions.set(roomId, session);
      connections.set(socket.id, { role: 'host', sessionId: roomId });
      console.log(`[COMPAT] Created lightweight session ${roomId} with host ${socket.id}`);

      // Notify others in the room (none yet)
      socket.to(roomId).emit('user-connected', socket.id);
    } catch (e) {
      console.error('[COMPAT] join-room error:', e);
    }
  });

  socket.on('signal', (data) => {
    try {
      console.log(`[COMPAT] Forwarding signal from ${socket.id} to ${data.to}`);
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    } catch (e) {
      console.error('[COMPAT] signal error:', e);
    }
  });
  
  // Create new session (Host)
  socket.on('create-session', async (callback) => {
    try {
      const sessionId = generateSessionId();
      const password = generatePassword();
      const passwordHash = await hashPassword(password);
      
      const session = {
        id: sessionId,
        host: socket.id,
        passwordHash,
        clients: [],
        created: Date.now(),
        permissions: {
          viewScreen: true,
          controlMouse: true,
          controlKeyboard: true
        }
      };
      
      sessions.set(sessionId, session);
      connections.set(socket.id, { role: 'host', sessionId });
      
      logger.log('session-created', { 
        sessionId, 
        hostId: socket.id 
      });
      
      callback({ 
        success: true, 
        sessionId, 
        password 
      });
      
    } catch (error) {
      logger.log('session-creation-failed', { error: error.message });
      callback({ success: false, error: error.message });
    }
  });
  
  // Join existing session (Client)
  socket.on('join-session', async ({ sessionId, password }, callback) => {
    try {
      const session = sessions.get(sessionId);
      
      if (!session) {
        logger.log('join-failed-not-found', { sessionId, clientId: socket.id });
        return callback({ success: false, error: 'Session not found' });
      }
      
      // Verify password
      const passwordValid = await verifyPassword(password, session.passwordHash);
      if (!passwordValid) {
        logger.log('join-failed-invalid-password', { sessionId, clientId: socket.id });
        return callback({ success: false, error: 'Invalid password' });
      }
      
      // Check client limit
      if (session.clients.length >= MAX_CLIENTS_PER_SESSION) {
        logger.log('join-failed-full', { sessionId, clientId: socket.id });
        return callback({ success: false, error: 'Session is full' });
      }
      
      // Add client to session
      session.clients.push(socket.id);
      connections.set(socket.id, { role: 'client', sessionId });
      
      logger.log('client-joined', { 
        sessionId, 
        clientId: socket.id,
        totalClients: session.clients.length 
      });
      
      // Notify host
      io.to(session.host).emit('client-joined', { 
        clientId: socket.id,
        totalClients: session.clients.length 
      });
      
      callback({ 
        success: true,
        permissions: session.permissions
      });
      
    } catch (error) {
      logger.log('join-error', { error: error.message });
      callback({ success: false, error: error.message });
    }
  });
  
  // WebRTC Signaling - Offer (from Host to Client)
  socket.on('webrtc-offer', ({ targetId, offer }) => {
    const conn = connections.get(socket.id);
    if (!conn || conn.role !== 'host') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    
    logger.log('webrtc-offer', { 
      from: socket.id, 
      to: targetId 
    });
    
    io.to(targetId).emit('webrtc-offer', { 
      fromId: socket.id, 
      offer 
    });
  });
  
  // WebRTC Signaling - Answer (from Client to Host)
  socket.on('webrtc-answer', ({ targetId, answer }) => {
    const conn = connections.get(socket.id);
    if (!conn || conn.role !== 'client') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    
    logger.log('webrtc-answer', { 
      from: socket.id, 
      to: targetId 
    });
    
    io.to(targetId).emit('webrtc-answer', { 
      fromId: socket.id, 
      answer 
    });
  });
  
  // WebRTC Signaling - ICE Candidate
  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', { 
      fromId: socket.id, 
      candidate 
    });
  });
  
  // Update permissions (Host only)
  socket.on('update-permissions', ({ permissions }, callback) => {
    const conn = connections.get(socket.id);
    if (!conn || conn.role !== 'host') {
      return callback({ success: false, error: 'Unauthorized' });
    }
    
    const session = sessions.get(conn.sessionId);
    if (session) {
      session.permissions = { ...session.permissions, ...permissions };
      
      logger.log('permissions-updated', { 
        sessionId: conn.sessionId, 
        permissions 
      });
      
      // Notify all clients
      session.clients.forEach(clientId => {
        io.to(clientId).emit('permissions-updated', session.permissions);
      });
      
      callback({ success: true });
    }
  });
  
  // Remote control command
  socket.on('remote-control', ({ command }) => {
    const conn = connections.get(socket.id);
    if (!conn || conn.role !== 'client') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    
    const session = sessions.get(conn.sessionId);
    if (!session) return;
    
    // Check permissions
    if (command.type === 'mouse' && !session.permissions.controlMouse) {
      return socket.emit('error', { message: 'Mouse control not permitted' });
    }
    if (command.type === 'keyboard' && !session.permissions.controlKeyboard) {
      return socket.emit('error', { message: 'Keyboard control not permitted' });
    }
    
    // Forward to host
    io.to(session.host).emit('remote-control', { 
      fromId: socket.id, 
      command 
    });
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    const conn = connections.get(socket.id);
    if (!conn) return;
    
    const session = sessions.get(conn.sessionId);
    if (!session) return;
    
    if (conn.role === 'host') {
      // Host disconnected - end session
      logger.log('host-disconnected', { 
        sessionId: conn.sessionId 
      });
      
      session.clients.forEach(clientId => {
        io.to(clientId).emit('host-disconnected');
      });
      
      sessions.delete(conn.sessionId);
      
    } else if (conn.role === 'client') {
      // Client disconnected
      session.clients = session.clients.filter(id => id !== socket.id);
      
      logger.log('client-disconnected', { 
        sessionId: conn.sessionId,
        clientId: socket.id,
        remainingClients: session.clients.length 
      });
      
      // Notify host
      io.to(session.host).emit('client-disconnected', { 
        clientId: socket.id,
        totalClients: session.clients.length 
      });
    }
    
    connections.delete(socket.id);
  });

  // Explicit leave-room (client or host can call)
  socket.on('leave-room', ({ roomId }) => {
    try {
      const conn = connections.get(socket.id);
      const session = sessions.get(roomId || (conn && conn.sessionId));
      if (!session) return;

      if (conn && conn.role === 'host') {
        // Host leaving: notify clients and delete session
        session.clients.forEach(clientId => io.to(clientId).emit('host-disconnected'));
        sessions.delete(session.id);
        logger.log('host-left', { sessionId: session.id, hostId: socket.id });
      } else {
        // Client leaving
        session.clients = session.clients.filter(id => id !== socket.id);
        io.to(session.host).emit('client-disconnected', { clientId: socket.id, totalClients: session.clients.length });
        connections.delete(socket.id);
        logger.log('client-left', { sessionId: session.id, clientId: socket.id });
      }
    } catch (e) {
      console.error('leave-room error:', e);
    }
  });
});

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeSessions: sessions.size,
    uptime: process.uptime()
  });
});

app.get('/api/session/:id/status', (req, res) => {
  const session = sessions.get(req.params.id.toUpperCase());
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.id,
    active: true,
    clients: session.clients.length,
    created: session.created
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n🚀 Remote Desktop Signaling Server');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔒 Security: ${USE_HTTPS ? 'HTTPS' : 'HTTP (dev only)'}`);
  console.log(`\n📋 Connect clients to: ${USE_HTTPS ? 'wss' : 'ws'}://localhost:${PORT}`);
  console.log('\n✅ Server ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});