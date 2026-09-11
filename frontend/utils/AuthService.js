import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../env-vars";

const CREDS_KEY = "@auth_creds";

export const saveAuthCreds = async (mobileNumber, password) => {
  await AsyncStorage.setItem(
    CREDS_KEY,
    JSON.stringify({
      mobileNumber: String(mobileNumber || ""),
      password: String(password || ""),
    })
  );
};

export const loadAuthCreds = async () => {
  const raw = await AsyncStorage.getItem(CREDS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.mobileNumber || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearAuthCreds = async () => {
  await AsyncStorage.removeItem(CREDS_KEY);
};

export const signup = async (mobileNumber, username, password) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber, username, password }),
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.ok) {
    return body ?? { message: "Signup successful" };
  }

  const msg = body?.message || `Signup failed (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

export const login = async (mobileNumber, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber, password }),
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.status === 200) {
    // return user only (NO persistence here)
    return body ?? {};
  }

  if (res.status === 401) {
    const msg = body?.message || "Invalid credentials";
    const err = new Error(msg);
    err.status = 401;
    throw err;
  }

  const msg = body?.message || `Login failed (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

// Lightweight balance read. Used to keep the wallet in sync after a result is
// declared, without re-sending credentials through /auth/login.
export const fetchBalance = async (mobileNumber) => {
  const res = await fetch(
    `${API_URL}/users/${encodeURIComponent(mobileNumber)}/balance`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.ok) return body ?? {};

  const msg = body?.message || `Balance fetch failed (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

export const userCheck = async (mobileNumber) => {
  try {
    const res = await fetch(`${API_URL}/auth/checkUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber }),
    });

    if (res.status === 200) return true;
    if (res.status === 404) return false;

    const errBody = await res.json().catch(() => null);
    const msg = errBody?.message || `User check failed (status ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  } catch (error) {
    console.error("Error during user check:", error);
    throw error;
  }
};

export const logOut = async () => {
  // only clear creds now
  await clearAuthCreds();
};

export const restoreUserState = async () => {
  // return creds
  const creds = await loadAuthCreds();
  return creds ? { creds } : null;
};