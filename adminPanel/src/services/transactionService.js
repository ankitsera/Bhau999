import { apiClient } from './api';

/**
 * Transaction Service
 * Handles all transaction-related API calls
 */
export const transactionService = {
  /**
   * Create a new transaction
   * @param {object} transactionData - Transaction data
   * @param {string} transactionData.mobileNumber - User's mobile number
   * @param {number} transactionData.amount - Transaction amount (positive for deposit, negative for withdrawal)
   * @param {string} transactionData.initiator - Who initiated the transaction (Admin/User)
   * @param {string} transactionData.status - Transaction status (SUCCESS/Pending/Approved/Rejected)
   * @param {string} transactionData.remarks - Optional remarks
   * @returns {Promise<object>} Created transaction
   */
  createTransaction: async (transactionData) => {
    return apiClient.post('transaction', transactionData);
  },

  /**
   * Get all transactions
   * @returns {Promise<Array>} List of all transactions
   */
  getAllTransactions: async () => {
    return apiClient.get('transaction');
  },

  /**
   * Get transactions by user
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<Array>} List of user's transactions
   */
  getTransactionsByUser: async (mobileNumber) => {
    return apiClient.post('transaction/by-user', { mobileNumber });
  },

  /**
   * Get deposits by user
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<Array>} List of user's deposits
   */
  getDepositsByUser: async (mobileNumber) => {
    return apiClient.post('transaction/deposits/by-user', { mobileNumber });
  },

  /**
   * Get deposits by admin
   * @returns {Promise<Object>} Object with sum and transactions array
   */
  getDepositsByAdmin: async () => {
    return apiClient.get('transaction/deposits/admin');
  },

  /**
   * Get withdrawals by user
   * @param {string} mobileNumber - User's mobile number
   * @returns {Promise<Array>} List of user's withdrawals
   */
  getWithdrawalsByUser: async (mobileNumber) => {
    return apiClient.post('transaction/withdrawals/by-user', { mobileNumber });
  },

  /**
   * Get all pending transactions
   * @returns {Promise<Array>} List of pending transactions
   */
  getPendingTransactions: async () => {
    return apiClient.get('transaction/pending');
  },

  /**
   * Get all withdrawals
   * @returns {Promise<Array>} List of all withdrawals
   */
  getAllWithdrawals: async () => {
    return apiClient.get('transaction/withdrawals');
  },

  /**
   * Get all deposits with sum
   * @returns {Promise<object>} Object containing { sum: number, transactions: Array }
   */
  getAllDeposits: async () => {
    return apiClient.get('transaction/deposits');
  },

  /**
   * Update transaction status
   * @param {object} statusData - Status update data
   * @param {number} statusData.id - Transaction ID
   * @param {string} statusData.status - New status (Pending/Approved/Rejected)
   * @param {string} statusData.remarks - Optional remarks
   * @returns {Promise<object>} Updated transaction
   */
  updateTransactionStatus: async (statusData) => {
    return apiClient.post('transaction/status', statusData);
  },

  /**
   * Approve a transaction
   * @param {number} id - Transaction ID
   * @param {string} remarks - Optional remarks
   * @returns {Promise<object>} Updated transaction
   */
  approveTransaction: async (id, remarks = '') => {
    return apiClient.post('transaction/status', {
      id,
      status: 'Approved',
      remarks
    });
  },

  /**
   * Reject a transaction
   * @param {number} id - Transaction ID
   * @param {string} remarks - Optional remarks
   * @returns {Promise<object>} Updated transaction
   */
  rejectTransaction: async (id, remarks = '') => {
    return apiClient.post('transaction/status', {
      id,
      status: 'Rejected',
      remarks
    });
  },
};
