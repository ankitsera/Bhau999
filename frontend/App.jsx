import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import Navigation from './navigation/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentsProvider } from "./contexts/PaymentsContext";
import { ThemeProvider } from '@react-navigation/native';
import { useRef } from 'react';
import { GameProvider } from './contexts/GameContext';
import { AppConfigProvider } from './contexts/AppConfigContext';

function App() {
  const navigationRef = useRef(null);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaymentsProvider>
          <GameProvider>
            <AppConfigProvider>
              <ThemeProvider>
                <Navigation navigationRef={navigationRef} />
              </ThemeProvider>
            </AppConfigProvider>
          </GameProvider>
        </PaymentsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
