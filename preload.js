const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  sendMouseMove: (data) => ipcRenderer.send('mouse-move', data),
  sendMouseClick: (data) => ipcRenderer.send('mouse-click', data),
  sendKeyPress: (data) => ipcRenderer.send('key-press', data),
  // Expose that we're in Electron
  isElectron: true
});