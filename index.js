const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");

const WINDOW_WIDTH = 980;
const WINDOW_HEIGHT = 680;
const MIN_CONTENT_WIDTH = 320;
const MIN_CONTENT_HEIGHT = 240;

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-webgl");
app.commandLine.appendSwitch("use-gl", "angle");
app.commandLine.appendSwitch("use-angle", "swiftshader-webgl");
app.commandLine.appendSwitch("enable-unsafe-swiftshader");

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_CONTENT_WIDTH,
    minHeight: MIN_CONTENT_HEIGHT,
    backgroundColor: "#050505",
    autoHideMenuBar: true,
    title: "Webamp",
    frame: false,
    hasShadow: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      webgl: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "webamp", "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({
    action: "deny",
  }));

  return mainWindow;
}

const dragSessions = new WeakMap();

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

ipcMain.handle("resize-to-player", (event, { width, height }) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (!window) {
    return null;
  }

  window.setContentSize(
    Math.max(MIN_CONTENT_WIDTH, Math.ceil(width)),
    Math.max(MIN_CONTENT_HEIGHT, Math.ceil(height)),
    true
  );

  return {
    width,
    height,
  };
});

ipcMain.on("close-shell", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (window) {
    window.close();
  }
});

ipcMain.on("begin-shell-drag", (event, { screenX, screenY }) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (!window) {
    return;
  }

  const [x, y] = window.getPosition();

  dragSessions.set(window, {
    offsetX: Math.round(screenX - x),
    offsetY: Math.round(screenY - y),
  });
});

ipcMain.on("update-shell-drag", (event, { screenX, screenY }) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dragSession = window ? dragSessions.get(window) : null;

  if (!window || !dragSession) {
    return;
  }

  window.setPosition(
    Math.round(screenX - dragSession.offsetX),
    Math.round(screenY - dragSession.offsetY)
  );
});

ipcMain.on("end-shell-drag", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (window) {
    dragSessions.delete(window);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
