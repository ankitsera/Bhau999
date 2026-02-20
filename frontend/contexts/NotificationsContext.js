import React, { createContext, useEffect, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";

import { registerPushToken } from "../utils/NotificationsService";
import { AuthContext } from "./AuthContext";

export const NotificationsContext = createContext(null);

const LAST_FCM_TOKEN_KEY = "LAST_FCM_TOKEN";

async function syncTokenOnce({ mobileNumber }) {
  if (!mobileNumber) return;

  const token = await messaging().getToken();
  if (!token) return;

  const last = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);
  if (last === token) return;

  await registerPushToken({ mobileNumber, token });
  await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, token);
}

export const NotificationsProvider = ({ children }) => {
  const { user, isBlocked } = React.useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const tokenRefreshUnsubRef = useRef(null);

  useEffect(() => {
    // cleanup previous listener
    if (tokenRefreshUnsubRef.current) {
      try {
        tokenRefreshUnsubRef.current();
      } catch {}
      tokenRefreshUnsubRef.current = null;
    }

    if (!mobileNumber || isBlocked) return;

    let cancelled = false;

    (async () => {
      try {
        await syncTokenOnce({ mobileNumber });
        if (cancelled) return;

        tokenRefreshUnsubRef.current = messaging().onTokenRefresh(async (newToken) => {
          try {
            if (!newToken) return;
            await registerPushToken({ mobileNumber, token: newToken });
            await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, newToken);
          } catch {
            // ignore; retry later
          }
        });
      } catch {
        // ignore; retry later
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mobileNumber, isBlocked]);

  const value = useMemo(
    () => ({
      // expose this if you ever want a manual retry button in settings
      resyncToken: async () => syncTokenOnce({ mobileNumber }),
    }),
    [mobileNumber]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};