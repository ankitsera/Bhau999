import { API_URL } from 'src/variables';
import { getToken } from 'src/helper';

/**
 * Get headers with authentication token
 * @param {object} additionalHeaders - Additional headers to merge
 * @returns {object} Headers object with Authorization token if available
 */
const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...additionalHeaders,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Base API client with common HTTP methods
 * Handles request/response formatting and error handling
 * Automatically includes JWT token in Authorization header
 */
export const apiClient = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  get: async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(options.headers),
        ...options,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      return res.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  post: async (endpoint, data = {}, options = {}) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(options.headers),
        body: JSON.stringify(data),
        ...options,
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Don't try to read text if json failed - stream already consumed
          errorMessage = `HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      return res.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  put: async (endpoint, data = {}, options = {}) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(options.headers),
        body: JSON.stringify(data),
        ...options,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      return res.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  delete: async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(options.headers),
        ...options,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      return res.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
};
