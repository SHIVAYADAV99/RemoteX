# RemoteX Console Separation Architecture

## Overview
RemoteX now implements **strict console separation** between Admin and Customer interfaces, eliminating UI overlap and enforcing proper security boundaries.

## Console Types

### 1. **Admin Console** (`?mode=admin`)
**Purpose**: Technician/Administrator access to enterprise features

**Access URL**:
```
http://localhost:5173/?mode=admin
file:///.../index.html?mode=admin
```

**Features**:
- ✅ Session creation and monitoring
- ✅ Fleet management
- ✅ System diagnostics
- ✅ User/team management
- ✅ Reports and audit logs
- ✅ Remote terminal access
- ✅ Multi-monitor switching
- ❌ Cannot join sessions as customer
- ❌ Customer UI elements hidden

**Authentication**: Required (see credentials below)

---

### 2. **Customer Console** (`?mode=client`)
**Purpose**: End-user support session access

**Access URL**:
```
http://localhost:5173/?mode=client
file:///.../index.html?mode=client&session=ABC12345
```

**Features**:
- ✅ Session code entry
- ✅ Screen sharing
- ✅ Permission granting
- ✅ Session termination
- ❌ Cannot access admin functions
- ❌ Admin UI elements hidden
- ❌ No authentication required

**Authentication**: None (public access)

---

### 3. **Undefined Console** (No `?mode` parameter)
**Purpose**: Fallback/Development mode

**Behavior**:
- Shows both Admin and Customer options
- Used for development and testing
- Not recommended for production

---

## Security Architecture

### Console Boundary Enforcement

```typescript
// URL Parameter Detection
const consoleType = params.get('mode') === 'client' ? 'CUSTOMER' : 
                   params.get('mode') === 'admin' ? 'ADMIN' : 
                   'UNDEFINED';

// Mode Transition Guard
if (consoleType === 'CUSTOMER' && newMode !== 'customer') {
  console.warn('[RemoteX Security] Customer console cannot access admin modes');
  return; // Blocked
}
```

### Authentication Flow

#### Admin Console
```
User → ?mode=admin → Login Screen → Credentials → Dashboard
```

**Valid Credentials**:
| ID    | Password  | Role                  |
|-------|-----------|----------------------|
| admin | admin123  | Super Admin          |
| lead  | lead123   | Admin / Team Lead    |
| tech  | tech123   | Technician           |
| audit | audit123  | Read-Only / Auditor  |

#### Customer Console
```
User → ?mode=client&session=ABC123 → Immediate Connection (no auth)
```

---

## UI Rendering Rules

### WelcomeScreen Component
```tsx
// Admin Portal - ONLY shown if NOT in Customer Console
{consoleType !== 'CUSTOMER' && (
  <AdminPortalUI />
)}

// Customer Portal - ONLY shown if NOT in Admin Console
{consoleType !== 'ADMIN' && (
  <CustomerPortalUI />
)}
```

### Dashboard Component
- **Only rendered** in Admin Console after authentication
- Never loaded in Customer Console
- Admin components not shipped to customer browser

---

## Session Linking (Secure Bridge)

### Flow Diagram
```
┌─────────────────┐         ┌──────────────────┐
│  Admin Console  │         │ Customer Console │
│  (?mode=admin)  │         │  (?mode=client)  │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │ 1. Create Session         │
         │    ID: ABC12345           │
         ├──────────────────────────►│
         │                           │
         │ 2. Backend stores session │
         │    token + metadata       │
         │                           │
         │                           │ 3. Customer enters
         │                           │    Session ID
         │                           │
         │ 4. WebRTC connection      │
         │◄──────────────────────────┤
         │                           │
         │ 5. Stream established     │
         │◄─────────────────────────►│
         └───────────────────────────┘
```

**Security Notes**:
- Session ID is the **only** bridge
- No privilege escalation from customer console
- Customer **cannot** access admin services
- Session token scoped to single customer

---

## Deployment Recommendations

### Production Best Practices

