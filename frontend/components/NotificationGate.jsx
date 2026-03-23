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
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";

const NotificationGate = ({ children }) => {
  const { t } = useTranslation(['common']);
  const { colors, isDarkMode } = useTheme();

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
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('common:justASec')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('common:checkingNotificationPermission')}</Text>
        </View>
      </View>
    );
  }

  if (granted) return children;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('common:notificationsRequired')}</Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('common:notificationPermissionNeeded')}
        </Text>

        <View style={styles.bullets}>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• {t('common:resultDeclaredAlerts')}</Text>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• {t('common:adminAnnouncements')}</Text>
        </View>

        {!neverAskAgain ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, requesting && styles.disabledBtn]}
            onPress={onAllow}
            disabled={requesting}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: isDarkMode ? "#ffffff" : "#07110A" }]}>
              {requesting ? t('common:requesting') : t('common:allowNotifications')}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={openAppSettings}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: isDarkMode ? "#ffffff" : "#07110A" }]}>{t('common:openSettings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => BackHandler.exitApp()}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t('common:exitApp')}</Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {t('common:enableNotificationsInSettings')}
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
    padding: 20,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
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
    lineHeight: 20,
    marginTop: 4,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: {
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
  },
  secondaryBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default NotificationGate;