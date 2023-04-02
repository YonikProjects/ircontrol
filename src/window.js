const { app, BrowserWindow } = require("electron");

function createWindow() {
  let win = new BrowserWindow({
    // skipTaskbar: true,
    height: 230,
    width: 500,
    closable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile("src/frontend/index.html");
}
function appHooks() {
  app.on("ready", createWindow);

  app.on("window-all-closed", () => {
    app.quit();
  });
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
    });
  }
}
module.exports = { appHooks };
