const { app } = require("electron");
const installer = require("./installer");

async function updater() {
  await installer.installer();
  console.log("Updater started");
  if (app.isPackaged) {
    const { autoUpdater } = require("electron");
    autoUpdater.on("error", (message) => {
      console.error("There was a problem updating the application");
      console.error(message);
    });
    const server = "https://icontrol.vercel.app";
    const url = `${server}/update/${process.platform}/${app.getVersion()}`;
    autoUpdater.setFeedURL(url);
    autoUpdater.checkForUpdates();
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 90000);
    autoUpdater.on("update-downloaded", () => {
      autoUpdater.quitAndInstall();
      app.closable = true;
      app.exit(0);
    });
  }
}

module.exports = {
  updater,
};
