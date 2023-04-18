const { app } = require("electron");
const path = require("path");
const JSONdb = require("simple-json-db");
const fs = require("fs");

const configFolder = path.join(app.getPath("userData"), "config");
if (!fs.existsSync(configFolder)) {
  fs.mkdirSync(configFolder);
}

const db = new JSONdb(path.join(configFolder, "config.json"));
const profileDb = new JSONdb(path.join(configFolder, "profile.json"));
const aliasDb = new JSONdb(path.join(configFolder, "alias.json"));

module.exports = {
  db,
  profileDb,
  aliasDb,
};
