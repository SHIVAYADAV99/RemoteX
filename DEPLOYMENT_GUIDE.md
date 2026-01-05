# RemoteX - Deployment & Usage Guide

## 🚀 Quick Start

### Starting the Signaling Server

**Option 1: Docker (Recommended for Production)**
```bash
cd C:\Users\ShivaDosala\Desktop\RemoteX
docker-compose up -d
```
*The server will now run in the background and auto-restart on reboot*

**Option 2: Direct Node.js**
```bash
cd C:\Users\ShivaDosala\Desktop\RemoteX\client
node signaling-server.js
```

---

## 📱 Using RemoteX

### Method A: Same WiFi (LAN) - Fastest
**When to use**: Both laptops on the same WiFi network

1. **Host**: Click "Host Now" → "Start Sharing"
2. **Host**: Copy the **Green Box** address (e.g., `192.168.1.15:3001`)
3. **Joiner**: Click "Join Session" → Advanced Settings
4. **Joiner**: Paste that LAN address and enter the Session Code
5. ✅ Connected!

### Method B: Different Networks (Tunnel) - Most Reliable
**When to use**: Laptops on different WiFi/locations

1. **Host**: Open terminal and run:
   ```bash
   npx localtunnel --port 3001
   ```
2. **Host**: Copy the URL it gives (e.g., `https://xyz.loca.lt`)
3. **Host**: Start sharing and note the Session Code
4. **Joiner**: Use that tunnel URL in Advanced Settings
5. ✅ Connected!

### Method C: Direct ISP (Public IP) - Advanced
**When to use**: You have configured Port Forwarding on your router

1. **Host**: Verify port forwarding is working at [canyouseeme.org](https://canyouseeme.org) (Port 3001)
2. **Host**: Use your Public IP shown on the dashboard
3. **Joiner**: Enter `http://YOUR_PUBLIC_IP:3001` in Advanced Settings
4. ✅ Connected!

*Note: Most ISPs block incoming ports or use CGNAT, making Method B more practical*

---

## 🎮 Remote Control Features

Once connected:
- **View Screen**: Automatically starts displaying the host's screen
- **Control Toggle**: Click "Enable Remote Control" to send mouse/keyboard
- **Zoom Controls**: Use +/- or Reset button for optimal viewing
- **Disconnect**: Click the Disconnect button to end the session

---

## 🐳 Docker Management

### View Logs
```bash
docker logs remotex-signaling -f
```

### Stop Server
```bash
docker-compose down
```

### Restart Server
```bash
docker-compose restart
```

### Remove Container
```bash
docker-compose down -v
```

---

## 🔧 Troubleshooting

### "Connection Refused" Error
1. Verify Docker is running: `docker ps`
2. Check if port 3001 is available: `netstat -ano | findstr :3001`
3. Use **Method B (Tunnel)** which bypasses all firewall issues

### Blank/Black Screen
1. Wait 5-10 seconds for initial connection
2. Check that Host clicked "Start Sharing"
3. Verify Session Code matches exactly

### Slow Performance
1. Use LAN connection when possible (Method A)
2. Close other bandwidth-heavy apps
3. Check your internet speed (tunnel requires upload bandwidth)

---

## 📊 System Requirements

### Host (Sharing Screen)
- Windows 10/11 or Linux
- 4GB RAM minimum
- Node.js 18+ (Docker bypasses this)

### Viewer (Connecting)
- Any OS with a modern browser
- 2GB RAM minimum
- Stable internet (1 Mbps+ recommended)

---

## 🔐 Security Notes

- Sessions use unique 8-character codes
- No passwords required (session-based security)
- WebRTC provides peer-to-peer encryption
- Tunnel URLs are temporary and expire after session

---

## 💡 Best Practices

1. **For Same Office**: Always use Method A (LAN)
2. **For Remote Support**: Use Method B (Tunnel)
3. **Keep Docker Running**: Set it to auto-start on boot
4. **Session Codes**: Generate new ones for each support session
5. **Bandwidth**: Host should have stable upload speed (5+ Mbps ideal)

---

## ☁️ Google Cloud Run Deployment (Public URL)

To deploy RemoteX to a public server with a secure HTTPS URL, use the included helper script.

**Prerequisites:**
1.  Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2.  Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
3.  Enable Billing for your project.

**One-Click Deployment:**
Double-click `deploy_cloud_run.bat` in the project folder.

**Manual Command:**
```bash
gcloud run deploy remotex --source . --port 3000 --allow-unauthenticated
```
*This handles building the client, setting up the server, and providing a public `https://remotex-xyz.a.run.app` URL.*

---

## 🎯 Production Deployment

For deploying in a corporate environment:

1. **Deploy Docker server** on a dedicated machine
2. **Configure firewall** to allow port 3001
3. **Use a domain name** instead of IP (optional via reverse proxy)
4. **Enable HTTPS** with Let's Encrypt (for production)
5. **Monitor logs** via `docker logs` for session tracking

---

## 📞 Support

Your RemoteX application is fully configured and production-ready!
- All source code: `C:\Users\ShivaDosala\Desktop\RemoteX`
- Docker setup: `docker-compose.yml`
- Connection guide: `ISP_CONNECTIVITY_GUIDE.md`
