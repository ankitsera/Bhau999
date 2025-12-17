// context/GameContext.js
import React, {
  createContext,
  useMemo,
  useReducer,
  useCallback,
} from "react";
import Snackbar from "react-native-snackbar";
import { getGameRates as getGameRatesAPI } from "../utils/GameService";

const initialState = {
  rates: [],
  isLoadingRates: false,
  error: null,
};

const TYPES = {
  FETCH_RATES_START: "FETCH_RATES_START",
  FETCH_RATES_SUCCESS: "FETCH_RATES_SUCCESS",
  FETCH_RATES_FAILURE: "FETCH_RATES_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
};

function gameReducer(state, action) {
  switch (action.type) {
    case TYPES.FETCH_RATES_START:
      return {
        ...state,
        isLoadingRates: true,
        error: null,
      };

    case TYPES.FETCH_RATES_SUCCESS:
      return {
        ...state,
        isLoadingRates: false,
        rates: action.rates || [],
        error: null,
      };

    case TYPES.FETCH_RATES_FAILURE:
      return {
        ...state,
        isLoadingRates: false,
        error: action.error || null,
      };

    case TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

export const GameContext = createContext({
  ...initialState,
  loadGameRates: () => {},
  clearGameError: () => {},
});

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { rates, isLoadingRates, error } = state;

  const loadGameRates = useCallback(async () => {
    try {
      dispatch({ type: TYPES.FETCH_RATES_START });

      const data = await getGameRatesAPI();

      dispatch({
        type: TYPES.FETCH_RATES_SUCCESS,
        rates: data,
      });
    } catch (err) {
      dispatch({
        type: TYPES.FETCH_RATES_FAILURE,
        error: err,
      });

      Snackbar.show({
        text: err?.message || "Failed to load game rates",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
    }
  }, []);

  const clearGameError = useCallback(() => {
    dispatch({ type: TYPES.CLEAR_ERROR });
  }, []);

  const value = useMemo(
    () => ({
      rates,
      isLoadingRates,
      error,
      loadGameRates,
      clearGameError,
    }),
    [rates, isLoadingRates, error, loadGameRates, clearGameError]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};