const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell, globalShortcut } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const os = require("os");
const { uIOhook, UiohookKey } = require("uiohook-napi");

// Hardware acceleration & GPU flags for buttery smooth 60fps on any device
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

const PORT = parseInt(process.env.PORT || "3000", 10);
const IS_DEV = process.env.NODE_ENV === "development";
const APP_URL = `http://127.0.0.1:${PORT}`;

let mainWindow = null;
let kioskWindow = null;
let tray = null;
let nextServerProcess = null;
let isQuitting = false;

// Global Background RFID Detection Map (0-9, A-F, Numpad0-9)
const RFID_KEY_MAP = {
  [UiohookKey["0"]]: "0",
  [UiohookKey["1"]]: "1",
  [UiohookKey["2"]]: "2",
  [UiohookKey["3"]]: "3",
  [UiohookKey["4"]]: "4",
  [UiohookKey["5"]]: "5",
  [UiohookKey["6"]]: "6",
  [UiohookKey["7"]]: "7",
  [UiohookKey["8"]]: "8",
  [UiohookKey["9"]]: "9",
  [UiohookKey.Numpad0]: "0",
  [UiohookKey.Numpad1]: "1",
  [UiohookKey.Numpad2]: "2",
  [UiohookKey.Numpad3]: "3",
  [UiohookKey.Numpad4]: "4",
  [UiohookKey.Numpad5]: "5",
  [UiohookKey.Numpad6]: "6",
  [UiohookKey.Numpad7]: "7",
  [UiohookKey.Numpad8]: "8",
  [UiohookKey.Numpad9]: "9",
  [UiohookKey.A]: "A",
  [UiohookKey.B]: "B",
  [UiohookKey.C]: "C",
  [UiohookKey.D]: "D",
  [UiohookKey.E]: "E",
  [UiohookKey.F]: "F",
};

const ENTER_KEYS = new Set([UiohookKey.Enter, UiohookKey.NumpadEnter]);

let rfidBuffer = "";
let lastRfidKeyTime = 0;
let isPopupActive = false;
let popupHideTimer = null;
let kioskWasFocusedBeforeScan = false;
let kioskWasMinimizedBeforeScan = false;
let mainWasFocusedBeforeScan = false;
let isManagementMode = false;

