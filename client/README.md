# RemoteX - Secure Remote Desktop Platform

## 🔒 Security Configuration

### Content Security Policy (CSP)

**Development Mode:**
- CSP warnings are suppressed using `ELECTRON_DISABLE_SECURITY_WARNINGS=true`
- `unsafe-eval` and `unsafe-inline` are allowed for React hot reloading
- All external connections are restricted to localhost and trusted domains

**Production Mode:**
- CSP should be hardened to remove `unsafe-eval` and `unsafe-inline`
- Only allow specific trusted domains
- Enable strict CSP enforcement

### Security Headers

The application includes additional security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Electron Security

- `nodeIntegration: false` - Prevents direct Node.js access
- `contextIsolation: true` - Isolates renderer from main process
- `webSecurity: true` - Enables web security features
- `enableRemoteModule: false` - Disables remote module access

## 🚀 Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Start Electron app:
   ```bash
   npm run electron
   ```

4. (Optional) Install React DevTools:
   ```bash
   npm install -g react-devtools
   npm run devtools
   ```

## 📦 Production Build

For production builds, update the CSP in `index.html` to remove development allowances:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; ...">
```

## 🔧 Troubleshooting

- **CSP Warnings**: Expected in development, suppressed automatically
- **React DevTools**: Install globally for better debugging experience
- **Security Warnings**: Review Electron security documentation for production hardening</content>
<parameter name="filePath">c:\Users\ShivaDosala\Desktop\RemoteX\client\README.md