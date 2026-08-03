// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// mp3 is already in Metro's default asset list, but the kana clips are the one asset
// class this app cannot start without, so the dependency is stated rather than assumed.
if (!config.resolver.assetExts.includes("mp3")) {
  config.resolver.assetExts.push("mp3");
}

module.exports = config;
