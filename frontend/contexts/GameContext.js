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
} from "../utils/GameService";

const GREEN = "#3FA16C";
const RED = "#EF4B3E";

const initialState = {
  // rates
  rates: [],
  isLoadingRates: false,

  // active games (raw)
  activeGames: [],
  isLoadingActiveGames: false,

  // common
  error: null,
};

const TYPES = {
  // rates
  FETCH_RATES_START: "FETCH_RATES_START",
  FETCH_RATES_SUCCESS: "FETCH_RATES_SUCCESS",
  FETCH_RATES_FAILURE: "FETCH_RATES_FAILURE",

  // active games
  FETCH_ACTIVE_GAMES_START: "FETCH_ACTIVE_GAMES_START",
  FETCH_ACTIVE_GAMES_SUCCESS: "FETCH_ACTIVE_GAMES_SUCCESS",
  FETCH_ACTIVE_GAMES_FAILURE: "FETCH_ACTIVE_GAMES_FAILURE",

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
      return { ...state, isLoadingActiveGames: false, error: action.error || null };

    // COMMON
    case TYPES.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}

// -------- helpers (UI transformation) --------
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

const toActiveGameUi = (g) => {
  const allowed = Array.isArray(g?.allowed_types) ? g.allowed_types : [];
  const len = allowed.length;

  const isClosed = len === 0;
  const statusText = isClosed
    ? "Closed for today"
    : len === 1
    ? "Close is Running"
    : "Bet is Running";

  const statusColor = isClosed ? RED : GREEN;
  const iconName = isClosed ? "close" : "play";

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
    iconName,
  };
};

export const GameContext = createContext({
  ...initialState,

  // derived UI data
  activeGamesUi: [],

  // selectors (better way)
  getGameRawByName: () => null,
  getGameUiByName: () => null,

  // actions
  loadGameRates: async () => {},
  loadActiveGames: async () => {},
  clearGameError: () => {},
});

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { rates, isLoadingRates, activeGames, isLoadingActiveGames, error } = state;

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

  const clearGameError = useCallback(() => {
    dispatch({ type: TYPES.CLEAR_ERROR });
  }, []);

  // ✅ derived UI list
  const activeGamesUi = useMemo(() => {
    const list = Array.isArray(activeGames) ? activeGames : [];
    return list.map(toActiveGameUi);
  }, [activeGames]);

  // ✅ maps for instant lookup (this enables the "better way")
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

  // ✅ polling (keeps allowed_types fresh)
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // initial fetch
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

      activeGames,
      activeGamesUi,
      isLoadingActiveGames,

      error,

      getGameRawByName,
      getGameUiByName,

      loadGameRates,
      loadActiveGames,
      clearGameError,
    }),
    [
      rates,
      isLoadingRates,
      activeGames,
      activeGamesUi,
      isLoadingActiveGames,
      error,
      getGameRawByName,
      getGameUiByName,
      loadGameRates,
      loadActiveGames,
      clearGameError,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};