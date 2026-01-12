// utils/GameService.js
import { API_URL } from "../env-vars";

// GET /api/rate  ->  ${API_URL}/rate
export const getGameRates = async () => {
  const res = await fetch(`${API_URL}/rate`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) {
    return Array.isArray(body) ? body : [];
  }

  const msg =
    body?.message || `Failed to load game rates (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

/**
 * GET /api/active-games  ->  `${API_URL}/active-games`
 *
 * Backend returns a list of ActiveGameWithAllowedTypes:
 * {
 *   gameName: string,
 *   open_pana: integer | null,
 *   close_pana: integer | null,
 *   openTime: string | null,   // LocalTime -> "HH:mm:ss"
 *   closeTime: string | null,  // LocalTime -> "HH:mm:ss"
 *   allowed_types: string[],   // e.g. ["OPEN","CLOSE"] or ["CLOSE"] or []
 * }
 */
export const getActiveGames = async () => {
  const res = await fetch(`${API_URL}/active-games`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) {
    return Array.isArray(body) ? body : [];
  }

  const msg =
    body?.message || `Failed to load active games (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

/**
 * GET /api/bet-history/bets/user/{mobileNumber}
 * Returns List<BetResponse> combined from bets + bets_history
 */
export const getBidHistoryByUser = async (mobileNumber) => {
  const mob = String(mobileNumber || "").trim();
  if (!mob) {
    const err = new Error("Mobile number is required");
    err.status = 400;
    throw err;
  }

  const res = await fetch(
    `${API_URL}/bets/user/${encodeURIComponent(mob)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) {
    return Array.isArray(body) ? body : [];
  }

  const msg =
    body?.message || `Failed to load bid history (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  err.body = body;
  throw err;
};

/**
 * POST /api/bet  ->  `${API_URL}/bet`
 *
 * Controller expects: JSON ARRAY of bets
 * Required (as per your controller + new field):
 * - mobileNumber
 * - gameName
 * - type           (NOW: sub-game key like "Single Pana", "Jodi", "Sp Motor" etc)
 * - open_close     ("OPEN" | "CLOSE")
 * - amount
 * - betValue
 */
export const placeBets = async (bets) => {
  if (!Array.isArray(bets) || bets.length === 0) {
    const err = new Error('Bets must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const res = await fetch(`${API_URL}/bet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bets),
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) return body;

  const msg = body?.message || `Failed to place bets (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  err.body = body;
  throw err;
};

/**
 * Tiny helper so screens don't mess up casing/keys.
 * Use this everywhere while building payload.
 */
export const makeBet = ({
  mobileNumber,
  gameName,
  type, // sub-game key
  openClose, // "OPEN" | "CLOSE"
  amount,
  betValue,
}) => {
  return {
    mobileNumber: String(mobileNumber || ""),
    gameName: String(gameName || ""),
    type: String(type || "").trim(), // you now store "Single Pana" style, so keep as-is
    open_close: String(openClose || "").trim(), // "Open"/"Close"
    amount: Number(amount) || 0,
    betValue: betValue === null || betValue === undefined ? null : Number(betValue),
  };
};
