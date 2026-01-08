# RemoteX LAN Network Testing Guide

## 🔴 Problem: Two Laptops Not Connecting

**Root Cause**: Both clients are trying to connect to `localhost` (127.0.0.1) instead of the actual signaling server IP address.

---

## ✅ Solution: LAN Network Setup

### Architecture Overview
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Laptop 1       │         │  Signaling       │         │  Laptop 2       │
│  (Technician)   │────────▶│  Server          │◀────────│  (Customer)     │
│  192.168.1.100  │         │  192.168.1.50    │         │  192.168.1.101  │
│                 │         │  Port: 3001      │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Key Point**: Both laptops must connect to the SAME signaling server IP.

---

## 📋 Step-by-Step Setup

### Step 1: Find Your Network IP Addresses

#### On Windows:
```cmd
ipconfig
```
Look for **IPv4 Address** under your active network adapter (WiFi or Ethernet)

Example output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.50
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

**Your Server IP**: `192.168.1.50` (example)

#### On macOS/Linux:
```bash
ifconfig
# or
ip addr show
```

---

### Step 2: Choose Which Laptop Runs the Server

**Option A: Dedicated Server Laptop** (Recommended)
- One laptop runs ONLY the signaling server
- Two other laptops run RemoteX clients

**Option B: Technician's Laptop as Server** (Easier for testing)
- Laptop 1 runs: Signaling server + RemoteX admin client
- Laptop 2 runs: RemoteX customer client

---

### Step 3: Start Signaling Server

#### On the Server Laptop:

Navigate to server directory:
```cmd
cd c:\Users\ShivaDosala\Desktop\RemoteX\server
```

Install dependencies (if not done):
```cmd
npm install
```

Start the server:
```cmd
npm start
```

**Expected Output**:
```
🚀 RemoteX Signaling Server
📡 Listening on: http://0.0.0.0:3001
🌐 Local:        http://127.0.0.1:3001
🌐 Network:      http://192.168.1.50:3001
```

**Important**: Note the **Network** IP address. This is what other laptops will connect to.

---

### Step 4: Configure Server IP in Client

You have **TWO options**:

#### **Option A: Environment Variable** (Recommended)

Create/edit `.env` file in `client` directory:
```bash
# c:\Users\ShivaDosala\Desktop\RemoteX\client\.env
VITE_SIGNAL_SERVER_URL=http://192.168.1.50:3001
```

Replace `192.168.1.50` with your actual server IP.

Then rebuild:
```cmd
cd c:\Users\ShivaDosala\Desktop\RemoteX\client
npm run build
npm start
```

#### **Option B: Quick Manual Edit** (For testing)

I'll update the code to automatically detect LAN IP. See implementation below.

---

### Step 5: Connect Both Laptops

#### **Laptop 1 (Technician)**:
1. Open: `http://localhost:5173/?mode=admin`
2. Login with: `tech` / `tech123`
3. Create session → Get session code (e.g., `ABC123XY`)
4. Share this code with Laptop 2

#### **Laptop 2 (Customer)**:
1. Open: `http://localhost:5173/?mode=client`
2. Enter session code: `ABC123XY`
3. Click "Connect to Node"

---

## 🔧 Automatic LAN IP Detection (Code Fix)

Update `getInitialSignalUrl()` to support LAN:

```typescript
function getInitialSignalUrl() {
  // 1. Check environment variable first
  if (import.meta.env.VITE_SIGNAL_SERVER_URL) {
    return import.meta.env.VITE_SIGNAL_SERVER_URL;
  }

  // 2. If running in browser (not file://), use same origin
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    // If accessing from another machine (e.g., 192.168.1.50:5173)
    // Use the same host for signaling server but port 3001
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return window.location.origin.replace(':5173', ':3001');
  }

  // 3. Fallback to localhost
  return 'http://127.0.0.1:3001';
}
```

---

## 🛠️ Troubleshooting

### Issue 1: "Connection Failed" or "Socket Disconnected"

**Check**:
```cmd
# On server laptop
netstat -an | findstr 3001
```

