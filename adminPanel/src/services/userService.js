import { apiClient } from './api';

/**
 * User Service
 * Handles all user-related API calls
 */
export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} List of users
   */
  getAllUsers: async () => {
    return apiClient.get('users');
  },

  /**
   * Update user details
   * @param {object} userData - User data to update
   * @param {string} userData.mobileNumber - User's mobile number (required)
   * @param {string} userData.username - User's name
   * @param {string} userData.password - User's password
   * @param {string} userData.accountNumber - Bank account number
   * @param {string} userData.accountHolderName - Account holder name
   * @param {string} userData.ifscCode - IFSC code
   * @param {string} userData.upiId - UPI ID
   * @param {string} userData.approvalStatus - Approval status (APPROVED/UNAPPROVED)
   * @returns {Promise<object>} Updated user data
   */
  updateUserDetails: async (userData) => {
    return apiClient.post('auth/UpdateDetails', userData);
  },

  /**
   * Approve a user
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<object>} Updated user data
   */
  approveUser: async (mobileNumber) => {
    return apiClient.post('auth/UpdateDetails', {
      mobileNumber,
      approvalStatus: 'APPROVED'
    });
  },

  /**
   * Unapprove a user
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<object>} Updated user data
   */
  unapproveUser: async (mobileNumber) => {
    return apiClient.post('auth/UpdateDetails', {
      mobileNumber,
      approvalStatus: 'UNAPPROVED'
    });
  },

  /**
   * Switch a user between the full and limited app view
   * @param {string} mobileNumber - User's mobile number
   * @param {'FULL'|'LIMITED'} viewMode - View to give the user
   * @returns {Promise<object>} Result message and the saved view mode
   */
  setViewMode: async (mobileNumber, viewMode) => {
    return apiClient.post(`users/${mobileNumber}/view-mode`, { viewMode });
  },

  /**
   * Update user password
   * @param {string} mobileNumber - User's mobile number
   * @param {string} password - New password
   * @returns {Promise<object>} Updated user data
   */
  updatePassword: async (mobileNumber, password) => {
    return apiClient.post('auth/UpdateDetails', {
      mobileNumber,
      password
    });
  },

  /**
   * Update user balance
   * @param {string} mobileNumber - User's mobile number
   * @param {number} balance - New balance
   * @returns {Promise<object>} Updated user data
   */
  updateBalance: async (mobileNumber, balance) => {
    // TODO: Replace with actual balance update endpoint when available
    return apiClient.post('auth/UpdateDetails', {
      mobileNumber,
      balance
    });
  },
};
