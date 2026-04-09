const path = require("path");
const { app, BrowserWindow } = require("electron");

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 960;

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 960,
    minHeight: 720,
    backgroundColor: "#10131a",
    autoHideMenuBar: true,
    title: "Webamp Desktop",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "webamp", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(() => ({
    action: "deny",
  }));
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
