// utils/Features.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// The admin sets each user's view mode; the backend sends it as user.viewMode.
export const VIEW_MODES = {
  FULL: "FULL",
  LIMITED: "LIMITED",
};

export const FEATURES = {
  // Add Money, Withdraw Money, Funds, Passbook, Bank Details, wallet balance
  PAYMENTS: "payments",
  // Placing bets and bet history
  BETTING: "betting",
  // Games home, results, charts, timings, rates, notices. Without it the user
  // gets the Library as their home screen instead.
  GAMES: "games",
};

// The single place that decides what each view mode can see. FULL sees everything.
const HIDDEN_FEATURES = {
  [VIEW_MODES.FULL]: [],
  [VIEW_MODES.LIMITED]: [FEATURES.PAYMENTS, FEATURES.BETTING, FEATURES.GAMES],
};

export const getViewMode = (user) =>
  String(user?.viewMode || "").trim().toUpperCase() === VIEW_MODES.LIMITED
    ? VIEW_MODES.LIMITED
    : VIEW_MODES.FULL;

export const canUseFeature = (user, feature) =>
  !HIDDEN_FEATURES[getViewMode(user)].includes(feature);

export const useFeature = (feature) => {
  const { user } = useContext(AuthContext);
  return canUseFeature(user, feature);
};
