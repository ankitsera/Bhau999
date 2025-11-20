import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_URL} from "../env-vars";

export const signup = async (mobileNumber, username, password) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber, username, password }),
  });

  // read body only once (safe if body is empty or non-JSON)
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) {
    // return the parsed response (e.g. { message: "Signup successful" })
    return body ?? { message: "Signup successful" };
  }

  // non-2xx -> throw Error with server message (if any)
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
    const user = body ?? {};
    try {
      await AsyncStorage.setItem("@user", JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to persist user locally:", e);
    }
    return user;
  }

  if (res.status === 401) {
    const msg = body?.message || "Invalid credentials";
    const err = new Error(msg);
    err.status = 401;
    throw err;
  }

  // other statuses
  const msg = body?.message || `Login failed (status ${res.status})`;
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

    if (res.status === 200) {
      // optional: const body = await res.json(); // body.message === "User exists"
      return true;
    }

    if (res.status === 404) {
      // optional: const body = await res.json(); // body.message === "User not found"
      return false;
    }

    // For any other response (400, 500, etc.) try to surface server message
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
  await AsyncStorage.removeItem("@user");
};

export const restoreUserState = async () => {
  const user = await AsyncStorage.getItem("@user");
  if (user) {
    return { user: JSON.parse(user) };
  }
  return null;
};