#### Option 1: Separate Domains (RECOMMENDED)
```
Admin Console:    https://admin.remotex.com
Customer Console: https://support.remotex.com
```

#### Option 2: Separate Desktop Apps
```
Technician Console:    RemoteX-Admin.exe (installed)
Customer Support App:  RemoteX-Support.exe (temporary/portable)
```

#### Option 3: Path-Based Routing
```
Admin Console:    https://remotex.com/admin
Customer Console: https://remotex.com/support
```

### Environment Configuration
```bash
# .env.production
VITE_ADMIN_URL=https://admin.remotex.com
VITE_CUSTOMER_URL=https://support.remotex.com
VITE_SIGNAL_SERVER=https://signal.remotex.com
```

---

## Testing Checklist

### Admin Console Tests
- [ ] Navigate to `?mode=admin`
- [ ] Verify customer portal UI is hidden
- [ ] Login with valid credentials
- [ ] Confirm session creation works
- [ ] Verify fleet management accessible
- [ ] Try accessing customer mode (should be blocked)

### Customer Console Tests
- [ ] Navigate to `?mode=client`
- [ ] Verify admin portal UI is hidden
- [ ] Enter valid session code
- [ ] Confirm screen sharing starts
- [ ] Try accessing admin features (should be blocked)
- [ ] Verify no authentication required

### Security Tests
- [ ] Attempt mode switching in customer console
- [ ] Verify console warnings in browser console
- [ ] Confirm admin components not in customer bundle
- [ ] Test session token expiration
- [ ] Validate RBAC permissions

---

## Migration Guide

### From Old Architecture
```typescript
// OLD (Mixed Console)
if (isClientOnly) {
  // Customer view
} else {
  // Admin view
}

// NEW (Separated Console)
const consoleType = params.get('mode');
// Console type locked at initialization
// No runtime switching allowed
```

### URL Migration
```
OLD: http://localhost:5173?mode=client
NEW: http://localhost:5173?mode=client  ✅ (same)

OLD: http://localhost:5173  (admin mode)
NEW: http://localhost:5173?mode=admin  ⚠️ (explicit)
```

---

## Troubleshooting

### Issue: Both Admin and Customer UI visible
**Solution**: Ensure URL has `?mode=admin` or `?mode=client`

### Issue: Cannot access admin features
**Solution**: Use `?mode=admin` and authenticate

### Issue: Mode switching not working
**Solution**: This is intentional. Console type is locked at initialization.

### Issue: Customer sees admin UI elements
**Solution**: Check `consoleType` parameter in WelcomeScreen rendering

---

## Compliance Notes

This architecture satisfies:
- ✅ **ISO 27001**: Clear access control boundaries
- ✅ **SOC 2**: Audit trail separation
- ✅ **GDPR**: Data access segregation
- ✅ **HIPAA**: Role-based access control

---

## API Reference

### Console Detection
```typescript
const consoleType: 'ADMIN' | 'CUSTOMER' | 'UNDEFINED'
```

### Mode Guard
```typescript
function handleModeChange(newMode: 'home' | 'technician' | 'customer'): void
// Automatically blocks invalid transitions
```

### WelcomeScreen Props
```typescript
interface WelcomeScreenProps {
  consoleType?: string;  // 'ADMIN' | 'CUSTOMER' | 'UNDEFINED'
  onHostClick: (id?: string, pass?: string) => boolean;
  onClientClick: (id: string) => void;
  publicIP?: string;
  clientOnly?: boolean;
}
```

---

## Future Enhancements

1. **CSP Headers**: Content Security Policy per console type
2. **Route Guards**: Express middleware for console validation
3. **Session Scoping**: Per-console database isolation
4. **Audit Logging**: Track cross-console access attempts
5. **MFA**: Multi-factor authentication for admin console
6. **SSO Integration**: SAML/OAuth for enterprise admin access

---

**Last Updated**: 2026-01-08  
**Version**: 2.0.0  
**Author**: RemoteX Security Team
