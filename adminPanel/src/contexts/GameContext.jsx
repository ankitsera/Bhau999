import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { gameService } from 'src/services';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await gameService.getAllGames();
      
      // Sort games by open time (earliest first)
      const sortedGames = (data || []).sort((a, b) => {
        // Handle cases where openTime might be null/undefined
        if (!a.openTime) return 1;
        if (!b.openTime) return -1;
        
        // Parse time strings and compare
        const timeA = dayjs(`2000-01-01 ${a.openTime}`);
        const timeB = dayjs(`2000-01-01 ${b.openTime}`);
        
        // Return negative if A is before B (ascending order - earliest first)
        return timeA.diff(timeB);
      });
      
      setGames(sortedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch games on mount
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const value = {
    games,
    loading,
    error,
    refetch: fetchGames,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGames = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};
