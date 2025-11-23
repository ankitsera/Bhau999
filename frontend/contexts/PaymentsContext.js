import React, { createContext, useContext, useMemo, useReducer } from "react";
import Snackbar from "react-native-snackbar";
import { lookupIFSC, savePayout as savePayoutAPI } from "../utils/PaymentsService";
import { AuthContext } from "./AuthContext";

export const PaymentsContext = createContext(null);

const initial = { loading: false, error: null, lastSaved: null };
const T = { LOADING: "LOADING", ERROR: "ERROR", SAVED: "SAVED" };

function reducer(state, action) {
  switch (action.type) {
    case T.LOADING: return { ...state, loading: true, error: null };
    case T.ERROR:   return { ...state, loading: false, error: action.error || null };
    case T.SAVED:   return { ...state, loading: false, lastSaved: action.payload, error: null };
    default:        return state;
  }
}

export const PaymentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const { updateUser } = useContext(AuthContext); // patch + persist @user

  const resolveIFSC = async (ifsc) => lookupIFSC(ifsc);

  /**
   * Save payout method and update AuthContext.user locally.
   * - If saving BANK -> clear any UPI (upiId: null)
   * - If saving UPI  -> clear any bank details (bankDetails: null)
   */
  const savePayout = async (payload) => {
    try {
      dispatch({ type: T.LOADING });

      await savePayoutAPI(payload);

      // infer local patch since backend returns empty body
      if (payload.type === "bank") {
        const bankDetails = {
          holderName: payload.holderName,
          accountNumber: payload.accountNumber,
          ifsc: payload.ifsc,
          bank: payload.bank,
          branch: payload.branch,
        };
        updateUser({ bankDetails, upiId: null }); // mutually exclusive
      } else if (payload.type === "upi") {
        updateUser({ upiId: payload.upiId, bankDetails: null }); // mutually exclusive
      }

      dispatch({ type: T.SAVED, payload });
      Snackbar.show({
        text: "Saved ✅",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#388e3c",
      });
      return { ok: true };
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

  const value = useMemo(
    () => ({
      loading: state.loading,
      lastSaved: state.lastSaved,
      resolveIFSC,
      savePayout,
    }),
    [state.loading, state.lastSaved]
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
};