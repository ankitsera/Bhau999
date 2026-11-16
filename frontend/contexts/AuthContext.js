import React, { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { AppState } from "react-native";
import Snackbar from "react-native-snackbar";
import i18n from '../i18n';

import {
  login as loginAPI,
  signup as signupAPI,
  userCheck as userCheckAPI,
  logOut as logOutAPI,
  restoreUserState,
  saveAuthCreds,
  clearAuthCreds,
  fetchBalance,
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

  // Kept in refs so refreshBalance can stay referentially stable and be safely
  // used inside focus/interval/push effects without restarting them.
  const mobileNumberRef = useRef(null);
  // Bumped on every local balance write (optimistic bet deduction, payments).
  // A poll that started before the latest local write is discarded so it cannot
  // resurrect a stale, pre-deduction balance.
  const balanceEpochRef = useRef(0);

  useEffect(() => {
    mobileNumberRef.current = user?.mobileNumber || null;
  }, [user?.mobileNumber]);

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

      // save creds for future restore
      await saveAuthCreds(mobileNumber, password);

      // Read the account back so the first Home paint already has the server's
      // view mode, instead of flashing the full UI at a limited user.
      const createdUser = await loginAPI(mobileNumber, password);
      dispatch({
        type: TYPES.SIGNUP_SUCCESS,
        user: { ...createdUser, password },
      });

      // go Home (as you asked)
      navigation.navigate("Home");

      Snackbar.show({
        text: result?.message || i18n.t('auth:accountCreatedSuccessfully'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });
    } catch (error) {
      dispatch({ type: TYPES.SIGNUP_FAILURE, error });
      Snackbar.show({
        text: error?.message || i18n.t('auth:somethingWentWrong'),
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
          text: i18n.t('auth:accountNotApprovedYet'),
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
        text: error?.message || i18n.t('auth:somethingWentWrong'),
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
        text: error?.message || i18n.t('auth:errorCheckingUser'),
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

  const refreshUser = useCallback(async () => {
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
        text: error?.message || i18n.t('auth:refreshFailed'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, [user?.mobileNumber, user?.password]);

  const updateUser = (patch) => {
    if (patch && Object.prototype.hasOwnProperty.call(patch, "balance")) {
      balanceEpochRef.current += 1;
    }
    dispatch({ type: TYPES.UPDATE, patch });
  };

  /**
   * Cheap balance-only sync. Unlike refreshUser it does not re-send credentials
   * and does not churn the rest of the user object, so it is safe to call on
   * screen focus, on app foreground and on a result push.
   * Stays silent on failure - it runs in the background and must not spam the user.
   */
  const refreshBalance = useCallback(async () => {
    const mobileNumber = mobileNumberRef.current;
    if (!mobileNumber) return;

    const epochAtStart = balanceEpochRef.current;

    try {
      const data = await fetchBalance(mobileNumber);

      // A bet was placed (or a payment landed) while this request was in flight;
      // that local value is newer than what the server told us. Drop this response.
      if (balanceEpochRef.current !== epochAtStart) return;

      if (data?.approvalStatus && !getApprovalStatus(data)) {
        dispatch({ type: TYPES.SET_BLOCKED });
        return;
      }

      // The admin can switch a user's view at any time; the server pushes the same
      // signal as a balance change, so pick the new view up here too.
      const patch = {};
      if (data?.balance != null) patch.balance = data.balance;
      if (data?.viewMode) patch.viewMode = data.viewMode;
      if (Object.keys(patch).length > 0) {
        dispatch({ type: TYPES.UPDATE, patch });
      }
    } catch {
      // background sync - stay quiet and retry on the next trigger
    }
  }, []);

  // Event-driven sync, no timer. The server pushes a data-only "balance_changed"
  // message on every balance write, which covers the case where the user is already
  // staring at the screen. This effect covers the other one: arriving at the app.
  //
  // A dropped push (Doze, OEM battery killers, FCM's best-effort delivery) is silent
  // and permanent, so this foreground fetch is the safety net that makes a lost
  // message self-correct the next time the user actually looks.
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const mobileNumber = user?.mobileNumber;
    if (!mobileNumber || isBlocked) return;

    refreshBalance();

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = String(appStateRef.current || "");
      appStateRef.current = nextState;

      if (prev.match(/inactive|background/) && nextState === "active") {
        refreshBalance();
      }
    });

    return () => {
      sub?.remove?.();
    };
  }, [user?.mobileNumber, isBlocked, refreshBalance]);

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
      refreshBalance,
      clearSession,
    }),
    [user, isLoading, isBlocked, refreshUser, refreshBalance]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};