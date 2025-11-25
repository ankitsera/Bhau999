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
 * Server IFSC lookup (public Razorpay endpoint; swap to your backend later)
 */
export const lookupIFSC = async (ifsc) => {
  const url = `https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`;
  const res = await fetch(url);
  if (!res.ok) fail(res, await readBody(res), "IFSC lookup failed");
  const data = await readBody(res);
  return {
    bank: data?.BANK || data?.bank,
    branch: data?.BRANCH || data?.branch,
    raw: data,
  };
}

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