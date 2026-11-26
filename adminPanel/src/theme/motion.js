import { keyframes } from '@emotion/react';

// ----------------------------------------------------------------------
// Shared motion for the admin panel. Users with "reduce motion" turned on
// get these switched off by the rule in src/global.css.

export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const fadeUpKf = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const fadeInKf = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

export const scaleInKf = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

export const floatKf = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;

export const driftKf = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(40px, -30px) scale(1.08); }
  66%  { transform: translate(-30px, 20px) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
`;

export const pulseRingKf = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(35, 178, 109, 0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(35, 178, 109, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 178, 109, 0); }
`;

export const growBarKf = keyframes`
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
`;

/** Fade + slide up once, optionally delayed (ms). */
export function fadeUp(delay = 0, duration = 500) {
  return {
    animation: `${fadeUpKf} ${duration}ms ${EASE_OUT} ${delay}ms backwards`,
  };
}

/** Stagger the direct children of a container (e.g. a Grid of cards). */
export function staggerChildren({ count = 16, step = 55, base = 60, duration = 520 } = {}) {
  const sx = {
    '& > *': {
      animation: `${scaleInKf} ${duration}ms ${EASE_OUT} backwards`,
    },
  };
  for (let i = 1; i <= count; i += 1) {
    sx[`& > *:nth-of-type(${i})`] = { animationDelay: `${base + (i - 1) * step}ms` };
  }
  return sx;
}
