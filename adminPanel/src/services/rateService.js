import { apiClient } from './api';

/**
 * Rate Service
 * Handles all game rate-related API calls
 */
export const rateService = {
  /**
   * Get all rates
   * @returns {Promise<Array>} List of all rates
   */
  getAllRates: async () => {
    return apiClient.get('rate');
  },

  /**
   * Get rates by game type
   * @param {string} gameType - Game type (e.g., 'KALYAN', 'MUMBAI')
   * @returns {Promise<Array>} List of rates for the game type
   */
  getRatesByGameType: async (gameType) => {
    return apiClient.get(`rate?gameType=${gameType}`);
  },

  /**
   * Update a rate
   * @param {object} rateData - Rate data
   * @param {string} rateData.gameType - Game type
   * @param {string} rateData.rateType - Rate type (e.g., 'SINGLE_DIGIT', 'JODI_DIGIT')
   * @param {number} rateData.rateValue - Rate value
   * @returns {Promise<object>} Updated rate
   */
  updateRate: async (rateData) => {
    return apiClient.post('rate', rateData);
  },

  /**
   * Update multiple rates
   * @param {Array} rates - Array of rate objects
   * @returns {Promise<Array>} Array of update results
   */
  updateMultipleRates: async (rates) => {
    const updatePromises = rates.map(rate =>
      apiClient.post('rate', rate)
    );
    return Promise.all(updatePromises);
  },

  /**
   * Delete a rate
   * @param {number} id - Rate ID
   * @returns {Promise<object>} Delete result
   */
  deleteRate: async (id) => {
    return apiClient.delete(`rate/${id}`);
  },
};
