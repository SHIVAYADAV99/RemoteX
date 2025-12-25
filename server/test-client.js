// Simple Socket.IO test client
// Usage:
// 1) cd server
// 2) npm install socket.io-client
// 3) node test-client.js

const { io } = require('socket.io-client');

const url = 'http://localhost:3000';
const socket = io(url, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 3,
  timeout: 5000
});

console.log('Attempting connection to', url);

socket.on('connect', () => {
  console.log('✅ Connected to server, socket id =', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ connect_error:', err && err.message ? err.message : err);
});

socket.on('connect_timeout', () => {
  console.error('❌ connect_timeout');
});

socket.on('error', (err) => {
  console.error('❌ error:', err);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Disconnected:', reason);
});

// Keep process alive briefly to observe events
setTimeout(() => {
  console.log('Closing test client');
  socket.close();
  process.exit(0);
}, 15000);
