const { app, ipcMain, powerMonitor } = require("electron");
const { SerialPort } = require("serialport");
const updater = require("./updater");
const { appHooks } = require("./window");
const { db, profileDb, aliasDb } = require("./jsondb");

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
ipcMain.handle("aliases", async () => {
  try {
    if (!aliasDb.get("initialized")) {
      console.log("No config found, creating a new one");
      aliasDb.set("VGA", "מחשב");
      aliasDb.set("HDMI", "Apple TV");
      aliasDb.set("initialized", true);
    }

    return aliasDb.JSON();
  } catch (err) {
    return `Backend confirms it errored: ${err}`;
  }
});
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
  await buttonPress(line);
  // Optional: Close the port after some time, e.g., 10 seconds
});
async function buttonPress(line) {
  try {
    switch (line) {
      case "buttonOn": {
        if (profileData.hex)
          await sendCommand(Buffer.from(profileData.command.on, "hex"));
        else await sendCommand(profileData.command.on);
        setInterval(() => {
          const idleTime = powerMonitor.getSystemIdleTime();

          if (idleTime >= 45 * 60) {
            // User has been idle for 45 minutes, run the function
            buttonPress("buttonOff");
          }
        }, 1000);
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
}
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
initialize();
function initialize() {
  updater.updater();
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
  appHooks();
}
