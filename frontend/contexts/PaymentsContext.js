import React, { createContext, useContext, useReducer } from "react";
import Snackbar from "react-native-snackbar";
import {
  lookupIFSC,
  savePayout as savePayoutAPI,
  startUpiPayment,
  submitUpiTopupResult,
} from "../utils/PaymentsService";
import { AuthContext } from "./AuthContext";

export const PaymentsContext = createContext(null);

const initial = {
  loading: false,
  error: null,
  lastSaved: null,
  lastTopup: null,
};

const T = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  SAVED: "SAVED",
  TOPUP: "TOPUP",
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
    default:
      return state;
  }
}

export const PaymentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const { user, updateUser } = useContext(AuthContext);

  const resolveIFSC = async (ifsc) => lookupIFSC(ifsc);

  const savePayout = async (screenPayload) => {
    try {
      if (!user?.mobileNumber) throw new Error("Missing mobile number in session");

      dispatch({ type: T.LOADING });

      // map to backend format + inject mobileNumber
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

      // Prefer server as source of truth if it returns user
      if (res?.user) {
        updateUser(res.user);
      } else {
        // Fallback patch
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

  /**
   * UPI Add Money (frontend-driven)
   *
   * You pass payee details from config:
   *  - payeeVpa  (your upi id)
   *  - payeeName
   *
   * Backend is called after SUCCESS to update DB balance.
   */
  const addMoneyViaUpi = async ({
    amountRupees,
    payeeVpa,
    payeeName,
    note,
  }) => {
    try {
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
      if (status !== "SUCCESS") {
        throw new Error(`UPI status: ${upiRes?.status || "UNKNOWN"}`);
      }

      // 🚨 This API MUST be protected on backend (auth + dedupe).
      // Otherwise people can fake this call and add balance.
      const submitRes = await submitUpiTopupResult({
        mobileNumber: user.mobileNumber,
        amountRupees: amt,
        txnRef: upiRes?.txnRef || txnRef,
        txnId: upiRes?.txnId,
        responseCode: upiRes?.responseCode,
        approvalRefNo: upiRes?.approvalRefNo,
        status: upiRes?.status,
      });

      // Update local user with returned data
      if (submitRes?.user) {
        updateUser(submitRes.user);
      } else if (submitRes?.balance != null) {
        // If your backend returns just balance
        updateUser({ balance: submitRes.balance });
      }

      dispatch({
        type: T.TOPUP,
        payload: { amountRupees: amt, txnRef, upi: upiRes, submit: submitRes },
      });

      Snackbar.show({
        text: submitRes?.message || "Money added ✅",
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
    }
  };

  const value = {
    loading: state.loading,
    lastSaved: state.lastSaved,
    lastTopup: state.lastTopup,
    resolveIFSC,
    savePayout,
    addMoneyViaUpi,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};