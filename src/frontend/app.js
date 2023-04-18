let { ipcRenderer } = require("electron");

const button = document.getElementById("settingsButton");

async function sendCommand(event) {
  await ipcRenderer.invoke("command", event.target.id);
}
function buttonClicked(event) {
  console.log(event);
  if (event.shiftKey) {
    location.href = "settings.html";
  } else {
    event.preventDefault();
  }
}
renderVersion();
async function renderVersion() {
  document.getElementById(
    "version"
  ).innerHTML = `<small>גרסה: ${await ipcRenderer.invoke("version")}</small>`;
}
button.addEventListener("click", buttonClicked);

getAliases();
async function getAliases() {
  let aliases = await ipcRenderer.invoke("aliases");
  console.log(aliases);
  document.getElementById("buttonVga").innerHTML = `${aliases.VGA} (VGA)`;
  document.getElementById("buttonHdmi").innerHTML = `${aliases.HDMI} (HDMI)`;
}

document.querySelector("#buttonOn").addEventListener("click", sendCommand);
document.querySelector("#buttonOff").addEventListener("click", sendCommand);
document.querySelector("#buttonVga").addEventListener("click", sendCommand);
document.querySelector("#buttonHdmi").addEventListener("click", sendCommand);
