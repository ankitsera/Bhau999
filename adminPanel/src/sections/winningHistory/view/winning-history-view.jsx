import React, { useEffect, useState } from 'react'
import { Container, Stack, IconButton, Link, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { betService } from 'src/services';
import { useGames } from 'src/contexts/GameContext';

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

const WinningHistoryView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { games } = useGames();
    const getInitialPickedDate = () => {
      const savedDate = sessionStorage.getItem('winning-history-date');
      if (savedDate === 'null') return null;
      if (savedDate) return dayjs(savedDate);
      return null;
    };
    const getInitialGame = () => sessionStorage.getItem('winning-history-game') || '';
    const getInitialGameType = () => sessionStorage.getItem('winning-history-game-type') || '';
    const [pickedDate, setPickedDate] = useState(getInitialPickedDate());
    const [selectedGame, setSelectedGame] = useState(getInitialGame());
    const [selectedGameType, setSelectedGameType] = useState(getInitialGameType());
    const [page, setPage] = React.useState(0);
    const [allWins, setAllWins] = useState([]);
    const [winHistory, setWinHistory] = useState([]);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [totalAmount, setTotalAmount] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(false);

  const gameTypes = ['Single Digit', 'Jodi', 'Single Pana', 'Double Pana', 'Triple Pana', 'Half Sangam', 'Full Sangam'];

  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [paginationDepth, setPaginationDepth] = React.useState(0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Save to sessionStorage for user-edit navigation
    sessionStorage.setItem('winning-history-page', newPage.toString());
    // Push to browser history for back/forward navigation
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'winning-history', depth: newDepth }, '', newPage === 0 ? '' : `#page-${newPage}`);
    }
  };

  // Browser history management with sessionStorage restoration
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.report === 'winning-history') {
        if (typeof event.state.depth === 'number' && typeof event.state.page === 'number') {
          setPaginationDepth(event.state.depth);
          setPage(event.state.page);
          sessionStorage.setItem('winning-history-page', event.state.page.toString());
        }
      }
    };

    if (isInitialLoad) {
      // Check if we're returning from user-edit with saved page in sessionStorage
      const savedPage = sessionStorage.getItem('winning-history-page');
      const initialPage = savedPage ? parseInt(savedPage, 10) : 0;

      window.history.replaceState({ page: initialPage, report: 'winning-history', depth: 0 }, '', initialPage === 0 ? '' : `#page-${initialPage}`);
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
    sessionStorage.setItem('winning-history-page', '0');
  };

  const handleCreatedAtSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);

    const sorted = [...winHistory].sort((a, b) => {
      const dateA = dayjs(a.betTime);
      const dateB = dayjs(b.betTime);
      return newOrder === 'desc' ? dateB.diff(dateA) : dateA.diff(dateB);
    });

    setWinHistory(sorted);
  };

  const handleClearFilter = () => {
    setPickedDate(null);
    sessionStorage.setItem('winning-history-date', 'null');
    setSelectedGame('');
    sessionStorage.setItem('winning-history-game', '');
    setSelectedGameType('');
    sessionStorage.setItem('winning-history-game-type', '');
    setPage(0);
    sessionStorage.setItem('winning-history-page', '0');
  };

  const loadAllWonBets = async () => {
    try {
      setLoading(true);
      const response = await betService.getWonBets({});
      // Sort by latest to oldest by default
      const sorted = (response.bets || []).sort((a, b) => {
        const dateA = dayjs(a.betTime);
        const dateB = dayjs(b.betTime);
        return dateB.diff(dateA);
      });
      setAllWins(sorted);
    } catch (error) {
      console.error('Error loading won bets:', error);
      setAllWins([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter wins on frontend
  useEffect(() => {
    const filtered = allWins.filter(item => {
      // Date filter
      if (pickedDate && item.betTime) {
        if (!dayjs(item.betTime).isSame(pickedDate, 'day')) return false;
      }
      // Game name filter
      if (selectedGame && item.gameName !== selectedGame) return false;
      // Game type filter
      if (selectedGameType && item.type !== selectedGameType) return false;
      return true;
    });

    setWinHistory(filtered);
    // Calculate total amount for filtered data
    const total = filtered.reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
    setTotalAmount(total);
  }, [pickedDate, selectedGame, selectedGameType, allWins]);

  useEffect(() => {
    // Load all won bets once on mount
    loadAllWonBets();
  }, []);


  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Winning History</Typography>
      </Stack>
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="Date"
              value={pickedDate}
              onChange={(newVal) => {
                setPickedDate(newVal);
                sessionStorage.setItem('winning-history-date', newVal ? newVal.format('YYYY-MM-DD') : 'null');
              }}
              slotProps={{
                field: { clearable: true },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Game Name</InputLabel>
          <Select
            value={selectedGame}
            label="Game Name"
            onChange={(e) => {
              setSelectedGame(e.target.value);
              sessionStorage.setItem('winning-history-game', e.target.value);
            }}
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
            value={selectedGameType}
            label="Game Type"
            onChange={(e) => {
              setSelectedGameType(e.target.value);
              sessionStorage.setItem('winning-history-game-type', e.target.value);
            }}
          >
            <MenuItem value="">All Types</MenuItem>
            {gameTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant='outlined' onClick={handleClearFilter} sx={{ height: '56px' }}>Clear Filters</Button>
      </Stack>
      <Typography variant="h6" mb={2}>
        Total Win Amount: ₹{totalAmount.toLocaleString()}
      </Typography>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '300px' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading winnings...</Typography>
        </Stack>
      ) : (
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
              Game Name
              </TableCell>
              <TableCell component="th" scope="row">
              Bet Type
              </TableCell>
              <TableCell component="th" scope="row">
              Bet Value
              </TableCell>
              <TableCell component="th" scope="row">
              Open/Close
              </TableCell>
              <TableCell style={{ width: 160 }} align="right">
                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                  <span>Bet Time</span>
                  <IconButton
                    size="small"
                    onClick={handleCreatedAtSort}
                    title={sortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                  >
                    {sortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                  </IconButton>
                </Stack>
              </TableCell>
              <TableCell style={{ width: 160 }} align="right">
              Win Amount
              </TableCell>
          </TableRow>
          </TableHead>
          <TableBody>
          {winHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary" py={3}>
                  No winning history found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            (rowsPerPage > 0
              ? winHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : winHistory
            ).map((row, index) => (
              <TableRow key={row.id}>
              <TableCell component="th" scope="row">
                  {page * rowsPerPage + index + 1}
              </TableCell>
              <TableCell component="th" scope="row">
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      sessionStorage.setItem('winning-history-page', page.toString());
                      navigate(`/user/${row.mobileNumber}`);
                    }}
                    sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {row.mobileNumber}
                  </Link>
              </TableCell>
              <TableCell component="th" scope="row">
                  {row.gameName}
              </TableCell>
              <TableCell component="th" scope="row">
                  {row.type}
              </TableCell>
              <TableCell component="th" scope="row">
                  {row.betValue}
              </TableCell>
              <TableCell component="th" scope="row">
                  {row.openClose}
              </TableCell>
              <TableCell style={{ width: 160 }} align="right">
                  {row.betTime ? dayjs(row.betTime).format('DD-MM-YYYY hh:mm A') : '-'}
              </TableCell>
              <TableCell style={{ width: 160 }} align="right">
                  ₹{row.winAmount}
              </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
          <TableFooter>
          <TableRow>
              <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={8}
              count={winHistory.length}
              rowsPerPage={rowsPerPage}
              page={page}
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
      )}
    </Container>
  )
}

export default WinningHistoryView
