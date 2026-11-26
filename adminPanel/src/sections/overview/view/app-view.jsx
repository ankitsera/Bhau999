import { faker } from '@faker-js/faker';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Switch } from '@mui/material';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CasinoIcon from '@mui/icons-material/Casino';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

import { fadeUp, staggerChildren } from 'src/theme/motion';

import AppWidgetSummary from '../app-widget-summary';

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsers } from 'src/contexts/UserContext';
import { useGames } from 'src/contexts/GameContext';
import { useTransactions } from 'src/contexts/TransactionContext';
import { useWithdrawals } from 'src/contexts/WithdrawalContext';
import { useBets } from 'src/contexts/BetContext';
import { transactionService, betService } from 'src/services';
import { useAuth } from 'src/contexts/AuthContext';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ----------------------------------------------------------------------

/** Users registered on `targetDate` who have at least one deposit on that same calendar day (withdrawals excluded). */
function buildActiveUsersRegisteredWithTxOnDate(users, deposits, targetDate) {
  if (!targetDate || !dayjs(targetDate).isValid()) {
    return [];
  }
  const d = dayjs(targetDate).startOf('day');
  const dayStr = d.format('YYYY-MM-DD');
  const dayDeposits = deposits.filter(
    (t) => t.txDate && dayjs(t.txDate).format('YYYY-MM-DD') === dayStr
  );
  const uniqueMobileNumbers = [...new Set(dayDeposits.map((t) => t.mobileNumber).filter(Boolean))];
  return uniqueMobileNumbers
    .map((mobile) => {
      const user = users.find((u) => u.mobileNumber === mobile);
      return {
        mobileNumber: mobile,
        name: user?.username || 'Unknown',
        balance: user?.balance || 0,
        createdAt: user?.dateSignup,
      };
    })
    .filter(
      (user) =>
        user.createdAt &&
        dayjs(user.createdAt).isValid() &&
        dayjs(user.createdAt).isSame(d, 'day')
    );
}