// 1. Single Instance Lock
console.log("[PASSPro] Starting Electron main process...");
const gotSingleInstanceLock = app.requestSingleInstanceLock();
console.log("[PASSPro] gotSingleInstanceLock:", gotSingleInstanceLock);
if (!gotSingleInstanceLock) {
  console.log("[PASSPro] Another instance is running, quitting...");
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Helper: Get local network IPv4 address for LAN devices
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Helper: Wait for local Next.js server to respond
function waitForServer(url, timeoutMs = 60000, intervalMs = 500) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        resolve(true);
      });

      req.on("error", () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timeout waiting for server at ${url}`));
        } else {
          setTimeout(check, intervalMs);
        }
      });
      req.end();
    };
    check();
  });
}

// Start Next.js production server if not in dev mode and not already running
function startNextServerIfNeeded() {
  if (IS_DEV) return Promise.resolve();

  return new Promise((resolve) => {
    // Check if port 3000 is already occupied
    const req = http.get(APP_URL, () => {
      console.log(`[PASSPro] Next.js server already running on port ${PORT}`);
      resolve();
    });

    req.on("error", () => {
      console.log(`[PASSPro] Spawning Next.js production server on port ${PORT}...`);
      const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
      
      nextServerProcess = spawn(process.execPath, [nextBin, "start", "-p", PORT.toString()], {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, PORT: PORT.toString(), NODE_ENV: "production" },
        stdio: "inherit",
      });

      nextServerProcess.on("error", (err) => {
        console.error("[PASSPro] Failed to spawn Next.js process:", err);
      });

      waitForServer(APP_URL, 45000)
        .then(resolve)
        .catch((err) => {
          console.error("[PASSPro] Server wait failed:", err);
          resolve();
        });
    });

    req.end();
  });
}

// Create System Tray Icon
function createTray() {
  // Generate a sleek 32x32 icon or load from assets
  const iconPath = path.join(__dirname, "assets", "icon.png");
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    // 32x32 blue rounded square fallback
    icon = nativeImage.createFromBuffer(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAM0lEQVR42u3PMQEAAAgEIPu3tmh8mQEI0KSpb9e7CwQEBAQEBAQEBAQEBAQEBAQEBAQEPgs2y/064q2k5wAAAABJRU5ErkJggg==",
        "base64"
      )
    );
  }

  tray = new Tray(icon);
  tray.setToolTip("PASSPro - Contrôle d'Accès & Gestion Salle");

  const localIp = getLocalIpAddress();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Ouvrir PASSPro",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Ouvrir l'Écran Borne Kiosque",
      click: () => openKioskWindow(),
    },
    {
      label: "⚡ Simuler Scan RFID (Pop-up dans 2s)",
      click: () => {
        console.log("[PASSPro] Tray triggered RFID simulation in 2s...");
        setTimeout(() => triggerRfidPopup("04A32BF1"), 2000);
      },
    },
    { type: "separator" },
    {
      label: `Serveur local : En ligne (Port ${PORT})`,
      enabled: false,
    },
    {
      label: `Accès Réseau LAN : http://${localIp}:${PORT}`,
      click: () => {
        shell.openExternal(`http://${localIp}:${PORT}`);
      },
    },
    { type: "separator" },
    {
      label: "Quitter PASSPro",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// Create Main Dashboard Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    frame: false, // Frameless modern window without OS borders
    backgroundColor: "#F6F8FB",
    title: "PASSPro - Gestion Salle de Sport & Contrôle d'Accès",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
    show: true,
  });

  // Ensure window is shown and focused
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.webContents.once("did-finish-load", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  setTimeout(() => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 1000);
  mainWindow.on("maximize", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-maximized-change", true);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-maximized-change", false);
    }
  });

  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-fullscreen-change", true);
    }
  });

  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-fullscreen-change", false);
    }
  });

  // Native application menu
  const menuTemplate = [
    {
      label: "Fichier",
      submenu: [
        {
          label: "Borne Kiosque (Double Écran)",
          accelerator: "CmdOrCtrl+K",
          click: () => openKioskWindow(),
        },
        {
          label: "Réduire dans la barre des tâches",
          accelerator: "CmdOrCtrl+W",
          click: () => mainWindow.hide(),
        },
        { type: "separator" },
        {
          label: "Quitter",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: "Vue",
      submenu: [
        { role: "reload", label: "Actualiser" },
        { role: "forceReload", label: "Actualiser (ignorer cache)" },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom normal" },
        { role: "zoomIn", label: "Zoom avant" },
        { role: "zoomOut", label: "Zoom arrière" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Plein écran" },
        ...(IS_DEV ? [{ role: "toggleDevTools", label: "Outils de développement" }] : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load URL with auto-retry
  mainWindow.loadURL(APP_URL).catch(() => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL).catch(console.error);
    }, 1200);
  });


  // Intercept window open calls to reuse kiosk window if opening /access
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/access") && !url.includes("/access-logs")) {
      openKioskWindow();
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Intercept window close to minimize to System Tray instead of terminating RFID access
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      if (tray && process.platform === "win32") {
        tray.displayBalloon({
          title: "PASSPro est toujours actif",
          content: "L'application fonctionne en arrière-plan pour maintenir le contrôle d'accès. Cliquez sur l'icône pour l'afficher.",
        });
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Locate any existing window that is currently displaying Borne d'accès (/access)
function findKioskWindow() {
  if (kioskWindow && !kioskWindow.isDestroyed()) {
    try {
      const url = kioskWindow.webContents.getURL();
      if (url.includes("/access") && !url.includes("/access-logs")) {
        return kioskWindow;
      }
    } catch (e) {}
  }

  // Check all open browser windows across the app
  const allWindows = BrowserWindow.getAllWindows();
  for (const win of allWindows) {
    if (!win.isDestroyed()) {
      try {
        const url = win.webContents.getURL();
        if (url.includes("/access") && !url.includes("/access-logs")) {
          kioskWindow = win;
          return win;
        }
      } catch (e) {}
    }
  }

  return null;
}

// Open Dedicated Kiosk Window (on secondary monitor if available or primary, reusing any existing window)
function openKioskWindow(options = {}) {
  const existing = findKioskWindow();
  if (existing) {
    if (!options.silent) {
      if (existing.isMinimized()) existing.restore();
      existing.maximize();
      existing.show();
      existing.focus();
    }
    return existing;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  kioskWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    minWidth: 900,
    minHeight: 600,
    fullscreen: false, // Normal window, NOT fullscreen (taskbar still appears)
    frame: false,      // Frameless modern window with our bespoke designed top menu
    backgroundColor: "#000000",
    title: "PASSPro - Borne d'Accès",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
    show: false,
  });

  // Track maximize state for KioskTopBar
  kioskWindow.on("maximize", () => {
    if (kioskWindow && !kioskWindow.isDestroyed() && kioskWindow.webContents) {
      kioskWindow.webContents.send("window-maximized-change", true);
    }
  });

  kioskWindow.on("unmaximize", () => {
    if (kioskWindow && !kioskWindow.isDestroyed() && kioskWindow.webContents) {
      kioskWindow.webContents.send("window-maximized-change", false);
    }
  });

  kioskWindow.loadURL(`${APP_URL}/access`);

  if (!options.autoPopup) {
    kioskWindow.once("ready-to-show", () => {
      if (kioskWindow && !kioskWindow.isDestroyed()) {
        kioskWindow.maximize();
        kioskWindow.show();
        kioskWindow.focus();
      }
    });
  }

  kioskWindow.on("closed", () => {
    kioskWindow = null;
  });

  return kioskWindow;
}

// Global RFID background keystroke processing
function handleGlobalKey(e) {
  const now = Date.now();
  const timeDelta = now - lastRfidKeyTime;
  lastRfidKeyTime = now;

  // RFID readers send characters in ultra-fast bursts (< 65ms per key)
  // If human typing or delay is > 65ms, clear the buffer
  if (timeDelta > 65) {
    rfidBuffer = "";
  }

  if (ENTER_KEYS.has(e.keycode)) {
    if (rfidBuffer.length >= 4) {
      const scannedUid = rfidBuffer;
      rfidBuffer = "";
      triggerRfidPopup(scannedUid);
    }
    rfidBuffer = "";
  } else if (RFID_KEY_MAP[e.keycode]) {
    rfidBuffer += RFID_KEY_MAP[e.keycode];
  } else {
    rfidBuffer = "";
  }
}

// Request instant evaluation of RFID scan from local Next.js server
function requestScanEvaluation(uid) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      uid,
      source: "HARDWARE",
      kioskName: "BORNE-01",
    });

    const req = http.request(
      `http://127.0.0.1:${PORT}/api/access/scan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "x-internal-kiosk": "passpro-internal",
        },
        timeout: 3000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(null);
          }
        });
      }
    );

    req.on("error", () => resolve(null));
    req.write(postData);
    req.end();
  });
}

// Bring Borne d'Accès to the absolute foreground (Topmost Pop-up)
async function triggerRfidPopup(scannedUid) {
  console.log(`[PASSPro] Global RFID Card Detected: ${scannedUid}`);

  // If receptionist is in management mode OR dashboard has an active modal / focused input,
  // DO NOT popup Kiosk window and DO NOT record a turnstile access passage!
  let dashboardBusy = isManagementMode;
  if (!dashboardBusy && mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
    try {
      dashboardBusy = await mainWindow.webContents.executeJavaScript(`
        Boolean(
          document.querySelector('[role="dialog"]') ||
          document.querySelector('[aria-modal="true"]') ||
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
      `);
    } catch (e) {
      dashboardBusy = false;
    }
  }

  if (dashboardBusy) {
    console.log(`[PASSPro] RFID scan intercepted for Management/Modal (UID: ${scannedUid}) - Kiosk popup suppressed.`);
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send("management-rfid-scan", { uid: scannedUid });
    }
    return;
  }

  // Capture exact focus and minimized state immediately at moment of scan BEFORE any async calls
  const existingKiosk = findKioskWindow();
  kioskWasFocusedBeforeScan = Boolean(existingKiosk && existingKiosk.isFocused());
  kioskWasMinimizedBeforeScan = Boolean(existingKiosk && existingKiosk.isMinimized());
  mainWasFocusedBeforeScan = Boolean(mainWindow && mainWindow.isFocused());

  // 1. Immediately evaluate scan in background
  const scanResult = await requestScanEvaluation(scannedUid);
  console.log(`[PASSPro] Evaluated scan decision:`, scanResult ? scanResult.decision : "None");

  // Note: Windows shell.beep() removed so the clean Web Audio RFID beep sounds in the kiosk screen

  // 2. Reuse existing Borne d'Accès window or open one if none exists
  let targetKiosk = existingKiosk;
  if (!targetKiosk || targetKiosk.isDestroyed()) {
    targetKiosk = openKioskWindow({ autoPopup: true });
  }

  if (targetKiosk && !targetKiosk.isDestroyed()) {
    isPopupActive = true;

    // Force Borne d'Accès window to absolute top (screen-saver level passes over fullscreen YouTube/games)
    if (kioskWasFocusedBeforeScan) {
      // If Borne d'Accès was ALREADY in focus before scan, keep focus on it
      if (kioskWasMinimizedBeforeScan) targetKiosk.restore();
      targetKiosk.setAlwaysOnTop(true, "screen-saver");
      targetKiosk.show();
      targetKiosk.focus();
    } else {
      // If user was in Google Chrome / external app / Dashboard:
      // Pop up visually on top WITHOUT stealing keyboard focus from Google Chrome!
      if (kioskWasMinimizedBeforeScan) {
        targetKiosk.restore();
      }
      targetKiosk.setAlwaysOnTop(true, "screen-saver");
      targetKiosk.showInactive();
    }

    const payload = { uid: scannedUid, result: scanResult };

    const dispatchScan = () => {
      if (targetKiosk && !targetKiosk.isDestroyed() && targetKiosk.webContents) {
        targetKiosk.webContents.send("global-rfid-scan", payload);
      }
    };

    if (targetKiosk.webContents.isLoading()) {
      targetKiosk.webContents.once("did-finish-load", () => {
        setTimeout(dispatchScan, 150);
      });
    } else {
      dispatchScan();
    }

    if (mainWindow && !mainWindow.isDestroyed() && mainWindow !== targetKiosk && mainWindow.webContents) {
      mainWindow.webContents.send("global-rfid-scan", payload);
    }

    // Safety fallback: release topmost after 2.2 seconds if not dismissed sooner by frontend
    if (popupHideTimer) clearTimeout(popupHideTimer);
    popupHideTimer = setTimeout(() => {
      hideKioskPopup();
    }, 2200);
  }
}

// Release topmost after scan presentation without making the window disappear
function hideKioskPopup() {
  if (popupHideTimer) {
    clearTimeout(popupHideTimer);
    popupHideTimer = null;
  }

  // If this wasn't an automated background popup (e.g. user tested via simulation console inside the kiosk window),
  // DO NOT alter focus at all! The window must remain directly in focus for continuous testing.
  if (!isPopupActive) {
    return;
  }
  isPopupActive = false;

  const targetKiosk = findKioskWindow();
  if (targetKiosk && !targetKiosk.isDestroyed()) {
    targetKiosk.setAlwaysOnTop(false);

    // 1. If Borne d'Accès was ALREADY in focus when scanned, IT STAYS IN FOCUS!
    if (kioskWasFocusedBeforeScan) {
      targetKiosk.focus();
      return;
    }

    // 2. If it was NOT in focus before the scan:
    // Minimize to taskbar to liberate Google Chrome / external app in the premier plan
    targetKiosk.minimize();
    if (mainWasFocusedBeforeScan && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

// 2. Setup IPC Handlers
function setupIpcHandlers() {
  // Silent Receipt Printing
  ipcMain.handle("print-receipt", async (event, { htmlContent, options = {} }) => {
    let printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      return await new Promise((resolve) => {
        printWin.webContents.print(
          {
            silent: options.silent !== undefined ? options.silent : true,
            printBackground: true,
            deviceName: options.deviceName || "",
            margins: { marginType: "none" },
            pageSize: options.pageSize || { width: 80000, height: 200000 }, // 80mm roll standard
          },
          (success, failureReason) => {
            printWin.close();
            printWin = null;
            resolve({ success, failureReason });
          }
        );
      });
    } catch (err) {
      if (printWin) printWin.close();
      return { success: false, failureReason: err.message };
    }
  });

  // Open Kiosk Window
  ipcMain.handle("open-kiosk", (event, options) => {
    openKioskWindow(options);
    return true;
  });

  // Window Controls
  ipcMain.handle("is-maximized", (event) => {
    const win = (event && event.sender && BrowserWindow.fromWebContents(event.sender)) || mainWindow;
    return win ? win.isMaximized() : false;
  });

  ipcMain.handle("is-fullscreen", (event) => {
    const win = (event && event.sender && BrowserWindow.fromWebContents(event.sender)) || mainWindow;
    return win ? win.isFullScreen() : false;
  });

  ipcMain.handle("toggle-fullscreen", (event) => {
    const win = (event && event.sender && BrowserWindow.fromWebContents(event.sender)) || mainWindow;
    if (win) {
      const nextState = !win.isFullScreen();
      win.setFullScreen(nextState);
      return nextState;
    }
    return false;
  });

  ipcMain.on("minimize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) {
      if (win.isFullScreen()) {
        win.setFullScreen(false);
      }
      win.minimize();
    }
  });

  ipcMain.on("maximize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) {
      if (win.isFullScreen()) {
        win.setFullScreen(false);
      }
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.on("close-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win === mainWindow) {
      isQuitting = true;
      app.quit();
    } else if (win) {
      win.close();
    }
  });

  // Hide Kiosk Popup after scan completes or on Escape
  ipcMain.on("hide-kiosk-popup", () => {
    hideKioskPopup();
  });

  // Set management mode (suppresses kiosk pop-up when typing or searching in dashboard)
  ipcMain.on("set-management-mode", (event, active) => {
    isManagementMode = Boolean(active);
    console.log(`[PASSPro] Management mode set to: ${isManagementMode}`);
  });

  // Test RFID Popup simulation trigger (e.g. from TitleBar button)
  ipcMain.on("test-rfid-popup", (event, { delaySeconds = 3 }) => {
    console.log(`[PASSPro] Test RFID Popup scheduled in ${delaySeconds} seconds...`);
    setTimeout(() => {
      triggerRfidPopup("04A32BF1");
    }, Math.max(0, delaySeconds * 1000));
  });

  // Server and LAN info
  ipcMain.handle("get-server-info", () => {
    return {
      port: PORT,
      localIp: getLocalIpAddress(),
      url: APP_URL,
      lanUrl: `http://${getLocalIpAddress()}:${PORT}`,
      platform: process.platform,
      displaysCount: screen.getAllDisplays().length,
    };
  });
}

