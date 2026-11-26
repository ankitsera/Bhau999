import React, {
  createContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useContext,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './Themes';

const STORAGE_KEY = 'APP_THEME_MODE'; // "system" | "light" | "dark"

const ThemeContext = createContext({
  themeMode: 'light',
  setThemeMode: _mode => {},
  toggleTheme: () => {},
  isDarkMode: false,
  colors: lightColors,
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [themeMode, setThemeModeState] = useState('light'); // default

  // Load saved preference
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        } else {
          setThemeModeState('light');
        }
      } catch (e) {
        // If storage fails, just fallback to light
        setThemeModeState('light');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // If in system mode, react to system theme changes (optional, but nice)
  useEffect(() => {
    if (themeMode !== 'system') return;

    const sub = Appearance.addChangeListener(() => {
      // no-op needed here because useColorScheme() already updates,
      // but keeping this ensures immediate reaction on some devices.
    });

    return () => sub.remove();
  }, [themeMode]);

  const resolvedScheme =
    themeMode === 'system' ? systemScheme || 'light' : themeMode;
  const isDarkMode = resolvedScheme === 'dark';

  const colors = useMemo(
    () => (isDarkMode ? darkColors : lightColors),
    [isDarkMode],
  );

  const setThemeMode = useCallback(async mode => {
    const next =
      mode === 'light' || mode === 'dark' || mode === 'system'
        ? mode
        : 'system';
    setThemeModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // ignore write errors
    }
  }, []);

  // Toggle only between light <-> dark, but if currently system, toggle based on system
  const toggleTheme = useCallback(() => {
    if (themeMode === 'system') {
      const next = (systemScheme || 'light') === 'dark' ? 'light' : 'dark';
      setThemeMode(next);
      return;
    }
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, systemScheme, setThemeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      toggleTheme,
      isDarkMode,
      colors,
    }),
    [themeMode, setThemeMode, toggleTheme, isDarkMode, colors],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
