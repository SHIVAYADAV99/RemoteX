const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

// Development mode detection
const isDev = process.env.NODE_ENV === 'development';

// Suppress CSP warning in development (unsafe-eval is needed for React hot reloading)
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

let robot;
try {
  robot = require('robotjs');
} catch (e) {
  console.warn('robotjs not installed; remote control will not work. Install with `npm install robotjs`');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // TEMPORARY DEBUG: Disable security to rule out CSP/CORS
      allowRunningInsecureContent: true,
      enableRemoteModule: false,
      experimentalFeatures: false
    }
  });

  // Content Security Policy is set in index.html meta tag
  // Additional security headers for development
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block']
      }
    });
  });

  // Alternative: Set CSP directly on webContents (for Electron 12+)
  mainWindow.webContents.on('dom-ready', () => {
    // CSP is already set in HTML meta tag, but we can reinforce it here if needed
    console.log('🔒 Content Security Policy active');
  });

  // Handle WebRTC screen sharing permissions
  mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      // Grant access to the first screen available
      callback({ video: sources[0], audio: 'loopback' });
    }).catch((error) => {
      console.error('Error selecting display media:', error);
      callback(null);
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Development helpers
  if (isDev) {
    console.log('🚀 RemoteX Development Server: http://localhost:5173');
    console.log('🔧 To install React DevTools: npm install -g react-devtools && react-devtools');
    console.log('📊 Open DevTools with Ctrl+Shift+I or Cmd+Option+I');
    console.log('🔒 Content Security Policy: Active (development mode - unsafe-eval allowed for React hot reloading)');
    console.log('⚠️  CSP warnings suppressed in development mode');
  }
}

ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    console.log('Available sources:', sources.length);
    return sources;
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

app.whenReady().then(() => {
  createWindow(); // No signaling server start here

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Remote control IPC handlers (host will receive commands from server and call these)
ipcMain.handle('remote-mouse-move', (event, { x, y }) => {
  if (!robot) return { success: false, error: 'robotjs-not-installed' };
  try {
    robot.moveMouse(Math.round(x), Math.round(y));
    return { success: true };
  } catch (err) {
    console.error('remote-mouse-move error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('remote-mouse-click', (event, { x, y, button = 'left' }) => {
  if (!robot) return { success: false, error: 'robotjs-not-installed' };
  try {
    robot.moveMouse(Math.round(x), Math.round(y));
    robot.mouseClick(button);
    return { success: true };
  } catch (err) {
    console.error('remote-mouse-click error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('remote-key', (event, { key, modifiers = [] }) => {
  if (!robot) return { success: false, error: 'robotjs-not-installed' };
  try {
    robot.keyTap(key, modifiers);
    return { success: true };
  } catch (err) {
    console.error('remote-key error:', err);
    return { success: false, error: err.message };
  }
});