// 3. App Lifecycle
app.whenReady().then(async () => {
  console.log("[PASSPro] app.whenReady fired!");
  setupIpcHandlers();
  createTray();

  // Start global keyboard hook for background RFID scanning
  try {
    uIOhook.on("keydown", handleGlobalKey);
    uIOhook.start();
    console.log("[PASSPro] Global RFID background hook activated.");
  } catch (hookErr) {
    console.warn("[PASSPro] Unable to start global keyboard hook:", hookErr.message);
  }

  // Register global shortcut Ctrl+Alt+S to simulate RFID scan from anywhere (even YouTube)
  try {
    globalShortcut.register("CommandOrControl+Alt+S", () => {
      console.log("[PASSPro] Global Shortcut Ctrl+Alt+S triggered RFID Simulation");
      triggerRfidPopup("04A32BF1");
    });
    console.log("[PASSPro] Shortcut Ctrl+Alt+S registered for RFID simulation test.");
  } catch (err) {
    console.warn("[PASSPro] Failed to register global shortcut:", err);
  }

  if (app.isPackaged) {
    // In standalone packaged .exe mode, spawn production server
    await startNextServerIfNeeded();
  }

  // Wait for server to respond on 127.0.0.1:3000
  try {
    await waitForServer(APP_URL, 60000);
  } catch (err) {
    console.warn("[PASSPro] Warning during server check:", err.message);
  }

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  try {
    globalShortcut.unregisterAll();
  } catch (err) {}
  try {
    uIOhook.stop();
  } catch (err) {}
  if (nextServerProcess) {
    try {
      nextServerProcess.kill();
    } catch (err) {
      console.error("Error killing next process:", err);
    }
  }
});

app.on("window-all-closed", () => {
  // On Windows, keep app alive in tray if not explicitly quitting
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});
