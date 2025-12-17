// utils/GameService.js
import { API_URL } from "../env-vars";

// GET /api/rate  ->  ${API_URL}/rate
export const getGameRates = async () => {
  // return dummy data for testing
  // return [
  //   { id: 1, type: "Single Ank", rate: 95 },
  //   { id: 2, type: "Jodi", rate: 950 },
  //   { id: 3, type: "Single Pana", rate: 1500 },
  // ];
  const res = await fetch(`${API_URL}/rate`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (res.ok) {
    return Array.isArray(body) ? body : [];
  }

  const msg =
    body?.message || `Failed to load game rates (status ${res.status})`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};