const { app, BrowserWindow, ipcMain, autoUpdater } = require("electron");
const path = require("path");
const JSONdb = require("simple-json-db");
const { SerialPort } = require("serialport");
const isDev = require("electron-is-dev");

const server = "https://ircontrol-updater.vercel.app";
const url = `${server}/update/${process.platform}/${app.getVersion()}`;

autoUpdater.setFeedURL({ url });

const db = new JSONdb(path.join(process.cwd(), "config.json"));
const profileDb = new JSONdb(path.join(process.cwd(), "profile.json"));
let profileData;
let projectorPort;
let settingsPort;
let settingProfile;
function refreshSettings() {
  settingsPort = db.get("port");
  settingProfile = db.get("profile");
  profileData = profileDb.get("profiles")[settingProfile];
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
        await sendCommand(profileData.command.on);
        break;
      }
      case "buttonOff": {
        await sendCommand(profileData.command.off);
        break;
      }
      case "buttonVga": {
        await sendCommand(profileData.command.VGA);
        break;
      }
      case "buttonHdmi": {
        await sendCommand(profileData.command.HDMI);
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
  console.log(line);
  switch (line) {
    case "listPorts": {
      console.log(await SerialPort.list());
      return await SerialPort.list();
    }
    case "currentPort": {
      return settingsPort;
    }
    case "listProfiles": {
      console.log(profileDb.get("profiles"));
      return profileDb.get("profiles");
    }
    case "currentProfile": {
      return settingProfile;
    }
    default: {
      if ("setPort" in line) {
        db.set("port", line.setPort);
        console.log("setting port", line.setPort);
        refreshSettings();
      } else if ("setProfile" in line) {
        db.set("profile", line.setProfile);
        console.log("setting profile", line.setProfile);
      }
    }
  }
});
function createWindow() {
  let win = new BrowserWindow({
    // skipTaskbar: true,
    height: 230,
    width: 500,
    closable: false,
    maximizable: false,
    minimizable: false,
    // resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  // win.setMenuBarVisibility(false);
  win.loadFile("src/frontend/index.html");
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
          VGA: "SOURCE 11\x0D",
        },
      },
    ]);
    profileDb.set("initialized", true);
  }
  refreshSettings();
  createWindow();
}
app.on("ready", initialize);

app.on("window-all-closed", () => {
  app.quit();
});

if (!isDev) {
  app.setLoginItemSettings({
    openAtLogin: true,
  });
}
