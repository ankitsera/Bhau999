import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from "./navigation/Navigation";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { PaymentsProvider } from "./contexts/PaymentsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { GameProvider } from "./contexts/GameContext";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import { AppState, NativeModules } from "react-native";

import { checkUpdateIfDue, markColdStart } from "./utils/UpdateService";
import UpdateGate from "./components/UpdateGate";
import BlockedGate from "./components/BlockedGate";
import NotificationGate from "./components/NotificationGate";

import { NotificationsProvider } from "./contexts/NotificationsContext";
import { LoaderProvider } from "./contexts/LoaderContext";

const { UpdateModule } = NativeModules;

function AppInner() {
  const navigationRef = useRef(null);
  const { isBlocked } = useContext(AuthContext);

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [compulsoryUpdate, setCompulsoryUpdate] = useState(false);
  const [optionalDismissed, setOptionalDismissed] = useState(false);

  const [apkUrl, setApkUrl] = useState(null);
  const [updateVersion, setUpdateVersion] = useState(null);

  const runCheck = useCallback (async () => {
    if (isBlocked) return;

    try {
      const res = await checkUpdateIfDue({ force: false });
      if (!res) return;

      // If check was skipped, don't update states
      if (res.skipped) return;

      // Clear all states when no update available
      if (res?.shouldClearState) {
        setUpdateAvailable(false);
        setCompulsoryUpdate(false);
        setOptionalDismissed(false);
        setApkUrl(null);
        setUpdateVersion(null);
        
        // Clear native state
        if (UpdateModule?.clearUpdateState) {
          try {
            await UpdateModule.clearUpdateState();
          } catch (e) {
            console.log("Failed to clear native update state:", e?.message);
          }
        }
        return;
      }

      const newVersion = res?.updateVersion || null;

      // Reset dismissed flag when a new version is detected
      setUpdateVersion( prev => {
        if ( newVersion && newVersion !== prev) {
          setOptionalDismissed(false);
        }
        return newVersion;
      })

      // Update all states
      setUpdateAvailable(!!res.updateAvailable);
      setCompulsoryUpdate(!!res.compulsoryUpdate);
      setApkUrl(res?.apkUrl || null);

      // Notify native module of available version
      if (UpdateModule?.setAvailableVersion && newVersion) {
        try {
          await UpdateModule.setAvailableVersion(newVersion);
        } catch (e) {
          console.log("Failed to set native version:", e?.message);
        }
      }
    } catch (e) {
      console.log("Update check error:", e?.message);
    }
  },[isBlocked]);

  const showUpdateGate =
    !isBlocked && (compulsoryUpdate || (updateAvailable && !optionalDismissed));

  useEffect(() => {
    // Mark cold start on app mount
    markColdStart().catch(console.warn);

    // Initial check on mount
    runCheck();

    // Check when app returns to foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        runCheck();
      }
    });

    return () => sub.remove();
  }, [isBlocked]);

  return (
      <NotificationGate>
        <Navigation navigationRef={navigationRef} />

        <BlockedGate visible={isBlocked} navigationRef={navigationRef} />

        <UpdateGate
          visible={showUpdateGate}
          compulsory={compulsoryUpdate}
          onDismiss={() => setOptionalDismissed(true)}
          apkUrl={apkUrl}
          updateVersion={updateVersion}
        />
      </NotificationGate>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LoaderProvider>
          <AuthProvider>
            <NotificationsProvider>
              <PaymentsProvider>
                <GameProvider>
                  <AppConfigProvider>
                    <AppInner />
                  </AppConfigProvider>
                </GameProvider>
              </PaymentsProvider>
            </NotificationsProvider>
          </AuthProvider>
        </LoaderProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;