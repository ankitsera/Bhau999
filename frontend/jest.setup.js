/**
 * Mocks for native modules that read their constants at import time. Without
 * these the suite cannot even reach a render, because requiring a screen pulls
 * the whole native surface in.
 */
/* eslint-env jest */

jest.mock('react-native-snackbar', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    dismiss: jest.fn(),
    LENGTH_SHORT: 0,
    LENGTH_LONG: 1,
    LENGTH_INDEFINITE: 2,
  },
  LENGTH_SHORT: 0,
  LENGTH_LONG: 1,
  LENGTH_INDEFINITE: 2,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-device-info', () => ({
  getVersion: () => '0.0.1',
  getBuildNumber: () => '1',
  getUniqueId: async () => 'test-device',
  getSystemVersion: () => '14',
  getModel: () => 'Test',
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [
    { countryCode: 'IN', languageTag: 'en-IN', languageCode: 'en', isRTL: false },
  ],
  findBestLanguageTag: () => ({ languageTag: 'en', isRTL: false }),
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: () => ({}),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: () => ({}),
  getToken: jest.fn(async () => 'test-token'),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
  requestPermission: jest.fn(async () => 1),
  setBackgroundMessageHandler: jest.fn(),
  subscribeToTopic: jest.fn(async () => {}),
  unsubscribeFromTopic: jest.fn(async () => {}),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 },
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () =>
  'MaterialCommunityIcons',
);

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn(), getString: jest.fn(async () => '') },
}));
