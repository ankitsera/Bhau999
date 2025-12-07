import { API_URL } from "../env-vars";

// read body safely even if empty
async function readBody(res) {
  try { return await res.json(); } catch { return null; }
}
function fail(res, body, fallback) {
  const err = new Error(body?.message || `${fallback} (status ${res.status})`);
  err.status = res.status;
  err.body = body;
  throw err;
}

/**
 *
 * Backend response (200):
 *   { message: "IFSC valid", details: { BANK, BRANCH, ... } }
 *
 * We normalize to:
 *   { bank, branch, raw }
 */
export const lookupIFSC = async (ifsc) => {
  const res = await fetch(`${API_URL}/ifsc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ifsc }),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "IFSC lookup failed");

  // backend wraps Razorpay response in details
  const data = body?.details || body || {};

  return {
    bank: data?.BANK || data?.bank || null,
    branch: data?.BRANCH || data?.branch || null,
    raw: data,
  };
};

/**
 * Unified payout save: POST /users/bank
 * Accepts either bank OR UPI payload (mobileNumber is required by backend).
 * - Bank: { mobileNumber, accountHolderName, accountNumber, ifscCode }
 * - UPI : { mobileNumber, upiId }
 * Server may return: { message, user } or just 200 with no body.
 */
export const savePayout = async (payload) => {
  const res = await fetch(`${API_URL}/users/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Save payout failed");

  // normalize return
  return {
    ok: true,
    message: body?.message || "Saved",
    user: body?.user || null,
  };
}