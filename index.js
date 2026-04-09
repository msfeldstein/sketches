const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-webgl");
app.commandLine.appendSwitch("use-gl", "angle");
app.commandLine.appendSwitch("use-angle", "swiftshader-webgl");
app.commandLine.appendSwitch("enable-unsafe-swiftshader");

let mainWindow = null;

function createMainWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    show: false,
    x,
    y,
    width,
    height,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    title: "Webamp",
    frame: false,
    transparent: true,
    hasShadow: false,
    minimizable: false,
    fullscreenable: false,
    resizable: false,
    movable: false,
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
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

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

ipcMain.handle("get-bounds", () => {
  return mainWindow ? mainWindow.getBounds() : null;
});

ipcMain.handle("get-cursor-screen-point", () => {
  return screen.getCursorScreenPoint();
});

ipcMain.on("set-ignore-mouse-events", (_event, ignore) => {
  if (!mainWindow) {
    return;
  }

  mainWindow.setIgnoreMouseEvents(Boolean(ignore));
});

ipcMain.on("minimize-shell", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("close-shell", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
