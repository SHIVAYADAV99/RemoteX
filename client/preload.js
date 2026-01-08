const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  sendMouseMove: (pos) => ipcRenderer.invoke('remote-mouse-move', pos),
  sendMouseClick: (pos) => ipcRenderer.invoke('remote-mouse-click', pos),
  sendKey: (data) => ipcRenderer.invoke('remote-key', data),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  runMaintenanceScript: (type) => ipcRenderer.invoke('run-maintenance-script', type),
  getEventLogs: () => ipcRenderer.invoke('get-event-logs'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  switchMonitor: (index) => ipcRenderer.send('switch-monitor', index),
  executeShellCommand: (cmd) => ipcRenderer.invoke('execute-shell-command', cmd),
  getDetailedDiagnostics: () => ipcRenderer.invoke('get-detailed-diagnostics')
});