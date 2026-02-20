import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  AppState,
} from "react-native";
import {
  isNotificationPermissionGranted,
  requestNotificationPermission,
  openAppSettings,
} from "../utils/NotificationsService";
import { ThemeColor } from "../contexts/Themes";

const NotificationGate = ({ children }) => {
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  // flow control
  const [requesting, setRequesting] = useState(false);
  const [denyCount, setDenyCount] = useState(0);
  const [neverAskAgain, setNeverAskAgain] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const ok = await isNotificationPermissionGranted();
      setGranted(ok);

      // only reset denial state if granted
      if (ok) {
        setNeverAskAgain(false);
        setDenyCount(0);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  const onAllow = async () => {
    if (requesting) return;

    setRequesting(true);
    try {
      const res = await requestNotificationPermission();

      if (res.granted) {
        setGranted(true);
        setNeverAskAgain(false);
        setDenyCount(0);
        return;
      }

      setGranted(false);

      // track denies to avoid infinite clicking
      setDenyCount((c) => {
        const next = c + 1;

        // If android says never ask again OR we already got denied once before,
        // stop requesting and push to Settings UI.
        if (res.neverAskAgain || next >= 2) {
          setNeverAskAgain(true);
        } else {
          setNeverAskAgain(false);
        }

        return next;
      });
    } finally {
      setRequesting(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Just a sec…</Text>
          <Text style={styles.subtitle}>Checking notification permission</Text>
        </View>
      </View>
    );
  }

  if (granted) return children;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Notifications are required</Text>

        <Text style={styles.subtitle}>
          This app needs notification permission to work properly.
        </Text>

        <View style={styles.bullets}>
          <Text style={styles.bullet}>• Result declared alerts</Text>
          <Text style={styles.bullet}>• Admin announcements</Text>
        </View>

        {!neverAskAgain ? (
          <TouchableOpacity
            style={[styles.primaryBtn, requesting && styles.disabledBtn]}
            onPress={onAllow}
            disabled={requesting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {requesting ? "Requesting…" : "Allow Notifications"}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={openAppSettings}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => BackHandler.exitApp()}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Exit App</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              In Settings, enable Notifications for this app.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F17",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 20,
  },
  bullets: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bullet: {
    fontSize: 14,
    color: "rgba(255,255,255,0.80)",
    lineHeight: 20,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: ThemeColor,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#07110A",
    fontWeight: "800",
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default NotificationGate;