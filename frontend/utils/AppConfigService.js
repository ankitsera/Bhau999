//AppConfigService.js
// utils/AppConfigService.js
import { API_URL } from "../env-vars";

// ✅ Backend is: /api/properties/{key}
const CONFIG_ENDPOINT = `${API_URL}/properties`;

// simple in-memory cache (key -> { value, ts })
const configCache = new Map();

// cache TTL (ms)
// - non-critical: ok to cache longer
// - critical: cache shorter, and we often forceRefresh anyway
const TTL_NON_CRITICAL = 5 * 60 * 1000; // 5 min
const TTL_CRITICAL = 30 * 1000; // 30 sec

const nowMs = () => Date.now();

const isEmptyValue = (value) => {
  return (
    value === null ||
    typeof value === "undefined" ||
    (typeof value === "string" && value.trim() === "")
  );
};

const readCache = (key, ttl) => {
  const hit = configCache.get(key);
  if (!hit) return undefined;
  const age = nowMs() - (hit.ts || 0);
  if (age > ttl) return undefined;
  return hit.value;
};

const writeCache = (key, value) => {
  configCache.set(key, { value, ts: nowMs() });
};

/**
 * Fetch a single config value from backend by key.
 *
 * Backend: single API, differentiated by key param.
 *
 * Accepts:
 *  - key: string
 *  - options:
 *      - forceRefresh?: boolean  -> ignore cache and hit API
 *      - defaultValue?: any      -> returned when request fails / empty (optional)
 *      - critical?: boolean      -> if true, do NOT silently default; throw on errors/empty
 *
 * Returns:
 *  - resolved config value (unwrapped from backend response) OR defaultValue (if provided & not critical)
 *
 * Throws:
 *  - Error when request fails or value is empty for critical keys
 */
