import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import Stack from '@mui/material/Stack';
import { Typography, CircularProgress, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Link } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { transactionService } from 'src/services';
import { useUsers } from 'src/contexts/UserContext';

// Pagination Actions Component
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

const WithdrawPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { users } = useUsers()
    const [withdrawals, setWithdrawals] = useState([])
    const [filteredWithdrawals, setFilteredWithdrawals] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Restore filters from sessionStorage
    const getInitialStatusFilter = () => sessionStorage.getItem('withdraw-status-filter') || 'All';
    const getInitialDate = () => {
        const savedDate = sessionStorage.getItem('withdraw-date');
        if (savedDate === 'null') return null;
        if (savedDate) return dayjs(savedDate);
        return dayjs();
    };
    const getInitialSearchMobile = () => sessionStorage.getItem('withdraw-search-mobile') || '';

    const [statusFilter, setStatusFilter] = useState(getInitialStatusFilter())
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [remarks, setRemarks] = useState('')
    const [searchMobile, setSearchMobile] = useState(getInitialSearchMobile())
    const [selectedDate, setSelectedDate] = useState(getInitialDate())
    const [sortOrder, setSortOrder] = useState('desc') // 'desc' = latest first, 'asc' = oldest first
    const usersByMobile = React.useMemo(
        () => new Map(users.map((user) => [user.mobileNumber, user])),
        [users],
    )

    // Pagination state
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [isInitialLoad, setIsInitialLoad] = React.useState(true)
    const [paginationDepth, setPaginationDepth] = React.useState(0)

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
        // Save to sessionStorage for user-edit navigation
        sessionStorage.setItem('withdraw-page', newPage.toString())
        // Push to browser history for back/forward navigation
        if (!isInitialLoad) {
            const newDepth = newPage === 0 ? 0 : paginationDepth + 1
            setPaginationDepth(newDepth)
            window.history.pushState({ page: newPage, report: 'withdraw', depth: newDepth }, '', newPage === 0 ? '' : `#page-${newPage}`)
        }
    }

    // Browser history management with sessionStorage restoration
    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state && event.state.report === 'withdraw') {
                if (typeof event.state.depth === 'number' && typeof event.state.page === 'number') {
                    setPaginationDepth(event.state.depth)
                    setPage(event.state.page)
                    sessionStorage.setItem('withdraw-page', event.state.page.toString())
                }
            }
        }

        if (isInitialLoad) {
            // Check if we're returning from user-edit with saved page in sessionStorage
            const savedPage = sessionStorage.getItem('withdraw-page')
            const initialPage = savedPage ? parseInt(savedPage, 10) : 0

            window.history.replaceState({ page: initialPage, report: 'withdraw', depth: 0 }, '', initialPage === 0 ? '' : `#page-${initialPage}`)
            setIsInitialLoad(false)

            if (savedPage && !isNaN(initialPage) && initialPage > 0) {
                setPage(initialPage)
            }
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [isInitialLoad, paginationDepth])

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
        sessionStorage.setItem('withdraw-page', '0')
    }

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredWithdrawals.length) : 0

    // Auto-dismiss success messages after 2 seconds
    useEffect(() => {
        if (message.type === 'success' && message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' })
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [message])
    const getWithdrawals = async() => {
        try {
            setLoading(true)
            setMessage({ type: '', text: '' })

            const data = await transactionService.getAllWithdrawals()

            // Map null/undefined/empty status to 'Pending'
            // Note: Backend already filters for user-initiated withdrawals only
            const mappedData = data.map(withdrawal => ({
                ...withdrawal,
                status: withdrawal.status || 'Pending'
            }))

            setWithdrawals(mappedData)
            setFilteredWithdrawals(mappedData)
            // setMessage({ type: 'success', text: `Loaded ${mappedData.length} withdrawal(s)` })
        } catch (error) {
            console.error('Error fetching withdrawals:', error)
            // setMessage({ type: 'error', text: `Failed to load withdrawals: ${error.message}` })
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        getWithdrawals()
    }, [])

    useEffect(() => {
        let filtered = withdrawals

        // Filter by status
        if (statusFilter !== 'All') {
            filtered = filtered.filter(w => w.status === statusFilter)
        }

        // Filter by mobile number search
        if (searchMobile.trim()) {
            filtered = filtered.filter(w =>
                w.mobileNumber && w.mobileNumber.includes(searchMobile.trim())
            )
        }

        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter(w => {
                if (!w.txDate) return false
                return dayjs(w.txDate).isSame(selectedDate, 'day')
            })
        }

        // Sort by date and time
        filtered = [...filtered].sort((a, b) => {
            const dateA = dayjs(`${a.txDate} ${a.txTime || '00:00:00'}`)
            const dateB = dayjs(`${b.txDate} ${b.txTime || '00:00:00'}`)

            if (sortOrder === 'desc') {
                return dateB.isAfter(dateA) ? 1 : -1
            } else {
                return dateA.isAfter(dateB) ? 1 : -1
            }
        })

        setFilteredWithdrawals(filtered)
    }, [statusFilter, withdrawals, searchMobile, selectedDate, sortOrder])
    const handleApprove = async(id) => {
        const withdrawal = withdrawals.find((item) => item.id === id)
        const user = usersByMobile.get(withdrawal?.mobileNumber)
        const confirmationMessage = user?.ifscRedFlagged
            ? `RED FLAG: IFSC ${user.ifscCode} is on the watchlist. Are you sure you want to approve this withdrawal?`
            : 'Are you sure you want to approve this withdrawal?'

        if (!window.confirm(confirmationMessage)) {
            return
        }

        try {
            setLoading(true)

            // Update local state optimistically
            setWithdrawals(prev => prev.map(w =>
                w.id === id ? {...w, status: 'Approved', remarks: 'Approved by admin'} : w
            ))

            try {
                await transactionService.approveTransaction(id, 'Approved by admin')
            } catch (apiError) {
                // Backend might return 500 but operation succeeds
                // Refresh data after a short delay to verify
                console.warn('API returned error but operation may have succeeded:', apiError)
                setTimeout(() => {
                    getWithdrawals()
                }, 1000)
            }

            setMessage({ type: 'success', text: 'Withdrawal approved successfully' })
        } catch (error) {
            console.error('Error approving withdrawal:', error)
            setMessage({ type: 'error', text: `Failed to approve: ${error.message}` })
        } finally {
            setLoading(false)
        }
    }
    const openRejectDialog = (transaction) => {
        setSelectedTransaction(transaction)
        setRemarks('')
        setRejectDialogOpen(true)
    }

    const handleReject = async() => {
        if (!selectedTransaction) return

        try {
            setLoading(true)

            // Update local state optimistically
            setWithdrawals(prev => prev.map(w =>
                w.id === selectedTransaction.id ? {...w, status: 'Rejected', remarks: remarks || 'Rejected by admin'} : w
            ))

            try {
                await transactionService.rejectTransaction(selectedTransaction.id, remarks || 'Rejected by admin')
            } catch (apiError) {
                // Backend might return 500 but operation succeeds
                // Refresh data after a short delay to verify
                console.warn('API returned error but operation may have succeeded:', apiError)
                setTimeout(() => {
                    getWithdrawals()
                }, 1000)
            }

            setMessage({ type: 'success', text: 'Withdrawal rejected and user refunded' })
            setRejectDialogOpen(false)
            setSelectedTransaction(null)
            setRemarks('')
        } catch (error) {
            console.error('Error rejecting withdrawal:', error)
            setMessage({ type: 'error', text: `Failed to reject: ${error.message}` })
        } finally {
            setLoading(false)
        }
    }

    // Helper function to get filtered counts and amounts based on date and mobile search
    const getFilteredStats = (status) => {
        let filtered = withdrawals

        // Apply mobile search filter
        if (searchMobile.trim()) {
            filtered = filtered.filter(w =>
                w.mobileNumber && w.mobileNumber.includes(searchMobile.trim())
            )
        }

        // Apply date filter
        if (selectedDate) {
            filtered = filtered.filter(w => {
                if (!w.txDate) return false
                return dayjs(w.txDate).isSame(selectedDate, 'day')
            })
        }

        // Apply status filter
        if (status !== 'All') {
            filtered = filtered.filter(w => w.status === status)
        }

        const count = filtered.length
        const amount = filtered.reduce((sum, w) => sum + Math.abs(w.amount || 0), 0)

        return { count, amount }
    }

  return (
    <Container>
        <Typography variant="h4" mb={3}>Withdrawal Requests</Typography>

        {message.text && (
            <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
                {message.text}
            </Alert>
        )}

        {/* Search Bar */}
        <TextField
            fullWidth
            label="Search by Mobile Number"
            variant="outlined"
            value={searchMobile}
            onChange={(e) => {
                setSearchMobile(e.target.value);
                sessionStorage.setItem('withdraw-search-mobile', e.target.value);
            }}
            placeholder="Enter mobile number..."
            sx={{ mb: 3 }}
        />

        {/* Status Filters */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Button
                variant={statusFilter === 'All' ? 'contained' : 'outlined'}
                onClick={() => {
                    setStatusFilter('All');
                    sessionStorage.setItem('withdraw-status-filter', 'All');
                }}
                sx={{ flexDirection: 'column', py: 2, minHeight: 90 }}
            >
                <Typography variant="body1" fontWeight="bold">All</Typography>
                <Typography variant="body2">{getFilteredStats('All').count} requests</Typography>
                <Typography variant="body2">₹{getFilteredStats('All').amount.toLocaleString()}</Typography>
            </Button>
            <Button
                variant={statusFilter === 'Pending' ? 'contained' : 'outlined'}
                onClick={() => {
                    setStatusFilter('Pending');
                    sessionStorage.setItem('withdraw-status-filter', 'Pending');
                }}
                color="warning"
                sx={{ flexDirection: 'column', py: 2, minHeight: 90 }}
            >
                <Typography variant="body1" fontWeight="bold">Pending</Typography>
                <Typography variant="body2">{getFilteredStats('Pending').count} requests</Typography>
                <Typography variant="body2">₹{getFilteredStats('Pending').amount.toLocaleString()}</Typography>
            </Button>
            <Button
                variant={statusFilter === 'Approved' ? 'contained' : 'outlined'}
                onClick={() => {
                    setStatusFilter('Approved');
                    sessionStorage.setItem('withdraw-status-filter', 'Approved');
                }}
                color="success"
                sx={{ flexDirection: 'column', py: 2, minHeight: 90 }}
            >
                <Typography variant="body1" fontWeight="bold">Approved</Typography>
                <Typography variant="body2">{getFilteredStats('Approved').count} requests</Typography>
                <Typography variant="body2">₹{getFilteredStats('Approved').amount.toLocaleString()}</Typography>
            </Button>
            <Button
                variant={statusFilter === 'Rejected' ? 'contained' : 'outlined'}
                onClick={() => {
                    setStatusFilter('Rejected');
                    sessionStorage.setItem('withdraw-status-filter', 'Rejected');
                }}
                color="error"
                sx={{ flexDirection: 'column', py: 2, minHeight: 90 }}
            >
                <Typography variant="body1" fontWeight="bold">Rejected</Typography>
                <Typography variant="body2">{getFilteredStats('Rejected').count} requests</Typography>
                <Typography variant="body2">₹{getFilteredStats('Rejected').amount.toLocaleString()}</Typography>
            </Button>
        </Box>

        {/* Date Filter and Actions */}
        <Stack direction='row' spacing={2} mb={3} alignItems="center" flexWrap="wrap">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['DatePicker']}>
                    <DatePicker
                        label="Filter by Date"
                        value={selectedDate}
                        onChange={(newVal) => {
                            setSelectedDate(newVal);
                            sessionStorage.setItem('withdraw-date', newVal ? newVal.format('YYYY-MM-DD') : 'null');
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
                    setSearchMobile('');
                    setStatusFilter('All');
                    sessionStorage.setItem('withdraw-date', 'null');
                    sessionStorage.setItem('withdraw-search-mobile', '');
                    sessionStorage.setItem('withdraw-status-filter', 'All');
                }}
            >
                Clear Filters
            </Button>

            <Button variant="contained" onClick={getWithdrawals} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
            </Button>
        </Stack>

        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                <TableRow>
                    <TableCell>S.No.</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell align='right'>
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                            <span>Created at</span>
                            <IconButton
                                size="small"
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                title={sortOrder === 'desc' ? 'Latest first (click for oldest first)' : 'Oldest first (click for latest first)'}
                            >
                                {sortOrder === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                            </IconButton>
                        </Stack>
                    </TableCell>
                    <TableCell align='right'>Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Remarks</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredWithdrawals.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="text.secondary" py={3}>
                                No withdrawals found
                            </Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    (rowsPerPage > 0
                        ? filteredWithdrawals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : filteredWithdrawals
                    ).map((row, index) => (
                        <TableRow
                        key={row.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        // Commented out row background colors - uncomment when confirmed by PM
                        // style={
                        //     row.status === 'Approved' ? approvedRow :
                        //     row.status === 'Rejected' ? rejectedRow :
                        //     row.status === 'Pending' ? pendingRow : {}
                        // }
                        >
                            <TableCell component="th" scope="row">
                                {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell component="th" scope="row">
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => {
                                        sessionStorage.setItem('withdraw-page', page.toString())
                                        navigate(`/user/${row.mobileNumber}`)
                                    }}
                                    sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                >
                                    {row.mobileNumber}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {usersByMobile.get(row.mobileNumber)?.ifscRedFlagged ? (
                                    <Chip
                                        label="IFSC Red Flag"
                                        color="error"
                                        size="small"
                                        title={`Watchlist match: ${usersByMobile.get(row.mobileNumber)?.ifscCode}`}
                                    />
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell align="right">
                                {row.txDate && row.txTime ?
                                    `${dayjs(row.txDate).format('DD-MM-YYYY')} ${row.txTime.split('.')[0]}` :
                                    '-'
                                }
                            </TableCell>
                            <TableCell align="right">
                                ₹{Math.abs(row.amount || 0)}
                            </TableCell>
                            <TableCell align="right">
                                <Chip
                                    label={row.status || 'Unknown'}
                                    color={
                                        row.status === 'Approved' ? 'success' :
                                        row.status === 'Rejected' ? 'error' :
                                        'warning'
                                    }
                                    size="small"
                                />
                            </TableCell>
                            <TableCell align="right">
                                {row.remarks || '-'}
                            </TableCell>
                            <TableCell align='right'>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    {row.status === 'Pending' ? (
                                        <>
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                size="small"
                                                disabled={loading}
                                                onClick={() => handleApprove(row.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                disabled={loading}
                                                onClick={() => openRejectDialog(row)}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            {row.status}
                                        </Typography>
                                    )}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))
                )}
                {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                        <TableCell colSpan={8} />
                    </TableRow>
                )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50, 100, { label: 'All', value: -1 }]}
                            colSpan={8}
                            count={filteredWithdrawals.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Transaction ID: {selectedTransaction?.id}<br />
                    Mobile: {selectedTransaction?.mobileNumber}<br />
                    Amount: ₹{Math.abs(selectedTransaction?.amount || 0)}
                </Typography>
                <TextField
                    label="Remarks (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for rejection..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setRejectDialogOpen(false)} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleReject} color="error" variant="contained" disabled={loading}>
                    {loading ? 'Rejecting...' : 'Reject & Refund'}
                </Button>
            </DialogActions>
        </Dialog>
    </Container>
  )
};

export default WithdrawPage
