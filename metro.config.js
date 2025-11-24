// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// add this:
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-native-fs": require("path").resolve(__dirname, "react-native-fs-mock.js"),
};

module.exports = config;
