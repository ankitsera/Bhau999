import React, { createContext, useEffect, useMemo, useReducer } from "react";
import Snackbar from "react-native-snackbar";

import {
  login as loginAPI,
  signup as signupAPI,
  userCheck as userCheckAPI,
  logOut as logOutAPI,
  restoreUserState,
  saveAuthCreds,
  clearAuthCreds,
} from "../utils/AuthService";

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  isLoading: true,
  error: null,
  isBlocked: false,
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

  UPDATE: "UPDATE",

  SET_BLOCKED: "SET_BLOCKED",
  CLEAR_BLOCKED: "CLEAR_BLOCKED",
};

function authReducer(state, action) {
  switch (action.type) {
    case TYPES.RESTORE_START:
      return { ...state, isLoading: true, error: null };

    case TYPES.RESTORE_SUCCESS:
      return {
        ...state,
        user: action.user,
        isLoading: false,
        error: null,
        isBlocked: false,
      };

    case TYPES.RESTORE_FAILURE:
      return {
        ...state,
        user: null,
        isLoading: false,
        error: action.error || null,
      };

    case TYPES.LOGIN_START:
    case TYPES.SIGNUP_START:
      return { ...state, error: null };

    case TYPES.LOGIN_SUCCESS:
    case TYPES.SIGNUP_SUCCESS:
      return { ...state, user: action.user, error: null, isBlocked: false };

    case TYPES.LOGIN_FAILURE:
    case TYPES.SIGNUP_FAILURE:
      return { ...state, error: action.error || null };

    case TYPES.LOGOUT:
      return { ...state, user: null, error: null, isBlocked: false, isLoading: false };

    case TYPES.SET_BLOCKED:
      return { ...state, user: null, isBlocked: true, isLoading: false, error: null };

    case TYPES.CLEAR_BLOCKED:
      return { ...state, isBlocked: false };

    case TYPES.UPDATE: {
      const prev = state.user || {};
      const patch = action.patch || {};
      const merged = {
        ...prev,
        ...patch,
        bankDetails: Object.prototype.hasOwnProperty.call(patch, "bankDetails")
          ? patch.bankDetails
          : prev.bankDetails,
      };
      return { ...state, user: merged };
    }

    default:
      return state;
  }
}

function getApprovalStatus(u) {
  const v = String(u?.approvalStatus || "").trim().toUpperCase();
  return v === "APPROVED";
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { user, isLoading, isBlocked } = state;

  // restore on app start: creds -> login -> Approval_status gate
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      dispatch({ type: TYPES.RESTORE_START });

      try {
        const saved = await restoreUserState();
        const creds = saved?.creds;

        if (!creds?.mobileNumber || !creds?.password) {
          if (!mounted) return;
          dispatch({ type: TYPES.RESTORE_SUCCESS, user: null });
          return;
        }

        const latestUser = await loginAPI(creds.mobileNumber, creds.password);
        const approval = getApprovalStatus(latestUser);

        if (!mounted) return;

        if (approval) {
          dispatch({
            type: TYPES.RESTORE_SUCCESS,
            user: { ...latestUser, password: creds.password },
          });
        } else {
          dispatch({ type: TYPES.SET_BLOCKED });
        }
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: TYPES.RESTORE_FAILURE, error });
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const signup = async (mobileNumber, username, password, navigation) => {
    try {
      dispatch({ type: TYPES.SIGNUP_START });

      const result = await signupAPI(mobileNumber, username, password);

      // ✅ save creds for future restore
      await saveAuthCreds(mobileNumber, password);

      // ✅ go Home (as you asked)
      navigation.navigate("Home");

      Snackbar.show({
        text: result?.message || "Account created successfully ✅",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      // optional: set a minimal user state (so UI doesn't break)
      const dateSignup = new Date().toISOString();
      dispatch({
        type: TYPES.SIGNUP_SUCCESS,
        user: { mobileNumber, username, dateSignup, password, approvalStatus: 'APPROVED' },
      });
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
      const approval = getApprovalStatus(loggedInUser);

      if (!approval) {
        // keep creds (so restore can keep checking), but block usage
        await saveAuthCreds(mobileNumber, password);

        dispatch({ type: TYPES.SET_BLOCKED });

        Snackbar.show({
          text: "Your account is not approved yet.",
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: "#d32f2f",
        });

        return;
      }

      await saveAuthCreds(mobileNumber, password);

      dispatch({
        type: TYPES.LOGIN_SUCCESS,
        user: { ...loggedInUser, password },
      });

      dispatch({ type: TYPES.CLEAR_BLOCKED });

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
    } catch {}

    await clearAuthCreds();
    dispatch({ type: TYPES.LOGOUT });
    navigation.navigate("UserCheck");
  };

  const clearSession = async () => {
    await clearAuthCreds();
    dispatch({ type: TYPES.LOGOUT});
  };

  const refreshUser = async () => {
    const mobileNumber = user?.mobileNumber;
    const password = user?.password;

    if (!mobileNumber || !password) return;

    try {
      dispatch({ type: TYPES.LOGIN_START });

      const latestUser = await loginAPI(mobileNumber, password);
      const approval = getApprovalStatus(latestUser);

      if (!approval) {
        dispatch({ type: TYPES.SET_BLOCKED });
        return;
      }

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
    }
  };

  const updateUser = (patch) => dispatch({ type: TYPES.UPDATE, patch });

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isBlocked,
      signup,
      login,
      logout,
      userCheck,
      updateUser,
      refreshUser,
      clearSession,
    }),
    [user, isLoading, isBlocked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};