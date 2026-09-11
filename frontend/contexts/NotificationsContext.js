import React, { createContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessaging, getToken, onMessage, onTokenRefresh } from "@react-native-firebase/messaging";

import { registerPushToken, getAllNotifications } from "../utils/NotificationsService";
import { AuthContext } from "./AuthContext";

export const NotificationsContext = createContext(null);

const LAST_FCM_TOKEN_KEY = "LAST_FCM_TOKEN";

// Must match BalanceNotificationService.TYPE_BALANCE_CHANGED on the backend.
const BALANCE_CHANGED = "balance_changed";

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
  const { user, isBlocked, refreshBalance } = React.useContext(AuthContext);
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

  // Two kinds of push land here:
  //   - a per-user data-only { type: "balance_changed" } sent on every balance write
  //   - the game_notifications topic broadcast when a result is declared
  // Both mean the wallet may have moved, so both trigger a fetch. The message never
  // carries the balance itself: push delivery is unordered, so we re-read the
  // authoritative value instead of trusting the payload.
  useEffect(() => {
    if (!mobileNumber || isBlocked) return;

    const messagingInstance = getMessaging();
    const unsubscribe = onMessage(messagingInstance, async (remoteMessage) => {
      const type = remoteMessage?.data?.type;

      if (type === BALANCE_CHANGED || !type) {
        try {
          await refreshBalance?.();
        } catch {
          // ignore; the foreground fetch will catch up
        }
      }

      // Topic result broadcasts also add a row to the notifications list.
      if (type !== BALANCE_CHANGED) {
        try {
          await fetchNotifications();
        } catch {
          // ignore
        }
      }
    });

    return () => {
      try {
        unsubscribe?.();
      } catch {}
    };
  }, [mobileNumber, isBlocked, refreshBalance, fetchNotifications]);

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