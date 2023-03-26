let { ipcRenderer } = require("electron");

const button = document.getElementById("settingsButton");

async function sendCommand(event) {
  console.log(event.target.id);
  let responseText = await ipcRenderer.invoke("command", event.target.id);
}
function buttonClicked(event) {
  console.log(event);
  if (event.shiftKey) {
    location.href = "settings.html";
  } else {
    event.preventDefault();
  }
}

button.addEventListener("click", buttonClicked);

document.querySelector("#buttonOn").addEventListener("click", sendCommand);
document.querySelector("#buttonOff").addEventListener("click", sendCommand);
document.querySelector("#buttonVga").addEventListener("click", sendCommand);
document.querySelector("#buttonHdmi").addEventListener("click", sendCommand);
