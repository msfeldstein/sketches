const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");

const WINDOW_WIDTH = 760;
const WINDOW_HEIGHT = 860;
const MIN_CONTENT_WIDTH = 560;
const MIN_CONTENT_HEIGHT = 640;

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    useContentSize: true,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_CONTENT_WIDTH,
    minHeight: MIN_CONTENT_HEIGHT,
    backgroundColor: "#050505",
    autoHideMenuBar: true,
    title: "Webamp",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "webamp", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(() => ({
    action: "deny",
  }));

  return mainWindow;
}

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
