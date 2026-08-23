import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { betService } from 'src/services';
import dayjs from 'dayjs';

const BetContext = createContext();

export const BetProvider = ({ children }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await betService.getAllBets({});
      setBets(response.bets || []);
    } catch (err) {
      console.error('Error fetching bets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bets on mount
  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  // Get today's unique bidders count
  const getTodayUniqueBidsCount = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayBets = bets.filter(bet => {
      if (!bet.betTime) return false;
      return dayjs(bet.betTime).format('YYYY-MM-DD') === today;
    });
    
    // Get unique mobile numbers
    const uniqueMobileNumbers = new Set(todayBets.map(bet => bet.mobileNumber));
    return uniqueMobileNumbers.size;
  }, [bets]);

  const value = {
    bets,
    loading,
    error,
    refetch: fetchBets,
    getTodayUniqueBidsCount,
  };

  return <BetContext.Provider value={value}>{children}</BetContext.Provider>;
};

export const useBets = () => {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error('useBets must be used within a BetProvider');
  }
  return context;
};
