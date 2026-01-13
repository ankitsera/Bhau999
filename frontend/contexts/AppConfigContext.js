import React, {
  createContext,
  useMemo,
  useReducer,
  useCallback,
} from "react";
import Snackbar from "react-native-snackbar";
import { fetchConfigValue } from "../utils/AppConfigService";

const initialState = {
  values: {},
  isLoading: false,
  error: null,
};

const TYPES = {
  FETCH_START: "FETCH_START",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_FAILURE: "FETCH_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
};

function configReducer(state, action) {
  switch (action.type) {
    case TYPES.FETCH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case TYPES.FETCH_SUCCESS: {
      const { key, value } = action;
      return {
        ...state,
        isLoading: false,
        error: null,
        values: {
          ...state.values,
          [key]: value,
        },
      };
    }

    case TYPES.FETCH_FAILURE:
      return {
        ...state,
        isLoading: false,
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

export const AppConfigContext = createContext({
  ...initialState,
  loadConfigValue: async () => {},
  getConfigValue: () => undefined,
  clearConfigError: () => {},
});

export const AppConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const { values, isLoading, error } = state;

  /**
   * loadConfigValue(key, options?)
   * options supports:
   *  - forceRefresh?: boolean
   *  - defaultValue?: any
   */
  const loadConfigValue = useCallback(async (key, options = {}) => {
    try {
      dispatch({ type: TYPES.FETCH_START });
      const value = await fetchConfigValue(key, options);
      dispatch({ type: TYPES.FETCH_SUCCESS, key, value });
      return value; // helpful for callers
    } catch (err) {
      dispatch({ type: TYPES.FETCH_FAILURE, error: err });
      Snackbar.show({
        text: err?.message || `Failed to load config for "${key}"`,
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#d32f2f",
      });
      throw err;
    }
  }, []);

  const getConfigValue = useCallback(
    (key) => {
      return values?.[key];
    },
    [values]
  );

  const clearConfigError = useCallback(() => {
    dispatch({ type: TYPES.CLEAR_ERROR });
  }, []);

  const value = useMemo(
    () => ({
      values,
      isLoading,
      error,
      loadConfigValue,
      getConfigValue,
      clearConfigError,
    }),
    [values, isLoading, error, loadConfigValue, getConfigValue, clearConfigError]
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};