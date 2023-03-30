const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const JSONdb = require("simple-json-db");
const { SerialPort } = require("serialport");

if (handleSquirrelEvent()) {
  return;
}

if (app.isPackaged) {
  const { autoUpdater } = require("electron");
  autoUpdater.on("error", (message) => {
    console.error("There was a problem updating the application");
    console.error(message);
  });
  const server = "https://icontrol.vercel.app";
  const url = `${server}/update/${process.platform}/${app.getVersion()}`;
  autoUpdater.setFeedURL(url);
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 90000);
  autoUpdater.on("update-downloaded", () => {
    autoUpdater.quitAndInstall();
    app.closable = true;
    app.exit(0);
  });
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require("child_process");
  const path = require("path");

  const appFolder = path.resolve(process.execPath, "..");
  const rootAtomFolder = path.resolve(appFolder, "..");
  const updateDotExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) {
      console.error(error);
    }

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated":
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(["--createShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-uninstall":
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(["--removeShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}
const configFolder = path.join(app.getPath("userData"), "config");
if (!fs.existsSync(configFolder)) {
  fs.mkdirSync(configFolder);
}
const db = new JSONdb(path.join(configFolder, "config.json"));
const profileDb = new JSONdb(path.join(configFolder, "profile.json"));
let profileData;
let projectorPort;
let settingsPort;
let settingProfile;
function refreshSettings() {
  settingsPort = db.get("port");
  settingProfile = db.get("profile");
  profileData = profileDb.get("profiles")[settingProfile];
  console.log(settingProfile);
  projectorPort = new SerialPort({
    path: settingsPort,
    baudRate: profileData.baudRate,
    dataBits: profileData.dataBits,
    parity: profileData.parity,
    stopBits: profileData.stopBits,
    autoOpen: false,
  });
  console.log("Setting have been loaded");
}
ipcMain.handle("console", async (event, line) => {
  try {
    if (line === "quit") {
      console.log("quitting");
      app.closable = true;
      app.exit(0);
    } else await sendCommand(line);
    console.log(`Received from frontend: ${line}`);
    return `Backend confirms it received: ${line}`;
  } catch (err) {
    return `Backend confirms it errored: ${err}`;
  }
});

async function sendCommand(command) {
  await new Promise((resolve, reject) => {
    console.log("Received command to send");
    projectorPort.open((err) => {
      if (err) {
        console.error("Error opening projector port:", err);
        reject(err);
      } else {
        projectorPort.write(command, (err) => {
          if (err) {
            console.error(`Error sending command "${command}":`, err);
            reject(err);
          } else {
            console.log(`Sent command: "${command}"`);
          }
        });
        setTimeout(() => {
          projectorPort.close((err) => {
            if (err) {
              console.error("Error closing projector port:", err);
              reject(err);
            } else {
              console.log("Projector port closed");
              resolve();
            }
          });
        }, 1000);
      }
    });
  });
}
ipcMain.handle("command", async (event, line) => {
  console.log(`Received command from frontend: ${line}`);
  try {
    switch (line) {
      case "buttonOn": {
        if (profileData.hex)
          await sendCommand(Buffer.from(profileData.command.on, "hex"));
        else await sendCommand(profileData.command.on);
        break;
      }
      case "buttonOff": {
        if (profileData.hex)
          await sendCommand(Buffer.from(profileData.command.off, "hex"));
        else await sendCommand(profileData.command.off);
        break;
      }
      case "buttonVga": {
        if (profileData.hex)
          await sendCommand(Buffer.from(profileData.command.VGA, "hex"));
        else await sendCommand(profileData.command.VGA);
        break;
      }
      case "buttonHdmi": {
        if (profileData.hex)
          await sendCommand(Buffer.from(profileData.command.HDMI, "hex"));
        else await sendCommand(profileData.command.HDMI);
        break;
      }
      default:
        break;
    }
    return `Backend confirms it received: ${line}`;
  } catch (err) {
    return `Backend returned error : ${err}`;
  }

  // Optional: Close the port after some time, e.g., 10 seconds
});
ipcMain.handle("settings", async (event, line) => {
  switch (line) {
    case "listPorts": {
      return await SerialPort.list();
    }
    case "currentPort": {
      return settingsPort;
    }
    case "listProfiles": {
      return profileDb.get("profiles");
    }
    case "currentProfile": {
      return profileDb.get("profiles")[settingProfile].name;
    }
    default: {
      if ("setPort" in line) {
        db.set("port", line.setPort);
        console.log("setting port", line.setPort);
        refreshSettings();
      } else if ("setProfile" in line) {
        db.set("profile", line.setProfile);
        console.log("setting profile", line.setProfile);
        refreshSettings();
      }
    }
  }
});

ipcMain.handle("version", async () => {
  return app.getVersion();
});
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
  initialize();
}

function initialize() {
  //Initializing config file
  if (!db.get("initialized")) {
    console.log("No config found, creating a new one");
    db.set("port", "COM1");
    db.set("profile", 0);
    db.set("initialized", true);
  }
  //Initializing default profile
  if (!profileDb.get("initialized")) {
    console.log("No Profiles found, creating a new profile");
    profileDb.set("profiles", [
      {
        name: "Epson",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        command: {
          on: "PWR ON\x0D",
          off: "PWR OFF\x0D",
          HDMI: "SOURCE A0\x0D",
          VGA: "SOURCE 10\x0D",
        },
      },
      {
        name: "Hitachi",
        baudRate: 19200,
        dataBits: 8,
        parity: "none",
        hex: true,
        stopBits: 1,
        command: {
          on: "BEEF030600BAD2010000600100",
          off: "BEEF0306002AD3010000600000",
          HDMI: "BEEF0306000ED2010000200300",
          VGA: "BEEF030600FED2010000200000",
        },
      },
      {
        name: "Sony",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        command: {
          on: "\x02\x00\x00C00\x30\r",
          off: "\x02\x00\x00C01\x31\r",
          HDMI: "\x02\x00\x00C03\x33\r",
          VGA: "\x02\x00\x00C02\x32\r",
        },
      },
    ]);
    profileDb.set("initialized", true);
  }
  refreshSettings();
}
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
if (app.isPackaged) {
  app.setLoginItemSettings({
    openAtLogin: true,
  });
}
