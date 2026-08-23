import PropTypes from 'prop-types';

import {Box, TextField} from '@mui/material';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { useResponsive } from 'src/hooks/use-responsive';

import { bgBlur } from 'src/theme/css';

import Iconify from 'src/components/iconify';
import {Button} from '@mui/material';

import Searchbar from './common/searchbar';
import { NAV, HEADER } from './config-layout';
import AccountPopover from './common/account-popover';
import LanguagePopover from './common/language-popover';
import NotificationsPopover from './common/notifications-popover';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useState } from 'react';
import { API_URL } from 'src/variables';
import { getToken } from 'src/helper';
import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  // border: '2px solid #000',
  borderRadius: '6px',
  padding: "6px",
  boxShadow: 24,
  p: 4,
};
export default function Header({ onOpenNav }) {
  const navigate = useNavigate()
  const theme = useTheme();
  const { username, clearUsername } = useAuth();
  
  const handleLogout = () => {
    window.localStorage.clear()
    clearUsername()
    navigate("/")
  }
  const [newPass, setNewPass] = useState("")
  const handleChangePass = async() => {
    if (newPass.trim() == ""){
      alert("password should not be empty")
      return;
    }
    
    if (!username) {
      alert("Username not found. Please login again.");
      return;
    }
    
    try {
      let res = await fetch(`${API_URL}users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          username: username,
          password: newPass
        })
      })
      let data = await res.json()
      
      if (data.message && data.message.toLowerCase().includes("saved")) {
        alert("Password changed successfully")
        setNewPass("")
        setOpen(false)
      } else {
        alert(data.message || "Failed to change password")
      }
    } catch (error) {
      console.error(error);
      alert("Error changing password. Please try again.")
    }
  }
  const lgUp = useResponsive('up', 'lg');
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const renderContent = (
    <>
      {!lgUp && (
        <IconButton onClick={onOpenNav} sx={{ mr: 1 }}>
          <Iconify icon="eva:menu-2-fill" />
        </IconButton>
      )}

      {/* <Searchbar /> */}

      <Box sx={{ flexGrow: 1 }} />

      <Stack direction="row" alignItems="center" spacing={1}>
        {/* <LanguagePopover /> */}
        {/* <NotificationsPopover /> */}
        {/* <AccountPopover /> */}
        <Button variant='outlined' onClick={handleOpen}>Change Password</Button>
        <Button variant='outlined' color='error' onClick={handleLogout}>Logout</Button>
        <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Stack direction='column' spacing={4}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Change Password
          </Typography>
          <TextField label='New Password' variant='outlined' value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <Button variant='outlined' color='success' onClick={handleChangePass} >Change Password</Button>
          </Stack>
        </Box>
      </Modal>
    </div>

      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        boxShadow: 'none',
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        transition: theme.transitions.create(['height'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(lgUp && {
          width: `calc(100% - ${NAV.WIDTH + 1}px)`,
          height: HEADER.H_DESKTOP,
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
};
