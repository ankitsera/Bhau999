import { apiClient } from './api';

/**
 * Property Service
 * Handles all property/settings-related API calls
 */
export const propertyService = {
  /**
   * Get all properties
   * @returns {Promise<Array>} List of all properties
   */
  getAllProperties: async () => {
    return apiClient.get('properties');
  },

  /**
   * Get a specific property by key
   * @param {string} key - Property key
   * @returns {Promise<object>} Property object
   */
  getPropertyByKey: async (key) => {
    return apiClient.get(`properties/${key}`);
  },

  /**
   * Update a property
   * @param {string} key - Property key
   * @param {string} value - Property value
   * @returns {Promise<object>} Updated property
   */
  updateProperty: async (key, value) => {
    return apiClient.post('properties', { key, value: value || '' });
  },

  /**
   * Update multiple properties
   * @param {object} properties - Object with key-value pairs
   * @returns {Promise<Array>} Array of update results
   */
  updateMultipleProperties: async (properties) => {
    const updatePromises = Object.entries(properties).map(([key, value]) =>
      apiClient.post('properties', { key, value: value || '' })
    );
    return Promise.all(updatePromises);
  },

  /**
   * Delete a property
   * @param {string} key - Property key
   * @returns {Promise<object>} Delete result
   */
  deleteProperty: async (key) => {
    return apiClient.delete(`properties/${key}`);
  },
};
