import React, { createContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessaging, getToken, onTokenRefresh } from "@react-native-firebase/messaging";

import { registerPushToken, getAllNotifications } from "../utils/NotificationsService";
import { AuthContext } from "./AuthContext";

export const NotificationsContext = createContext(null);

const LAST_FCM_TOKEN_KEY = "LAST_FCM_TOKEN";

async function syncTokenOnce({ mobileNumber, gameNotification = true }) {
  if (!mobileNumber) return;

  const messaging = getMessaging();
  const token = await getToken(messaging);
  if (!token) return;

  const last = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);
  if (last === token) return;

  await registerPushToken({ mobileNumber, token, gameNotification: !!gameNotification });
  await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, token);
}

export const NotificationsProvider = ({ children }) => {
  const { user, isBlocked } = React.useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const tokenRefreshUnsubRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const data = await getAllNotifications();
      setNotifications(data);
    } catch (err) {
      setNotificationsError(err.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
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
        await syncTokenOnce({ mobileNumber, gameNotification: true });
        if (cancelled) return;

        const messagingInstance = getMessaging();
        tokenRefreshUnsubRef.current = onTokenRefresh(messagingInstance, async (newToken) => {
          try {
            if (!newToken) return;

            await registerPushToken({
              mobileNumber,
              token: newToken,
              gameNotification: true,
            });

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
      resyncToken: async () => syncTokenOnce({ mobileNumber, gameNotification: true }),

      // ✅ OPTIONAL: when you wire your toggle screen, call this:
      updateGameNotificationPreference: async (enabled) => {
        if (!mobileNumber) return;

        // reuse stored token, fallback to getToken
        let token = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);
        if (!token) {
          const messagingInstance = getMessaging();
          token = await getToken(messagingInstance);
        }
        if (!token) return;

        await registerPushToken({
          mobileNumber,
          token,
          gameNotification: !!enabled,
        });

        // store if not present
        if (!(await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY))) {
          await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, token);
        }
      },

      notifications,
      notificationsLoading,
      notificationsError,
      refreshNotifications: fetchNotifications,
    }),
    [mobileNumber, notifications, notificationsLoading, notificationsError, fetchNotifications]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};