import React, { createContext, useContext, useReducer } from "react";
import Snackbar from "react-native-snackbar";
import { lookupIFSC, savePayout as savePayoutAPI } from "../utils/PaymentsService";
import { AuthContext } from "./AuthContext";

export const PaymentsContext = createContext(null);

const initial = { loading: false, error: null, lastSaved: null };
const T = { LOADING: "LOADING", ERROR: "ERROR", SAVED: "SAVED" };

function reducer(state, action) {
  switch (action.type) {
    case T.LOADING:
      return { ...state, loading: true, error: null };
    case T.ERROR:
      return { ...state, loading: false, error: action.error || null };
    case T.SAVED:
      return { ...state, loading: false, error: null, lastSaved: action.payload };
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
      if (!user?.mobileNumber) {
        throw new Error("Missing mobile number in session");
      }

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
        backendPayload = {
          ...backendPayload,
          upiId: screenPayload.upiId,
        };
      } else {
        throw new Error("Unknown payout type");
      }

      const res = await savePayoutAPI(backendPayload);

      // Prefer server as source of truth if it returns user
      if (res?.user) {
        updateUser(res.user);
      } else {
        // Fallback: local patch (flat fields, no bankDetails nesting)
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

  const value = {
    loading: state.loading,
    lastSaved: state.lastSaved,
    resolveIFSC,
    savePayout,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};