import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Fab from '@mui/material/Fab';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

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
        boxShadow: theme.shadows[8],
      }}
    >
      <HomeRoundedIcon />
    </Fab>
  );
}
