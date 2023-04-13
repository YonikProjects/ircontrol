module.exports = {
  packagerConfig: {
    icon: "./ico", // no file extension required
  },
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "YonikProjects",
          name: "ircontrol",
        },
        draft: false,
      },
    },
  ],
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
  ],
};
