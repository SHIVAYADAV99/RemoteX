# Direct ISP Connectivity Guide (RemoteX)

To use RemoteX across the internet without using tunnels (like localtunnel) or LAN IPs, you must expose your signaling server directly to the internet.

## 1. Requirement: Port Forwarding
Your router's firewall blocks all unsolicited incoming traffic by default. To allow the "Joining" laptop to reach your "Host" laptop, you MUST forward Port 3001.

### Steps:
1.  **Find your Laptop's Internal IP**:
    *   Open Command Prompt and type `ipconfig`.
    *   Look for "IPv4 Address" (e.g., `192.168.1.15`).
2.  **Log into your Router**:
    *   Open a browser and go to your router's gateway (usually `192.168.1.1` or `192.168.0.1`).
3.  **Find "Port Forwarding" or "Virtual Server" settings**:
    *   Create a new rule:
        *   **Service Name**: RemoteX
        *   **External Port**: 3001
        *   **Internal Port**: 3001
        *   **Protocol**: TCP
        *   **Internal IP**: (The IP you found in step 1, e.g., `192.168.1.15`).
4.  **Save/Apply settings**.

## 2. Dynamic Docker Deployment
Since you have Docker and 24GB RAM, you can run the signaling server in a container.

### Start the Server:
Run this from the `RemoteX` root folder:
```bash
docker-compose up -d
```
The server will now be running on port 3001 and will automatically restart if your laptop reboots.

## 3. Connecting via ISP
1.  **On the Host**: Fetch your Public IP (the app shows this on the dashboard).
2.  **On the Joiner**: 
    *   Go to **Join Session** -> **Advanced Settings**.
    *   Set **Signaling Server URL** to: `http://YOUR_PUBLIC_IP:3001`.
    *   Enter the Session ID and connect.

---
**Note:** If your ISP uses **CGNAT** (Carrier Grade NAT), Port Forwarding may not work. In that case, you must use a tunnel (Method B) or a VPN (Tailscale/ZeroTier).
