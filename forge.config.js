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
        authToken: "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",
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
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
