import { API_URL as configuredApiUrl } from '../env-vars';

// This is the single public API base used by every frontend service.
// Nginx rewrites it to the backend's internal /api route.
export const API_URL = String(configuredApiUrl || '').trim().replace(/\/+$/, '');
