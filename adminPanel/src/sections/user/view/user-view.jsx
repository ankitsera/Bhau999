import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Stack,
  Button,
  Container,
  Table,
  Typography,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  TableFooter,
  TablePagination,
  OutlinedInput,
  InputLabel,
  Dialog,
  ListItemText,
  ListItemButton,
  List,
  TextField,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
  Link,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons"
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { useUsers } from 'src/contexts/UserContext';
import { userService, transactionService } from 'src/services';
import dayjs from 'dayjs';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
// ----------------------------------------------------------------------
function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <Button
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        variant="outlined"
      >
        Prev
      </Button>
      <Button
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        variant="outlined"
      >
        Next
      </Button>
    </Box>
  );
}

export default function UserPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { users: contextUsers, loading: usersLoading, error: usersError, refetch } = useUsers();
  const [userData, setUserData] = useState([]);
  const [userDataCopy, setUserDataCopy] = useState([]);
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [searchVal, setSearchVal] = useState(location.state?.searchMobile || '');
  const [singleUserInfo, setSingleUserInfo] = useState({});
  const [userFund, setUserFund] = useState([]);
  const [userWithdraw, setUserWithdraw] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [winHistory, setWinHistory] = useState([]);
  const [userpage, setuserPage] = React.useState(0);
  const [userrowsPerPage, setuserRowsPerPage] = React.useState(10);
  const [pass, setPass] = useState("");
  const [fundpage, setFundPage] = React.useState(0);
  const [fundrowsPerPage, setFundRowsPerPage] = React.useState(10);
  const [withdrawpage, setWithdrawPage] = React.useState(0);
  const [withdrawrowsPerPage, setWithdrawRowsPerPage] = React.useState(10);
  const [bidpage, setBidPage] = React.useState(0);
  const [bidrowsPerPage, setBidRowsPerPage] = React.useState(10);
  const [winpage, setWinPage] = React.useState(0);
  const [winrowsPerPage, setWinRowsPerPage] = React.useState(10);
  const [userWalletPoints, setUserWalletPoints] = useState(0);
  const getInitialSelectedDate = () => {
    const savedDate = sessionStorage.getItem('user-list-date');
    if (savedDate === 'null') return null;
    if (savedDate) return dayjs(savedDate);
    return dayjs();
  };
  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate());
  const [createdAtSortOrder, setCreatedAtSortOrder] = useState('desc'); // 'desc' = latest first, 'asc' = oldest first
  /** null = sort by created date only; 'asc' | 'desc' = primary sort by balance, then by created date */
  const [balanceSortOrder, setBalanceSortOrder] = useState(null);
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRowsUser = userpage > 0 ? Math.max(0, (1 + userpage) * userrowsPerPage - userData.length) : 0;
  const emptyRowsFund = fundpage > 0 ? Math.max(0, (1 + fundpage) * fundrowsPerPage - userFund.length) : 0;
  const emptyRowsWithdraw = withdrawpage > 0 ? Math.max(0, (1 + withdrawpage) * withdrawrowsPerPage - userWithdraw.length) : 0;
  const emptyRowsBid = bidpage > 0 ? Math.max(0, (1 + bidpage) * bidrowsPerPage - bidHistory.length) : 0;
  const emptyRowsWin = winpage > 0 ? Math.max(0, (1 + winpage) * winrowsPerPage - winHistory.length) : 0;

  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [paginationDepth, setPaginationDepth] = React.useState(0);

  const handleChangePage = (event, newPage) => {
    setuserPage(newPage);
    // Save to sessionStorage for user-edit navigation
    sessionStorage.setItem('user-list-page', newPage.toString());
    // Push to browser history for back/forward navigation
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-list', depth: newDepth }, '', newPage === 0 ? '' : `#page-${newPage}`);
    }
  };

  // Browser history management with sessionStorage restoration
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.report === 'user-list') {
        if (typeof event.state.depth === 'number' && typeof event.state.page === 'number') {
          setPaginationDepth(event.state.depth);
          setuserPage(event.state.page);
          sessionStorage.setItem('user-list-page', event.state.page.toString());
        }
      }
    };

    if (isInitialLoad) {
      // Check if we're returning from user-edit with saved page in sessionStorage
      const savedPage = sessionStorage.getItem('user-list-page');
      const initialPage = savedPage ? parseInt(savedPage, 10) : 0;

      window.history.replaceState({ page: initialPage, report: 'user-list', depth: 0 }, '', initialPage === 0 ? '' : `#page-${initialPage}`);
      setIsInitialLoad(false);

      if (savedPage && !isNaN(initialPage) && initialPage > 0) {
        setuserPage(initialPage);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInitialLoad, paginationDepth]);

  useEffect(() => {
    if (location.state?.presetBalanceSort === 'desc') {
      setBalanceSortOrder('desc');
      setuserPage(0);
      sessionStorage.setItem('user-list-page', '0');
      const { presetBalanceSort: _preset, ...rest } = location.state || {};
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: Object.keys(rest).length > 0 ? rest : undefined,
      });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  const handleChangeRowsPerPage = (event) => {
    setuserRowsPerPage(parseInt(event.target.value, 10));
    setuserPage(0);
    sessionStorage.setItem('user-list-page', '0');
  };
  const handleChangePageFund = (event, newPage) => {
    setFundPage(newPage);
  };

  const handleChangeRowsPerPageFund = (event) => {
    setFundRowsPerPage(parseInt(event.target.value, 10));
    setFundPage(0);
  };
  const handleChangePageWithdraw = (event, newPage) => {
    setWithdrawPage(newPage);
  };

  const handleChangeRowsPerPageWithdraw = (event) => {
    setWithdrawRowsPerPage(parseInt(event.target.value, 10));
    setWithdrawPage(0);
  };
  const handleChangePageBid = (event, newPage) => {
    setBidPage(newPage);
  };

  const handleChangeRowsPerPageBid = (event) => {
    setBidRowsPerPage(parseInt(event.target.value, 10));
    setBidPage(0);
  };
  const handleChangePageWin = (event, newPage) => {
    setWinPage(newPage);
  };

  const handleChangeRowsPerPageWin = (event) => {
    setWinRowsPerPage(parseInt(event.target.value, 10));
    setWinPage(0);
  };

  const changePassword = async () => {
    if (!pass || pass.trim() === '') {
      alert('Password cannot be empty');
      return;
    }
    if (pass.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await userService.updatePassword(singleUserInfo.mobileNumber, pass);
      alert('Password updated successfully');
      setPass('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert(`Error updating password: ${error.message}`);
    }
  };

  const handleUpdateBalance = async () => {
    if (!singleUserInfo?.balance || singleUserInfo.balance === '' || parseInt(singleUserInfo.balance) < 0) {
      alert('Please enter a valid balance');
      return;
    }

    try {
      await userService.updateBalance(singleUserInfo.mobileNumber, parseInt(singleUserInfo.balance));
      alert('Balance updated successfully');
      // Update local state
      setUserData(prev => prev.map(u =>
        u.mobileNumber === singleUserInfo.mobileNumber
          ? { ...u, balance: parseInt(singleUserInfo.balance) }
          : u
      ));
      setUserDataCopy(prev => prev.map(u =>
        u.mobileNumber === singleUserInfo.mobileNumber
          ? { ...u, balance: parseInt(singleUserInfo.balance) }
          : u
      ));
      refetch();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert(`Error updating balance: ${error.message}`);
    }
  };
  const handleOpen = async (id) => {
    // try {
    //   let res = await fetch(`${API_URL}users/all-user-info/${id}/`);
    //   let data = await res.json();
    //   console.log(data);
    //   setUserInfo(data);
    // } catch (error) {
    //   console.log(error);
    // }

    // DUMMY - Not used in current flow, but keeping for compatibility
  };
  const handleClose = () => setOpen(false);
  // Sync context users to local state
  useEffect(() => {
    if (contextUsers && contextUsers.length > 0) {
      // Add id field for compatibility and ensure is_subscriber is calculated from approvalStatus
      const usersWithId = contextUsers.map(user => ({
        ...user,
        id: user.mobileNumber,
        is_subscriber: user.approvalStatus?.toUpperCase() === 'APPROVED' // Always calculate from approvalStatus (case-insensitive)
      })).sort((a, b) => {
        if (balanceSortOrder !== null) {
          const balA = Number(a.balance) || 0;
          const balB = Number(b.balance) || 0;
          if (balA !== balB) {
            return balanceSortOrder === 'desc' ? balB - balA : balA - balB;
          }
        }
        const dateA = dayjs(a.dateSignup);
        const dateB = dayjs(b.dateSignup);
        if (createdAtSortOrder === 'desc') {
          return dateB.isAfter(dateA) ? 1 : -1;
        }
        return dateA.isAfter(dateB) ? 1 : -1;
      });
      setUserDataCopy(usersWithId);
      
      // Apply date filter if selected
      if (selectedDate) {
        const filtered = usersWithId.filter(user => {
          if (!user.dateSignup) return false;
          return dayjs(user.dateSignup).isSame(selectedDate, 'day');
        });
        setUserData(filtered);
      } else {
        setUserData(usersWithId);
      }
    }
  }, [contextUsers, selectedDate, createdAtSortOrder, balanceSortOrder]);
  const unverifyUser = async (mobileNumber) => {
    try {
      await userService.unapproveUser(mobileNumber);
      alert('User unapproved successfully');
      // Update local state and refetch from context
      setUserData(prev => prev.map(u => u.mobileNumber === mobileNumber ? {...u, approvalStatus: 'UNAPPROVED', is_subscriber: false} : u));
      setUserDataCopy(prev => prev.map(u => u.mobileNumber === mobileNumber ? {...u, approvalStatus: 'UNAPPROVED', is_subscriber: false} : u));
      refetch();
    } catch (error) {
      console.error('Error unapproving user:', error);
      alert(`Error unapproving user: ${error.message}`);
    }
  };

  const verifyUser = async (mobileNumber) => {
    try {
      await userService.approveUser(mobileNumber);
      alert('User approved successfully');
      // Update local state and refetch from context
      setUserData(prev => prev.map(u => u.mobileNumber === mobileNumber ? {...u, approvalStatus: 'APPROVED', is_subscriber: true} : u));
      setUserDataCopy(prev => prev.map(u => u.mobileNumber === mobileNumber ? {...u, approvalStatus: 'APPROVED', is_subscriber: true} : u));
      refetch();
    } catch (error) {
      console.error('Error approving user:', error);
      alert(`Error approving user: ${error.message}`);
    }
  };
  const handleCreatedAtSort = () => {
    const newOrder = createdAtSortOrder === 'desc' ? 'asc' : 'desc';
    setCreatedAtSortOrder(newOrder);
  };

  const handleBalanceSort = () => {
    if (balanceSortOrder === null) {
      setBalanceSortOrder('desc');
      return;
    }
    setBalanceSortOrder(balanceSortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleSearch = () => {
    if (searchVal == '') {
      return;
    }
    const newData = userDataCopy.filter(
      (user) => user.mobileNumber.includes(searchVal) || (user.username && user.username.includes(searchVal))
    );
    setUserData(newData);
    setSearchVal('');
    setuserPage(0);
    sessionStorage.setItem('user-list-page', '0');
  };
  const handleEdit = async (user) => {
    // Navigate to the new user edit page with pagination state
    sessionStorage.setItem('user-list-page', userpage.toString());
    navigate(`/user/${user.mobileNumber}`);
  };
  const showUnapprove = () => {
    let newarr = userDataCopy.filter((user) => user.is_subscriber === false)
    setUserData(newarr)
    setuserPage(0);
    sessionStorage.setItem('user-list-page', '0');
  }
  const showApprove = () => {
    let newarr = userDataCopy.filter((user) => user.is_subscriber === true)
    setUserData(newarr)
    setuserPage(0);
    sessionStorage.setItem('user-list-page', '0');
  }
  const showAllUser = () => {
    setUserData(userDataCopy)
    setuserPage(0);
    sessionStorage.setItem('user-list-page', '0');
  }
  const handleSaveUserDetails = async () => {
    try {
      const payload = {
        mobileNumber: singleUserInfo.mobileNumber,
        username: singleUserInfo.username,
        accountNumber: singleUserInfo.accountNumber || null,
        accountHolderName: singleUserInfo.accountHolderName || null,
        ifscCode: singleUserInfo.ifscCode || null,
        upiId: singleUserInfo.upiId || null
      };

      await userService.updateUserDetails(payload);

      alert("User details updated successfully");
      // Update local state
      setUserData(prev => prev.map(u =>
        u.mobileNumber === singleUserInfo.mobileNumber
          ? {
              ...u,
              username: singleUserInfo.username,
              accountNumber: singleUserInfo.accountNumber,
              accountHolderName: singleUserInfo.accountHolderName,
              ifscCode: singleUserInfo.ifscCode,
              upiId: singleUserInfo.upiId
            }
          : u
      ));
      setUserDataCopy(prev => prev.map(u =>
        u.mobileNumber === singleUserInfo.mobileNumber
          ? {
              ...u,
              username: singleUserInfo.username,
              accountNumber: singleUserInfo.accountNumber,
              accountHolderName: singleUserInfo.accountHolderName,
              ifscCode: singleUserInfo.ifscCode,
              upiId: singleUserInfo.upiId
            }
          : u
      ));
      setPass("");
    } catch (error) {
      console.error('Error updating user details:', error);
      alert(`Error updating user details: ${error.message}`);
    }
  };
  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Users</Typography>
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={showAllUser}>All</Button>
          <Button variant="outlined" onClick={showUnapprove}>Unapproved</Button>
          <Button variant="outlined" onClick={showApprove}>Approved</Button>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <FormControl fullWidth sx={{ m: 1 }}>
          <InputLabel htmlFor="outlined-adornment-amount">Search</InputLabel>
          <OutlinedInput
            id="outlined-adornment-amount"
            label="Search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </FormControl>
        <Button onClick={handleSearch}>Search</Button>
      </Stack>
      
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="Filter by Date"
              value={selectedDate}
              onChange={(newVal) => {
                setSelectedDate(newVal);
                sessionStorage.setItem('user-list-date', newVal ? newVal.format('YYYY-MM-DD') : 'null');
                setuserPage(0);
                sessionStorage.setItem('user-list-page', '0');
              }}
              slotProps={{
                field: { clearable: true },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>

        <Button
          variant="outlined"
          onClick={() => {
            setSelectedDate(null);
            sessionStorage.setItem('user-list-date', 'null');
            setuserPage(0);
            sessionStorage.setItem('user-list-page', '0');
          }}
        >
          Clear Filter
        </Button>
      </Stack>

      {usersLoading && (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" mb={3}>
          <CircularProgress size={24} />
          <Typography>Loading users...</Typography>
        </Stack>
      )}

      {usersError && (
        <Typography color="error" mb={3}>
          Error loading users: {usersError}
        </Typography>
      )}

      <Card>
        <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        S.No.
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Mobile Number
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Name
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <span>Balance</span>
                          <IconButton
                            size="small"
                            onClick={handleBalanceSort}
                            title={
                              balanceSortOrder === null
                                ? 'Click to sort by balance (high to low first)'
                                : balanceSortOrder === 'desc'
                                  ? 'Balance: high to low (click for low to high)'
                                  : 'Balance: low to high (click for high to low)'
                            }
                          >
                            {balanceSortOrder === null ? (
                              <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.45 }} />
                            ) : balanceSortOrder === 'desc' ? (
                              <ArrowDownwardIcon fontSize="small" />
                            ) : (
                              <ArrowUpwardIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                          <span>Created at</span>
                          <IconButton 
                            size="small" 
                            onClick={handleCreatedAtSort}
                            title={createdAtSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                          >
                            {createdAtSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Approved
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Change Approval
                      </TableCell>
                      <TableCell style={{ width: 120 }} align="right">
                        View
                      </TableCell>
                       <TableCell style={{ width: 160 }} align="right">
                        Whatsapp
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(userrowsPerPage > 0
                      ? userData.slice(userpage * userrowsPerPage, userpage * userrowsPerPage + userrowsPerPage)
                      : userData
                    ).map((row, index) => (
                      <TableRow key={row.mobileNumber}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell onClick={() => handleEdit(row)} style={{cursor: "pointer", color: "#2881F3"}} component="th" scope="row">
                          {row.mobileNumber}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.username || '-'}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.balance || 0}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {dayjs(row.dateSignup).format('DD-MM-YYYY HH:mm:ss')}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                     {row.is_subscriber ? (
                      <p style={{ color: '#00A76F' }}>Yes</p>
                    ) : (
                      <p style={{ color: '#FF6340' }}>No</p>
                    )}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                    {row.is_subscriber ? (
                      <Button color="error" onClick={() => unverifyUser(row.mobileNumber)}>
                        Unapprove
                      </Button>
                    ) : (
                      <Button color="success" onClick={() => verifyUser(row.mobileNumber)}>
                        Approve
                      </Button>
                    )}
                        </TableCell>
                        <TableCell style={{ width: 120 }} align="right">
                          {row.viewMode === 'LIMITED' ? (
                            <p style={{ color: '#FFAB00' }}>Limited</p>
                          ) : (
                            <p style={{ color: '#00A76F' }}>Full</p>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                        <Button variant="text">
                          <Link target="_blank" href={`https://api.whatsapp.com/send?phone=91${row?.mobileNumber}`} underline='none' >
                            <FontAwesomeIcon icon={faWhatsapp} />
                          </Link>
                        </Button>
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          <Button onClick={() => handleEdit(row)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRowsUser > 0 && (
                      <TableRow style={{ height: 53 * emptyRowsUser }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 100, 500, 1000, { label: 'All', value: -1 }]}
                        colSpan={9}
                        count={userData.length}
                        rowsPerPage={userrowsPerPage}
                        page={userpage}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
             </Card>
      <Dialog fullScreen open={open} onClose={handleClose}>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Button variant="filled" onClick={handleClose} aria-label="close">
              Close
            </Button>
          </Toolbar>
        </AppBar>
        <List>
          <Container style={{ padding: '5vh 0' }}>
            <Stack direction="column" spacing={4}>
              <h2>User Information</h2>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TextField
                  variant="outlined"
                  label="Name"
                  value={singleUserInfo?.username || ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, username: e.target.value})}
                />
                <TextField
                  variant="outlined"
                  label="Created at"
                  value={singleUserInfo?.dateSignup ? dayjs(singleUserInfo?.dateSignup).format('DD-MM-YY hh:mm A') : ''}
                  disabled
                />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  variant="outlined"
                  label="Mobile Number"
                  value={singleUserInfo?.mobileNumber || ''}
                  disabled
                />
                <Button variant="text">
                  <Link target="_blank" href={`https://api.whatsapp.com/send?phone=91${singleUserInfo?.mobileNumber}`} underline='none' >Whatsapp</Link>
                </Button>
                <Button variant="text" color="success">
                  <Link href={`tel:+91${singleUserInfo?.mobileNumber}`} target="_blank" underline='none'>Call</Link>
                </Button>
              </Stack>
              <Divider />
              <h3>Bank Details</h3>
              <Stack direction='row' spacing={2} alignItems='center'>
                <TextField
                  variant='outlined'
                  label='Account Number'
                  value={singleUserInfo?.accountNumber || ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, accountNumber: e.target.value})}
                />
                <TextField
                  variant='outlined'
                  label='Account Holder Name'
                  value={singleUserInfo?.accountHolderName || ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, accountHolderName: e.target.value})}
                />
              </Stack>
              <Stack direction='row' spacing={2} alignItems='center'>
                <TextField
                  variant='outlined'
                  label='IFSC Code'
                  value={singleUserInfo?.ifscCode || ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, ifscCode: e.target.value})}
                />
                <TextField
                  variant='outlined'
                  label='UPI ID'
                  value={singleUserInfo?.upiId || ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, upiId: e.target.value})}
                />
              </Stack>
              <Stack>
                <Button variant="contained" onClick={handleSaveUserDetails}>Save Changes</Button>
              </Stack>
              <Divider />
              <Stack direction='row' spacing={2} alignItems='center'>
                <TextField
                  variant='outlined'
                  label='Balance'
                  type='number'
                  value={singleUserInfo?.balance ?? ''}
                  onChange={(e) => setSingleUserInfo({...singleUserInfo, balance: e.target.value === '' ? '' : parseInt(e.target.value)})}
                />
                <Button variant='outlined' onClick={handleUpdateBalance}>Update Balance</Button>
              </Stack>
              <Divider />
              <Stack direction='row' spacing={2} alignItems='center'>
                <TextField variant='outlined' value={pass} label='New Password' type='password' onChange={(e) => setPass(e.target.value)} />
                <Button variant='outlined' onClick={changePassword}>Change Password</Button>
              </Stack>
              <Divider />
              <h2>Fund Deposit</h2>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        S.No.
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Username
                      </TableCell>
                      <TableCell style={{ width: 200 }} align="right">
                        Date & Time
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Deposited by
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(fundrowsPerPage > 0
                      ? userFund.slice(fundpage * fundrowsPerPage, fundpage * fundrowsPerPage + fundrowsPerPage)
                      : userFund
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {singleUserInfo.username}
                        </TableCell>
                        <TableCell style={{ width: 200 }} align="right">
                          {row.txDate && row.txTime ? `${dayjs(row.txDate).format('DD-MM-YYYY')} ${row.txTime}` : '-'}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {row.amount || 0}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {row.initiator || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRowsFund > 0 && (
                      <TableRow style={{ height: 53 * emptyRowsFund }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                        colSpan={3}
                        count={userFund.length}
                        rowsPerPage={fundrowsPerPage}
                        page={fundpage}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePageFund}
                        onRowsPerPageChange={handleChangeRowsPerPageFund}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
              <Divider />
              <h2>Withdraw History</h2>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        S.No.
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Username
                      </TableCell>
                      <TableCell style={{ width: 200 }} align="right">
                        Date & Time
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(withdrawrowsPerPage > 0
                      ? userWithdraw.slice(withdrawpage * withdrawrowsPerPage, withdrawpage * withdrawrowsPerPage + withdrawrowsPerPage)
                      : userWithdraw
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {singleUserInfo.username}
                        </TableCell>
                        <TableCell style={{ width: 200 }} align="right">
                          {row.txDate && row.txTime ? `${dayjs(row.txDate).format('DD-MM-YYYY')} ${row.txTime}` : '-'}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {Math.abs(row.amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRowsWithdraw > 0 && (
                      <TableRow style={{ height: 53 * emptyRowsWithdraw }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                        colSpan={3}
                        count={userWithdraw.length}
                        rowsPerPage={withdrawrowsPerPage}
                        page={withdrawpage}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePageWithdraw}
                        onRowsPerPageChange={handleChangeRowsPerPageWithdraw}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
              <Divider />
              <h2>Bid History</h2>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        S.No.
                      </TableCell>
                      <TableCell component="th" scope="row">
                        game
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Game Type
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Date
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Bid
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(bidrowsPerPage > 0
                      ? bidHistory.slice(bidpage * bidrowsPerPage, bidpage * bidrowsPerPage + bidrowsPerPage)
                      : bidHistory
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.game_name}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.subGameChoice}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {dayjs(row.created_at).format('DD-MM-YYYY')}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {`${row?.panna_one ? row.panna_one : '***'}-`} {row.subGameChoice == "JD" ? `${row?.jodi_digit?row.jodi_digit:'*'}` : `${row?.open_single?row.open_single:'*'}${row?.close_single?row.close_single:'*'}`}{`-${row?.panna_two?row.panna_two:'***'}`}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {row.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRowsBid > 0 && (
                      <TableRow style={{ height: 53 * emptyRowsBid }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                        colSpan={3}
                        count={bidHistory.length}
                        rowsPerPage={bidrowsPerPage}
                        page={bidpage}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePageBid}
                        onRowsPerPageChange={handleChangeRowsPerPageBid}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
              <Divider />
              <h2>Win History</h2>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        S.No.
                      </TableCell>
                      <TableCell component="th" scope="row">
                        game
                      </TableCell>
                      <TableCell component="th" scope="row">
                        Game Type
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Date
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Bid
                      </TableCell>
                      <TableCell style={{ width: 160 }} align="right">
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(winrowsPerPage > 0
                      ? winHistory.slice(winpage * winrowsPerPage, winpage * winrowsPerPage + winrowsPerPage)
                      : winHistory
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.game_name}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.subGameChoice}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {dayjs(row.created_at).format('DD-MM-YYYY')}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {`${row?.panna_one ? row.panna_one : '***'}-`} {row.subGameChoice == "JD" ? `${row?.jodi_digit?row.jodi_digit:'*'}` : `${row?.open_single?row.open_single:'*'}${row?.close_single?row.close_single:'*'}`}{`-${row?.panna_two?row.panna_two:'***'}`}
                        </TableCell>
                        <TableCell style={{ width: 160 }} align="right">
                          {row.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRowsWin > 0 && (
                      <TableRow style={{ height: 53 * emptyRowsWin }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 100, { label: 'All', value: -1 }]}
                        colSpan={3}
                        count={winHistory.length}
                        rowsPerPage={winrowsPerPage}
                        page={winpage}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePageWin}
                        onRowsPerPageChange={handleChangeRowsPerPageWin}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Stack>
          </Container>
        </List>
      </Dialog>
    </Container>
  );
}
