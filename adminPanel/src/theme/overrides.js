import { alpha } from '@mui/material/styles';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';

// ----------------------------------------------------------------------

export function overrides(theme) {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          maxWidth: '100%',
          display: 'inline-block',
          verticalAlign: 'bottom',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(theme.palette.grey[900], 0.8),
        },
        invisible: {
          background: 'transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: Number(theme.shape.borderRadius) * 1.25,
          fontWeight: theme.typography.fontWeightSemiBold,
          transition: theme.transitions.create(
            ['transform', 'box-shadow', 'background-color', 'border-color', 'color'],
            { duration: theme.transitions.duration.shorter }
          ),
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          boxShadow: theme.customShadows.primary,
          '&:hover': {
            boxShadow: `0 10px 20px 0 ${alpha(theme.palette.primary.main, 0.32)}`,
            transform: 'translateY(-1px)',
          },
        },
        containedInherit: {
          // Matches the app's dark "Continue" button.
          color: theme.palette.common.white,
          backgroundColor: '#333333',
          '&:hover': {
            color: theme.palette.common.white,
            backgroundColor: '#222222',
            transform: 'translateY(-1px)',
            boxShadow: `0 10px 20px 0 ${alpha(theme.palette.common.black, 0.18)}`,
          },
        },
        outlined: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          minHeight: 48,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: theme.customShadows.card,
          borderRadius: Number(theme.shape.borderRadius) * 2,
          position: 'relative',
          zIndex: 0, // Fix Safari overflow: hidden with border radius
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: { variant: 'h6' },
        subheaderTypographyProps: { variant: 'body2' },
      },
      styleOverrides: {
        root: {
          padding: theme.spacing(3, 3, 0),
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          [`& .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: alpha(theme.palette.grey[500], 0.24),
            transition: theme.transitions.create(['border-color', 'box-shadow'], {
              duration: theme.transitions.duration.shorter,
            }),
          },
          [`&.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
          }),
          '&.MuiTableRow-hover:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: theme.palette.secondary.main,
          fontWeight: theme.typography.fontWeightSemiBold,
          backgroundColor: theme.palette.primary.lighter,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: theme.palette.grey[800],
        },
        arrow: {
          color: theme.palette.grey[800],
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        paragraph: {
          marginBottom: theme.spacing(2),
        },
        gutterBottom: {
          marginBottom: theme.spacing(1),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...theme.typography.body2,
        },
      },
    },
  };
}
