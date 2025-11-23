import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import Navigation from './navigation/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentsProvider } from "./contexts/PaymentsContext";
import { ThemeProvider } from '@react-navigation/native';
import { useRef } from 'react';

function App() {
  const navigationRef = useRef(null);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaymentsProvider>
        <ThemeProvider>
          <Navigation navigationRef={navigationRef} />
        </ThemeProvider>
        </PaymentsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
