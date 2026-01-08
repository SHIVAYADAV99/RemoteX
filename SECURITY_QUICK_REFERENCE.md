# RemoteX Security Quick Reference

## 🔐 Console Access URLs

```bash
# Admin Console (Requires Authentication)
http://localhost:5173/?mode=admin
https://admin.remotex.com

# Customer Console (No Authentication)
http://localhost:5173/?mode=client&session=ABC12345
https://support.remotex.com?session=ABC12345
```

## 👤 Test Credentials

```javascript
// Admin Console Login
username: 'admin'    password: 'admin123'   // Super Admin
username: 'tech'     password: 'tech123'    // Technician
username: 'lead'     password: 'lead123'    // Team Lead
username: 'audit'    password: 'audit123'   // Read-Only Auditor
```

## 🚀 Quick Start Guide

### For Admin Users
```typescript
1. Navigate to: ?mode=admin
2. Click "Authorize Console"
3. Login with credentials above
4. Click "Create Session" → Get session code
5. Share code with customer
6. Accept connection when customer joins
```

### For Customers
```typescript
1. Navigate to: ?mode=client
2. Enter 8-character session code
3. Click "Connect to Node"
4. Grant screen sharing permission
5. Wait for admin to accept
```

## 📡 API Usage Examples

### Admin creates session
```typescript
import { adminAPI } from './services/AdminAPIService';

// Set auth token (from login)
adminAPI.setAuthToken('your-jwt-token');

// Create session
const session = await adminAPI.createSession({
  permissions: {
    screenView: true,
    remoteControl: true,
    fileTransfer: false,
    audioShare: true
  }
});

console.log('Share this code:', session.sessionId);
```

### Customer joins session
```typescript
import { customerAPI } from './services/CustomerAPIService';

// Validate session first
const validation = await customerAPI.validateSession('ABC12345');

if (validation.valid) {
  // Join session
  const response = await customerAPI.joinSession({
    sessionId: 'ABC12345',
    customerConsent: true
  });
  
  // Token is automatically stored
  console.log('Connected! Expires in:', response.expiresIn);
}
```

## 🛡️ Security Rules

### ✅ DO
- Use `?mode=admin` for technician access
- Use `?mode=client` for customer access
- Validate console type before API calls
- Use AdminRoute for protected admin pages
- Use CustomerRoute for customer pages
- Store tokens in memory (not localStorage)
- Check permissions before sensitive operations

### ❌ DON'T
- Mix admin and customer UI in same view
- Allow mode switching after initialization
- Use admin JWT in customer APIs
- Use customer token in admin APIs
- Store session IDs in URLs (except initial join)
- Expose admin features to customers

## 🔒 Route Guard Examples

### Protect Admin Route
```tsx
import { AdminRoute } from './guards/RouteGuards';

<Route path="/admin/dashboard" element={
  <AdminRoute requiredRole="Super Admin">
    <AdminDashboard />
  </AdminRoute>
} />
```

### Protect Customer Route
```tsx
import { CustomerRoute } from './guards/RouteGuards';

<Route path="/support" element={
  <CustomerRoute>
    <CustomerSupportView />
  </CustomerRoute>
} />
```

### Permission-Based Guard
```tsx
import { PermissionGuard } from './guards/RouteGuards';

<PermissionGuard requiredPermission="executeCommands">
  <RemoteTerminalButton />
</PermissionGuard>
```

## 🎯 Console Boundary Matrix

| Feature | Admin Console | Customer Console |
|---------|---------------|------------------|
| URL Pattern | `?mode=admin` | `?mode=client` |
| Authentication | Required (JWT) | Not Required |
| Session Creation | ✅ Yes | ❌ No |
| Session Joining | ❌ No | ✅ Yes |
| Fleet Management | ✅ Yes | ❌ No |
| Diagnostics | ✅ Yes | ❌ No |
| Remote Terminal | ✅ Yes | ❌ No |
| Screen Sharing | ✅ Receives | ✅ Sends |
| API Base URL | `/api/admin/*` | `/api/customer/*` |
| Token Header | `Authorization: Bearer` | `X-Customer-Token` |
| Mode Switching | 🔒 Locked | 🔒 Locked |

## 🚨 Error Codes

```typescript
// Authentication Errors
UNAUTHORIZED                   // Missing or invalid token
FORBIDDEN                      // Valid token, insufficient permissions
TOKEN_EXPIRED                  // Token has expired

// Session Errors
SESSION_NOT_FOUND             // Invalid session ID
SESSION_EXPIRED               // Session timeout reached
SESSION_ALREADY_ACTIVE        // Session already in use

// Permission Errors
INSUFFICIENT_PERMISSIONS      // User lacks required permission
OPERATION_NOT_ALLOWED         // Operation blocked by policy

// Security Violations
ADMIN_TOKEN_IN_CUSTOMER_API   // Admin JWT used in customer API
CUSTOMER_TOKEN_IN_ADMIN_API   // Customer token used in admin API
CONSOLE_TYPE_MISMATCH         // Wrong console type for operation
```

## 📞 Emergency Procedures

### Force Terminate All Sessions
```bash
# Admin API
curl -X POST https://admin.remotex.com/api/admin/sessions/terminate-all \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "X-Console-Type: ADMIN"
```

### Revoke Customer Token
```bash
# Admin API
curl -X POST https://admin.remotex.com/api/admin/tokens/revoke \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{"customerToken":"<token-to-revoke>"}'
```

### Check System Status
```bash
# Public endpoint
curl https://status.remotex.com/health
```

## 🔍 Debugging Tips

### Check Console Type
```typescript
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');
console.log('Console Type:', mode); // 'admin' or 'client'
```

### Verify Token
```typescript
// Admin Console
if (adminAPI.authToken) {
  console.log('Admin authenticated');
} else {
  console.log('Admin not authenticated');
}

// Customer Console
if (customerAPI.customerToken) {
  console.log('Customer session active');
}
```

### Monitor Security Warnings
```javascript
// Browser console will show:
// [RemoteX Security] Customer console cannot access admin modes
// [RemoteX Security] Admin console cannot access customer mode
```

## 📚 Related Documentation

- **Frontend Architecture**: `CONSOLE_SEPARATION_ARCHITECTURE.md`
- **Full API Contract**: `API_CONTRACT_IMPLEMENTATION.md`
- **Backend Guards**: `server/guards/backend-guards.ts`
- **TypeScript Types**: `client/src/types/api-contracts.ts`

---

**Support**: support@remotex.com  
**Version**: 2.0.0  
**Last Updated**: 2026-01-08
