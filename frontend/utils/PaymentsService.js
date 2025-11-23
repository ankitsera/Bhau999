import { API_URL } from "../env-vars";

// read body safely (even if empty)
async function readBody(res) {
  try { return await res.json(); } catch { return null; }
}
function fail(res, body, fallback) {
  const err = new Error(body?.message || `${fallback} (status ${res.status})`);
  err.status = res.status;
  err.body = body;
  throw err;
}

export async function lookupIFSC(ifsc) {
  const url = `https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`;
  const res = await fetch(url);
  if (!res.ok) fail(res, await readBody(res), "IFSC lookup failed");
  const data = await readBody(res);
  return { bank: data?.BANK || data?.bank, branch: data?.BRANCH || data?.branch, raw: data };
}

/**
 * Unified payout endpoint (returns 200 with no body on success).
 * payload: { type:"bank", holderName, accountNumber, ifsc, bank, branch }
 *       or { type:"upi",  upiId }
 */
export async function savePayout(payload) {
  const res = await fetch(`${API_URL}/payments/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) fail(res, await readBody(res), "Save payout failed");
  // backend returns no body → we return a simple success message
  return { ok: true, message: "Saved" };
}