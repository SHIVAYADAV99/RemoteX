# RemoteX Enterprise Administration & RBAC

## 1. Admin (Technician) Installation
The RemoteX Technician Console is the primary tool for managing support sessions.

### Installation Methods
- **Web Console**: Accessible via `https://remotex.admin.portal`. No installation required.
- **Desktop Console**: Recommended for multi-monitor support and system-level remote control. Download from the portal and follow the wizard.

### Post-Installation
1. Launch the application.
2. Select **Technician Console** login.
3. Authenticate with enterprise credentials.
4. Verify the generation of Session PINs and access to the **Fleet Inventory**.

---

## 2. Role-Based Access Control (RBAC)
RemoteX enforces strict security via assigned roles. Features are visible or hidden based on these privileges.

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Super Admin** | Full | Global settings, User Management, Fleet-wide Reports. |
| **Admin / Team Lead** | High | Manage Technician Groups, View Team Reports, Session Escalation. |
| **Technician** | Standard | Create Sessions, Remote Control, File Transfer, Diagnostics. |
| **Read-Only / Auditor** | Minimal | View Active Sessions, Audit Logs, Performance Reports. No session control. |

---

## 3. Security Architecture
RemoteX utilizes a brokered signaling model to ensure secure, end-to-end encrypted sessions.

```text
+-------------------+          Encrypted Signaling      +----------------------+
|                   |  <----------------------------> |                      |
|  Technician Admin |                                  |  RemoteX Cloud       |
|  Console (Admin)  |                                  |  - Auth & Signaling  |
|                   |                                  |  - Session Broker    |
+---------+---------+                                  |  - Audit Mesh        |
          |                                            +----------+-----------+
          | [1] Create Session (PIN)                               |
          | [2] Share PIN with User                               |
          |                                                       |
+---------v---------+          Encrypted Peer Tunnel    +----------v-----------+
|                   |  <----------------------------> |                      |
|  Customer Support |                                  |  Secure Data         |
|  Client (PIN ONLY)|                                  |  Channel             |
|                   |                                  |                      |
+-------------------+                                  +----------------------+
```

### Security Controls
1. **Explicit Consent**: Customers must enter the PIN and approve the connection modal.
2. **Dynamic PINs**: Single-use, time-bound session codes.
3. **Encryption**: TLS 1.3 for signaling and DTLS/SCTP for the peer media/data stream.
4. **Separation**: Admin consoles are isolated from customer clients.
