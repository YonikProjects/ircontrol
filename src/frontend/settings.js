let { ipcRenderer } = require("electron");

// let form = document.querySelector("form");
// let input = document.querySelector("input");
// let responses = document.querySelector("#responses");

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   let line = input.value;
//   input.value = "";
//   let responseText = await ipcRenderer.invoke("console", line);
//   let response = document.createElement("div");
//   response.textContent = responseText;
//   responses.appendChild(response);
// });

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

// const optionElement = document.createElement("option");
// optionElement.textContent = ipcRenderer.invoke("settings", "port");
// optionElement.value = option.path;
// document.querySelector("#comSelect").appendChild(optionElement);

// document.querySelector("#comSelect").addEventListener("click", async () => {

//   console.log(await data);
// });
