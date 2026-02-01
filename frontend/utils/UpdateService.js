import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { API_URL } from '../env-vars';

const LAST_CHECK_KEY = "last_update_check_at";
const ONE_DAY_MS = 12 * 60 * 60 * 1000;  //12 hours in milliseconds
// const ONE_DAY_MS = 1 * 2 * 1000; //for testing: 2 seconds

export const APK_URL = "http://admina1online.cloud/apk/app-release.apk";

export async function checkUpdateIfDue({ force = false } = {}) {
  const now = Date.now();

  if (!force) {
    const last = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastNum = last ? Number(last) : 0;
    if (lastNum && now - lastNum < ONE_DAY_MS) {
      return { skipped: true };
    }
  }

  // ✅ semantic version like "0.0.1"
  const version = DeviceInfo.getVersion();

  const url = `${API_URL}/properties/check-update?version=${encodeURIComponent(
    version
  )}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Update check failed: ${res.status}`);

  const data = await res.json();
  await AsyncStorage.setItem(LAST_CHECK_KEY, String(now));

  return {
    skipped: false,
    compulsoryUpdate: !!data.compulsoryUpdate,
    updateAvailable: !!data.updateAvailable,
  };
}