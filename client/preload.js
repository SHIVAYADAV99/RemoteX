const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  sendMouseMove: (pos) => ipcRenderer.invoke('remote-mouse-move', pos),
  sendMouseClick: (pos) => ipcRenderer.invoke('remote-mouse-click', pos),
  sendKey: (data) => ipcRenderer.invoke('remote-key', data)
});