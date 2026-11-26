import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------

// SETUP COLORS

export const grey = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
};

// Bhau999 brand green (same as the app's ThemeColor).
export const primary = {
  lighter: '#D4EDE0',
  light: '#5CCB95',
  main: '#23B26D',
  dark: '#1A8F56',
  darker: '#0E5C37',
  contrastText: '#FFFFFF',
};

// Bhau999 heading purple.
export const secondary = {
  lighter: '#E4DDF0',
  light: '#6B5A85',
  main: '#2A1B3D',
  dark: '#1E1330',
  darker: '#120B1D',
  contrastText: '#FFFFFF',
};

export const info = {
  lighter: '#D9E8FC',
  light: '#7AB0F5',
  main: '#2F80ED',
  dark: '#1A5DB8',
  darker: '#0D3878',
  contrastText: '#FFFFFF',
};

export const success = {
  lighter: '#E3F5EC',
  light: '#6FD39F',
  main: '#1FA463',
  dark: '#147A48',
  darker: '#0B4D2D',
  contrastText: '#FFFFFF',
};

export const warning = {
  lighter: '#FFF3DC',
  light: '#FFD36E',
  main: '#F2A93B',
  dark: '#B7741A',
  darker: '#7A4A0B',
  contrastText: grey[800],
};

export const error = {
  lighter: '#FDE4E2',
  light: '#F7928A',
  main: '#EF4B3E',
  dark: '#B72A20',
  darker: '#7A140E',
  contrastText: '#FFFFFF',
};

export const common = {
  black: '#000000',
  white: '#FFFFFF',
};

export const action = {
  hover: alpha(grey[500], 0.08),
  selected: alpha(grey[500], 0.16),
  disabled: alpha(grey[500], 0.8),
  disabledBackground: alpha(grey[500], 0.24),
  focus: alpha(grey[500], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

const base = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: alpha(grey[500], 0.2),
  action,
};

// ----------------------------------------------------------------------

export function palette() {
  return {
    ...base,
    mode: 'light',
    text: {
      primary: secondary.main,
      secondary: grey[600],
      disabled: grey[500],
    },
    background: {
      paper: '#FFFFFF',
      default: '#F7F7F7',
      neutral: grey[200],
    },
    action: {
      ...base.action,
      active: grey[600],
    },
  };
}
