const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
  stream: require.resolve('stream-browserify'),
  process: require.resolve('process/browser'),
};

module.exports = config;
