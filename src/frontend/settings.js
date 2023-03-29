let { ipcRenderer } = require("electron");

document.querySelector("#close").addEventListener("click", () => {
  ipcRenderer.invoke("console", "quit");
});

comInput();
async function comInput() {
  const select = document.querySelector("#comSelect");
  const currentPort = await ipcRenderer.invoke("settings", "currentPort");
  console.log(currentPort);
  const optionElement = document.createElement("option");
  optionElement.setAttribute("selected", "true");
  optionElement.setAttribute("disabled", "true");
  optionElement.setAttribute("hidden", "true");
  optionElement.textContent = currentPort;
  select.appendChild(optionElement);
  const data = await ipcRenderer.invoke("settings", "listPorts");
  if (data.length > 0) {
    data.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = option.path;
      optionElement.value = option.path;
      select.appendChild(optionElement);
    });
  } else {
    const optionElement = document.createElement("option");
    optionElement.textContent = "No COM ports found";
    optionElement.setAttribute("disabled", "true");
    select.appendChild(optionElement);
  }
  select.addEventListener("change", async () => {
    await ipcRenderer.invoke("settings", { setPort: select.value });
    location.reload();
  });
}
profileInput();
async function profileInput() {
  const select = document.querySelector("#profileSelect");
  const currentProfile = await ipcRenderer.invoke("settings", "currentProfile");
  console.log(currentProfile);
  const optionElement = document.createElement("option");
  optionElement.setAttribute("selected", "true");
  optionElement.setAttribute("disabled", "true");
  optionElement.setAttribute("hidden", "true");
  optionElement.textContent = currentProfile;
  select.appendChild(optionElement);
  const data = await ipcRenderer.invoke("settings", "listProfiles");
  if (data.length > 0) {
    data.forEach((option, i) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = option.name;
      optionElement.value = i;
      select.appendChild(optionElement);
    });
  } else {
    const optionElement = document.createElement("option");
    optionElement.textContent = "No Profiles found";
    optionElement.setAttribute("disabled", "true");
    select.appendChild(optionElement);
  }
  select.addEventListener("change", async () => {
    await ipcRenderer.invoke("settings", { setProfile: select.value });
    location.reload();
  });
}
