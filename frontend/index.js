/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Required because the server now sends data-only messages (e.g. balance_changed).
// Android routes those to a headless task while the app is backgrounded, and without
// a registered handler react-native-firebase raises "No task registered for key
// ReactNativeFirebaseMessagingHeadlessTask".
//
// There is deliberately nothing to do here: no UI exists to update, and AuthContext
// re-reads the balance on every return to foreground, which is what the user
// actually sees. Acknowledging the message is the whole job.
setBackgroundMessageHandler(getMessaging(), async () => {});

AppRegistry.registerComponent(appName, () => App);
