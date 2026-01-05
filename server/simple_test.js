const http = require('http');

console.log('Starting simple test server...');

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello from simple test server!');
    console.log('Received request!');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Simple server listening on port 3000');
});

server.on('error', (err) => {
    console.error('Server failed:', err.message);
});