Should show:
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING
```

**Solution**: Restart signaling server

---

### Issue 2: Firewall Blocking Connections

**Windows Firewall**:
```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="RemoteX Server" dir=in action=allow protocol=TCP localport=3001

netsh advfirewall firewall add rule name="RemoteX Client" dir=in action=allow protocol=TCP localport=5173
```

**Or**: Temporarily disable firewall for testing (not recommended for production)

---

### Issue 3: Can't Access from Other Laptop

**Test Connection**:
From Laptop 2, open browser:
```
http://192.168.1.50:3001
```

Should see: "RemoteX Signaling Server Running" or similar message

If **timeout/refused**:
- Server not running
- Wrong IP address
- Firewall blocking

---

### Issue 4: WebRTC Connection Fails (Socket connects but no video)

**STUN Server Issue**: Add public STUN servers

Update SimplePeer configuration:
```typescript
const peer = new SimplePeer({
  initiator: true,
  stream: streamRef.current,
  trickle: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }
});
```

---

## 📊 Network Testing Checklist

### Before Starting:
- [ ] Both laptops on same WiFi network
- [ ] Server laptop IP address noted (e.g., 192.168.1.50)
- [ ] Firewall allows ports 3001 and 5173
- [ ] Signaling server running and accessible

### Connection Test:
- [ ] Laptop 2 can ping Laptop 1: `ping 192.168.1.50`
- [ ] Laptop 2 can access server: `http://192.168.1.50:3001`
- [ ] Laptop 2 can access client UI: `http://192.168.1.50:5173`
- [ ] Socket.io connects (check browser console)
- [ ] WebRTC peers connect

---

## 🌐 Access from Other Laptop

### Method 1: Direct IP Access
```
# On Laptop 2, open browser:
http://192.168.1.50:5173/?mode=client

# Replace 192.168.1.50 with Laptop 1's actual IP
```

### Method 2: Use Environment Variable
```bash
# On each laptop, set server IP:
VITE_SIGNAL_SERVER_URL=http://192.168.1.50:3001
```

---

## 📝 Quick Start Commands

### Server Laptop (192.168.1.50):
```cmd
# Terminal 1: Start signaling server
cd c:\Users\ShivaDosala\Desktop\RemoteX\server
npm start

# Terminal 2: Start admin client
cd c:\Users\ShivaDosala\Desktop\RemoteX\client
npm start
```

### Customer Laptop (192.168.1.101):
```cmd
# Open browser:
http://192.168.1.50:5173/?mode=client&session=ABC123XY
```

---

## 🔍 Debug Logs

### Check Socket Connection:
Open browser console (F12) and look for:
```javascript
// Should see:
Socket connected: true
Session ID: ABC123XY
Room joined: ABC123XY

// Should NOT see:
Socket disconnected
Connection timeout
ERR_CONNECTION_REFUSED
```

### Check WebRTC Peer:
```javascript
// Should see:
WebRTC Handshake Complete
Peer connected
Stream received

// Should NOT see:
ICE connection failed
Peer error
Connection timeout
```

---

## ✅ Success Indicators

When properly connected, you'll see:

**Admin Dashboard**:
```
✅ Session: ABC123XY
✅ Status: LIVE
✅ Viewer Count: 1
✅ Remote stream visible
```

**Customer View**:
```
✅ Connected to Technician
✅ Screen sharing active
✅ "LIVE CHANNEL" indicator
```

---

## 🚀 Production Deployment (Future)

For production, use:
- Public signaling server (e.g., AWS EC2, Heroku)
- HTTPS with SSL certificates
- TURN servers for NAT traversal
- Domain names instead of IP addresses

Example:
```
Signaling Server: wss://signal.remotex.com
Admin Console:    https://admin.remotex.com
Customer Portal:  https://support.remotex.com
```

---

**Need Help?** Check these logs in order:
1. Server terminal: Is it running? Any errors?
2. Browser console (F12): Socket connection status?
3. Network tab: Any failed requests?
4. WebRTC internals: `chrome://webrtc-internals/`

---

**Last Updated**: 2026-01-08  
**For**: LAN Testing Setup
