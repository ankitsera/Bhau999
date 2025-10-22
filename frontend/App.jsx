import { StatusBar, useColorScheme} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import Navigation from './navigation/Navigation';
import { useRef } from 'react';

function App() {
  const navigationRef = useRef(null);
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation navigationRef={navigationRef}/>
    </SafeAreaProvider>
  );
}

export default App;
