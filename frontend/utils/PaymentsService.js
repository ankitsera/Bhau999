import { API_URL } from "../env-vars";

// read body safely even if empty
async function readBody(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
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

/**
 * OPTIONAL helper: get installed UPI apps (package names).
 * Returns [] if none. :contentReference[oaicite:3]{index=3}
 */
export const getInstalledUpiApps = async () => {
  try {
    const apps = await OneUpi.getInstalledUPIApps();
    return Array.isArray(apps) ? apps : [];
  } catch {
    return [];
  }
};

/**
 * Start UPI payment.
 * If targetPackage is NOT passed -> chooser opens. :contentReference[oaicite:4]{index=4}
 *
 * Returns normalized:
 *   { status, txnId, responseCode, approvalRefNo, raw }
 */
export const startUpiPayment = async ({
  vpa,
  payeeName,
  amountRupees,
  transactionRef, // we’ll pass it in note so it’s visible in many UPI apps
  transactionNote,
  targetPackage, // optional
}) => {
  return new Promise((resolve, reject) => {
    if (!vpa || !payeeName || !amountRupees) {
      reject(new Error("Missing required UPI payment params"));
      return;
    }

    const note = transactionNote || "Wallet topup";
    const ref = transactionRef ? ` | Ref:${transactionRef}` : "";

    const config = {
      upiId: String(vpa),          // README uses upiId :contentReference[oaicite:5]{index=5}
      name: String(payeeName),
      note: `${note}${ref}`,
      amount: String(amountRupees),
      ...(targetPackage ? { targetPackage: String(targetPackage) } : {}), // optional chooser
    };

    // OneUpi.initiate(
    //   config,
    //   (success) => {
    //     // README success: { status, txnId, code, approvalRefNo } :contentReference[oaicite:6]{index=6}
    //     resolve({
    //       status: success?.status || "SUCCESS",
    //       txnId: success?.txnId || null,
    //       responseCode: success?.code || null,
    //       approvalRefNo: success?.approvalRefNo || null,
    //       raw: success,
    //     });
    //   },
    //   (error) => {
    //     // README failure: { status: FAILED, message } :contentReference[oaicite:7]{index=7}
    //     const msg = error?.message || "UPI payment cancelled / failed";
    //     const err = new Error(msg);
    //     err.raw = error;
    //     reject(err);
    //   }
    // );
  });
};

export const submitUpiTopupResult = async (payload) => {
  // TODO: change endpoint later when your real API comes
  const res = await fetch(`${API_URL}/wallet/topup/upi/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Topup submit failed");

  return {
    ok: true,
    message: body?.message || "Topup submitted",
    user: body?.user || null,
    balance: body?.balance ?? null,
    raw: body,
  };
};