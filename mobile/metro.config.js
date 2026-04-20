const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use resolveRequest to intercept @react-native-community/netinfo before
// Metro ever tries to initialize the native module. This is more reliable
// than extraNodeModules for packages that crash on native-module init.
const netInfoMock = path.resolve(__dirname, 'utils/netinfo-mock.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-native-community/netinfo') {
    return { filePath: netInfoMock, type: 'sourceFile' };
  }
  // Fall through to default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;


