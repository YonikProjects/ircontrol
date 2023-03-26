let { app, BrowserWindow, ipcMain } = require("electron");
path = require("path");
const JSONdb = require("simple-json-db");
const { SerialPort } = require("serialport");

let profileData;
let settingsData;
ipcMain.handle("console", (event, line) => {
  if (line === "quit") {
    console.log("quitting");
    app.closable = true;
    app.exit(0);
  }
  console.log(`Received from frontend: ${line}`);
  return `Backend confirms it received: ${line}`;
});

function sendCommand(command) {
  const projectorPort = new SerialPort({
    path: "COM4",
    baudRate: profileData.baudRate,
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    autoOpen: false,
  });
  projectorPort.write(command, (err) => {
    if (err) {
      console.error(`Error sending command "${command}":`, err);
    } else {
      console.log(`Sent command: "${command}"`);
    }
  });
}
ipcMain.handle("command", (event, line) => {
  console.log(`Received command from frontend: ${line}`);
  projectorPort.open((err) => {
    if (err) {
      console.error("Error opening projector port:", err);
    } else {
      switch (line) {
        case "buttonOn": {
          sendCommand(profileData.command.on);
          break;
        }
        case "buttonOff": {
          sendCommand(profileData.command.off);
          break;
        }
        case "buttonVga": {
          sendCommand(profileData.command.VGA);
          break;
        }
        case "buttonHdmi": {
          sendCommand(profileData.command.HDMI);
          break;
        }
        default:
          break;
      }
    }
  });

  // Optional: Close the port after some time, e.g., 10 seconds
  setTimeout(() => {
    projectorPort.close((err) => {
      if (err) {
        console.error("Error closing projector port:", err);
      } else {
        console.log("Projector port closed");
      }
    });
  }, 3000);
  return `Backend confirms it received: ${line}`;
});
function createWindow() {
  let win = new BrowserWindow({
    // skipTaskbar: true,
    height: 720,
    width: 400,
    closable: false,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile("src/index.html");
}
function initialize() {
  //Initializing config file
  const db = new JSONdb(path.join(process.cwd(), "config.json"));
  if (!db.get("initialized")) {
    console.log("No config found, creating a new one");
    db.set("settings", { port: "COM1", profile: 0 });
    db.set("initialized", true);
  }
  const profileDb = new JSONdb(path.join(process.cwd(), "profile.json"));
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
  settingsData = db.get("settings");
  profileData = profileDb.get("profiles")[settingsData.profile];
  console.log(settingsData);
  createWindow();
}
app.on("ready", initialize);

app.on("window-all-closed", () => {
  app.quit();
});
