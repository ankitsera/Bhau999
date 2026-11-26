import { StyleSheet } from 'react-native';

// Global Theme Colors
export const ThemeColor = '#23B26D';
export const ThemeColorTile = '#D4EDE0';
export const ThemeIconBg = '#E3F5EC';

// Text size scale used across the app. Pick by role, not by look:
// display = screen hero title, h1-h3 = headings, title = card/section titles,
// body = normal text, label = secondary text, caption = hints and meta.
export const FONT = {
  display: 24,
  h1: 22,
  h2: 20,
  h3: 18,
  title: 16,
  subtitle: 15,
  body: 14,
  label: 13,
  caption: 12,
};

// Light Mode Colors Palette
export const lightColors = {
  primary: '#23B26D',
  primaryDark: '#1A8F56',
  primaryTile: '#D4EDE0',
  primaryIconBg: '#E3F5EC',
  onPrimary: '#FFFFFF',
  dark: '#333333',
  onDark: '#FFFFFF',
  heading: '#2A1B3D',
  card: '#FFFFFF',
  cardBorder: '#E2E2E2',
  closed: '#D32F2F',
  background: '#F7F7F7',
  surface: '#FFFFFF',
  text: '#111111',
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
  primary: '#23B26D',
  primaryDark: '#1A8F56',
  primaryTile: '#17382A',
  primaryIconBg: '#0F2A1D',
  onPrimary: '#FFFFFF',
  dark: '#2E2E2E',
  onDark: '#FFFFFF',
  heading: '#FFFFFF',
  card: '#1A1A1A',
  cardBorder: '#333333',
  closed: '#EF5350',
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
    backgroundColor: '#23B26D',
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
    backgroundColor: '#23B26D',
    color: '#ffffff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#ffffff',
  },
  bg:{
    backgroundColor:'#000000',
  },
});
