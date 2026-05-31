const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix: @lottiefiles/dotlottie-react has a broken `main` field in package.json
// that points to dist/index.js which doesn't exist. The real file is at
// dist/browser/index.js — we redirect Metro to the correct path.
config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@lottiefiles/dotlottie-react') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@lottiefiles/dotlottie-react/dist/browser/index.js'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });