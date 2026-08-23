import { apiClient } from './api';

/**
 * Game Service
 * Handles all game-related API calls
 */
export const gameService = {
  /**
   * Get all games
   * @returns {Promise<Array>} List of all games
   */
  getAllGames: async () => {
    return apiClient.get('game');
  },

  /**
   * Create a new game
   * @param {object} gameData - Game data
   * @param {string} gameData.name - Game name (will be normalized to uppercase)
   * @param {string} gameData.openTime - Open time in HH:mm:ss format
   * @param {string} gameData.closeTime - Close time in HH:mm:ss format
   * @param {boolean} gameData.saturday - Whether game runs on Saturday
   * @param {boolean} gameData.sunday - Whether game runs on Sunday
   * @returns {Promise<object>} Created game
   */
  createGame: async (gameData) => {
    return apiClient.post('game', gameData);
  },

  /**
   * Update an existing game
   * @param {object} gameData - Game data
   * @param {string} gameData.name - Game name (will be normalized to uppercase)
   * @param {string} gameData.openTime - Open time in HH:mm:ss format
   * @param {string} gameData.closeTime - Close time in HH:mm:ss format
   * @param {boolean} gameData.saturday - Whether game runs on Saturday
   * @param {boolean} gameData.sunday - Whether game runs on Sunday
   * @returns {Promise<object>} Updated game
   */
  updateGame: async (gameData) => {
    return apiClient.post('game', gameData);
  },

  /**
   * Delete a game
   * @param {string} name - Game name
   * @returns {Promise<object>} Delete result
   */
  deleteGame: async (name) => {
    return apiClient.delete(`game/${name}`);
  },

  /**
   * Declare result for a game
   * @param {object} resultData - Result declaration data
   * @param {string} resultData.gameName - Game name
   * @param {string} resultData.when - "open" or "close"
   * @param {number} resultData.result - Result value (0-9)
   * @returns {Promise<object>} Result declaration response
   */
  declareResult: async (resultData) => {
    return apiClient.post('active-games/declare-result', resultData);
  },

  /**
   * Identify winners for a game result (preview before declaring)
   * @param {object} resultData - Result data
   * @param {string} resultData.gameName - Game name
   * @param {string} resultData.when - "open" or "close"
   * @param {number} resultData.result - Result value (0-9)
   * @returns {Promise<object>} Winners data with count and list
   */
  identifyWinners: async (resultData) => {
    return apiClient.post('active-games/identify-winners', resultData);
  },

  /**
   * Get all active games with their status and allowed types
   * @returns {Promise<Array>} List of active games with market status
   */
  getActiveGames: async () => {
    return apiClient.get('active-games');
  },

  /**
   * Get disabled games
   * @returns {Promise<Array>} List of disabled games
   */
  getDisabledGames: async () => {
    return apiClient.get('game/disabled');
  },

  /**
   * Enable or disable a game
   * @param {string} name - Game name
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<object>} Updated game status
   */
  setGameEnabled: async (name, enabled) => {
    return apiClient.post(`game/${name}/enable`, { enabled });
  },

  /**
   * Start or stop a game for today
   * @param {string} name - Game name
   * @param {boolean} runningToday - Whether game should run today
   * @returns {Promise<object>} Updated active game status
   */
  setGameRunning: async (name, runningToday) => {
    return apiClient.post(`active-games/${name}/running`, { runningToday });
  },
};
