import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { transactionService } from 'src/services';
import dayjs from 'dayjs';

const WithdrawalContext = createContext();

export const WithdrawalProvider = ({ children }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await transactionService.getAllWithdrawals();
      setWithdrawals(data.transactions || []);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch withdrawals on mount
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Get today's withdrawal requests count
  const getTodayWithdrawalCount = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return withdrawals.filter(w => {
      if (!w.txDate) return false;
      return dayjs(w.txDate).format('YYYY-MM-DD') === today;
    }).length;
  }, [withdrawals]);

  // Get today's pending withdrawal requests count
  const getTodayPendingCount = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return withdrawals.filter(w => {
      if (!w.txDate) return false;
      const isPending = w.status && w.status.toUpperCase() === 'PENDING';
      const isToday = dayjs(w.txDate).format('YYYY-MM-DD') === today;
      return isPending && isToday;
    }).length;
  }, [withdrawals]);

  // Get today's approved withdrawal requests count
  const getTodayApprovedCount = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return withdrawals.filter(w => {
      if (!w.txDate) return false;
      const isApproved = w.status && w.status.toUpperCase() === 'APPROVED';
      const isToday = dayjs(w.txDate).format('YYYY-MM-DD') === today;
      return isApproved && isToday;
    }).length;
  }, [withdrawals]);

  const value = {
    withdrawals,
    loading,
    error,
    refetch: fetchWithdrawals,
    getTodayWithdrawalCount,
    getTodayPendingCount,
    getTodayApprovedCount,
  };

  return <WithdrawalContext.Provider value={value}>{children}</WithdrawalContext.Provider>;
};

export const useWithdrawals = () => {
  const context = useContext(WithdrawalContext);
  if (!context) {
    throw new Error('useWithdrawals must be used within a WithdrawalProvider');
  }
  return context;
};
