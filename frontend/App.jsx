import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from "./navigation/Navigation";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { PaymentsProvider } from "./contexts/PaymentsContext";
import { ThemeProvider } from "@react-navigation/native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { GameProvider } from "./contexts/GameContext";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import { AppState } from "react-native";

import { checkUpdateIfDue } from "./utils/UpdateService";
import UpdateGate from "./components/UpdateGate";
import BlockedGate from "./components/BlockedGate";

function AppInner() {
  const navigationRef = useRef(null);
  const { isBlocked } = useContext(AuthContext);

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [compulsoryUpdate, setCompulsoryUpdate] = useState(false);
  const [optionalDismissed, setOptionalDismissed] = useState(false);

  const [apkUrl, setApkUrl] = useState(null);

  const runCheck = async () => {
    // priority to blocked gate
    if (isBlocked) return;

    try {
      const res = await checkUpdateIfDue({ force: false });
      if (res?.skipped) return;

      setUpdateAvailable(!!res.updateAvailable);
      setCompulsoryUpdate(!!res.compulsoryUpdate);
      setApkUrl(res?.apkUrl || null);

      // reset dismissal when a fresh check happens
      setOptionalDismissed(false);
    } catch (e) {
      console.log("Update check error:", e?.message);
    }
  };

  const showUpdateGate = !isBlocked && (compulsoryUpdate || (updateAvailable && !optionalDismissed));

  useEffect(() => {
    runCheck();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") runCheck();
    });
    return () => sub.remove();
  }, [isBlocked]);

  return (
    <ThemeProvider>
      <Navigation navigationRef={navigationRef} />

      {/* Blocked gate takes priority */}
      <BlockedGate visible={isBlocked} navigationRef={navigationRef} />

      {/* Only show update gate if not blocked */}
      <UpdateGate
        visible={showUpdateGate}
        compulsory={compulsoryUpdate}
        onDismiss={() => setOptionalDismissed(true)}
        apkUrl={apkUrl}
      />
    </ThemeProvider>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaymentsProvider>
          <GameProvider>
            <AppConfigProvider>
              <AppInner />
            </AppConfigProvider>
          </GameProvider>
        </PaymentsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;