import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Snackbar from "react-native-snackbar";
import i18n from '../i18n';
import {
  lookupIFSC,
  savePayout as savePayoutAPI,
  startUpiPayment,
  submitTransaction,
  listTransactionsByUser,
  listWithdrawalsByUser,
  listDepositsByUser,
} from "../utils/PaymentsService";

import {
  createGatewayPayment,
  openUpiIntentUrl,
  getGatewayPaymentStatus,
} from "../utils/PaymentsService";

import { getIsGatewayUp } from "../utils/AppConfigService";

import { AuthContext } from "./AuthContext";

export const PaymentsContext = createContext(null);

const GREEN = "#3FA16C";

const initial = {
  // existing
  loading: false,
  error: null,
  lastSaved: null,
  lastTopup: null,
  lastWithdraw: null,

  // gateway UI state
  gatewayUi: {
    visible: false,
    step: null, // opening | confirming | success | fail
    message: "",
    custRefNum: null,
  },

  // lists
  transactions: [],
  deposits: [],
  withdrawals: [],
  isLoadingTransactions: false,
  isLoadingDeposits: false,
  isLoadingWithdrawals: false,
};

const T = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  SAVED: "SAVED",
  TOPUP: "TOPUP",
  WITHDRAW: "WITHDRAW",

  GATEWAY_UI: "GATEWAY_UI",

  TXN_START: "TXN_START",
  TXN_SUCCESS: "TXN_SUCCESS",
  TXN_FAIL: "TXN_FAIL",

  DEP_START: "DEP_START",
  DEP_SUCCESS: "DEP_SUCCESS",
  DEP_FAIL: "DEP_FAIL",

  WDR_START: "WDR_START",
  WDR_SUCCESS: "WDR_SUCCESS",
  WDR_FAIL: "WDR_FAIL",

  CLEAR_ERROR: "CLEAR_ERROR",
};

