const { ipcRenderer } = require("electron");

function attachCloseEventListener() {
  document.querySelector("#close").addEventListener("click", () => {
    ipcRenderer.invoke("console", "quit");
  });
}

async function populateComSelect() {
  const select = document.querySelector("#comSelect");
  const currentPort = await ipcRenderer.invoke("settings", "currentPort");
  const ports = await ipcRenderer.invoke("settings", "listPorts");

  appendOption(select, currentPort, true, true, true);

  if (ports.length > 0) {
    ports.forEach((port) => {
      appendOption(select, port.path, false, false, false);
    });
  } else {
    appendOption(select, "No COM ports found", false, true, false);
  }

  select.addEventListener("change", async () => {
    await ipcRenderer.invoke("settings", { setPort: select.value });
    location.reload();
  });
}

function appendOption(select, text, selected, disabled, hidden) {
  const optionElement = document.createElement("option");
  optionElement.textContent = text;
  optionElement.value = text;

  if (selected) {
    optionElement.setAttribute("selected", "true");
  }
  if (disabled) {
    optionElement.setAttribute("disabled", "true");
  }
  if (hidden) {
    optionElement.setAttribute("hidden", "true");
  }

  select.appendChild(optionElement);
}

function initialize() {
  attachCloseEventListener();
  comInput();
}

initialize();

async function comInput() {
  await populateComSelect();
}
