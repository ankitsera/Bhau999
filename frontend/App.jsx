import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import Navigation from './navigation/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@react-navigation/native';
import { useRef } from 'react';

function App() {
  const navigationRef = useRef(null);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <Navigation navigationRef={navigationRef} />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