function reducer(state, action) {
  switch (action.type) {
    case T.LOADING:
      return { ...state, loading: true, error: null };
    case T.ERROR:
      return { ...state, loading: false, error: action.error || null };

    case T.SAVED:
      return { ...state, loading: false, error: null, lastSaved: action.payload };
    case T.TOPUP:
      return { ...state, loading: false, error: null, lastTopup: action.payload };
    case T.WITHDRAW:
      return { ...state, loading: false, error: null, lastWithdraw: action.payload };

    case T.GATEWAY_UI:
      return { ...state, gatewayUi: { ...state.gatewayUi, ...action.payload } };
    
      case T.TXN_START:
      return { ...state, isLoadingTransactions: true, error: null };
    case T.TXN_SUCCESS:
      return { ...state, isLoadingTransactions: false, transactions: action.payload || [], error: null };
    case T.TXN_FAIL:
      return { ...state, isLoadingTransactions: false, error: action.error || null };

    case T.DEP_START:
      return { ...state, isLoadingDeposits: true, error: null };
    case T.DEP_SUCCESS:
      return { ...state, isLoadingDeposits: false, deposits: action.payload || [], error: null };
    case T.DEP_FAIL:
      return { ...state, isLoadingDeposits: false, error: action.error || null };

    case T.WDR_START:
      return { ...state, isLoadingWithdrawals: true, error: null };
    case T.WDR_SUCCESS:
      return { ...state, isLoadingWithdrawals: false, withdrawals: action.payload || [], error: null };
    case T.WDR_FAIL:
      return { ...state, isLoadingWithdrawals: false, error: action.error || null };

    case T.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}

export const PaymentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const { user, updateUser, refreshUser } = useContext(AuthContext);

  // prevents multi-tap causing multiple intents + multiple API calls
  const inFlightPayRef = useRef(false);

  // ONE active pending payment lock (per app instance)
  const activePayRef = useRef(null);
  // { custRefNum, startedAtMs, amount, mobileNumber, finished: boolean }
  const pollRunningRef = useRef(false);

  // prevents multi-tap on withdraw
  const inFlightWithdrawRef = useRef(false);

  // prevents list spam (focus double-fire / refresh spamming)
  const inFlightTxRef = useRef(false);
  const inFlightDepRef = useRef(false);
  const inFlightWdrRef = useRef(false);

  // tiny throttle (helps when focus fires twice)
  const lastTxAtRef = useRef(0);
  const lastDepAtRef = useRef(0);
  const lastWdrAtRef = useRef(0);

  const resolveIFSC = useCallback(async (ifsc) => lookupIFSC(ifsc), []);

  const clearPaymentsError = useCallback(() => {
    dispatch({ type: T.CLEAR_ERROR });
  }, []);

  const setGatewayUi = useCallback((patch) => {
    dispatch({ type: T.GATEWAY_UI, payload: patch });
  }, []);

  const closeGatewayUi = useCallback(() => {
    // IMPORTANT: hide only; do NOT stop polling
    setGatewayUi({ visible: false });
  }, [setGatewayUi]);

  const savePayout = useCallback(async (screenPayload) => {
    try {
      if (!user?.mobileNumber) throw new Error("Missing mobile number in session");

      dispatch({ type: T.LOADING });

      let backendPayload = { mobileNumber: user.mobileNumber };

      if (screenPayload.type === "bank") {
        backendPayload = {
          ...backendPayload,
          accountHolderName: screenPayload.accountHolderName,
          accountNumber: screenPayload.accountNumber,
          ifscCode: screenPayload.ifscCode,
        };
      } else if (screenPayload.type === "upi") {
        backendPayload = { ...backendPayload, upiId: screenPayload.upiId };
      } else {
        throw new Error("Unknown payout type");
      }

      const res = await savePayoutAPI(backendPayload);

      if (res?.user) {
        updateUser(res.user);
      } else {
        // fallback local update
        if (screenPayload.type === "bank") {
          updateUser({
            accountHolderName: screenPayload.accountHolderName,
            accountNumber: screenPayload.accountNumber,
            ifscCode: screenPayload.ifscCode,
            upiId: null,
          });
        } else {
          updateUser({
            upiId: screenPayload.upiId,
            accountHolderName: null,
            accountNumber: null,
            ifscCode: null,
          });
        }
      }

      dispatch({ type: T.SAVED, payload: screenPayload });

      Snackbar.show({
        text: res?.message || i18n.t('funds:saved'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return res;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:saveFailed'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error; // keep throw (screen may depend on it)
    }
  }, [user?.mobileNumber, updateUser]);

    // ---- Polling helper (max 60s)
  const pollGatewayStatus = useCallback(async ({ custRefNum, timeoutMs = 65000, intervalMs = 2000 }) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const st = await getGatewayPaymentStatus(custRefNum);

      if (st.status === "SUCCESS" || st.status === "FAIL") {
        return st;
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    return { custRefNum, status: "PENDING_TIMEOUT" };
  }, []);

    /**
   * Add Money via Gateway (ONE active pending payment at a time)
   * - creates payment on backend
   * - opens upiIntentUrl
   * - polls /status for up to 60s in background
   * - user can close overlay but polling continues
   */
  const addMoneyViaGateway = useCallback(async ({ amountRupees }) => {
    if (!user?.mobileNumber) throw new Error("Missing mobile number in session");

    const amt = Number(amountRupees);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");

    // if there is an active pending payment within 60s -> block starting new one
    const active = activePayRef.current;
    if (active && !active.finished) {
      const age = Date.now() - (active.startedAtMs || 0);
      if (age < 60000) {
        // reopen overlay (optional)
        setGatewayUi({
          visible: true,
          step: "confirming",
          message: i18n.t('funds:previousPaymentProcessing'),
          custRefNum: active.custRefNum,
        });

        Snackbar.show({
          text: i18n.t('funds:previousPaymentProcessing'),
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "#f59e0b",
        });

        return;
      }
      // older than 60s -> allow new
      activePayRef.current = null;
    }

    dispatch({ type: T.LOADING });

    setGatewayUi({
      visible: true,
      step: "opening",
      message: i18n.t('funds:openingUpi'),
      custRefNum: null,
    });

    // create payment on backend
    const created = await createGatewayPayment({
      mobileNumber: user.mobileNumber,
      amount: Math.round(amt),
    });

    if (!created?.custRefNum || !created?.upiIntentUrl) {
      dispatch({ type: T.ERROR, error: new Error("Gateway response missing custRefNum / upiIntentUrl") });
      setGatewayUi({
        visible: true,
        step: "fail",
        message: i18n.t('funds:paymentCouldNotStart'),
        custRefNum: created?.custRefNum || null,
      });
      throw new Error(i18n.t('funds:paymentCouldNotStart'));
    }

    // lock it
    activePayRef.current = {
      custRefNum: created.custRefNum,
      startedAtMs: Date.now(),
      amount: amt,
      mobileNumber: user.mobileNumber,
      finished: false,
    };

    // move to confirming state BEFORE opening UPI (so user sees overlay even if UPI takes time)
    setGatewayUi({
      visible: true,
      step: "confirming",
      message: i18n.t('funds:confirmingPayment'),
      custRefNum: created.custRefNum,
    });

    // start opening UPI
    try {
      await openUpiIntentUrl(created.upiIntentUrl);
    } catch (e) {
      // If user has no UPI app, we should fail fast and unlock
      activePayRef.current.finished = true;
      activePayRef.current = null;

      dispatch({ type: T.ERROR, error: e });
      setGatewayUi({
        visible: true,
        step: "fail",
        message: e?.message || i18n.t('funds:unableToOpenUpi'),
        custRefNum: created.custRefNum,
      });
      throw e;
    } finally {
      // DO NOT set loading false here — keep it true while confirming
      // We'll clear loading after polling finishes
    }

    // Poll in background (but do it from this call once; avoid multiple poll loops)
    if (pollRunningRef.current) return;

    pollRunningRef.current = true;

    try {
      const finalStatus = await pollGatewayStatus({
        custRefNum: created.custRefNum,
        timeoutMs: 60000,
        intervalMs: 2000,
      });

      // Mark finished no matter what
      if (activePayRef.current && activePayRef.current.custRefNum === created.custRefNum) {
        activePayRef.current.finished = true;
      }

      if (finalStatus.status === "SUCCESS") {
        setGatewayUi({
          visible: true,
          step: "success",
          message: i18n.t('funds:paymentSuccess'),
          custRefNum: created.custRefNum,
        });

        Snackbar.show({
          text: i18n.t('funds:paymentSuccess'),
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: "#388e3c",
        });

        // refresh user from backend (source of truth)
        await refreshUser();

        dispatch({
          type: T.TOPUP,
          payload: {
            amountRupees: amt,
            custRefNum: created.custRefNum,
          },
        });
      } else if (finalStatus.status === "FAIL") {
        setGatewayUi({
          visible: true,
          step: "fail",
          message: i18n.t('funds:paymentFailed'),
          custRefNum: created.custRefNum,
        });

        Snackbar.show({
          text: i18n.t('funds:paymentFailed'),
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: "#d32f2f",
        });
      } else {
        // timeout / still pending
        setGatewayUi({
          visible: true,
          step: "fail",
          message: i18n.t('funds:paymentStillProcessing'),
          custRefNum: created.custRefNum,
        });

        Snackbar.show({
          text: i18n.t('funds:paymentStillProcessing'),
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: "#f59e0b",
        });
      }
    } catch (e) {
      // polling error
      setGatewayUi({
        visible: true,
        step: "fail",
        message: e?.message || i18n.t('funds:unableToConfirmPayment'),
        custRefNum: created.custRefNum,
      });

      Snackbar.show({
        text: e?.message || i18n.t('funds:unableToConfirmPayment'),
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: "#d32f2f",
      });
    } finally {
      pollRunningRef.current = false;
      activePayRef.current = null;
      dispatch({ type: T.LOADING, }); // set true then immediately set to false? nah.
      // better:
      dispatch({ type: T.ERROR, error: null }); // sets loading false in reducer
    }
  }, [user?.mobileNumber, refreshUser, pollGatewayStatus, setGatewayUi]);

  const addMoneyViaUpi = useCallback(async ({ amountRupees, payeeVpa, payeeName, note }) => {
    try {
      if (inFlightPayRef.current) throw new Error("Payment already in progress");
      inFlightPayRef.current = true;

      if (!user?.mobileNumber) throw new Error("Missing mobile number in session");

      const amt = Number(amountRupees);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      if (!payeeVpa || !payeeName) throw new Error("Missing payee UPI details");

      dispatch({ type: T.LOADING });

      // Unique ref you can store & use to dedupe on backend
      const txnRef = `TOPUP_${user.mobileNumber}_${Date.now()}`;

      const upiRes = await startUpiPayment({
        vpa: payeeVpa,
        payeeName,
        amountRupees: amt.toFixed(2),
        transactionRef: txnRef,
        transactionNote: note || "Wallet topup",
      });

      const status = String(upiRes?.status || "").toUpperCase();

      // We only accept SUCCESS for instant credit
      if (status !== "SUCCESS") {
        throw new Error(`UPI status: ${status || "UNKNOWN"}`);
      }

      // "secure as possible" in frontend-only world:
      // don't credit if we didn't receive any trace id
      const hasTrace =
        !!upiRes?.txnId || !!upiRes?.approvalRefNo || !!upiRes?.rrn;

      if (!hasTrace) {
        throw new Error("Payment response missing txn reference. Try another UPI app.");
      }

      // Single backend call after payment
      const submitRes = await submitTransaction({
        mobileNumber: user.mobileNumber,
        amount: amt,
        txnRef, // always use our generated ref
        status,
        txnId: upiRes?.txnId,
        approvalRefNo: upiRes?.approvalRefNo,
        rrn: upiRes?.rrn,
        initiator: "User",
        responseCode: upiRes?.responseCode,
        raw: upiRes?.raw, // optional but useful for logs
      });

      const newBalance = Number(user?.balance || 0) + amt;
      updateUser({ balance: newBalance });

      dispatch({
        type: T.TOPUP,
        payload: {
          amountRupees: amt,
          txnRef,
          upi: upiRes,
          transaction: submitRes, // saved entity
        },
      });

      Snackbar.show({
        text: i18n.t('funds:moneyAdded'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return submitRes;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:paymentFailed'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error;
    } finally {
      inFlightPayRef.current = false;
    }
  }, [user?.mobileNumber, user?.balance, updateUser]);

  /**
   * Unified Add Money function - toggles between Gateway and UPI flows
   * based on IS_GATEWAY_UP property
   */
  const addMoney = useCallback(async ({ amountRupees, payeeVpa, payeeName, note }) => {
    try {
      const isGatewayUp = await getIsGatewayUp();

      if (isGatewayUp) {
        return await addMoneyViaGateway({ amountRupees });
      } else {
        return await addMoneyViaUpi({ amountRupees, payeeVpa, payeeName, note });
      }
    } catch (error) {
      throw error;
    }
  }, [addMoneyViaGateway, addMoneyViaUpi]);

  /**
   * Withdraw money (frontend-driven)
   * Uses submitTransaction with ONLY required fields:
   *  - mobileNumber
   *  - amount (NEGATIVE)
   *  - initiator: "User"
   *
   * Updates balance instantly like addMoneyViaUpi.
   */
  const withdrawMoney = useCallback(async ({ amountRupees }) => {
    try {
      if (inFlightWithdrawRef.current) throw new Error("Withdraw already in progress");
      inFlightWithdrawRef.current = true;

      if (!user?.mobileNumber) throw new Error("Missing mobile number in session");

      const amt = Number(amountRupees);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid withdraw amount");

      const currentBal = Number(user?.balance || 0);
      if (amt > currentBal) throw new Error("Insufficient balance");

      dispatch({ type: T.LOADING });

      // IMPORTANT: amount must be negative for withdraw
      const negativeAmount = -Math.abs(amt);

      const submitRes = await submitTransaction({
        mobileNumber: user.mobileNumber,
        amount: negativeAmount,
        initiator: "User",
      });

      const newBalance = currentBal + negativeAmount; // subtracts
      updateUser({ balance: newBalance });

      dispatch({
        type: T.WITHDRAW,
        payload: {
          amountRupees: amt,
          transaction: submitRes,
        },
      });

      Snackbar.show({
        text: i18n.t('funds:withdrawalRequested'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return submitRes;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:withdrawFailed'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error;
    } finally {
      inFlightWithdrawRef.current = false;
    }
  }, [user?.mobileNumber, user?.balance, updateUser]);

  // list loaders: NO THROW + in-flight + throttle
  const loadTransactions = useCallback(async () => {
    const mobile = user?.mobileNumber;
    if (!mobile) return [];

    const now = Date.now();
    if (now - lastTxAtRef.current < 500) return [];
    lastTxAtRef.current = now;

    if (inFlightTxRef.current) return [];
    inFlightTxRef.current = true;

    try {
      dispatch({ type: T.TXN_START });
      const list = await listTransactionsByUser(mobile);
      dispatch({ type: T.TXN_SUCCESS, payload: list });
      return Array.isArray(list) ? list : [];
    } catch (error) {
      dispatch({ type: T.TXN_FAIL, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:failedToLoadTransactions'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      return [];
    } finally {
      inFlightTxRef.current = false;
    }
  }, [user?.mobileNumber]);

  const loadDeposits = useCallback(async () => {
    const mobile = user?.mobileNumber;
    if (!mobile) return [];

    const now = Date.now();
    if (now - lastDepAtRef.current < 500) return [];
    lastDepAtRef.current = now;

    if (inFlightDepRef.current) return [];
    inFlightDepRef.current = true;

    try {
      dispatch({ type: T.DEP_START });
      const list = await listDepositsByUser(mobile);
      dispatch({ type: T.DEP_SUCCESS, payload: list });
      return Array.isArray(list) ? list : [];
    } catch (error) {
      dispatch({ type: T.DEP_FAIL, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:failedToLoadDeposits'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      return [];
    } finally {
      inFlightDepRef.current = false;
    }
  }, [user?.mobileNumber]);

  const loadWithdrawals = useCallback(async () => {
    const mobile = user?.mobileNumber;
    if (!mobile) return [];

    const now = Date.now();
    if (now - lastWdrAtRef.current < 500) return [];
    lastWdrAtRef.current = now;

    if (inFlightWdrRef.current) return [];
    inFlightWdrRef.current = true;

    try {
      dispatch({ type: T.WDR_START });
      const list = await listWithdrawalsByUser(mobile);
      dispatch({ type: T.WDR_SUCCESS, payload: list });
      return Array.isArray(list) ? list : [];
    } catch (error) {
      dispatch({ type: T.WDR_FAIL, error });
      Snackbar.show({
        text: error?.message || i18n.t('funds:failedToLoadWithdrawals'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      return [];
    } finally {
      inFlightWdrRef.current = false;
    }
  }, [user?.mobileNumber]);

  const value = useMemo(() => {
    return {
      GREEN,

      loading: state.loading,
      error: state.error,
      lastSaved: state.lastSaved,
      lastTopup: state.lastTopup,
      lastWithdraw: state.lastWithdraw,

      transactions: state.transactions,
      deposits: state.deposits,
      withdrawals: state.withdrawals,
      isLoadingTransactions: state.isLoadingTransactions,
      isLoadingDeposits: state.isLoadingDeposits,
      isLoadingWithdrawals: state.isLoadingWithdrawals,

      addMoney,
      addMoneyViaGateway,
      gatewayUi: state.gatewayUi,
      closeGatewayUi,

      resolveIFSC,
      savePayout,
      addMoneyViaUpi,
      withdrawMoney,

      loadTransactions,
      loadDeposits,
      loadWithdrawals,

      clearPaymentsError,
    };
  }, [
    state.loading,
    state.error,
    state.lastSaved,
    state.lastTopup,
    state.lastWithdraw,
    state.gatewayUi,
    closeGatewayUi,
    state.transactions,
    state.deposits,
    state.withdrawals,
    state.isLoadingTransactions,
    state.isLoadingDeposits,
    state.isLoadingWithdrawals,
    resolveIFSC,
    savePayout,
    addMoney,
    addMoneyViaGateway,
    addMoneyViaUpi,
    withdrawMoney,
    loadTransactions,
    loadDeposits,
    loadWithdrawals,
    clearPaymentsError,
  ]);

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};