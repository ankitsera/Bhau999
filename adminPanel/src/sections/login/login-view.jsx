import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
// import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { API_URL } from 'src/variables';
import { getToken, saveToken } from 'src/helper';
import { useAuth } from 'src/contexts/AuthContext';
import { fadeUp, floatKf, driftKf, EASE_OUT, scaleInKf } from 'src/theme/motion';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
// ----------------------------------------------------------------------

export default function LoginView() {
  const theme = useTheme();
  const { saveUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const verifyToken = useCallback(() => {
    if (getToken() != null) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleClick = async () => {
    const user = username.trim();
    const pass = password.trim();
    if (user === '' || pass === '') {
      alert('please enter both username and password');
      return;
    }
    try {
      const res = await fetch(`${API_URL}users/admin-login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const resBack = await res.json();
      if (res.status === 401) {
        alert('invalid credential');
      } else if (res.status === 200) {
        saveToken(resBack.token);
        saveUsername(user);
        verifyToken();
      } else {
        alert('something went wrong');
      }
    } catch (err) {
      alert('something went wrong');
    }
  };

  useEffect(() => {
    verifyToken();
  }, [router, verifyToken]);

  const renderForm = (
    <>
      <Stack spacing={3}>
        <TextField name="Username" label="Username" onChange={(e) => setUsername(e.target.value)} />

        <TextField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ my: 3 }}>
        <Link variant="subtitle2" underline="hover">
          Forgot password?
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        color="inherit"
        onClick={handleClick}
      >
        Login
      </LoadingButton>
    </>
  );

  const blob = (size, color, position, delay) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    bgcolor: color,
    filter: 'blur(60px)',
    opacity: 0.8,
    ...position,
    animation: `${driftKf} 18s ease-in-out ${delay}s infinite`,
  });

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: 1,
        bgcolor: 'background.default',
      }}
    >
      {/* Soft drifting brand-colored background */}
      <Box sx={blob(420, alpha(theme.palette.primary.main, 0.35), { top: -120, left: -100 }, 0)} />
      <Box
        sx={blob(360, alpha(theme.palette.primary.light, 0.4), { bottom: -120, right: -80 }, -6)}
      />
      <Box
        sx={blob(240, alpha(theme.palette.warning.light, 0.35), { top: '55%', left: '12%' }, -12)}
      />

      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ position: 'relative', height: 1, px: 2 }}
      >
        <Card
          sx={{
            p: { xs: 3, sm: 5 },
            width: 1,
            maxWidth: 440,
            borderRadius: 3,
            boxShadow: `0 24px 60px -12px ${alpha(theme.palette.secondary.main, 0.18)}`,
            animation: `${scaleInKf} 600ms ${EASE_OUT} backwards`,
          }}
        >
          <Stack alignItems="center" sx={{ mb: 3 }}>
            <Logo
              disabledLink
              sx={{
                width: 180,
                height: 60,
                objectPosition: 'center',
                animation: `${floatKf} 4s ease-in-out 700ms infinite`,
              }}
            />
          </Stack>

          <Typography variant="h4" align="center" sx={{ color: 'secondary.main', ...fadeUp(150) }}>
            Welcome back 💚
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{ color: 'text.secondary', mt: 1, ...fadeUp(220) }}
          >
            Sign in to the Bhau999 admin dashboard
          </Typography>

          <Divider sx={{ my: 3, ...fadeUp(280) }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Login
            </Typography>
          </Divider>

          <Box sx={fadeUp(340)}>{renderForm}</Box>
        </Card>
      </Stack>
    </Box>
  );
}
