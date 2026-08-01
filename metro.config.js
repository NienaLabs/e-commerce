const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── SVG transformer ────────────────────────────────────────────────────────
// Allows importing .svg files as React components via react-native-svg-transformer
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: (resolver.assetExts || []).filter((ext) => ext !== 'svg'),
  sourceExts: [...(resolver.sourceExts || []), 'svg'],
};

// Fix: @lottiefiles/dotlottie-react has a broken `main` field in package.json
// that points to dist/index.js which doesn't exist. The real file is at
// dist/browser/index.js — we redirect Metro to the correct path.
const originalResolveRequest = config.resolver.resolveRequest;
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