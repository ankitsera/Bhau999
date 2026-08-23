import React, { useEffect, useState } from 'react'
import { Container, Stack, IconButton, Link, CircularProgress } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { transactionService } from 'src/services'
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
import {Box} from '@mui/material';

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

const AdminDepositHistoryView = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const getInitialPickedDate = () => {
      const savedDate = sessionStorage.getItem('admin-deposit-history-date');
      if (savedDate === 'null') return null;
      if (savedDate) return dayjs(savedDate);
      return dayjs(new Date());
    };
    const [pickedDate, setPickedDate] = useState(getInitialPickedDate())
    const [page, setPage] = React.useState(0);
    const [adminDeposits, setAdminDeposits] = useState([])
    const [allAdminDeposits, setAllAdminDeposits] = useState([])
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [totalAmount, setTotalAmount] = useState(0);
    const [filteredAmount, setFilteredAmount] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(false);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - adminDeposits.length) : 0;

  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [paginationDepth, setPaginationDepth] = React.useState(0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Save to sessionStorage for user-edit navigation
    sessionStorage.setItem('admin-deposit-history-page', newPage.toString());
    // Push to browser history for back/forward navigation
    if (!isInitialLoad) {
      const newDepth = newPage === 0 ? 0 : paginationDepth + 1;
      setPaginationDepth(newDepth);
      window.history.pushState({ page: newPage, report: 'admin-deposit-history', depth: newDepth }, '', newPage === 0 ? '' : `#page-${newPage}`);
    }
  };

  // Browser history management with sessionStorage restoration
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.report === 'admin-deposit-history') {
        if (typeof event.state.depth === 'number' && typeof event.state.page === 'number') {
          setPaginationDepth(event.state.depth);
          setPage(event.state.page);
          sessionStorage.setItem('admin-deposit-history-page', event.state.page.toString());
        }
      }
    };

    if (isInitialLoad) {
      // Check if we're returning from user-edit with saved page in sessionStorage
      const savedPage = sessionStorage.getItem('admin-deposit-history-page');
      const initialPage = savedPage ? parseInt(savedPage, 10) : 0;

      window.history.replaceState({ page: initialPage, report: 'admin-deposit-history', depth: 0 }, '', initialPage === 0 ? '' : `#page-${initialPage}`);
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
    sessionStorage.setItem('admin-deposit-history-page', '0');
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sorted = [...adminDeposits].sort((a, b) => {
      // Priority: date first, then created at time
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
    setAdminDeposits(sorted);
  };

    const loadAllAdminDeposits = async() => {
        try {
            setLoading(true);
            const response = await transactionService.getDepositsByAdmin();
            const { sum, transactions } = response;
            
            setTotalAmount(sum || 0);
            setAllAdminDeposits(transactions || []);
            
            filterDepositsByDate(transactions || [], pickedDate);
        } catch (error) {
            console.error('Error loading admin deposits:', error);
            alert('Error loading admin deposits');
        } finally {
            setLoading(false);
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
        
        setAdminDeposits(sorted);
        setFilteredAmount(date ? dateSum : totalAmount);
    };

    const handleDateChange = (newDate) => {
        setPickedDate(newDate);
        sessionStorage.setItem('admin-deposit-history-date', newDate ? newDate.format('YYYY-MM-DD') : 'null');
        filterDepositsByDate(allAdminDeposits, newDate);
        setPage(0);
        sessionStorage.setItem('admin-deposit-history-page', '0');
    };

    const handleClearFilter = () => {
        setPickedDate(null);
        sessionStorage.setItem('admin-deposit-history-date', 'null');
        filterDepositsByDate(allAdminDeposits, null);
        setPage(0);
        sessionStorage.setItem('admin-deposit-history-page', '0');
    }

    useEffect(() => {
      loadAllAdminDeposits()
    },[])


  return (
    <Container>
        <Stack direction='column' spacing={5}>
        <h1>Admin Deposit History</h1>

        <Stack direction="row" spacing={2} alignItems="center">
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
          <Button variant='outlined' onClick={handleClearFilter}>Clear Filter</Button>
        </Stack>
        <Typography variant="h6" mb={2}>
          Total Amount: ₹{pickedDate ? filteredAmount : totalAmount}
        </Typography>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '300px' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading admin deposits...</Typography>
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
                <TableCell style={{ width: 160 }} align="right">
                Created at
                </TableCell>
                <TableCell style={{ width: 160 }} align="right">
                Amount
                </TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {adminDeposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No admin deposits found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? adminDeposits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : adminDeposits
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
                          sessionStorage.setItem('admin-deposit-history-page', page.toString());
                          navigate(`/user/${row.mobileNumber}`);
                        }}
                        sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                        {row.mobileNumber}
                    </Link>
                </TableCell>
                <TableCell component="th" scope="row">
                    {dayjs(row.txDate).format('DD-MM-YYYY')}
                </TableCell>
                <TableCell style={{ width: 160 }} align="right">
                    {row.txTime ? dayjs(row.txTime, 'HH:mm:ss').format('hh:mm A') : '-'}
                </TableCell>
                <TableCell style={{ width: 160 }} align="right">
                    ₹{row.amount}
                </TableCell>
                </TableRow>
              ))
            )}
            {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={5} />
                </TableRow>
            )}
            </TableBody>
            <TableFooter>
            <TableRow>
                <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100, 500, 1000, { label: 'All', value: -1 }]}
                colSpan={5}
                count={adminDeposits.length}
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
    </Stack>
    </Container>
  )
}

export default AdminDepositHistoryView
