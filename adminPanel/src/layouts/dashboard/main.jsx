import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { fadeUp } from 'src/theme/motion';

import { NAV, HEADER } from './config-layout';

// ----------------------------------------------------------------------

const SPACING = 8;

export default function Main({ children, sx, ...other }) {
  const lgUp = useResponsive('up', 'lg');
  const pathname = usePathname();

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        flexDirection: 'column',
        py: `${HEADER.H_MOBILE + SPACING}px`,
        ...(lgUp && {
          px: 2,
          py: `${HEADER.H_DESKTOP + SPACING}px`,
          width: `calc(100% - ${NAV.WIDTH}px)`,
        }),
        ...sx,
      }}
      {...other}
    >
      {/* Re-keyed per route so every page fades in. */}
      <Box
        key={pathname}
        sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, ...fadeUp(0, 450) }}
      >
        {children}
      </Box>
    </Box>
  );
}

Main.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
