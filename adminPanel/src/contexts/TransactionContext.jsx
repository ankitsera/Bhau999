import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { transactionService } from 'src/services';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all deposits
      const depositsResponse = await transactionService.getAllDeposits();
      setDeposits(depositsResponse.transactions || []);

      // Fetch all withdrawals
      const withdrawalsData = await transactionService.getAllWithdrawals();
      setWithdrawals(withdrawalsData || []);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refetch = useCallback(() => {
    return fetchTransactions();
  }, [fetchTransactions]);

  const value = {
    deposits,
    withdrawals,
    loading,
    error,
    refetch,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
