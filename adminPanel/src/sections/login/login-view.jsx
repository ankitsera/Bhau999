import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { bgGradient } from 'src/theme/css';
import { useAuth } from 'src/contexts/AuthContext';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
// ----------------------------------------------------------------------

export default function LoginView() {
  const theme = useTheme();
  const { saveUsername } = useAuth();
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const verifyToken = () => {
        const token = getToken()
        if (token != null) {
            navigate("/dashboard")
        }
  }

  const handleClick = async() => {
    if (username == "" || password == "") {
        alert("please enter both username and password")
    }
    try {
        let data = {
                    "username": username.trim(),
                    "password": password.trim(),
                }
        let res = await fetch(`${API_URL}users/admin-login`,{
                "method": "POST",
                "headers": {
                    "content-type": "application/json"
                },
                "body": JSON.stringify(data)
            })
        let res_back = await res.json()
        if (res.status == 401){
          alert("invalid credential")
          return;
        } else if (res.status == 200){
          saveToken(res_back.token)
          saveUsername(username.trim())
          verifyToken()
        } else {
          alert("something went wrong")
          return ;
        }
    } catch(err) {
        alert("something went wrong")
    }
};

    useEffect(() => {
       verifyToken()
    }, [router])
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

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.background.default, 0.9),
          imgUrl: '/assets/background/overlay_4.jpg',
        }),
        height: 1,
      }}
    >
      <Logo
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
        }}
      />

      <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        <Card
          sx={{
            p: 5,
            width: 1,
            maxWidth: 420,
          }}
        >
          <Typography variant="h4">SignIn To Admin DashBoard</Typography>

                    {/* <Stack direction="row" spacing={2}>
                      <Button
                        fullWidth
                        size="large"
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: alpha(theme.palette.grey[500], 0.16) }}
                      >
                        <Iconify icon="eva:google-fill" color="#DF3E30" />
                      </Button>

                      <Button
                        fullWidth
                        size="large"
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: alpha(theme.palette.grey[500], 0.16) }}
                      >
                        <Iconify icon="eva:facebook-fill" color="#1877F2" />
                      </Button>

                      <Button
                        fullWidth
                        size="large"
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: alpha(theme.palette.grey[500], 0.16) }}
                      >
                        <Iconify icon="eva:twitter-fill" color="#1C9CEA" />
                      </Button>
                    </Stack> */}

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Login
            </Typography>
          </Divider>

          {renderForm}
        </Card>
      </Stack>
    </Box>
  );
}
