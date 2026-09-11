const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const os = require("os");

const PORT = parseInt(process.env.PORT || "3000", 10);
const IS_DEV = process.env.NODE_ENV === "development";
const APP_URL = `http://127.0.0.1:${PORT}`;

let mainWindow = null;
let kioskWindow = null;
let tray = null;
let nextServerProcess = null;
let isQuitting = false;

// 1. Single Instance Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
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
    },
    show: false,
  });

  // Track and broadcast maximize/unmaximize state to frontend
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

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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

// Open Dedicated Kiosk Window (on secondary monitor if available)
function openKioskWindow(options = {}) {
  if (kioskWindow) {
    kioskWindow.show();
    kioskWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  // Find external or secondary display if available
  const secondaryDisplay = displays.find((d) => d.id !== primaryDisplay.id) || primaryDisplay;

  kioskWindow = new BrowserWindow({
    x: secondaryDisplay.bounds.x,
    y: secondaryDisplay.bounds.y,
    width: secondaryDisplay.bounds.width,
    height: secondaryDisplay.bounds.height,
    fullscreen: true,
    kiosk: true, // Lock into kiosk mode
    backgroundColor: "#000000",
    title: "PASSPro - Borne d'Accès Kiosque",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  kioskWindow.loadURL(`${APP_URL}/access`);

  kioskWindow.on("closed", () => {
    kioskWindow = null;
  });
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
  ipcMain.handle("is-maximized", () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle("is-fullscreen", () => {
    return mainWindow ? mainWindow.isFullScreen() : false;
  });

  ipcMain.handle("toggle-fullscreen", () => {
    if (mainWindow) {
      const nextState = !mainWindow.isFullScreen();
      mainWindow.setFullScreen(nextState);
      return nextState;
    }
    return false;
  });

  ipcMain.on("minimize-window", () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on("maximize-window", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });

  ipcMain.on("close-window", () => {
    if (mainWindow) mainWindow.close();
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
  setupIpcHandlers();
  createTray();

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
