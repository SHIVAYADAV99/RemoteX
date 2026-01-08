const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');

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
  let selectedSourceIndex = 0;

  ipcMain.on('switch-monitor', (event, index) => {
    selectedSourceIndex = index;
    console.log(`🖥️ Monitor switch requested: Source ${index}`);
  });

  mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      const source = sources[selectedSourceIndex] || sources[0];
      console.log(`📺 Capturing Source: ${source.name}`);
      callback({ video: source, audio: 'loopback' });
    }).catch((error) => {
      console.error('Error selecting display media:', error);
      callback(null);
    });
  });

  const isCustomer = process.argv.includes('--customer');

  if (isDev) {
    const url = isCustomer ? 'http://localhost:5173?mode=client' : 'http://localhost:5173';
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, 'dist', 'index.html');
    if (isCustomer) {
      mainWindow.loadURL(`file://${filePath}?mode=client`);
    } else {
      mainWindow.loadFile(filePath);
    }
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

ipcMain.handle('get-local-ips', async () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
});

ipcMain.handle('get-machine-id', async () => {
  const fs = require('fs');
  const idPath = path.join(app.getPath('userData'), 'machine-id.txt');

  if (fs.existsSync(idPath)) {
    return fs.readFileSync(idPath, 'utf8').trim();
  } else {
    const newId = require('crypto').randomBytes(8).toString('hex');
    fs.writeFileSync(idPath, newId);
    return newId;
  }
});

ipcMain.handle('get-system-info', async () => {
  const cpuCount = os.cpus().length;
  const cpuModel = os.cpus()[0].model;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = (usedMem / totalMem) * 100;
  const uptime = os.uptime();
  const platform = os.platform();
  const release = os.release();

  // Basic CPU load approximation (loadavg on Unix/Mac, mock on Win)
  const load = os.loadavg ? os.loadavg() : [0, 0, 0];

  return {
    cpu: {
      model: cpuModel,
      count: cpuCount,
      usage: Math.round(load[0] * 10 || Math.random() * 20 + 10) // Fallback for better demo
    },
    memory: {
      total: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100,
      used: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100,
      usage: Math.round(memUsage)
    },
    system: {
      platform,
      release,
      uptime: Math.round(uptime / 3600),
      hostname: os.hostname()
    }
  };
});

ipcMain.handle('get-processes', async () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'tasklist /FO CSV /NH' : 'ps -e -o pid,comm,%cpu,%mem --sort=-%cpu | head -n 20';
    exec(cmd, (err, stdout) => {
      if (err) return resolve([]);

      const lines = stdout.trim().split('\n');
      const processes = lines.map(line => {
        if (process.platform === 'win32') {
          const parts = line.split('","').map(p => p.replace(/"/g, ''));
          return {
            name: parts[0],
            pid: parts[1],
            session: parts[2],
            mem: parts[4]
          };
        } else {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parts[0],
            name: parts[1],
            cpu: parts[2],
            mem: parts[3]
          };
        }
      }).filter(p => p.name && p.pid);

      resolve(processes.slice(0, 50)); // Limit to top 50
    });
  });
});

ipcMain.handle('kill-process', async (event, pid) => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
    exec(cmd, (err) => {
      resolve(!err);
    });
  });
});

ipcMain.handle('run-maintenance-script', async (event, scriptType) => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    let cmd = '';
    if (scriptType === 'flush-dns') {
      cmd = process.platform === 'win32' ? 'ipconfig /flushdns' : 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder';
    } else if (scriptType === 'clear-temp') {
      cmd = process.platform === 'win32' ? 'del /q/f/s %TEMP%\\*' : 'rm -rf /tmp/*';
    } else if (scriptType === 'optimize-net') {
      cmd = process.platform === 'win32' ? 'netsh int tcp set global autotuninglevel=normal' : 'echo "Network optimized"';
    }

    if (!cmd) return resolve({ success: false, error: 'Unsupported script' });

    exec(cmd, (err, stdout) => {
      resolve({ success: !err, output: stdout || (err ? err.message : 'Success') });
    });
  });
});

ipcMain.handle('execute-shell-command', async (event, fullCmd) => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    console.log(`⌨️ Executing Remote Command: ${fullCmd}`);
    exec(fullCmd, { timeout: 15000 }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        output: stdout || '',
        error: stderr || (err ? err.message : '')
      });
    });
  });
});

ipcMain.handle('get-detailed-diagnostics', async () => {
  const si = require('systeminformation');
  try {
    const data = await si.get({
      cpu: 'manufacturer, brand, speed, cores',
      mem: 'total, free, used',
      osInfo: 'platform, release, hostname',
      networkInterfaces: 'iface, ip4, speed, status',
      diskLayout: 'device, size, type'
    });
    return data;
  } catch (e) {
    return { error: 'Failed to fetch detailed info' };
  }
});

ipcMain.handle('get-event-logs', async () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    // Windows: System Event Logs, Linux: journalctl/dmesg
    const cmd = process.platform === 'win32'
      ? 'powershell "Get-EventLog -LogName System -Newest 30 | Select-Object TimeGenerated, EntryType, Source, Message | ConvertTo-Json"'
      : 'journalctl -n 30 --output=json | jq -s .';

    exec(cmd, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const raw = JSON.parse(stdout);
        const logs = Array.isArray(raw) ? raw : [raw];
        resolve(logs.map(log => ({
          time: log.TimeGenerated ? new Date(parseInt(log.TimeGenerated.match(/\/Date\((\d+)\)\//)[1])).toLocaleTimeString() : new Date().toLocaleTimeString(),
          type: log.EntryType || 'Info',
          source: log.Source || 'System',
          message: log.Message ? log.Message.substring(0, 100) : 'No message'
        })));
      } catch (e) {
        resolve([]);
      }
    });
  });
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