import { StyleSheet } from 'react-native';

// Global Theme Colors
export const ThemeColor = '#b07312';
export const ThemeColorTile = '#ca9034';
export const ThemeIconBg = '#f2ede5';

// Light Mode Colors Palette
export const lightColors = {
  primary: '#b07312',
  primaryTile: '#ca9034',
  primaryIconBg: '#f2ede5',
  background: '#ffffff',
  surface: '#f8f8f8',
  text: '#000000',
  textSecondary: '#333333',
  textTertiary: '#666666',
  border: '#e0e0e0',
  divider: '#d6d6d6',
  error: '#EF4B3E',
  warning: '#ff9800',
  success: '#4caf50',
  infoText: '#0d0d0d',
  switchTrackOff: '#c0c0c0',
  switchThumbOff: '#ffffff',
};

// Dark Mode Colors Palette
export const darkColors = {
  primary: '#b07312',
  primaryTile: '#ca9034',
  primaryIconBg: '#3a2f1f',
  background: '#0a0a0a',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  border: '#333333',
  divider: '#2a2a2a',
  error: '#EF4B3E',
  warning: '#ff9800',
  success: '#4caf50',
  infoText: '#e0e0e0',
  switchTrackOff: '#717171',
  switchThumbOff: '#f1f1f1',
};

export const lightTheme = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#000000',
  },
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#ffffff',
  },
  bg:{
    backgroundColor:'#ffffff',
  },
});

export const darkTheme = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#000000',
  },
  bg:{
    backgroundColor:'#000000',
  },
});