export const fetchConfigValue = async (key, options = {}) => {
  const {
    forceRefresh = false,
    defaultValue,
    critical = false,
  } = options;

  // normalize key (backend expects exact key)
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) {
    if (!critical && typeof defaultValue !== "undefined") return defaultValue;
    throw new Error("Config key is required");
  }

  // pick TTL based on criticality
  const ttl = critical ? TTL_CRITICAL : TTL_NON_CRITICAL;

  // 1) cache short-circuit (TTL aware)
  if (!forceRefresh) {
    const cached = readCache(normalizedKey, ttl);
    if (typeof cached !== "undefined") return cached;
  }

  // ✅ Final API: GET /api/properties/{key}
  const url = `${CONFIG_ENDPOINT}/${encodeURIComponent(normalizedKey)}`;

  let res;
  try {
    // 2) add a small timeout around fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

    res = await fetch(url, {
      method: "GET",
      headers: {
        // technically not needed for GET, but harmless
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    // network/timeout error
    if (!critical && typeof defaultValue !== "undefined") {
      // cache default too (non-critical only) to avoid spamming calls
      writeCache(normalizedKey, defaultValue);
      return defaultValue;
    }
    const e = new Error(
      `Failed to load config for key "${normalizedKey}": ${err.message}`
    );
    e.cause = err;
    throw e;
  }

  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }

  if (res.ok) {
    /**
     * Backend response:
     * { message: "...", property: { key: "...", value: "..." } }
     */
    let value = body?.property?.value;

    // ✅ treat empty value as missing
    if (isEmptyValue(value)) {
      if (!critical && typeof defaultValue !== "undefined") {
        value = defaultValue;
      } else {
        const err = new Error(`Config "${normalizedKey}" is missing/empty`);
        err.status = res.status;
        throw err;
      }
    }

    writeCache(normalizedKey, value);
    return value;
  }

  const msg =
    body?.message ||
    `Failed to load config for key "${normalizedKey}" (status ${res.status})`;

  if (!critical && typeof defaultValue !== "undefined") {
    console.warn(msg);
    writeCache(normalizedKey, defaultValue);
    return defaultValue;
  }

  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

/**
 * Helpers for specific keys, so call sites stay clean.
 * You can add more as needed.
 *
 * NOTE: keys must match backend keys exactly.
 * NOTE: non-critical helpers have defaults; critical helpers throw on failure/empty.
 */

// ------------------------ NON-CRITICAL (safe defaults) ------------------------

export const getCallSupport = async (options = {}) =>
  String(
    await fetchConfigValue("call_support", {
      defaultValue: "7757033237",
      ...options,
      critical: false,
    })
  );

export const getWhatsappSupport = async (options = {}) =>
  String(
    await fetchConfigValue("whatsapp_support", {
      defaultValue: "7757033237",
      ...options,
      critical: false,
    })
  );

export const getHeadline = async (options = {}) =>
  String(
    await fetchConfigValue("headline", {
      defaultValue:
        "Play Daily - Win Big! ₹1Cr+ Winnings Everyday 💸 A1 Online : Safe ✅ Fast⚡Real Results हर दिन ₹1Cr+ जीतनेका मौका – सिर्फ A1 Online पर!",
      ...options,
      critical: false,
    })
  );

export const getBankingName = async (options = {}) =>
  String(
    await fetchConfigValue("banking_name", {
      defaultValue: "A1Online",
      ...options,
      critical: false,
    })
  );

export const getWithdrawalTimeStart = async (options = {}) =>
  String(
    await fetchConfigValue("withdrawal_time_start", {
      defaultValue: "10:00",
      ...options,
      critical: false,
    })
  );

export const getWithdrawalTimeEnd = async (options = {}) =>
  String(
    await fetchConfigValue("withdrawal_time_end", {
      defaultValue: "23:59",
      ...options,
      critical: false,
    })
  );

export const getMinBetAmount = async (options = {}) =>
  Number(
    await fetchConfigValue("min_bet_amount", {
      defaultValue: "10",
      ...options,
      critical: false,
    })
  );

export const getMaxBetAmount = async (options = {}) =>
  Number(
    await fetchConfigValue("max_bet_amount", {
      defaultValue: "10000",
      ...options,
      critical: false,
    })
  );

export const getMinimumDepositAmount = async (options = {}) =>
  Number(
    await fetchConfigValue("minimum_deposit_amount", {
      defaultValue: "1",
      ...options,
      critical: false,
    })
  );

export const getMinimumWithdrawalAmount = async (options = {}) =>
  Number(
    await fetchConfigValue("minimum_withdrawal_amount", {
      defaultValue: "1",
      ...options,
      critical: false,
    })
  );

export const getTelegramChannel = async (options = {}) =>
  String(
    await fetchConfigValue("telegram_channel", {
      defaultValue: "https://t.me/asonline_support",
      ...options,
      critical: false,
    })
  );

// ------------------------ NOTICEBOARD (non-critical, no throw, default null) ------------------------

const normalizeNoticeValue = (v) => {
  if (v === null || typeof v === "undefined") return null;
  const s = String(v);
  return s.trim() === "" ? null : s;
};

const getNoticeBoard = async (n, options = {}) => {
  const key = `NoticeBoard${n}`;
  const v = await fetchConfigValue(key, {
    defaultValue: null, // ✅ screen decides empty state
    critical: false,
    ...options,
  });
  return normalizeNoticeValue(v);
};

export const getNoticeBoard1 = async (options = {}) => getNoticeBoard(1, options);
export const getNoticeBoard2 = async (options = {}) => getNoticeBoard(2, options);
export const getNoticeBoard3 = async (options = {}) => getNoticeBoard(3, options);
export const getNoticeBoard4 = async (options = {}) => getNoticeBoard(4, options);
export const getNoticeBoard5 = async (options = {}) => getNoticeBoard(5, options);

// ------------------------ CRITICAL (must be present) ------------------------

export const getUpiId = async (options = {}) =>
  String(
    await fetchConfigValue("UPI", {
      ...options,
      critical: true,
      forceRefresh: true,
    })
  );