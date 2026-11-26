import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ListItemButton from '@mui/material/ListItemButton';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuth } from 'src/contexts/AuthContext';
import { fadeUp, EASE_OUT, growBarKf, staggerChildren } from 'src/theme/motion';

import Logo from 'src/components/logo';
import Scrollbar from 'src/components/scrollbar';

import { NAV } from './config-layout';
import navConfig from './config-navigation';

// ----------------------------------------------------------------------

export default function Nav({ openNav, onCloseNav }) {
  const pathname = usePathname();
  const { username } = useAuth();

  const upLg = useResponsive('up', 'lg');

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderAccount = (
    <Box
      sx={{
        my: 3,
        mx: 2.5,
        py: 2,
        px: 2,
        display: 'flex',
        borderRadius: 2,
        alignItems: 'center',
        color: 'common.white',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: (theme) => theme.customShadows.primary,
        ...fadeUp(80),
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'common.white',
          color: 'primary.dark',
          fontWeight: 'fontWeightBold',
        }}
      >
        {(username || 'A').charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ ml: 1.5, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {username || 'Admin'}
        </Typography>

        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          Administrator
        </Typography>
      </Box>
    </Box>
  );

  const renderMenu = (
    <Stack
      component="nav"
      spacing={0.5}
      sx={{ px: 2, ...staggerChildren({ base: 140, step: 40 }) }}
    >
      {navConfig.map((item) => (
        <NavItem key={item.title} item={item} />
      ))}
    </Stack>
  );

  const renderUpgrade = (
    <Box sx={{ px: 2.5, pb: 3, mt: 10 }}>
      {/* <Stack alignItems="center" spacing={3} sx={{ pt: 5, borderRadius: 2, position: 'relative' }}>
        <Box
          component="img"
          src="/assets/illustrations/illustration_avatar.png"
          sx={{ width: 100, position: 'absolute', top: -50 }}
        />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">Get more?</Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            From only $69
          </Typography>
        </Box>

        <Button
          href="https://material-ui.com/store/items/minimal-dashboard/"
          target="_blank"
          variant="contained"
          color="inherit"
        >
          Upgrade to Pro
        </Button>
      </Stack> */}
    </Box>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Logo sx={{ mt: 3, ml: 4, ...fadeUp(0) }} />

      {renderAccount}

      {renderMenu}

      <Box sx={{ flexGrow: 1 }} />

      {renderUpgrade}
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.WIDTH },
      }}
    >
      {upLg ? (
        <Box
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.WIDTH,
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Box>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.WIDTH,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};

// ----------------------------------------------------------------------

// Shared look for top-level and nested menu items.
const itemSx = (active, { minHeight = 44 } = {}) => ({
  position: 'relative',
  minHeight,
  borderRadius: 1,
  typography: 'body2',
  color: 'text.secondary',
  textTransform: 'capitalize',
  fontWeight: 'fontWeightMedium',
  transition: (theme) =>
    theme.transitions.create(['background-color', 'color', 'padding-left'], {
      duration: theme.transitions.duration.shorter,
    }),
  '& .nav-icon': {
    transition: (theme) =>
      theme.transitions.create(['transform', 'color'], {
        duration: theme.transitions.duration.shorter,
      }),
  },
  '&:hover': {
    color: 'secondary.main',
    pl: 2.5,
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
    '& .nav-icon': { transform: 'scale(1.12)', color: 'primary.main' },
  },
  ...(active && {
    color: 'primary.dark',
    fontWeight: 'fontWeightSemiBold',
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
    '& .nav-icon': { color: 'primary.main' },
    '&:hover': {
      pl: 2.5,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
    },
    // Green indicator bar, grows in when the item becomes active.
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 4,
      borderRadius: 4,
      bgcolor: 'primary.main',
      transformOrigin: 'center',
      animation: `${growBarKf} 320ms ${EASE_OUT}`,
    },
  }),
});

function NavItem({ item }) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const childActive = hasChildren && item.children.some((child) => child.path === pathname);
  const [open, setOpen] = useState(childActive);

  const active = item.path === pathname;

  if (hasChildren) {
    return (
      <>
        <ListItemButton
          onClick={() => setOpen(!open)}
          sx={{
            ...itemSx(false),
            ...(childActive && {
              color: 'primary.dark',
              fontWeight: 'fontWeightSemiBold',
              '& .nav-icon': { color: 'primary.main' },
            }),
          }}
        >
          <Box
            component="span"
            className="nav-icon"
            sx={{ width: 22, height: 22, mr: 2, display: 'flex' }}
          >
            {item.icon}
          </Box>
          <Box component="span" sx={{ flexGrow: 1 }}>
            {item.title}
          </Box>
          <ExpandMore
            fontSize="small"
            sx={{
              transition: (theme) => theme.transitions.create('transform'),
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Stack sx={{ pl: 4, pt: 0.5 }} spacing={0.5}>
            {item.children.map((child) => (
              <ListItemButton
                key={child.title}
                component={RouterLink}
                href={child.path}
                sx={itemSx(child.path === pathname, { minHeight: 40 })}
              >
                <Box component="span">{child.title}</Box>
              </ListItemButton>
            ))}
          </Stack>
        </Collapse>
      </>
    );
  }

  return (
    <ListItemButton component={RouterLink} href={item.path} sx={itemSx(active)}>
      <Box
        component="span"
        className="nav-icon"
        sx={{ width: 22, height: 22, mr: 2, display: 'flex' }}
      >
        {item.icon}
      </Box>

      <Box component="span">{item.title}</Box>
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
};
