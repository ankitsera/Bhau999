import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  AppState,
  Image,
  Animated,
} from "react-native";
import {
  isNotificationPermissionGranted,
  requestNotificationPermission,
  openAppSettings,
} from "../utils/NotificationsService";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";
import { FONT } from '../contexts/Themes';

const NotificationGate = ({ children }) => {
  const { t } = useTranslation(['common']);
  const { colors, isDarkMode } = useTheme();

  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  // flow control
  const [requesting, setRequesting] = useState(false);
  const [denyCount, setDenyCount] = useState(0);
  const [neverAskAgain, setNeverAskAgain] = useState(false);

  // 🔔 Bell Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateBell = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  useEffect(() => {
    animateBell();
  }, [animateBell]);

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
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>
          {t("common:checkingNotificationPermission")}
        </Text>
      </View>
    );
  }

  if (granted) return children;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* 🔔 Animated Bell */}
        <Animated.Image
          source={require("../assets/Images/bell.webp")} // replace with your asset
          style={[
            styles.bell,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />

        <Text style={[styles.title, { color: colors.text }]}>
          {t("common:notificationsRequired")}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("common:notificationPermissionNeeded")}
        </Text>

        {!neverAskAgain ? (
          <>
            {/* ✅ Allow Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                requesting && styles.disabledBtn,
              ]}
              onPress={onAllow}
              disabled={requesting}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.primaryText,
                  { color: isDarkMode ? "#fff" : "#07110A" },
                ]}
              >
                {requesting
                  ? t("common:requesting")
                  : t("common:allowNotifications")}
              </Text>
            </TouchableOpacity>

            {/* ❌ No Thanks */}
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surfaceVariant || "#eee" },
              ]}
              onPress={() => setNeverAskAgain(true)}
              activeOpacity={0.85}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                {t("common:noThanks")}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={openAppSettings}
            >
              <Text
                style={[
                  styles.primaryText,
                  { color: isDarkMode ? "#fff" : "#07110A" },
                ]}
              >
                {t("common:openSettings")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surfaceVariant || "#eee" },
              ]}
              onPress={() => BackHandler.exitApp()}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                {t("common:exitApp")}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {t("common:enableNotificationsInSettings")}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    elevation: 3,
  },

  bell: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },

  title: {
    fontSize: FONT.h3,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: FONT.label,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 19,
  },

  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  primaryText: {
    fontSize: FONT.body,
    fontWeight: "700",
  },

  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  hint: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
  },

  disabledBtn: {
    opacity: 0.7,
  },
});

export default NotificationGate;