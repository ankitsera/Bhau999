import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { API_URL } from './ApiConfig';
import { getApkUrl } from "./AppConfigService";

const LAST_CHECK_KEY = "update_last_check_at";
const COLD_START_KEY = "update_cold_start";
const LAST_VERSION_KEY = "update_last_version";
const THREE_HOUR_MS = 3 * 60 * 60 * 1000;

let checkPromise = null;

export async function markColdStart() {
  await AsyncStorage.setItem(COLD_START_KEY, "true");
}

export async function checkUpdateIfDue({ force = false } = {}) {
  // Prevent concurrent checks by reusing the same promise
  if (checkPromise) {
    return checkPromise;
  }

  checkPromise = performUpdateCheck({ force })
    .finally(() => {
      checkPromise = null;
    });
  
  return checkPromise;
}

async function performUpdateCheck({ force = false } = {}) {
  const now = Date.now();
  
  // Check if this is a cold start
  const isColdStart = (await AsyncStorage.getItem(COLD_START_KEY)) === "true";
  await AsyncStorage.removeItem(COLD_START_KEY);

  // Always check on cold start or forced check, otherwise apply 3-hour throttle
  if (!force && !isColdStart) {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck) {
      const elapsed = now - Number(lastCheck);
      if (elapsed < THREE_HOUR_MS) {
        return { skipped: true };
      }
    }
  }

  // Check for updates from server
  const version = DeviceInfo.getVersion();
  const url = `${API_URL}/properties/check-update?version=${encodeURIComponent(version)}`;

  let res;
  let data;

  try {
    res = await fetch(url, {method: 'GET'});
    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
      return{ skipped: true};
    }
    data = await res.json();
  } catch (error) {
    console.error("Error checking for updates:", error?.message);
    return { skipped: true };
  }
  await AsyncStorage.setItem(LAST_CHECK_KEY, String(now));

  const compulsoryUpdate = !!data.compulsoryUpdate;
  const updateAvailable = !!data.updateAvailable;
  const updateVersion = data.latestVersion || null;

  // Clear stored version when no update available
  if (!compulsoryUpdate && !updateAvailable) {
    await AsyncStorage.removeItem(LAST_VERSION_KEY);
    return {
      skipped: false,
      compulsoryUpdate: false,
      updateAvailable: false,
      apkUrl: null,
      updateVersion: null,
      shouldClearState: true,
    };
  }

  // Store the update version when available
  if (updateVersion) {
    await AsyncStorage.setItem(LAST_VERSION_KEY, updateVersion);
  }

  // Fetch APK URL only if update is available
  let apkUrl = null;
  if (compulsoryUpdate || updateAvailable) {
    try {
      apkUrl = await getApkUrl({ forceRefresh: false });
      apkUrl = String(apkUrl || "").trim() || null;
    } catch (e) {
      console.warn("Failed to fetch APK_URL:", e?.message);
    }
  }

  return {
    skipped: false,
    compulsoryUpdate,
    updateAvailable,
    apkUrl,
    updateVersion,
    shouldClearState: false,
  };
}
