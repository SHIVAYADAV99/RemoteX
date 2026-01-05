# RemoteX - Premium Remote Desktop Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-windows%20%7C%20linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Next-generation remote desktop application with AnyDesk-style UI and WebRTC technology**

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Docker](#-docker-deployment)

</div>

---

## 🎯 Overview

RemoteX is a production-ready, cross-platform remote desktop application built with **Electron**, **React**, and **WebRTC**. It provides secure, real-time screen sharing and remote control with a premium dark-mode interface and multiple connection methods.

### Key Highlights
- ✅ **Zero-configuration LAN sharing** - Works on same WiFi instantly
- ✅ **Internet connectivity via tunnel** - No router setup required  
- ✅ **Premium UI/UX** - Glassmorphism, dark mode, micro-animations
- ✅ **Docker-ready** - Containerized signaling server
- ✅ **Secure by default** - WebRTC encryption, CSP hardened
- ✅ **Cross-platform** - Windows & Linux support

---

## 🚀 Quick Start

### For End Users

**Host (Share Your Screen):**
```bash
cd client
npm run start
# Click "Host Session" → "Start Sharing"
# Share the Session ID with viewers
```

**Viewer (Connect to Remote):**
```bash
# On another laptop, launch RemoteX
# Click "Join Session"
# Enter the Session ID
# Done! 🎉
```

### For Developers

```bash
# Install dependencies
cd client
npm install

# Development mode
npm run dev          # Start Vite dev server
npm run electron     # Launch Electron app

# Production build
npm run build
```

---

## ✨ Features

### Core Functionality
- 🖥️ **Real-time screen sharing** via WebRTC
- 🖱️ **Remote mouse & keyboard control** with robotjs
- 📺 **Responsive canvas rendering** with zoom controls
- 🔔 **Toast notifications** for connection events
- 📊 **Viewer count tracking** for hosts

### UI/UX Excellence
- 🌍 **World map tech background** on all screens
- 🎨 **Glassmorphism effects** with premium gradients
- ⚡ **Smooth animations** and hover effects
- 📱 **Responsive design** adapts to any screen size
- 🎯 **Loading overlays** during connection states

### Network Flexibility
- **Method A**: Same WiFi (LAN) - `192.168.x.x:3001`
- **Method B**: Internet Tunnel - `npx localtunnel --port 3001`
- **Method C**: Direct ISP - Configure port forwarding

### Security
- 🔒 WebRTC peer-to-peer encryption (DTLS-SRTP)
- 🛡️ Content Security Policy configured
- 🎲 Random 8-character session IDs
- 🚫 No password storage required

---

## 🐳 Docker Deployment

### Start Signaling Server
```bash
docker-compose up -d
```

### Verify Running
```bash
docker logs remotex-signaling -f
```

### Stop Server
```bash
docker-compose down
```

**Server will auto-restart** on system reboot and handle unlimited concurrent sessions.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md)** | Complete architecture & code review |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Usage instructions for all methods |
| **[ISP_CONNECTIVITY_GUIDE.md](ISP_CONNECTIVITY_GUIDE.md)** | Router port forwarding guide |

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Host      │────────▶│ Signaling Server │◀────────│   Viewer    │
│  (Share)    │         │   (Socket.IO)    │         │  (Connect)  │
└─────────────┘         └──────────────────┘         └─────────────┘
       │                         ▲                            │
       │                         │                            │
       └─────────WebRTC P2P Video Stream──────────────────────┘
```

**Technology Stack:**
- Frontend: React 18 + TypeScript + TailwindCSS
- Desktop: Electron 28.3
- Signaling: Socket.IO 4.8
- Media: WebRTC (native)
- Control: robotjs 0.6
- Container: Docker + Alpine Linux

---

## 🛠️ Build Commands

```bash
npm run dev              # Vite dev server
npm run build            # Production build
npm run build:win        # Windows installer
npm run build:linux      # Linux package
npm run server           # Start signaling server
```

---

## 🧪 Testing

### Local (Same Machine)
1. Launch two instances of RemoteX
2. Host → Start Sharing → Note Session ID
3. Viewer → Join Session → Enter ID
4. ✅ Connected

### Network (Different Machines)
**Same WiFi:**
- Use the **green LAN address** from host dashboard

**Different Networks:**
```bash
# On host laptop terminal:
npx localtunnel --port 3001

# Use provided URL on viewer laptop
```

---

## 🤝 Contributing

This is a production application ready for deployment. For feature requests or bug reports, please review the [TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md) first.

---

## 📊 Project Stats

- **Components**: 10 React components
- **Core Files**: ~250 files (incl. dependencies)
- **Build Time**: ~2.5s (Vite production)
- **Docker Image**: ~150MB (Alpine + Node)
- **Session Capacity**: Unlimited (P2P architecture)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices in remote desktop solutions. Inspired by AnyDesk and TeamViewer.

**Powered by**: Electron • React • WebRTC • Socket.IO • Docker

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by [Shiva Yadav](https://github.com/SHIVAYADAV99)

</div>