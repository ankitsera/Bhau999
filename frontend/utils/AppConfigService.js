// utils/AppConfigService.js
import { API_URL } from "../env-vars";

const CONFIG_ENDPOINT = `${API_URL}/config`;

// simple in-memory cache
const configCache = new Map();

/**
 * Fetch a single config value from backend by key.
 *
 * Backend: single API, differentiated by key param.
 *
 * Accepts:
 *  - key: string
 *  - options:
 *      - forceRefresh?: boolean  -> ignore cache and hit API
 *      - defaultValue?: any      -> returned when request fails (optional)
 *
 * Returns:
 *  - resolved config value (unwrapped from { value }) OR defaultValue (if provided)
 *
 * Throws:
 *  - Error when request fails and no defaultValue is provided
 */
export const fetchConfigValue = async (key, options = {}) => {
  const { forceRefresh = false, defaultValue } = options;

  // 1) cache short-circuit
  if (!forceRefresh && configCache.has(key)) {
    return configCache.get(key);
  }

  const url = `${CONFIG_ENDPOINT}?key=${encodeURIComponent(key)}`;

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
    if (typeof defaultValue !== "undefined") {
      return defaultValue;
    }
    const e = new Error(
      `Failed to load config for key "${key}": ${err.message}`
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
    // If backend wraps value as { value: ... }, unwrap it
    const value =
      body && Object.prototype.hasOwnProperty.call(body, "value")
        ? body.value
        : body;

    // cache it
    configCache.set(key, value);
    return value;
  }

  const msg =
    (body && body.message) ||
    `Failed to load config for key "${key}" (status ${res.status})`;

  if (typeof defaultValue !== "undefined") {
    console.warn(msg);
    return defaultValue;
  }

  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

/**
 * Helpers for specific keys, so call sites stay clean.
 * You can add more as needed.
 */

export const getMinBidAmount = async () =>
  Number(await fetchConfigValue("MIN_BID_AMOUNT", { defaultValue: 0 }));

export const getMaxBidAmount = async () =>
  Number(await fetchConfigValue("MAX_BID_AMOUNT", { defaultValue: 0 }));

export const getSomethingTextConfig = async () =>
  String(await fetchConfigValue("SOME_TEXT_CONFIG", { defaultValue: "" }));