import { useNavigate } from 'react-router-dom';

import Fab from '@mui/material/Fab';
import { useTheme } from '@mui/material/styles';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

import { pulseRingKf } from 'src/theme/motion';

export default function HomeButton() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Fab
      color="primary"
      aria-label="Go to home"
      onClick={() => navigate('/dashboard')}
      sx={{
        position: 'fixed',
        bottom: { xs: 24, md: 32 },
        right: { xs: 20, md: 32 },
        zIndex: theme.zIndex.appBar + 1,
        boxShadow: theme.customShadows.primary,
        animation: `${pulseRingKf} 2s ease-out 1.2s 2`,
      }}
    >
      <HomeRoundedIcon />
    </Fab>
  );
}
