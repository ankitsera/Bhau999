import { apiClient } from './api';

/**
 * Bet Service
 * Handles all bet-related API calls
 */
export const betService = {
  /**
   * Get bet history for a specific user
   * Fetches bets from both bets and bets_history tables
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<Array>} List of user's bets
   */
  getUserBets: async (mobileNumber) => {
    return apiClient.get(`bets/user/${mobileNumber}`);
  },

  /**
   * Get all bets from both bets and bets_history tables
   * @param {object} params - Optional parameters
   * @param {string} params.mobileNumber - Filter by mobile number
   * @param {string} params.date - Filter by date (yyyy-MM-dd)
   * @returns {Promise<object>} Object with sum and bets array
   */
  getAllBets: async (params = {}) => {
    return apiClient.post('bets/all', params);
  },

  /**
   * Get won bets from both bets and bets_history tables
   * @param {object} params - Optional parameters
   * @param {string} params.mobileNumber - Filter by mobile number
   * @param {string} params.date - Filter by date (yyyy-MM-dd)
   * @returns {Promise<object>} Object with sum and bets array
   */
  getWonBets: async (params = {}) => {
    return apiClient.post('bets/won', params);
  },
};
