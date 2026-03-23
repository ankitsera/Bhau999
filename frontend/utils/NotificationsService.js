import { PermissionsAndroid, Platform, Linking } from "react-native";
import { API_URL } from "../env-vars";

/* =========================================================
   NOTIFICATION PERMISSION (Android 13+)
   ========================================================= */

export const isNotificationPermissionGranted = async () => {
  if (Platform.OS !== "android") return true;

  const apiLevel = Number(Platform.Version);
  if (apiLevel < 33) return true;

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return granted === true;
};

export const requestNotificationPermission = async () => {
  if (Platform.OS !== "android") return { granted: true, neverAskAgain: false };

  const apiLevel = Number(Platform.Version);
  if (apiLevel < 33) return { granted: true, neverAskAgain: false };

  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  return {
    granted: res === PermissionsAndroid.RESULTS.GRANTED,
    neverAskAgain: res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
  };
};

export const openAppSettings = async () => {
  await Linking.openSettings();
};

/* =========================================================
   PUSH TOKEN API
   ========================================================= */

// Backend endpoint assumption:
// POST  ${API_URL}/push/register-token
// body: { mobileNumber, token, platform, deviceId }
export async function registerPushToken({ mobileNumber, token }) {
  const url = `${API_URL}/users/fcm`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobileNumber,
      token,
      gameNotifications: true,
    }),
  });

  if (!res.ok) {
    let msg = `registerPushToken failed: ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = `${msg} - ${t}`;
    } catch {}
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* =========================================================
   NOTIFICATION PREFS API (for toggle screen)
   ========================================================= */

export async function getNotificationPrefs() {
  const url = `${API_URL}/notifications/prefs`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    let msg = `getNotificationPrefs failed: ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = `${msg} - ${t}`;
    } catch {}
    throw new Error(msg);
  }

  return await res.json();
}

export async function updateNotificationPrefs(payload) {
  const url = `${API_URL}/notifications/prefs`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    let msg = `updateNotificationPrefs failed: ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = `${msg} - ${t}`;
    } catch {}
    throw new Error(msg);
  }

  return await res.json();
}

export async function getAllNotifications() {
  const url = `${API_URL}/notifications`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let msg = `getAllNotifications failed: ${res.status}`;
    try {
      const t = await res.json();
      if (t) msg = `${msg} - ${t}`;
    } catch {}
    throw new Error(msg);
  }

  const body = await res.json();
  return Array.isArray(body) ? body : [];
}