import React, { createContext, useContext, useReducer, useRef } from "react";
import Snackbar from "react-native-snackbar";
import {
  lookupIFSC,
  savePayout as savePayoutAPI,
  startUpiPayment,
  submitTransaction,
} from "../utils/PaymentsService";
import { AuthContext } from "./AuthContext";

export const PaymentsContext = createContext(null);

const initial = {
  loading: false,
  error: null,
  lastSaved: null,
  lastTopup: null,
  lastWithdraw: null,
};

const T = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  SAVED: "SAVED",
  TOPUP: "TOPUP",
  WITHDRAW: "WITHDRAW",
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
    default:
      return state;
  }
}

export const PaymentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const { user, updateUser } = useContext(AuthContext);

  // prevents multi-tap causing multiple intents + multiple API calls
  const inFlightPayRef = useRef(false);

  // prevents multi-tap on withdraw
  const inFlightWithdrawRef = useRef(false);

  const resolveIFSC = async (ifsc) => lookupIFSC(ifsc);

  const savePayout = async (screenPayload) => {
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
        text: res?.message || "Saved ✅",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return res;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || "Save failed",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error;
    }
  };

  const addMoneyViaUpi = async ({ amountRupees, payeeVpa, payeeName, note }) => {
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

      // ✅ We only accept SUCCESS for instant credit
      if (status !== "SUCCESS") {
        throw new Error(`UPI status: ${status || "UNKNOWN"}`);
      }

      // ✅ "secure as possible" in frontend-only world:
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
        text: 'Money added ✅',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return submitRes;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || "Payment failed",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error;
    } finally {
      inFlightPayRef.current = false;
    }
  };

  /**
   * ✅ Withdraw money (frontend-driven)
   * Uses submitTransaction with ONLY required fields:
   *  - mobileNumber
   *  - amount (NEGATIVE)
   *  - initiator: "User"
   *
   * Updates balance instantly like addMoneyViaUpi.
   */
  const withdrawMoney = async ({ amountRupees }) => {
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
        text: "Withdrawal requested ✅",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });

      return submitRes;
    } catch (error) {
      dispatch({ type: T.ERROR, error });
      Snackbar.show({
        text: error?.message || "Withdraw failed",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw error;
    } finally {
      inFlightWithdrawRef.current = false;
    }
  };

  const value = {
    loading: state.loading,
    lastSaved: state.lastSaved,
    lastTopup: state.lastTopup,
    lastWithdraw: state.lastWithdraw,
    resolveIFSC,
    savePayout,
    addMoneyViaUpi,
    withdrawMoney,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};