module.exports = {
  preset: 'react-native',
  // react-native's own preset only transforms js/ts/tsx. This app is written in
  // .jsx, so without widening the pattern every app file reaches jest untransformed
  // and the suite dies on the first `import`.
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      'react-native/jest/assetFileTransformer.js',
    ),
  },
  // Several runtime deps ship untranspiled ESM, so they have to go through babel too.
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native'
      + '|@react-native(-community)?'
      + '|@react-navigation'
      + '|react-native-.*'
      + '|react-navigation-header-buttons'
      + ')/',
  ],
  // listing setupFiles replaces the preset's, so react-native's own setup is
  // re-added here ahead of our mocks
  setupFiles: [
    require.resolve('react-native/jest/setup.js'),
    '<rootDir>/jest.setup.js',
  ],
};