// Table Pagination Actions Component
function TablePaginationActions(props) {
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

export default function AppView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users } = useUsers();
  const { games } = useGames();
  const { deposits, withdrawals } = useTransactions();
  const { getTodayUniqueBidsCount } = useBets();
  const [dashData, setDashData] = useState({
    user_count: 0,
    ifsc_red_flagged_users: 0,
    today_registrations: 0,
    bid_count: 0,
    bid_amount: 0,
    today_bid: 0,
    today_bid_amount: 0,
    today_win_amount: 0,
    today_withdrawal_requests: 0,
    today_unique_bids: 0,
    game_count: 0,
    today_active_users: 0,
    today_deposit: 0,
    today_withdraw: 0,
    total_wallet: 0,
    total_deposit_lifetime: 0,
    admin_deposit_today: 0,
    today_admin_deposit: 0
  })
  const [upprove, setUpprove] = useState(false);

  // Deposit History Table State
  const getInitialPickedDate = () => {
    const savedDate = sessionStorage.getItem('dashboard-deposit-date');
    if (savedDate === 'null') return null;
    if (savedDate) return dayjs(savedDate);
    return dayjs(new Date());
  };
  const [pickedDate, setPickedDate] = useState(getInitialPickedDate());
  const [page, setPage] = useState(0);
  const [depositData, setDepositData] = useState([]);
  const [allDeposits, setAllDeposits] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDepositAmount, setTotalDepositAmount] = useState(0);
  const [filteredDepositAmount, setFilteredDepositAmount] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');

  // Market Bid Details State
  const [marketBidDate, setMarketBidDate] = useState(dayjs());
  const [marketBidData, setMarketBidData] = useState({
    totalBidAmount: 0,
    withdrawRequest: 0,
    totalWinningAmount: 0,
    totalDepositUPI: 0,
    totalProfit: 0,
    addFundsByAdmin: 0
  });
  const [allAdminDeposits, setAllAdminDeposits] = useState([]);
  const [totalAdminDepositAmount, setTotalAdminDepositAmount] = useState(0);
  const [allBets, setAllBets] = useState([]);
  const [totalBetAmount, setTotalBetAmount] = useState(0);

  // Today Active Users Dialog State
  const [activeUsersDialogOpen, setActiveUsersDialogOpen] = useState(false);
  const [activeUsersDialogDate, setActiveUsersDialogDate] = useState(() => dayjs());
  const [activeUsersPage, setActiveUsersPage] = useState(0);
  const [activeUsersRowsPerPage, setActiveUsersRowsPerPage] = useState(10);

  const dialogActiveUsersList = React.useMemo(
    () => buildActiveUsersRegisteredWithTxOnDate(users, deposits, activeUsersDialogDate),
    [users, deposits, activeUsersDialogDate]
  );

  React.useEffect(() => {
    setActiveUsersPage(0);
  }, [activeUsersDialogDate]);

  // Update dashboard data with context values
  const getData = async() => {
    const today = dayjs().format('YYYY-MM-DD');

    // Calculate today's registrations
    const todayRegistrations = users.filter(u => {
      if (!u.dateSignup) return false;
      const userDate = dayjs(u.dateSignup);
      return userDate.isValid() && userDate.startOf('day').isSame(dayjs(today).startOf('day'));
    }).length;

    // Calculate today's admin deposits from API data
    const todayAdminDeposits = allAdminDeposits.filter(d =>
      dayjs(d.txDate).format('YYYY-MM-DD') === today
    );
    const todayAdminDepositSum = todayAdminDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate today's deposits (user initiated only)
    const todayDeposits = deposits.filter(d =>
      d.initiator?.toLowerCase() === 'user' &&
      dayjs(d.txDate).format('YYYY-MM-DD') === today
    );
    const todayDepositSum = todayDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Today's active users: registered today with at least one deposit today
    const activeUsersData = buildActiveUsersRegisteredWithTxOnDate(users, deposits, dayjs());

    // Calculate today's approved withdrawals (user initiated only)
    const todayWithdrawals = withdrawals.filter(w =>
      w.status === 'Approved' &&
      w.initiator?.toLowerCase() === 'user' &&
      dayjs(w.txDate).format('YYYY-MM-DD') === today
    );
    const todayWithdrawSum = todayWithdrawals.reduce((sum, w) => sum + Math.abs(w.amount || 0), 0);

    // Calculate total wallet balance
    const totalWallet = users.reduce((sum, user) => sum + (user.balance || 0), 0);

    // Calculate total deposit lifetime (all user deposits)
    const totalDepositLifetime = deposits
      .filter(d => d.initiator?.toLowerCase() === 'user')
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate admin deposits (today only)
    const adminDepositsToday = deposits.filter(d =>
      d.initiator?.toLowerCase() === 'admin' &&
      dayjs(d.txDate).format('YYYY-MM-DD') === today
    );
    const adminDepositTodaySum = adminDepositsToday.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate today's bets from allBets
    const todayBets = allBets.filter(b =>
      dayjs(b.betTime).format('YYYY-MM-DD') === today
    );
    const todayBidCount = todayBets.length;
    const todayBidAmount = todayBets.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate today's win amount from won bets
    const todayWonBets = allBets.filter(b =>
      b.result?.toLowerCase() === 'won' &&
      dayjs(b.betTime).format('YYYY-MM-DD') === today
    );
    const todayWinAmount = todayWonBets.reduce((sum, b) => sum + (b.winAmount || 0), 0);

    // Calculate today's withdrawal requests count
    const todayWithdrawalRequests = withdrawals.filter(w => {
      if (!w.txDate) return false;
      return dayjs(w.txDate).format('YYYY-MM-DD') === today;
    }).length;

    const calculatedData = {
      user_count: users.length,
      ifsc_red_flagged_users: users.filter((user) => user.ifscRedFlagged).length,
      today_registrations: todayRegistrations,
      bid_count: allBets.length,
      bid_amount: totalBetAmount,
      today_bid: todayBidCount,
      today_bid_amount: todayBidAmount,
      today_win_amount: todayWinAmount,
      today_withdrawal_requests: todayWithdrawalRequests,
      today_unique_bids: getTodayUniqueBidsCount(),
      game_count: games.length,
      today_active_users: activeUsersData.length,
      today_deposit: todayDepositSum,
      today_withdraw: todayWithdrawSum,
      total_wallet: totalWallet,
      total_deposit_lifetime: totalDepositLifetime,
      admin_deposit_today: adminDepositTodaySum,
      today_admin_deposit: todayAdminDepositSum
    }
    setDashData(calculatedData)
  }

  const getApproveStatus = async() => {
    // try {
    //   let res = await fetch(`${API_URL}users/all-user-info/upprove-status/`)
    //   let data = await res.json()
    //   console.log(data.upprove_all)
    //   setUpprove(data.upprove_all)
    // } catch (error) {
    //   console.log(error)
    // }

    // DUMMY DATA
    setUpprove(true)
  }

  const handleApprove = async() => {
    // try {
    //   console.log(!upprove)
    //    let res = await fetch(`${API_URL}users/all-user-info/upprove-user/`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Accept: "application/json"
    //     },
    //     body: JSON.stringify({
    //       upprove_all: !upprove
    //     })
    //    })
    //    let data = await res.json()
    //    console.log(data)
    //    if (res.status == 200){
    //     setUpprove(!upprove)
    //    }else {
    //     alert("Something Went Wrong")
    //    }
    // } catch (error) {
    //   console.log(error)
    // }

    // DUMMY - Just toggle the state
    setUpprove(!upprove)
    alert("Approval status updated (dummy)")
  }

  // Market Bid Details Functions
  const loadAdminDeposits = async() => {
    try {
      const response = await transactionService.getDepositsByAdmin();
      const { sum, transactions } = response;

      setTotalAdminDepositAmount(sum || 0);
      setAllAdminDeposits(transactions || []);
      return transactions || [];
    } catch (error) {
      console.error('Error loading admin deposits:', error);
      return [];
    }
  };

  const loadBets = async() => {
    try {
      const response = await betService.getAllBets({});
      setAllBets(response.bets || []);
      setTotalBetAmount(response.sum || 0);
    } catch (error) {
      console.error('Error loading bets:', error);
      setAllBets([]);
      setTotalBetAmount(0);
    }
  };

  const calculateMarketBidData = async(date) => {
    try {
      let totalDepositUPI, addFundsByAdmin, withdrawRequest, totalBidAmount, totalWinningAmount;

      if (date) {
        // Filter by specific date
        const selectedDate = dayjs(date).format('YYYY-MM-DD');

        // Filter deposits by date (user-initiated only)
        const dateDeposits = deposits.filter(d =>
          d.initiator?.toLowerCase() === 'user' &&
          dayjs(d.txDate).format('YYYY-MM-DD') === selectedDate
        );
        totalDepositUPI = dateDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

        // Filter admin deposits by date from API data
        const dateAdminDeposits = allAdminDeposits.filter(d =>
          dayjs(d.txDate).format('YYYY-MM-DD') === selectedDate
        );
        addFundsByAdmin = dateAdminDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

        // Filter withdrawals by date (approved only)
        const dateWithdrawals = withdrawals.filter(w =>
          w.status === 'Approved' &&
          dayjs(w.txDate).format('YYYY-MM-DD') === selectedDate
        );
        withdrawRequest = dateWithdrawals.reduce((sum, w) => sum + Math.abs(w.amount || 0), 0);

        // Filter bets by date
        const dateBets = allBets.filter(b =>
          dayjs(b.betTime).format('YYYY-MM-DD') === selectedDate
        );
        totalBidAmount = dateBets.reduce((sum, b) => sum + (b.amount || 0), 0);

        // Filter won bets by date
        const dateWonBets = dateBets.filter(b => b.result?.toLowerCase() === 'won');
        totalWinningAmount = dateWonBets.reduce((sum, b) => sum + (b.winAmount || 0), 0);
      } else {
        // No date filter - show all-time totals
        totalDepositUPI = deposits
          .filter(d => d.initiator?.toLowerCase() === 'user')
          .reduce((sum, d) => sum + (d.amount || 0), 0);

        addFundsByAdmin = allAdminDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

        withdrawRequest = withdrawals
          .filter(w => w.status === 'Approved')
          .reduce((sum, w) => sum + Math.abs(w.amount || 0), 0);

        // Calculate total bid amount from all bets
        totalBidAmount = allBets.reduce((sum, b) => sum + (b.amount || 0), 0);

        // Calculate total winning amount from won bets
        const wonBets = allBets.filter(b => b.result?.toLowerCase() === 'won');
        totalWinningAmount = wonBets.reduce((sum, b) => sum + (b.winAmount || 0), 0);
      }

      const totalProfit = totalBidAmount - totalWinningAmount;

      setMarketBidData({
        totalBidAmount,
        withdrawRequest,
        totalWinningAmount,
        totalDepositUPI,
        totalProfit,
        addFundsByAdmin
      });
    } catch (error) {
      console.error('Error calculating market bid data:', error);
    }
  };

  const handleMarketBidDateChange = (newDate) => {
    setMarketBidDate(newDate);
    calculateMarketBidData(newDate);
  };

  const handleClearMarketBidFilter = () => {
    setMarketBidDate(null);
    calculateMarketBidData(null);
  };

  // Deposit History Functions
  const loadAllDeposits = async() => {
    try {
      const response = await transactionService.getAllDeposits();
      const { sum, transactions } = response;

      setTotalDepositAmount(sum || 0);
      setAllDeposits(transactions || []);

      filterDepositsByDate(transactions || [], pickedDate);
    } catch (error) {
      console.error('Error loading deposits:', error);
    }
  };

  const filterDepositsByDate = (deposits, date) => {
    let result = deposits;

    if (date) {
      // Filter by selected date
      result = deposits.filter(tx => {
        if (!tx.txDate) return false;
        return dayjs(tx.txDate).isSame(date, 'day');
      });
    }

    // Sort by date desc (latest first), then by time desc
    const sorted = result.sort((a, b) => {
      const dateA = dayjs(a.txDate);
      const dateB = dayjs(b.txDate);

      // Compare dates first
      if (!dateA.isSame(dateB, 'day')) {
        return dateB.diff(dateA); // Latest date first
      }

      // If dates are same, compare times
      const timeA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
      const timeB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
      return timeB.diff(timeA); // Latest time first
    });

    // Calculate sum
    const dateSum = result.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    setDepositData(sorted);
    setFilteredDepositAmount(date ? dateSum : totalDepositAmount);
  };

  const handleDateChange = (newDate) => {
    setPickedDate(newDate);
    sessionStorage.setItem('dashboard-deposit-date', newDate ? newDate.format('YYYY-MM-DD') : 'null');
    filterDepositsByDate(allDeposits, newDate);
    setPage(0);
    sessionStorage.setItem('dashboard-deposit-page', '0');
  };

  const handleClearDepositFilter = () => {
    setPickedDate(null);
    sessionStorage.setItem('dashboard-deposit-date', 'null');
    filterDepositsByDate(allDeposits, null);
    setPage(0);
    sessionStorage.setItem('dashboard-deposit-page', '0');
  };

  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [paginationDepth, setPaginationDepth] = React.useState(0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Save to sessionStorage for user-edit navigation
    sessionStorage.setItem('dashboard-deposit-page', newPage.toString());
    // Push to browser history for back/forward navigation
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'dashboard-deposit', depth: newDepth }, '', newPage === 0 ? '' : `#page-${newPage}`);
    }
  };

  // Browser history management with sessionStorage restoration
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.report === 'dashboard-deposit') {
        if (typeof event.state.depth === 'number' && typeof event.state.page === 'number') {
          setPaginationDepth(event.state.depth);
          setPage(event.state.page);
          sessionStorage.setItem('dashboard-deposit-page', event.state.page.toString());
        }
      }
    };

    if (isInitialLoad) {
      // Check if we're returning from user-edit with saved page in sessionStorage
      const savedPage = sessionStorage.getItem('dashboard-deposit-page');
      const initialPage = savedPage ? parseInt(savedPage, 10) : 0;

      window.history.replaceState({ page: initialPage, report: 'dashboard-deposit', depth: 0 }, '', initialPage === 0 ? '' : `#page-${initialPage}`);
      setIsInitialLoad(false);

      if (savedPage && !isNaN(initialPage) && initialPage > 0) {
        setPage(initialPage);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInitialLoad, paginationDepth]);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    sessionStorage.setItem('dashboard-deposit-page', '0');
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sorted = [...depositData].sort((a, b) => {
      // Priority: date first, then time
      const dateA = dayjs(a.txDate);
      const dateB = dayjs(b.txDate);

      // Compare dates first
      if (!dateA.isSame(dateB, 'day')) {
        if (newOrder === 'desc') {
          return dateB.diff(dateA);
        }
        return dateA.diff(dateB);
      }

      // If dates are same, compare times
      const timeA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`);
      const timeB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`);
      if (newOrder === 'desc') {
        return timeB.diff(timeA);
      }
      return timeA.diff(timeB);
    });
    setDepositData(sorted);
  };

  useEffect(() => {
    const initializeData = async () => {
      await getData();
      await getApproveStatus();
      await loadAllDeposits();
      await loadAdminDeposits();
      await loadBets();
    };
    initializeData();
  }, [])

  // Calculate market bid data after admin deposits and bets are loaded
  useEffect(() => {
    if (allAdminDeposits.length >= 0 || allBets.length >= 0) {
      calculateMarketBidData(marketBidDate);
    }
  }, [allAdminDeposits, deposits, withdrawals, allBets, marketBidDate])

  // Recalculate dashboard data when dependencies change
  useEffect(() => {
    getData();
  }, [users, deposits, withdrawals, games, allBets]);


  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 5, color: 'secondary.main', ...fadeUp(0) }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3} sx={staggerChildren()}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Total Users"
            total={dashData.user_count}
            color="primary"
            icon={<PeopleAltIcon />}
            onClick={() => navigate('/user')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="IFSC Red Flags"
            total={dashData.ifsc_red_flagged_users}
            color="error"
            icon={<ReportProblemOutlinedIcon />}
            onClick={() => navigate('/user', { state: { showIfscRedFlags: true } })}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Registrations"
            total={dashData.today_registrations}
            color="info"
            icon={<PersonAddIcon />}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Active Users"
            total={dashData.today_active_users}
            color="primary"
            icon={<PersonIcon />}
            onClick={() => {
              setActiveUsersDialogDate(dayjs());
              setActiveUsersPage(0);
              setActiveUsersDialogOpen(true);
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Bid"
            total={dashData.today_bid}
            color="secondary"
            icon={<CasinoIcon />}
            onClick={() => navigate('/bid-history')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Unique Bids"
            total={dashData.today_unique_bids}
            color="info"
            icon={<CasinoIcon />}
            onClick={() => navigate('/bid-history')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Bid Amount"
            total={dashData.today_bid_amount}
            color="warning"
            icon={<AttachMoneyIcon />}
            onClick={() => navigate('/bid-history')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Total Games"
            total={dashData.game_count}
            color="secondary"
            icon={<SportsEsportsIcon />}
            onClick={() => navigate('/game-setting')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Total Wallet"
            total={dashData.total_wallet}
            color="primary"
            icon={<AccountBalanceWalletIcon />}
            onClick={() => navigate('/user', { state: { presetBalanceSort: 'desc' } })}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Deposit"
            total={dashData.today_deposit}
            color="success"
            icon={<AttachMoneyIcon />}
            onClick={() => navigate('/deposit-history')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Withdraw"
            total={dashData.today_withdraw}
            color="error"
            icon={<MoneyOffIcon />}
            onClick={() => navigate('/withdraw')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Today Withdrawal Requests"
            total={dashData.today_withdrawal_requests}
            color="error"
            icon={<MoneyOffIcon />}
            onClick={() => navigate('/withdraw')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Total Deposit"
            total={dashData.total_deposit_lifetime}
            color="success"
            icon={<AttachMoneyIcon />}
            onClick={() => navigate('/deposit-history')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title="Admin Deposit"
            total={dashData.today_admin_deposit}
            color="warning"
            icon={<AdminPanelSettingsIcon />}
          />
        </Grid>
      </Grid>

      {/* Market Bid Details Section */}
      <Typography variant="h5" sx={{ mt: 5, mb: 3 }}>Market Bid Details</Typography>

      <Stack direction='row' spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="Filter by Date"
              value={marketBidDate}
              onChange={handleMarketBidDateChange}
              slotProps={{
                field: { clearable: true },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>

        <Button
          variant="outlined"
          onClick={handleClearMarketBidFilter}
        >
          Clear Filters
        </Button>
      </Stack>

      <Grid container spacing={3}>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1">Total Bid Amount: ₹{marketBidData.totalBidAmount.toLocaleString()}</Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/bid-history')}>View</Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1">Approved Withdraw Request: ₹{marketBidData.withdrawRequest.toLocaleString()}</Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/withdraw')}>View</Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1">Total Winning Amount: ₹{marketBidData.totalWinningAmount.toLocaleString()}</Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/winning-history')}>View</Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1">Total Deposit(UPI): ₹{marketBidData.totalDepositUPI.toLocaleString()}</Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/deposit-history')}>View</Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1" sx={{ color: marketBidData.totalProfit >= 0 ? 'success.main' : 'error.main' }}>
              Total Profit Amount: ₹{marketBidData.totalProfit.toLocaleString()}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="body1">Add Funds by Admin: ₹{marketBidData.addFundsByAdmin.toLocaleString()}</Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/admin-deposit-history')}>View</Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Deposit History Section - Full Report */}
      <Typography variant="h5" sx={{ mt: 5, mb: 3 }}>Deposit History</Typography>

      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="Filter by Date"
              value={pickedDate}
              onChange={handleDateChange}
              slotProps={{
                field: { clearable: true },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
        <Button variant='outlined' onClick={handleClearDepositFilter}>Clear Filter</Button>
      </Stack>

      <Typography variant="h6" mb={2}>
        Total Amount: ₹{pickedDate ? filteredDepositAmount.toLocaleString() : totalDepositAmount.toLocaleString()}
      </Typography>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="deposit history table">
          <TableHead>
            <TableRow>
              <TableCell>S.No.</TableCell>
              <TableCell>Mobile Number</TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>Date</span>
                  <IconButton
                    size="small"
                    onClick={handleSort}
                    title={sortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                  >
                    {sortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                  </IconButton>
                </Stack>
              </TableCell>
              <TableCell align="right">Created at</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? depositData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : depositData
            ).map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      sessionStorage.setItem('dashboard-deposit-page', page.toString());
                      navigate(`/user/${row.mobileNumber}`);
                    }}
                    sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {row.mobileNumber}
                  </Link>
                </TableCell>
                <TableCell>{dayjs(row.txDate).format('DD-MM-YYYY')}</TableCell>
                <TableCell align="right">
                  {row.txTime ? dayjs(row.txTime, 'HH:mm:ss').format('hh:mm A') : '-'}
                </TableCell>
                <TableCell align="right">₹{row.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100, { label: 'All', value: -1 }]}
                colSpan={5}
                count={depositData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                slotProps={{
                  select: {
                    inputProps: { 'aria-label': 'rows per page' },
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

      <Stack direction='row' spacing={2} style={{marginTop: "20px"}} alignItems='center'>
        <p>Set Approval Status</p>
        <Switch checked={upprove} onChange={handleApprove} inputProps={{ 'aria-label': 'controlled' }} />
      </Stack>

      {/* Today Active Users Dialog */}
      <Dialog
        open={activeUsersDialogOpen}
        onClose={() => setActiveUsersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Active users ({activeUsersDialogDate ? activeUsersDialogDate.format('DD-MM-YYYY') : ''}) — {dialogActiveUsersList.length}
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 1 }} alignItems="center" flexWrap="wrap">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={['DatePicker']}>
                <DatePicker
                  label="Registered with deposit on"
                  value={activeUsersDialogDate}
                  onChange={(newVal) => setActiveUsersDialogDate(newVal && dayjs(newVal).isValid() ? dayjs(newVal) : dayjs())}
                  slotProps={{
                    field: { clearable: false },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogActiveUsersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No users registered on this date with a deposit the same day
                    </TableCell>
                  </TableRow>
                ) : (
                  dialogActiveUsersList
                    .slice(activeUsersPage * activeUsersRowsPerPage, activeUsersPage * activeUsersRowsPerPage + activeUsersRowsPerPage)
                    .map((user, index) => (
                      <TableRow key={user.mobileNumber}>
                        <TableCell>{activeUsersPage * activeUsersRowsPerPage + index + 1}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => {
                              setActiveUsersDialogOpen(false);
                              navigate(`/user/${user.mobileNumber}`, { state: { returnPage: page, returnPath: '/dashboard' } });
                            }}
                            sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {user.mobileNumber}
                          </Link>
                        </TableCell>
                        <TableCell align="right">₹{user.balance.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={4}
                    count={dialogActiveUsersList.length}
                    rowsPerPage={activeUsersRowsPerPage}
                    page={activeUsersPage}
                    onPageChange={(event, newPage) => setActiveUsersPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setActiveUsersRowsPerPage(parseInt(event.target.value, 10));
                      setActiveUsersPage(0);
                    }}
                    ActionsComponent={TablePaginationActions}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveUsersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
