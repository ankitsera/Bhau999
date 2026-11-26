import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Animates a number from its previous value to `value`.
function useCountUp(value, duration = 900) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      shown.current = target;
      setDisplay(target);
      return undefined;
    }

    let frame;
    const from = shown.current;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const raw = from + (target - from) * eased;
      const next = Number.isInteger(target) ? Math.round(raw) : Math.round(raw * 100) / 100;
      shown.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

export default function AppWidgetSummary({
  title,
  total,
  icon,
  color = 'primary',
  sx,
  onClick,
  ...other
}) {
  const theme = useTheme();
  const tone = theme.palette[color] || theme.palette.primary;
  const count = useCountUp(total);
  const clickable = Boolean(onClick);

  return (
    <Card
      component={Stack}
      spacing={2.5}
      direction="row"
      alignItems="center"
      onClick={onClick}
      sx={{
        px: 3,
        py: 4,
        height: 1,
        borderRadius: 2,
        overflow: 'hidden',
        // Accent strip along the top, slides in on hover.
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          height: 3,
          width: 1,
          bgcolor: tone.main,
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: theme.transitions.create('transform', { duration: 350 }),
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 16px 32px -8px ${alpha(tone.main, 0.28)}`,
          '&::after': { transform: 'scaleX(1)' },
          '& .widget-icon': { transform: 'scale(1.08) rotate(-4deg)' },
        },
        ...(clickable && { cursor: 'pointer' }),
        ...sx,
      }}
      {...other}
    >
      {icon && (
        <Box
          className="widget-icon"
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            color: tone.main,
            bgcolor: alpha(tone.main, 0.12),
            transition: theme.transitions.create('transform', { duration: 300 }),
            '& svg': { width: 30, height: 30 },
          }}
        >
          {icon}
        </Box>
      )}

      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          sx={{ color: 'secondary.main', fontVariantNumeric: 'tabular-nums' }}
        >
          {count.toLocaleString()}
        </Typography>

        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </Stack>
    </Card>
  );
}

AppWidgetSummary.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  onClick: PropTypes.func,
  sx: PropTypes.object,
  title: PropTypes.string,
  total: PropTypes.number,
};
