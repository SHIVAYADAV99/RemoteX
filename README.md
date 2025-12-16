# Remote Desktop Application

A cross-platform remote desktop application built with Electron, React, and WebRTC.

## Features
- Real-time screen sharing
- Remote control capabilities
- Secure peer-to-peer connections
- Cross-platform support (Windows, macOS, Linux)

## Installation

1. Install dependencies:
```bash
   npm install
```

2. Run in development:
```bash
   npm start
```

3. Build for production:
```bash
   # Windows
   npm run build:win
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
```

## Usage

### Host Mode
1. Click "Share Screen"
2. Select the screen or window to share
3. Share the Session ID with remote users

### Client Mode
1. Click "Connect"
2. Enter the Session ID
3. Enable "Remote Control" to interact with the remote screen

## Requirements
- Node.js 16+
- npm or yarn

## License
MIT