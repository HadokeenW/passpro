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

  // Global background RFID scan events
  onGlobalRfidScan: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("global-rfid-scan", handler);
    return () => ipcRenderer.removeListener("global-rfid-scan", handler);
  },

  // Hide kiosk window after popup timeout
  hideKioskPopup: () => {
    ipcRenderer.send("hide-kiosk-popup");
  },

  // Management mode: suppress Kiosk popup when receptionist is searching/managing
  setManagementMode: (active) => {
    ipcRenderer.send("set-management-mode", Boolean(active));
  },
  onManagementRfidScan: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("management-rfid-scan", handler);
    return () => ipcRenderer.removeListener("management-rfid-scan", handler);
  },

  // Trigger simulation test popup after specified delay (in seconds)
  testRfidPopup: (delaySeconds = 3) => {
    ipcRenderer.send("test-rfid-popup", { delaySeconds });
  },
});
