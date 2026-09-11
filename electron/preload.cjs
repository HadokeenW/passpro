const { contextBridge, ipcRenderer } = require("electron");

// Expose safe, selected Electron APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,

  // Direct / silent receipt printing
  printReceipt: (htmlContent, options = {}) => {
    return ipcRenderer.invoke("print-receipt", { htmlContent, options });
  },

  // Open / toggle dedicated kiosk screen on secondary monitor
  openKioskWindow: (options = {}) => {
    return ipcRenderer.invoke("open-kiosk", options);
  },

  // Window control & fullscreen
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMax) => callback(isMax);
    ipcRenderer.on("window-maximized-change", handler);
    return () => ipcRenderer.removeListener("window-maximized-change", handler);
  },
  isFullScreen: () => ipcRenderer.invoke("is-fullscreen"),
  toggleFullScreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  onFullScreenChange: (callback) => {
    const handler = (_event, isFull) => callback(isFull);
    ipcRenderer.on("window-fullscreen-change", handler);
    return () => ipcRenderer.removeListener("window-fullscreen-change", handler);
  },
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  closeWindow: () => ipcRenderer.send("close-window"),

  // Server & LAN info (local IP address for turnstiles / tablets)
  getServerInfo: () => {
    return ipcRenderer.invoke("get-server-info");
  },
});
