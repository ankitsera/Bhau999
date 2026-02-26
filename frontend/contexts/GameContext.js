// contexts/GameContext.js
import React, {
  createContext,
  useMemo,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { AppState } from "react-native";
import Snackbar from "react-native-snackbar";
import {
  getGameRates as getGameRatesAPI,
  getActiveGames as getActiveGamesAPI,
  getAllGames as getAllGamesAPI,
  getBidHistoryByUser as getBidHistoryByUserAPI,
  getGameHistory as getGameHistoryAPI,
} from "../utils/GameService";
import { ThemeColor } from "./Themes";

const RED = "#EF4B3E";
const GREEN = "#4CAF50";

const initialState = {
  // rates
  rates: [],
  isLoadingRates: false,

  // all games (raw) from /api/game
  allGames: [],
  isLoadingAllGames: false,

  // active games (raw)
  activeGames: [],
  isLoadingActiveGames: false,

  // bid history
  bidHistory: [],
  isLoadingBidHistory: false,

  // game history (raw) from /api/game-history
  gameHistory: [],
  isLoadingGameHistory: false,

  // common
  error: null,
};

const TYPES = {
  // rates
  FETCH_RATES_START: "FETCH_RATES_START",
  FETCH_RATES_SUCCESS: "FETCH_RATES_SUCCESS",
  FETCH_RATES_FAILURE: "FETCH_RATES_FAILURE",

  // all games
  FETCH_ALL_GAMES_START: "FETCH_ALL_GAMES_START",
  FETCH_ALL_GAMES_SUCCESS: "FETCH_ALL_GAMES_SUCCESS",
  FETCH_ALL_GAMES_FAILURE: "FETCH_ALL_GAMES_FAILURE",

  // active games
  FETCH_ACTIVE_GAMES_START: "FETCH_ACTIVE_GAMES_START",
  FETCH_ACTIVE_GAMES_SUCCESS: "FETCH_ACTIVE_GAMES_SUCCESS",
  FETCH_ACTIVE_GAMES_FAILURE: "FETCH_ACTIVE_GAMES_FAILURE",

  // bid history
  FETCH_BID_HISTORY_START: "FETCH_BID_HISTORY_START",
  FETCH_BID_HISTORY_SUCCESS: "FETCH_BID_HISTORY_SUCCESS",
  FETCH_BID_HISTORY_FAILURE: "FETCH_BID_HISTORY_FAILURE",

  // game history
  FETCH_GAME_HISTORY_START: "FETCH_GAME_HISTORY_START",
  FETCH_GAME_HISTORY_SUCCESS: "FETCH_GAME_HISTORY_SUCCESS",
  FETCH_GAME_HISTORY_FAILURE: "FETCH_GAME_HISTORY_FAILURE",

  // common
  CLEAR_ERROR: "CLEAR_ERROR",
};

function gameReducer(state, action) {
  switch (action.type) {
    // RATES
    case TYPES.FETCH_RATES_START:
      return { ...state, isLoadingRates: true, error: null };
    case TYPES.FETCH_RATES_SUCCESS:
      return {
        ...state,
        isLoadingRates: false,
        rates: action.rates || [],
        error: null,
      };
    case TYPES.FETCH_RATES_FAILURE:
      return { ...state, isLoadingRates: false, error: action.error || null };

    // ALL GAMES
    case TYPES.FETCH_ALL_GAMES_START:
      return { ...state, isLoadingAllGames: true, error: null };
    case TYPES.FETCH_ALL_GAMES_SUCCESS:
      return {
        ...state,
        isLoadingAllGames: false,
        allGames: action.allGames || [],
        error: null,
      };
    case TYPES.FETCH_ALL_GAMES_FAILURE:
      return { ...state, isLoadingAllGames: false, error: action.error || null };

    // ACTIVE GAMES
    case TYPES.FETCH_ACTIVE_GAMES_START:
      return { ...state, isLoadingActiveGames: true, error: null };
    case TYPES.FETCH_ACTIVE_GAMES_SUCCESS:
      return {
        ...state,
        isLoadingActiveGames: false,
        activeGames: action.activeGames || [],
        error: null,
      };
    case TYPES.FETCH_ACTIVE_GAMES_FAILURE:
      return {
        ...state,
        isLoadingActiveGames: false,
        error: action.error || null,
      };

    // BID HISTORY
    case TYPES.FETCH_BID_HISTORY_START:
      return { ...state, isLoadingBidHistory: true, error: null };
    case TYPES.FETCH_BID_HISTORY_SUCCESS:
      return {
        ...state,
        isLoadingBidHistory: false,
        bidHistory: action.bidHistory || [],
        error: null,
      };
    case TYPES.FETCH_BID_HISTORY_FAILURE:
      return {
        ...state,
        isLoadingBidHistory: false,
        error: action.error || null,
      };

    // GAME HISTORY
    case TYPES.FETCH_GAME_HISTORY_START:
      return { ...state, isLoadingGameHistory: true, error: null };
    case TYPES.FETCH_GAME_HISTORY_SUCCESS:
      return {
        ...state,
        isLoadingGameHistory: false,
        gameHistory: action.gameHistory || [],
        error: null,
      };
    case TYPES.FETCH_GAME_HISTORY_FAILURE:
      return {
        ...state,
        isLoadingGameHistory: false,
        error: action.error || null,
      };

    // COMMON
    case TYPES.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}

// -------- helpers (UI transformation for active games) --------
const formatTime12h = (t) => {
  if (!t || typeof t !== "string") return "--:--";
  const parts = t.split(":");
  const hh = Number(parts?.[0]);
  const mm = Number(parts?.[1]);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return t;

  const ampm = hh >= 12 ? "PM" : "AM";
  let h = hh % 12;
  if (h === 0) h = 12;

  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
};

// parse "09:10 AM" -> minutes for sorting
const time12hToMinutes = (t) => {
  const s = String(t || "").trim().toUpperCase();
  if (!s || s === "--:--") return Number.POSITIVE_INFINITY;

  const parts = s.split(" ");
  const hhmm = parts[0] || "";
  const ampm = parts[1] || "";

  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return Number.POSITIVE_INFINITY;

  // if AM/PM missing, treat as 24h (fallback)
  if (ampm !== "AM" && ampm !== "PM") {
    return hh * 60 + mm;
  }

  let h = hh;
  if (ampm === "AM") {
    if (h === 12) h = 0;
  } else {
    // PM
    if (h !== 12) h += 12;
  }

  return h * 60 + mm;
};

const sumDigitsMod10 = (val) => {
  if (val === null || val === undefined) return null;
  const s = String(val);
  const digits = s.replace(/\D/g, "").split("");
  if (digits.length === 0) return null;
  const sum = digits.reduce((acc, d) => acc + Number(d), 0);
  return String(sum % 10);
};

const buildResultText = (allowedLen, openPana, closePana) => {
  // pattern: left3 - mid2 - right3
  if (allowedLen === 2) {
    return "***-**-***";
  }

  if (allowedLen === 1) {
    const left = openPana !== null && openPana !== undefined ? String(openPana) : "***";
    const mid1 = sumDigitsMod10(openPana) ?? "*";
    const mid2 = "*";
    const right = "***";
    return `${left}-${mid1}${mid2}-${right}`;
  }

  // allowedLen === 0 (closed)
  const left = openPana !== null && openPana !== undefined ? String(openPana) : "***";
  const right = closePana !== null && closePana !== undefined ? String(closePana) : "***";
  const mid1 = sumDigitsMod10(openPana) ?? "*";
  const mid2 = sumDigitsMod10(closePana) ?? "*";
  return `${left}-${mid1}${mid2}-${right}`;
};

const normalizeAllowedTypes = (arr) => {
  const raw = Array.isArray(arr) ? arr : [];
  return raw
    .map((x) => String(x || "").trim().toUpperCase())
    .filter(Boolean);
};

const toActiveGameUi = (g) => {
  const allowed = normalizeAllowedTypes(g?.allowed_types);
  const len = allowed.length;

  const isClosed = len === 0;
  const statusText = isClosed
    ? "Closed for today"
    : "Running Now"; // you can customize this text based on allowed types if needed

  const statusColor = isClosed ? RED : GREEN;
  // normalize pana keys
  const openPana = g?.openPana ?? g?.open_pana ?? null;
  const closePana = g?.closePana ?? g?.close_pana ?? null;

  return {
    raw: g,

    gameName: g?.gameName ?? "Unknown",
    openTimeText: formatTime12h(g?.openTime),
    closeTimeText: formatTime12h(g?.closeTime),

    resultText: buildResultText(len, openPana, closePana),

    allowed_types: allowed,
    isClosed,

    statusText,
    statusColor,
  };
};

//UI model for /api/game (Game entity)
const toGameUi = (g) => {
  // backend uses "name" for game name
  const name = g?.name ?? g?.gameName ?? "Unknown";
  return {
    raw: g,
    gameName: name,
    openTimeText: formatTime12h(g?.openTime),
    closeTimeText: formatTime12h(g?.closeTime),
  };
};

export const GameContext = createContext({
  ...initialState,

  // derived UI data
  activeGamesUi: [],
  allGamesUi: [],

  // selectors
  getGameRawByName: () => null,
  getGameUiByName: () => null,

  // actions
  loadGameRates: async () => {},
  loadAllGames: async () => {},
  loadActiveGames: async () => {},
  loadBidHistoryByUser: async () => {},
  loadGameHistory: async () => {}, // NEW
  clearGameError: () => {},
});

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const {
    rates,
    isLoadingRates,

    allGames,
    isLoadingAllGames,

    activeGames,
    isLoadingActiveGames,

    bidHistory,
    isLoadingBidHistory,

    gameHistory, // NEW
    isLoadingGameHistory, // NEW

    error,
  } = state;

  const loadGameRates = useCallback(async () => {
    try {
      dispatch({ type: TYPES.FETCH_RATES_START });
      const data = await getGameRatesAPI();
      dispatch({ type: TYPES.FETCH_RATES_SUCCESS, rates: data });
    } catch (err) {
      dispatch({ type: TYPES.FETCH_RATES_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || "Failed to load game rates",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  // load all games (/api/game)
  const loadAllGames = useCallback(async () => {
    try {
      dispatch({ type: TYPES.FETCH_ALL_GAMES_START });
      const data = await getAllGamesAPI();
      dispatch({ type: TYPES.FETCH_ALL_GAMES_SUCCESS, allGames: data });
    } catch (err) {
      dispatch({ type: TYPES.FETCH_ALL_GAMES_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || "Failed to load games",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  const loadActiveGames = useCallback(async () => {
    try {
      dispatch({ type: TYPES.FETCH_ACTIVE_GAMES_START });
      const data = await getActiveGamesAPI();
      dispatch({ type: TYPES.FETCH_ACTIVE_GAMES_SUCCESS, activeGames: data });
    } catch (err) {
      dispatch({ type: TYPES.FETCH_ACTIVE_GAMES_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || "Failed to load games",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  const loadBidHistoryByUser = useCallback(async (mobileNumber) => {
    try {
      dispatch({ type: TYPES.FETCH_BID_HISTORY_START });
      const data = await getBidHistoryByUserAPI(mobileNumber);
      dispatch({ type: TYPES.FETCH_BID_HISTORY_SUCCESS, bidHistory: data });
    } catch (err) {
      dispatch({ type: TYPES.FETCH_BID_HISTORY_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || "Failed to load bid history",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  // NEW: load game history (/api/game-history)
  const loadGameHistory = useCallback(async () => {
    try {
      dispatch({ type: TYPES.FETCH_GAME_HISTORY_START });
      const data = await getGameHistoryAPI();
      dispatch({ type: TYPES.FETCH_GAME_HISTORY_SUCCESS, gameHistory: data });
    } catch (err) {
      dispatch({ type: TYPES.FETCH_GAME_HISTORY_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || "Failed to load game history",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  const clearGameError = useCallback(() => {
    dispatch({ type: TYPES.CLEAR_ERROR });
  }, []);

  // derived UI list (ACTIVE games)
  const activeGamesUi = useMemo(() => {
    const list = Array.isArray(activeGames) ? activeGames : [];

    // map -> sort by open time (earliest first)
    return list
      .map(toActiveGameUi)
      .sort((a, b) => {
        const ta = time12hToMinutes(a?.openTimeText);
        const tb = time12hToMinutes(b?.openTimeText);
        if (ta !== tb) return ta - tb;

        // tie-breaker: name
        return String(a?.gameName || "").localeCompare(String(b?.gameName || ""));
      });
  }, [activeGames]);

  // (ALL games from /api/game)
  const allGamesUi = useMemo(() => {
    const list = Array.isArray(allGames) ? allGames : [];

    return list
      .map(toGameUi)
      .sort((a, b) => {
        const ta = time12hToMinutes(a?.openTimeText);
        const tb = time12hToMinutes(b?.openTimeText);
        if (ta !== tb) return ta - tb;

        return String(a?.gameName || "").localeCompare(String(b?.gameName || ""));
      });
  }, [allGames]);

  // maps for instant lookup (ACTIVE games)
  const activeGamesRawMap = useMemo(() => {
    const m = new Map();
    (Array.isArray(activeGames) ? activeGames : []).forEach((g) => {
      const name = g?.gameName;
      if (name) m.set(name, g);
    });
    return m;
  }, [activeGames]);

  const activeGamesUiMap = useMemo(() => {
    const m = new Map();
    (Array.isArray(activeGamesUi) ? activeGamesUi : []).forEach((g) => {
      const name = g?.gameName;
      if (name) m.set(name, g);
    });
    return m;
  }, [activeGamesUi]);

  const getGameRawByName = useCallback(
    (gameName) => (gameName ? activeGamesRawMap.get(gameName) || null : null),
    [activeGamesRawMap]
  );

  const getGameUiByName = useCallback(
    (gameName) => (gameName ? activeGamesUiMap.get(gameName) || null : null),
    [activeGamesUiMap]
  );

  // polling (keeps allowed_types fresh)
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // initial fetch (keep existing behavior)
    loadActiveGames?.();

    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        loadActiveGames?.();
      }, 60000); // 60s
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    start();

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev.match(/inactive|background/) && nextState === "active") {
        loadActiveGames?.();
        start();
      } else if (nextState === "background") {
        stop();
      }
    });

    return () => {
      stop();
      sub?.remove?.();
    };
  }, [loadActiveGames]);

  const value = useMemo(
    () => ({
      rates,
      isLoadingRates,

      allGames,
      allGamesUi,
      isLoadingAllGames,

      activeGames,
      activeGamesUi,
      isLoadingActiveGames,

      bidHistory,
      isLoadingBidHistory,

      // NEW
      gameHistory,
      isLoadingGameHistory,

      error,

      getGameRawByName,
      getGameUiByName,

      loadGameRates,
      loadAllGames,
      loadActiveGames,
      loadBidHistoryByUser,
      loadGameHistory, // NEW
      clearGameError,
    }),
    [
      rates,
      isLoadingRates,

      allGames,
      allGamesUi,
      isLoadingAllGames,

      activeGames,
      activeGamesUi,
      isLoadingActiveGames,

      bidHistory,
      isLoadingBidHistory,

      gameHistory,
      isLoadingGameHistory,

      error,

      getGameRawByName,
      getGameUiByName,

      loadGameRates,
      loadAllGames,
      loadActiveGames,
      loadBidHistoryByUser,
      loadGameHistory,
      clearGameError,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};