module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    "@babel/plugin-transform-export-namespace-from",
    [
      "module-resolver",
      {
        root: ["."],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@": "./src",
          "@assets": "./src/assets",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@navigation": "./src/navigation",
          "@store": "./src/store",
          "@services": "./src/services",
          "@hooks": "./src/hooks",
          "@data": "./src/data",
          "@utils": "./src/utils",
          "@constants": "./src/constants",
          "@types": "./src/types",
          "@contexts": "./src/contexts",
          "@api": "./src/api",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
