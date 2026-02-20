import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { lightColors, darkColors } from './Themes';

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => {},
    colors: lightColors,
  });

export const ThemeProvider = ({ children }) => {
const systemColorScheme = useColorScheme();
const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    setIsDarkMode(colorScheme === 'dark');
    });

    return () => subscription.remove();
}, []);

const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
};

const colors = isDarkMode ? darkColors : lightColors;

return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
    {children}
    </ThemeContext.Provider>
);
};

export const useTheme = () => useContext(ThemeContext);
