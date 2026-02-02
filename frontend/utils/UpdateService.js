import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { API_URL } from "../env-vars";
import { getApkUrl } from "./AppConfigService";

const LAST_CHECK_KEY = "last_update_check_at";
const HALF_DAY_CHECK_MS = 12 * 60 * 60 * 1000;
// const HALF_DAY_CHECK_MS = 1 * 2 * 1000; //for testing: 2 seconds

export async function checkUpdateIfDue({ force = false } = {}) {
  const now = Date.now();

  if (!force) {
    const last = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastNum = last ? Number(last) : 0;
    if (lastNum && now - lastNum < HALF_DAY_CHECK_MS) {
      return { skipped: true };
    }
  }

  // semantic version like "0.0.1"
  const version = DeviceInfo.getVersion();
  console.log("Checking update for version:", version);

  const url = `${API_URL}/properties/check-update?version=${encodeURIComponent(version)}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Update check failed: ${res.status}`);

  const data = await res.json();
  await AsyncStorage.setItem(LAST_CHECK_KEY, String(now));

  const compulsoryUpdate = !!data.compulsoryUpdate;
  const updateAvailable = !!data.updateAvailable;

  // only fetch APK_URL if update is relevant
  let apkUrl = null;
  if (compulsoryUpdate || updateAvailable) {
    try {
      apkUrl = await getApkUrl({ forceRefresh: false });
      apkUrl = String(apkUrl || "").trim();
      if (!apkUrl) apkUrl = null;
    } catch (e) {
      console.warn("Failed to fetch APK_URL:", e?.message);
      apkUrl = null;
    }
  }

  return {
    skipped: false,
    compulsoryUpdate,
    updateAvailable,
    apkUrl,
  };
}