import React, { useState } from 'react'
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import { Button, Alert, CircularProgress } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Stack} from '@mui/material';
import Typography from '@mui/material/Typography';
import { useUsers } from 'src/contexts/UserContext';
import { transactionService } from 'src/services';

const AddFundsView = () => {
    const { users: contextUsers, loading: usersLoading, error: usersError } = useUsers();
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Map users for autocomplete
    const users = contextUsers.map(user => ({
        label: `${user.username} (${user.mobileNumber})`,
        mobileNumber: user.mobileNumber,
        username: user.username,
        balance: user.balance
    }));

    const handleSubmit = async() => {
        // Validation
        if (!selectedUser) {
            setMessage({ type: 'error', text: 'Please select a user' });
            return;
        }

        if (!amount || amount === "" || parseFloat(amount) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount greater than 0' });
            return;
        }

        try {
            setSubmitting(true);
            setMessage({ type: '', text: '' });

            const transactionData = {
                mobileNumber: selectedUser.mobileNumber,
                amount: parseInt(amount),
                initiator: "Admin",
                status: "SUCCESS"
            };

            await transactionService.createTransaction(transactionData);
            
            setMessage({
                type: 'success',
                text: `Successfully added ${amount} funds to ${selectedUser.username}`
            });
            
            // Reset form
            setAmount("");
            setSelectedUser(null);
        } catch (error) {
            console.error('Error adding funds:', error);
            setMessage({ 
                type: 'error', 
                text: error.message || 'Error adding funds. Please try again.' 
            });
        } finally {
            setSubmitting(false);
        }
    }

  return (
    <Container>
        <Stack direction='column' spacing={4} sx={{ mt: 4 }}>
            <Typography variant='h4'>Add Funds</Typography>

            {usersError && (
                <Alert severity="error">
                    Failed to load users: {usersError}
                </Alert>
            )}

            {message.text && (
                <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            {usersLoading && (
                <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={24} />
                    <Typography>Loading users...</Typography>
                </Stack>
            )}

            <Autocomplete
                options={users}
                value={selectedUser}
                onChange={(event, newValue) => setSelectedUser(newValue)}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Select User"
                        placeholder="Search by username or mobile number"
                    />
                )}
                renderOption={(props, option) => (
                    <li {...props}>
                        <Stack>
                            <Typography variant="body1">{option.username}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.mobileNumber} | Balance: {option.balance || 0}
                            </Typography>
                        </Stack>
                    </li>
                )}
                isOptionEqualToValue={(option, value) => option.mobileNumber === value.mobileNumber}
                disabled={submitting || usersLoading}
            />

            <Stack direction='row' spacing={2} alignItems='center'>
                <TextField
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    variant='outlined'
                    label="Enter Amount"
                    fullWidth
                    disabled={submitting || usersLoading}
                />
                <Button 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={submitting || usersLoading}
                    sx={{ minWidth: 120 }}
                >
                    {submitting ? 'Processing...' : 'Submit'}
                </Button>
            </Stack>
        </Stack>
    </Container>
  )
}
export default AddFundsView;
