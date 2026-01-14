import React, { createContext, useEffect, useMemo, useReducer } from "react";
import Snackbar from "react-native-snackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  login as loginAPI,
  signup as signupAPI,
  userCheck as userCheckAPI,
  logOut as logOutAPI,
  restoreUserState,
} from "../utils/AuthService";

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  isLoading: true,
  error: null,
};

const TYPES = {
  RESTORE_START: "RESTORE_START",
  RESTORE_SUCCESS: "RESTORE_SUCCESS",
  RESTORE_FAILURE: "RESTORE_FAILURE",

  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",

  SIGNUP_START: "SIGNUP_START",
  SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
  SIGNUP_FAILURE: "SIGNUP_FAILURE",

  LOGOUT: "LOGOUT",

  UPDATE: "UPDATE", // merge+persist a user patch
};

function authReducer(state, action) {
  switch (action.type) {
    case TYPES.RESTORE_START:
      return { ...state, isLoading: true, error: null };
    case TYPES.RESTORE_SUCCESS:
      return { ...state, user: action.user, isLoading: false, error: null };
    case TYPES.RESTORE_FAILURE:
      return { ...state, user: null, isLoading: false, error: action.error || null };

    case TYPES.LOGIN_START:
    case TYPES.SIGNUP_START:
      return { ...state, error: null };

    case TYPES.LOGIN_SUCCESS:
    case TYPES.SIGNUP_SUCCESS:
      return { ...state, user: action.user, error: null };

    case TYPES.LOGIN_FAILURE:
    case TYPES.SIGNUP_FAILURE:
      return { ...state, error: action.error || null };

    case TYPES.LOGOUT:
      return { ...state, user: null, error: null };

    case TYPES.UPDATE: {
      const prev = state.user || {};
      const patch = action.patch || {};
      // Shallow merge + preserve nested bankDetails unless explicitly set
      const merged = {
        ...prev,
        ...patch,
        bankDetails: patch.hasOwnProperty("bankDetails")
          ? patch.bankDetails
          : prev.bankDetails,
      };
      return { ...state, user: merged };
    }

    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { user, isLoading } = state;

  // Restore user on app start
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      dispatch({ type: TYPES.RESTORE_START });
      try {
        const saved = await restoreUserState();
        if (!mounted) return;
        dispatch({ type: TYPES.RESTORE_SUCCESS, user: saved?.user ?? null });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: TYPES.RESTORE_FAILURE, error });
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Persist user to AsyncStorage on every change
  useEffect(() => {
    (async () => {
      try {
        if (user) {
          await AsyncStorage.setItem("@user", JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem("@user");
        }
      } catch (e) {
        console.warn("Failed to persist @user:", e);
      }
    })();
  }, [user]);

  // Handlers
  const signup = async (mobileNumber, username, password, navigation) => {
    try {
      dispatch({ type: TYPES.SIGNUP_START });
      const result = await signupAPI(mobileNumber, username, password);
      const dateSignup = new Date().toISOString();
      const newUser = { mobileNumber, username, dateSignup };
      dispatch({ type: TYPES.SIGNUP_SUCCESS, user: newUser });

      Snackbar.show({
        text: result?.message || "Account created successfully ✅",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });
      navigation.navigate("Home");
    } catch (error) {
      dispatch({ type: TYPES.SIGNUP_FAILURE, error });
      Snackbar.show({
        text: error?.message || "Something went wrong!",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  };

  const login = async (mobileNumber, password, navigation) => {
    try {
      dispatch({ type: TYPES.LOGIN_START });
      const loggedInUser = await loginAPI(mobileNumber, password);
      dispatch({ type: TYPES.LOGIN_SUCCESS, user: { ...loggedInUser, password } });
      navigation.navigate("Home");
    } catch (error) {
      dispatch({ type: TYPES.LOGIN_FAILURE, error });
      Snackbar.show({
        text: error?.message || "Something went wrong!",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  };

  const userCheck = async (mobileNumber, navigation) => {
    try {
      const exists = await userCheckAPI(mobileNumber);
      if (exists) navigation.navigate("Login", { mobileNumber });
      else navigation.navigate("Signup", { mobileNumber });
    } catch (error) {
      Snackbar.show({
        text: error?.message || "Error checking user. Please try again.",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  };

  const logout = async (navigation) => {
    try {
      await logOutAPI();
      dispatch({ type: TYPES.LOGOUT });
      navigation.navigate("UserCheck");
    } catch {
      Snackbar.show({
        text: "Logout Failed: Something went wrong!",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  };

  const refreshUser = async () => {
    const mobileNumber = user?.mobileNumber;
    const password = user?.password;

    if (!mobileNumber || !password) {
      // no creds saved -> can't refresh
      return;
    }

    try {
      dispatch({ type: TYPES.LOGIN_START });

      const latestUser = await loginAPI(mobileNumber, password);

      // keep password in state
      dispatch({
        type: TYPES.LOGIN_SUCCESS,
        user: { ...latestUser, password },
      });
    } catch (error) {
      dispatch({ type: TYPES.LOGIN_FAILURE, error });

      Snackbar.show({
        text: error?.message || "Refresh failed",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });

      // optional: if 401, force logout
      // if (error?.status === 401) dispatch({ type: TYPES.LOGOUT });
    }
  };

  // Expose updateUser so other contexts (Payments) can patch & persist
  const updateUser = (patch) => dispatch({ type: TYPES.UPDATE, patch });

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signup,
      login,
      logout,
      userCheck,
      updateUser,
      refreshUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};