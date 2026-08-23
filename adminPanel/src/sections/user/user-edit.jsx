import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
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
  TextField,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
  Select,
  MenuItem,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { useUsers } from 'src/contexts/UserContext';
import { useGames } from 'src/contexts/GameContext';
import { userService, transactionService, betService } from 'src/services';
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

export default function UserEditPage() {
  const { mobileNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { users: contextUsers, loading: usersLoading, refetch } = useUsers();
  const { games } = useGames();

  const [singleUserInfo, setSingleUserInfo] = useState({});
  const [userFund, setUserFund] = useState([]);
  const [userFundFiltered, setUserFundFiltered] = useState([]);
  const [adminUserTx, setAdminUserTx] = useState([]);
  const [adminUserTxFiltered, setAdminUserTxFiltered] = useState([]);
  const [userWithdraw, setUserWithdraw] = useState([]);
  const [userWithdrawFiltered, setUserWithdrawFiltered] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [bidHistoryFiltered, setBidHistoryFiltered] = useState([]);
  const [winHistory, setWinHistory] = useState([]);
  const [winHistoryFiltered, setWinHistoryFiltered] = useState([]);
  const [pass, setPass] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userWalletPoints, setUserWalletPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');

  // Filter states for bid and win history
  const [selectedBidGame, setSelectedBidGame] = useState('');
  const [selectedBidGameType, setSelectedBidGameType] = useState('');
  const [selectedWinGame, setSelectedWinGame] = useState('');
  const [selectedWinGameType, setSelectedWinGameType] = useState('');

  const gameTypes = ['Single Digit', 'Jodi', 'Single Pana', 'Double Pana', 'Triple Pana', 'Half Sangam', 'Full Sangam'];

  // Summary totals
  const [totalAddFund, setTotalAddFund] = useState(0);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalBidAmount, setTotalBidAmount] = useState(0);
  const [totalWinningAmount, setTotalWinningAmount] = useState(0);
  const [todayBidAmount, setTodayBidAmount] = useState(0);
  const [todayWinAmount, setTodayWinAmount] = useState(0);

  // Sort order states for each table
  const [fundSortOrder, setFundSortOrder] = useState('desc');
  const [adminTxSortOrder, setAdminTxSortOrder] = useState('desc');
  const [withdrawSortOrder, setWithdrawSortOrder] = useState('desc');
  const [bidSortOrder, setBidSortOrder] = useState('desc');
  const [winSortOrder, setWinSortOrder] = useState('desc');

  const [fundpage, setFundPage] = React.useState(0);
  const [fundrowsPerPage, setFundRowsPerPage] = React.useState(10);
  const [adminTxPage, setAdminTxPage] = React.useState(0);
  const [adminTxRowsPerPage, setAdminTxRowsPerPage] = React.useState(10);
  const [withdrawpage, setWithdrawPage] = React.useState(0);
  const [withdrawrowsPerPage, setWithdrawRowsPerPage] = React.useState(10);
  const [bidpage, setBidPage] = React.useState(0);
  const [bidrowsPerPage, setBidRowsPerPage] = React.useState(10);
  const [winpage, setWinPage] = React.useState(0);
  const [winrowsPerPage, setWinRowsPerPage] = React.useState(10);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [activeReport, setActiveReport] = React.useState(null);
  const [paginationDepth, setPaginationDepth] = React.useState(0);

  const emptyRowsFund = fundpage > 0 ? Math.max(0, (1 + fundpage) * fundrowsPerPage - userFund.length) : 0;
  const emptyRowsAdminTx = adminTxPage > 0 ? Math.max(0, (1 + adminTxPage) * adminTxRowsPerPage - adminUserTxFiltered.length) : 0;
  const emptyRowsWithdraw = withdrawpage > 0 ? Math.max(0, (1 + withdrawpage) * withdrawrowsPerPage - userWithdraw.length) : 0;
  const emptyRowsBid = bidpage > 0 ? Math.max(0, (1 + bidpage) * bidrowsPerPage - bidHistory.length) : 0;
  const emptyRowsWin = winpage > 0 ? Math.max(0, (1 + winpage) * winrowsPerPage - winHistory.length) : 0;

  const handleChangePageFund = (event, newPage) => {
    setFundPage(newPage);
    setActiveReport('user-fund');
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-fund', userId: mobileNumber, depth: newDepth }, '', newPage === 0 ? '' : `#fund-page-${newPage}`);
    }
  };

  const handleChangeRowsPerPageFund = (event) => {
    setFundRowsPerPage(parseInt(event.target.value, 10));
    setFundPage(0);
  };

  const handleChangePageAdminTx = (event, newPage) => {
    setAdminTxPage(newPage);
    setActiveReport('user-admin-tx');
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-admin-tx', userId: mobileNumber, depth: newDepth }, '', newPage === 0 ? '' : `#admin-tx-page-${newPage}`);
    }
  };

  const handleChangeRowsPerPageAdminTx = (event) => {
    setAdminTxRowsPerPage(parseInt(event.target.value, 10));
    setAdminTxPage(0);
  };

  const handleChangePageWithdraw = (event, newPage) => {
    setWithdrawPage(newPage);
    setActiveReport('user-withdraw');
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-withdraw', userId: mobileNumber, depth: newDepth }, '', newPage === 0 ? '' : `#withdraw-page-${newPage}`);
    }
  };

  const handleChangeRowsPerPageWithdraw = (event) => {
    setWithdrawRowsPerPage(parseInt(event.target.value, 10));
    setWithdrawPage(0);
  };

  const handleChangePageBid = (event, newPage) => {
    setBidPage(newPage);
    setActiveReport('user-bid');
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-bid', userId: mobileNumber, depth: newDepth }, '', newPage === 0 ? '' : `#bid-page-${newPage}`);
    }
  };

  const handleChangeRowsPerPageBid = (event) => {
    setBidRowsPerPage(parseInt(event.target.value, 10));
    setBidPage(0);
  };

  const handleChangePageWin = (event, newPage) => {
    setWinPage(newPage);
    setActiveReport('user-win');
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'user-win', userId: mobileNumber, depth: newDepth }, '', newPage === 0 ? '' : `#win-page-${newPage}`);
    }
  };

  const handleChangeRowsPerPageWin = (event) => {
    setWinRowsPerPage(parseInt(event.target.value, 10));
    setWinPage(0);
  };

  // Handle browser back/forward button for all tables
  React.useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.userId === mobileNumber) {
        // Only handle pagination navigation if we have depth and it matches active report
        if (event.state.depth && event.state.depth > 0) {
          setPaginationDepth(event.state.depth);
          if (event.state.report === 'user-fund' && typeof event.state.page === 'number') {
            setFundPage(event.state.page);
            setActiveReport('user-fund');
          } else if (event.state.report === 'user-admin-tx' && typeof event.state.page === 'number') {
            setAdminTxPage(event.state.page);
            setActiveReport('user-admin-tx');
          } else if (event.state.report === 'user-withdraw' && typeof event.state.page === 'number') {
            setWithdrawPage(event.state.page);
            setActiveReport('user-withdraw');
          } else if (event.state.report === 'user-bid' && typeof event.state.page === 'number') {
            setBidPage(event.state.page);
            setActiveReport('user-bid');
          } else if (event.state.report === 'user-win' && typeof event.state.page === 'number') {
            setWinPage(event.state.page);
            setActiveReport('user-win');
          }
        } else {
          // Depth is 0 or undefined - reset pagination and allow normal back navigation
          setPaginationDepth(0);
          setActiveReport(null);
        }
      }
    };

    // Set initial state
    if (isInitialLoad && mobileNumber) {
      window.history.replaceState({ page: 0, report: 'user-edit', userId: mobileNumber, depth: 0 }, '', window.location.pathname + window.location.search);
      setIsInitialLoad(false);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInitialLoad, mobileNumber, paginationDepth]);

  // Sort handlers for each table
  const handleFundSort = () => {
    const newOrder = fundSortOrder === 'desc' ? 'asc' : 'desc';
    setFundSortOrder(newOrder);
    const sorted = [...userFundFiltered].sort((a, b) => {
      const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
      const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
      if (newOrder === 'desc') {
        return dateB.isAfter(dateA) ? 1 : -1;
      }
      return dateA.isAfter(dateB) ? 1 : -1;
    });
    setUserFundFiltered(sorted);
  };

  const handleAdminTxSort = () => {
    const newOrder = adminTxSortOrder === 'desc' ? 'asc' : 'desc';
    setAdminTxSortOrder(newOrder);
    const sorted = [...adminUserTxFiltered].sort((a, b) => {
      const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
      const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
      if (newOrder === 'desc') {
        return dateB.isAfter(dateA) ? 1 : -1;
      }
      return dateA.isAfter(dateB) ? 1 : -1;
    });
    setAdminUserTxFiltered(sorted);
  };

  const handleWithdrawSort = () => {
    const newOrder = withdrawSortOrder === 'desc' ? 'asc' : 'desc';
    setWithdrawSortOrder(newOrder);
    const sorted = [...userWithdrawFiltered].sort((a, b) => {
      const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
      const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
      if (newOrder === 'desc') {
        return dateB.isAfter(dateA) ? 1 : -1;
      }
      return dateA.isAfter(dateB) ? 1 : -1;
    });
    setUserWithdrawFiltered(sorted);
  };

  const handleBidSort = () => {
    const newOrder = bidSortOrder === 'desc' ? 'asc' : 'desc';
    setBidSortOrder(newOrder);
    const sorted = [...bidHistoryFiltered].sort((a, b) => {
      const dateA = dayjs(a.betTime);
      const dateB = dayjs(b.betTime);
      if (newOrder === 'desc') {
        return dateB.isAfter(dateA) ? 1 : -1;
      }
      return dateA.isAfter(dateB) ? 1 : -1;
    });
    setBidHistoryFiltered(sorted);
  };

  const handleWinSort = () => {
    const newOrder = winSortOrder === 'desc' ? 'asc' : 'desc';
    setWinSortOrder(newOrder);
    const sorted = [...winHistoryFiltered].sort((a, b) => {
      const dateA = dayjs(a.betTime);
      const dateB = dayjs(b.betTime);
      if (newOrder === 'desc') {
        return dateB.isAfter(dateA) ? 1 : -1;
      }
      return dateA.isAfter(dateB) ? 1 : -1;
    });
    setWinHistoryFiltered(sorted);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        // Find user info from context
        const userInfo = contextUsers.find(u => u.mobileNumber === mobileNumber);
        if (userInfo) {
          setSingleUserInfo(userInfo);
          setUserWalletPoints(userInfo.balance || 0);
        } else {
          setSingleUserInfo({});
          return;
        }

        // Fetch deposits for this user (returns { sum, transactions })
        const depositsResponse = await transactionService.getDepositsByUser(mobileNumber);
        const deposits = depositsResponse.transactions || [];
        setTotalAddFund(depositsResponse.sum || 0);

        const sortedDeposits = deposits.sort((a, b) => {
          const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
          const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
          return dateB.isAfter(dateA) ? 1 : -1; // desc by default
        });
        setUserFund(sortedDeposits);
        setUserFundFiltered(sortedDeposits);

        const allUserTxResponse = await transactionService.getTransactionsByUser(mobileNumber);
        const allUserTxRaw = Array.isArray(allUserTxResponse)
          ? allUserTxResponse
          : (allUserTxResponse?.transactions || allUserTxResponse?.data || []);
        const adminOnlyTx = (allUserTxRaw || []).filter((t) => t.initiator === 'Admin');
        const sortedAdminTx = adminOnlyTx.sort((a, b) => {
          const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
          const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
          return dateB.isAfter(dateA) ? 1 : -1;
        });
        setAdminUserTx(sortedAdminTx);
        setAdminUserTxFiltered(sortedAdminTx);

        // Fetch withdrawals for this user (returns { sum, transactions })
        const withdrawalsResponse = await transactionService.getWithdrawalsByUser(mobileNumber);
        const withdrawals = withdrawalsResponse.transactions || [];
        setTotalWithdrawal(withdrawalsResponse.sum || 0);

        const sortedWithdrawals = withdrawals.sort((a, b) => {
          const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
          const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
          return dateB.isAfter(dateA) ? 1 : -1; // desc by default
        });
        setUserWithdraw(sortedWithdrawals);
        setUserWithdrawFiltered(sortedWithdrawals);

        // Fetch bet history for this user
        const betResponse = await betService.getUserBets(mobileNumber);
        const bets = betResponse.bets || [];
        const sortedBets = bets.sort((a, b) => {
          const dateA = dayjs(a.betTime);
          const dateB = dayjs(b.betTime);
          return dateB.isAfter(dateA) ? 1 : -1; // desc by default
        });
        setBidHistory(sortedBets);
        setBidHistoryFiltered(sortedBets);

        // Use total bid amount from API response
        setTotalBidAmount(betResponse.sum || 0);

        // Calculate today's bid amount
        const today = dayjs().format('YYYY-MM-DD');
        const todayBets = bets.filter(bet => dayjs(bet.betTime).format('YYYY-MM-DD') === today);
        const todayBid = todayBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
        setTodayBidAmount(todayBid);

        // Fetch won bets for win history using dedicated API
        const wonBetsResponse = await betService.getWonBets({ mobileNumber });
        const wonBets = wonBetsResponse.bets || [];
        const sortedWonBets = wonBets.sort((a, b) => {
          const dateA = dayjs(a.betTime);
          const dateB = dayjs(b.betTime);
          return dateB.isAfter(dateA) ? 1 : -1; // desc by default
        });
        setWinHistory(sortedWonBets);
        setWinHistoryFiltered(sortedWonBets);

        // Use total winning amount from API response
        setTotalWinningAmount(wonBetsResponse.sum || 0);

        // Calculate today's winning amount
        const todayWonBets = wonBets.filter(bet => dayjs(bet.betTime).format('YYYY-MM-DD') === today);
        const todayWin = todayWonBets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
        setTodayWinAmount(todayWin);
      } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user data');
      } finally {
        setLoading(false);
      }
    };

    if (mobileNumber && contextUsers.length > 0) {
      loadUserData();
    }
  }, [mobileNumber, contextUsers, navigate]);

  // Apply filters to all reports
  useEffect(() => {
    // Filter deposits
    const filteredDeposits = selectedDate
      ? userFund.filter(item => item.txDate && dayjs(item.txDate).isSame(selectedDate, 'day'))
      : userFund;
    setUserFundFiltered(filteredDeposits);

    const filteredAdminTx = selectedDate
      ? adminUserTx.filter((item) => item.txDate && dayjs(item.txDate).isSame(selectedDate, 'day'))
      : adminUserTx;
    setAdminUserTxFiltered(filteredAdminTx);

    // Filter withdrawals
    const filteredWithdrawals = selectedDate
      ? userWithdraw.filter(item => item.txDate && dayjs(item.txDate).isSame(selectedDate, 'day'))
      : userWithdraw;
    setUserWithdrawFiltered(filteredWithdrawals);

    // Filter bid history (date, game name, game type)
    const filteredBids = bidHistory.filter(item => {
      // Date filter
      if (selectedDate && item.betTime) {
        if (!dayjs(item.betTime).isSame(selectedDate, 'day')) return false;
      }
      // Game name filter
      if (selectedBidGame && item.gameName !== selectedBidGame) return false;
      // Game type filter
      if (selectedBidGameType && item.type !== selectedBidGameType) return false;
      return true;
    });
    setBidHistoryFiltered(filteredBids);

    // Filter win history (date, game name, game type)
    const filteredWins = winHistory.filter(item => {
      // Date filter
      if (selectedDate && item.betTime) {
        if (!dayjs(item.betTime).isSame(selectedDate, 'day')) return false;
      }
      // Game name filter
      if (selectedWinGame && item.gameName !== selectedWinGame) return false;
      // Game type filter
      if (selectedWinGameType && item.type !== selectedWinGameType) return false;
      return true;
    });
    setWinHistoryFiltered(filteredWins);
  }, [selectedDate, selectedBidGame, selectedBidGameType, selectedWinGame, selectedWinGameType, userFund, adminUserTx, userWithdraw, bidHistory, winHistory]);

  const changePassword = async () => {
    if (!newPassword || newPassword.trim() === '') {
      alert('Password cannot be empty');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await userService.updatePassword(singleUserInfo.mobileNumber, newPassword);
      alert('Password updated successfully');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert(`Error updating password: ${error.message}`);
    }
  };

  const handleAddBalance = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || parseInt(balanceAmount) <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      const transactionData = {
        mobileNumber: singleUserInfo.mobileNumber,
        amount: parseInt(balanceAmount),
        initiator: 'Admin',
        status: 'SUCCESS',
        remarks: 'Balance added by admin'
      };

      await transactionService.createTransaction(transactionData);
      alert(`Successfully added ₹${balanceAmount} to user balance`);
      setBalanceAmount('');
      refetch();
    } catch (error) {
      console.error('Error adding balance:', error);
      alert(`Error adding balance: ${error.message}`);
    }
  };

  const handleWithdrawBalance = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || parseInt(balanceAmount) <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      const transactionData = {
        mobileNumber: singleUserInfo.mobileNumber,
        amount: -parseInt(balanceAmount), // Negative for withdrawal
        initiator: 'Admin',
        remarks: 'Balance withdrawn by admin'
      };

      await transactionService.createTransaction(transactionData);
      alert(`Successfully withdrew ₹${balanceAmount} from user balance`);
      setBalanceAmount('');
      refetch();
    } catch (error) {
      console.error('Error withdrawing balance:', error);
      alert(`Error withdrawing balance: ${error.message}`);
    }
  };

  const unverifyUser = async () => {
    try {
      await userService.unapproveUser(singleUserInfo.mobileNumber);
      alert('User unapproved successfully');
      setSingleUserInfo(prev => ({ ...prev, approvalStatus: 'UNAPPROVED', is_subscriber: false }));
      refetch();
    } catch (error) {
      console.error('Error unapproving user:', error);
      alert(`Error unapproving user: ${error.message}`);
    }
  };

  const verifyUser = async () => {
    try {
      await userService.approveUser(singleUserInfo.mobileNumber);
      alert('User approved successfully');
      setSingleUserInfo(prev => ({ ...prev, approvalStatus: 'APPROVED', is_subscriber: true }));
      refetch();
    } catch (error) {
      console.error('Error approving user:', error);
      alert(`Error approving user: ${error.message}`);
    }
  };

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
      alert('User details updated successfully');
      setPass('');
      refetch();
    } catch (error) {
      console.error('Error updating user details:', error);
      alert(`Error updating user details: ${error.message}`);
    }
  };

  if (loading || usersLoading) {
    return (
      <Container>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" mt={5}>
          <CircularProgress />
          <Typography>Loading user data...</Typography>
        </Stack>
      </Container>
    );
  }

  if (!singleUserInfo.mobileNumber) {
    return (
      <Container>
        <Typography variant="h5" color="error" mt={5}>
          User not found
        </Typography>
        <Button variant="contained" onClick={() => {
          const returnPage = location.state?.returnPage;
          const returnPath = location.state?.returnPath;
          if (returnPath && returnPage !== undefined) {
            navigate(returnPath, { state: { restorePage: returnPage } });
          } else {
            navigate('/user');
          }
        }} sx={{ mt: 2 }}>
          Back to Users
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Edit User: {singleUserInfo.username || singleUserInfo.mobileNumber}</Typography>
        <Button variant="outlined" onClick={() => {
          const returnPage = location.state?.returnPage;
          const returnPath = location.state?.returnPath;
          if (returnPath && returnPage !== undefined) {
            navigate(returnPath, { state: { restorePage: returnPage } });
          } else {
            navigate('/user');
          }
        }}>
          Back to Users
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* User Details Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>User Information</Typography>
            <Stack spacing={2}>
              <TextField
                label="Mobile Number"
                value={singleUserInfo.mobileNumber || ''}
                disabled
                fullWidth
              />
              <TextField
                label="Registered on"
                value={singleUserInfo.dateSignup ? dayjs(singleUserInfo.dateSignup).format('DD-MM-YYYY hh:mm A') : '-'}
                disabled
                fullWidth
              />
              <TextField
                label="Username"
                value={singleUserInfo.username || ''}
                onChange={(e) => setSingleUserInfo({ ...singleUserInfo, username: e.target.value })}
                fullWidth
              />
              <TextField
                label="Account Number"
                value={singleUserInfo.accountNumber || ''}
                onChange={(e) => setSingleUserInfo({ ...singleUserInfo, accountNumber: e.target.value })}
                fullWidth
              />
              <TextField
                label="Account Holder Name"
                value={singleUserInfo.accountHolderName || ''}
                onChange={(e) => setSingleUserInfo({ ...singleUserInfo, accountHolderName: e.target.value })}
                fullWidth
              />
              <TextField
                label="IFSC Code"
                value={singleUserInfo.ifscCode || ''}
                onChange={(e) => setSingleUserInfo({ ...singleUserInfo, ifscCode: e.target.value })}
                fullWidth
              />
              <TextField
                label="UPI ID"
                value={singleUserInfo.upiId || ''}
                onChange={(e) => setSingleUserInfo({ ...singleUserInfo, upiId: e.target.value })}
                fullWidth
              />
              <Button variant="contained" onClick={handleSaveUserDetails}>
                Save Details
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Balance & Actions Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Balance & Actions</Typography>
            <Stack spacing={2}>
              <TextField
                label="Current Balance"
                type="number"
                value={singleUserInfo.balance || 0}
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
              />
              <TextField
                label="Amount"
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Enter amount"
                size="small"
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="success" onClick={handleAddBalance} fullWidth>
                  Add Balance
                </Button>
                <Button variant="contained" color="error" onClick={handleWithdrawBalance} fullWidth>
                  Withdraw Balance
                </Button>
              </Stack>
              <Divider />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                fullWidth
              />
              <Button variant="contained" onClick={changePassword}>
                Change Password
              </Button>
              <Divider />
              <Stack direction="row" spacing={2}>
                {singleUserInfo.is_subscriber ? (
                  <Button variant="outlined" color="error" onClick={unverifyUser} fullWidth>
                    Unapprove User
                  </Button>
                ) : (
                  <Button variant="contained" color="success" onClick={verifyUser} fullWidth>
                    Approve User
                  </Button>
                )}
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                  onClick={() => window.open(`https://api.whatsapp.com/send?phone=91${singleUserInfo.mobileNumber}`, '_blank')}
                  fullWidth
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => window.open(`tel:+91${singleUserInfo.mobileNumber}`, '_blank')}
                  fullWidth
                >
                  Call
                </Button>
              </Stack>

              <Divider />

              {/* Summary Capsules inside Balance & Actions */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Card sx={{
                    p: 1,
                    bgcolor: '#2e7d32',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      Total Add Fund: ₹{totalAddFund}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{
                    p: 1,
                    bgcolor: '#d32f2f',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      Total Withdrawal: ₹{totalWithdrawal}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{
                    p: 1,
                    bgcolor: '#0000ff',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      Total Bid Amount: ₹{totalBidAmount}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{
                    p: 1,
                    bgcolor: '#ff9800',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      Total Winning Amount: ₹{totalWinningAmount}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </Grid>

        {/* Date Filter for all reports */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={['DatePicker']}>
                <DatePicker
                  label="Filter Reports by Date"
                  value={selectedDate}
                  onChange={(newVal) => setSelectedDate(newVal)}
                  slotProps={{
                    field: { clearable: true },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>

            <Button
              variant="outlined"
              onClick={() => setSelectedDate(null)}
            >
              Clear Filter
            </Button>
          </Stack>
        </Grid>

        {/* Deposits Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Fund Deposit</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <span>Created at</span>
                        <IconButton
                          size="small"
                          onClick={handleFundSort}
                          title={fundSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                        >
                          {fundSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Deposited by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userFundFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No deposits found</TableCell>
                    </TableRow>
                  ) : (
                    (fundrowsPerPage > 0
                      ? userFundFiltered.slice(fundpage * fundrowsPerPage, fundpage * fundrowsPerPage + fundrowsPerPage)
                      : userFundFiltered
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{fundpage * fundrowsPerPage + index + 1}</TableCell>
                        <TableCell>{singleUserInfo.username || '-'}</TableCell>
                        <TableCell align="right">{row.txDate && row.txTime ? `${dayjs(row.txDate).format('DD-MM-YYYY')} ${row.txTime.split('.')[0]}` : '-'}</TableCell>
                        <TableCell align="right">{row.amount || 0}</TableCell>
                        <TableCell align="right">{row.initiator || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {emptyRowsFund > 0 && (
                    <TableRow style={{ height: 53 * emptyRowsFund }}>
                      <TableCell colSpan={5} />
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                      colSpan={5}
                      count={userFundFiltered.length}
                      rowsPerPage={fundrowsPerPage}
                      page={fundpage}
                      onPageChange={handleChangePageFund}
                      onRowsPerPageChange={handleChangeRowsPerPageFund}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Admin transactions (all types initiated by Admin only) */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Admin transactions</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <span>Created at</span>
                        <IconButton
                          size="small"
                          onClick={handleAdminTxSort}
                          title={adminTxSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                        >
                          {adminTxSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminUserTxFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No admin transactions found</TableCell>
                    </TableRow>
                  ) : (
                    (adminTxRowsPerPage > 0
                      ? adminUserTxFiltered.slice(adminTxPage * adminTxRowsPerPage, adminTxPage * adminTxRowsPerPage + adminTxRowsPerPage)
                      : adminUserTxFiltered
                    ).map((row, index) => {
                      const amt = Number(row.amount);
                      const amountSx =
                        amt > 0
                          ? { color: 'success.main', opacity: 0.78, fontWeight: 500 }
                          : amt < 0
                            ? { color: 'error.main', opacity: 0.78, fontWeight: 500 }
                            : {};
                      return (
                      <TableRow key={row.id ?? `${row.txDate}-${row.txTime}-${index}`}>
                        <TableCell>{adminTxPage * adminTxRowsPerPage + index + 1}</TableCell>
                        <TableCell>{singleUserInfo.username || '-'}</TableCell>
                        <TableCell align="right">
                          {row.txDate && row.txTime
                            ? `${dayjs(row.txDate).format('DD-MM-YYYY')} ${String(row.txTime).split('.')[0]}`
                            : '-'}
                        </TableCell>
                        <TableCell align="right" sx={amountSx}>{row.amount ?? 0}</TableCell>
                        <TableCell align="right">{row.status || '-'}</TableCell>
                        <TableCell align="right">{row.remarks || '-'}</TableCell>
                      </TableRow>
                    );
                    })
                  )}
                  {emptyRowsAdminTx > 0 && (
                    <TableRow style={{ height: 53 * emptyRowsAdminTx }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                      colSpan={6}
                      count={adminUserTxFiltered.length}
                      rowsPerPage={adminTxRowsPerPage}
                      page={adminTxPage}
                      onPageChange={handleChangePageAdminTx}
                      onRowsPerPageChange={handleChangeRowsPerPageAdminTx}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Withdrawals Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Withdraw History</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <span>Created at</span>
                        <IconButton
                          size="small"
                          onClick={handleWithdrawSort}
                          title={withdrawSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                        >
                          {withdrawSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userWithdrawFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No withdrawals found</TableCell>
                    </TableRow>
                  ) : (
                    (withdrawrowsPerPage > 0
                      ? userWithdrawFiltered.slice(withdrawpage * withdrawrowsPerPage, withdrawpage * withdrawrowsPerPage + withdrawrowsPerPage)
                      : userWithdrawFiltered
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{withdrawpage * withdrawrowsPerPage + index + 1}</TableCell>
                        <TableCell>{singleUserInfo.username || '-'}</TableCell>
                        <TableCell align="right">{row.txDate && row.txTime ? `${dayjs(row.txDate).format('DD-MM-YYYY')} ${row.txTime.split('.')[0]}` : '-'}</TableCell>
                        <TableCell align="right">{Math.abs(row.amount || 0)}</TableCell>
                        <TableCell align="right">{row.status || 'Pending'}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {emptyRowsWithdraw > 0 && (
                    <TableRow style={{ height: 53 * emptyRowsWithdraw }}>
                      <TableCell colSpan={5} />
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                      colSpan={5}
                      count={userWithdrawFiltered.length}
                      rowsPerPage={withdrawrowsPerPage}
                      page={withdrawpage}
                      onPageChange={handleChangePageWithdraw}
                      onRowsPerPageChange={handleChangeRowsPerPageWithdraw}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Bid History Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Bid History</Typography>
            <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Game Name</InputLabel>
                <Select
                  value={selectedBidGame}
                  label="Game Name"
                  onChange={(e) => setSelectedBidGame(e.target.value)}
                >
                  <MenuItem value="">All Games</MenuItem>
                  {games.map((game) => (
                    <MenuItem key={game.name} value={game.name}>
                      {game.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Game Type</InputLabel>
                <Select
                  value={selectedBidGameType}
                  label="Game Type"
                  onChange={(e) => setSelectedBidGameType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {gameTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedBidGame('');
                  setSelectedBidGameType('');
                }}
              >
                Clear Filters
              </Button>
            </Stack>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Game</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Session</TableCell>
                    <TableCell align="right">Bet Value</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <span>Created at</span>
                        <IconButton
                          size="small"
                          onClick={handleBidSort}
                          title={bidSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                        >
                          {bidSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bidHistoryFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No bid history found</TableCell>
                    </TableRow>
                  ) : (
                    (bidrowsPerPage > 0
                      ? bidHistoryFiltered.slice(bidpage * bidrowsPerPage, bidpage * bidrowsPerPage + bidrowsPerPage)
                      : bidHistoryFiltered
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{bidpage * bidrowsPerPage + index + 1}</TableCell>
                        <TableCell>{row.gameName}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell align="center">{row.openClose || '-'}</TableCell>
                        <TableCell align="right">{row.betValue || '-'}</TableCell>
                        <TableCell align="right">{row.amount}</TableCell>
                        <TableCell align="right">
                          {row.betTime ? dayjs(row.betTime).format('DD-MM-YYYY HH:mm:ss') : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {emptyRowsBid > 0 && (
                    <TableRow style={{ height: 53 * emptyRowsBid }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                      colSpan={7}
                      count={bidHistoryFiltered.length}
                      rowsPerPage={bidrowsPerPage}
                      page={bidpage}
                      onPageChange={handleChangePageBid}
                      onRowsPerPageChange={handleChangeRowsPerPageBid}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Win History Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Win History</Typography>
            <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Game Name</InputLabel>
                <Select
                  value={selectedWinGame}
                  label="Game Name"
                  onChange={(e) => setSelectedWinGame(e.target.value)}
                >
                  <MenuItem value="">All Games</MenuItem>
                  {games.map((game) => (
                    <MenuItem key={game.name} value={game.name}>
                      {game.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Game Type</InputLabel>
                <Select
                  value={selectedWinGameType}
                  label="Game Type"
                  onChange={(e) => setSelectedWinGameType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {gameTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedWinGame('');
                  setSelectedWinGameType('');
                }}
              >
                Clear Filters
              </Button>
            </Stack>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Game</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Session</TableCell>
                    <TableCell align="right">Bet Value</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <span>Created at</span>
                        <IconButton
                          size="small"
                          onClick={handleWinSort}
                          title={winSortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                        >
                          {winSortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winHistoryFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No win history found</TableCell>
                    </TableRow>
                  ) : (
                    (winrowsPerPage > 0
                      ? winHistoryFiltered.slice(winpage * winrowsPerPage, winpage * winrowsPerPage + winrowsPerPage)
                      : winHistoryFiltered
                    ).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{winpage * winrowsPerPage + index + 1}</TableCell>
                        <TableCell>{row.gameName}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell align="center">{row.openClose || '-'}</TableCell>
                        <TableCell align="right">{row.betValue || '-'}</TableCell>
                        <TableCell align="right">{row.winAmount || 0}</TableCell>
                        <TableCell align="right">
                          {row.betTime ? dayjs(row.betTime).format('DD-MM-YYYY HH:mm:ss') : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {emptyRowsWin > 0 && (
                    <TableRow style={{ height: 53 * emptyRowsWin }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                      colSpan={7}
                      count={winHistoryFiltered.length}
                      rowsPerPage={winrowsPerPage}
                      page={winpage}
                      onPageChange={handleChangePageWin}
                      onRowsPerPageChange={handleChangeRowsPerPageWin}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
