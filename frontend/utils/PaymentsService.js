import { API_URL } from './ApiConfig';
import { NativeModules, Platform, Linking } from "react-native";

const { UpiIntentModule } = NativeModules;

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

function normalizeGatewayStatus(s) {
  const v = String(s || "").trim().toLowerCase();
  // your DB: Pending / Success / Fail
  if (v === "pending") return "PENDING";
  if (v === "success") return "SUCCESS";
  if (v === "fail" || v === "failed") return "FAIL";
  return "UNKNOWN";
}

function enc(v) {
  return encodeURIComponent(String(v ?? ""));
}

function buildUpiUrl({ vpa, payeeName, amountRupees, txnRef, note }) {
  const am = Number(amountRupees || 0);
  const amount = Number.isFinite(am) ? am.toFixed(2) : "0.00";

  // Common params used across UPI apps:
  // pa (payee vpa), pn (name), am (amount), cu, tn (note), tr (reference)
  return (
    `upi://pay?pa=${enc(vpa)}` +
    `&pn=${enc(payeeName)}` +
    `&am=${enc(amount)}` +
    `&cu=INR` +
    (note ? `&tn=${enc(note)}` : "") +
    (txnRef ? `&tr=${enc(txnRef)}` : "")
  );
}

function parseUpiResponseString(raw) {
  if (!raw || typeof raw !== "string") return {};

  // Some apps return "upi://pay?Status=SUCCESS&txnId=..."
  let s = raw;
  const q = s.indexOf("?");
  if (q >= 0 && q < s.length - 1) s = s.slice(q + 1);

  const out = {};
  s.split("&").forEach((part) => {
    const [k, v] = part.split("=", 2);
    if (k && v != null) out[k] = v;
  });

  return out;
}

function normalizeUpiResult(nativeRes) {
  // nativeRes could be:
  // 1) object map { raw, status, txnId, ApprovalRefNo, ... }
  // 2) string "txnId=...&Status=SUCCESS..."
  const raw =
    typeof nativeRes === "string" ? nativeRes : nativeRes?.raw || null;

  const parsedFromRaw = parseUpiResponseString(raw);

  const merged =
    typeof nativeRes === "object" && nativeRes != null
      ? { ...nativeRes, ...parsedFromRaw }
      : { ...parsedFromRaw, raw };

  const status = String(merged?.Status || merged?.status || "").toUpperCase();

  return {
    raw: merged?.raw ?? raw,
    status,
    txnId: merged?.txnId || merged?.TxnId || null,
    approvalRefNo:
      merged?.ApprovalRefNo ||
      merged?.approvalRefNo ||
      merged?.approvalrefno ||
      null,
    rrn: merged?.RRN || merged?.rrn || null,
    responseCode: merged?.responseCode || merged?.ResponseCode || null,
    // keep everything for debugging / backend logging if you want
    all: merged,
  };
}

/**
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
 */
export const savePayout = async (payload) => {
  const res = await fetch(`${API_URL}/users/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Save payout failed");

  return {
    ok: true,
    message: body?.message || "Saved",
    user: body?.user || null,
  };
};

/**
 * Optional helper — without extra native work we can't reliably list installed UPI apps.
 * Keeping it as a harmless stub so your imports don't break.
 */
export const getInstalledUpiApps = async () => {
  return [];
};

/**
 * Start UPI payment using your custom native module.
 *
 * Returns normalized:
 *   { status, txnId, approvalRefNo, rrn, responseCode, raw, txnRef, all }
 */
export const startUpiPayment = async ({
  vpa,
  payeeName,
  amountRupees,
  transactionRef,
  transactionNote,
}) => {
  if (Platform.OS !== "android") {
    throw new Error("UPI Intent is Android-only in this setup");
  }
  if (!UpiIntentModule?.openUpiApp) {
    throw new Error("UPI module not linked (UpiIntentModule.openUpiApp missing)");
  }
  if (!vpa || !payeeName || !amountRupees) {
    throw new Error("Missing required UPI payment params");
  }

  const upiUrl = buildUpiUrl({
    vpa,
    payeeName,
    amountRupees,
    txnRef: transactionRef,
    note: transactionNote || "Wallet topup",
  });

  const nativeRes = await UpiIntentModule.openUpiApp(upiUrl);
  const normalized = normalizeUpiResult(nativeRes);

  return {
    ...normalized,
    txnRef: transactionRef,
  };
};

export const submitTransaction = async (payload) => {

  const res = await fetch(`${API_URL}/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Topup submit failed");

  return {
    ok: true,
    data: body, // ← actual API response (saved entity)
  };
};

/**
 * GET /transaction/withdrawal-rules
 * The withdrawal rules the server enforces right now, judged by the server clock:
 * { minAmount, maxPerDay, timeStart: "HH:mm" | null, timeEnd: "HH:mm" | null,
 *   allowedToday, withinTimeWindow }
 */
export const getWithdrawalRules = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_URL}/transaction/withdrawal-rules`, {
      method: "GET",
      signal: controller.signal,
    });

    const body = await readBody(res);
    if (!res.ok) fail(res, body, "Failed to load withdrawal rules");

    return body;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createGatewayPayment = async ({ mobileNumber, amount }) => {
  const res = await fetch(`${API_URL}/gateway-payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobileNumber: String(mobileNumber || "").trim(),
      amount: Number(amount),
    }),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Failed to create gateway payment");

  return {
    custRefNum: body?.custRefNum || body?.custRef || null,
    upiIntentUrl: body?.upiIntentUrl || null,
    amount: body?.amount ?? null,
    message: body?.message || "Payment created",
    raw: body,
  };
};

export const getGatewayPaymentStatus = async (custRefNum) => {
  const ref = String(custRefNum || "").trim();
  if (!ref) throw new Error("custRefNum required for status check");

  const res = await fetch(`${API_URL}/gateway-payments/status/${encodeURIComponent(ref)}`, {
    method: "GET",
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Failed to check payment status");
  console.log("Payment status response:", body);
  return {
    custRefNum: body?.custRefNum || ref,
    status: normalizeGatewayStatus(body?.status),
    amount: body?.amount ?? null,
    raw: body,
  };
};

export const openUpiIntentUrl = async (upiIntentUrl) => {
  if (Platform.OS !== "android") {
    throw new Error("UPI intent is Android-only");
  }

  const url = String(upiIntentUrl || "").trim();
  if (!url) throw new Error("Missing UPI intent URL");

  // Prefer native chooser (forces app selection even if some app is default)
  if (UpiIntentModule?.openUpiChooser) {
    await UpiIntentModule.openUpiChooser(url);
    return;
  }

  // fallback if method not present
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error("No UPI app found to handle this payment");
  await Linking.openURL(url);
};

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ✅ NEW: normalize list responses (backend may return { sum, list } now)
function normalizeTxnList(body) {
  if (Array.isArray(body)) return body;

  // If backend returns { sum: X, list: [...] } (or any similar wrapper),
  // unwrap the array so screens keep receiving plain lists.
  if (body && typeof body === "object") {
    const maybe =
      body.list ||
      body.transactions ||
      body.items ||
      body.data ||
      body.result ||
      body.content;

    if (Array.isArray(maybe)) return maybe;
  }

  return [];
}

/**
 * POST /transaction/by-user
 * body: { mobileNumber }
 */
export const listTransactionsByUser = async (mobileNumber) => {
  const mob = String(mobileNumber || "").trim();
  if (!mob) {
    const err = new Error("mobileNumber is required");
    err.status = 400;
    throw err;
  }

  const res = await fetch(`${API_URL}/transaction/by-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber: mob }),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Failed to load transactions");

  return normalizeTxnList(body);
};

/**
 * POST /transaction/withdrawals/by-user
 * amount < 0
 */
export const listWithdrawalsByUser = async (mobileNumber) => {
  const mob = String(mobileNumber || "").trim();
  if (!mob) {
    const err = new Error("mobileNumber is required");
    err.status = 400;
    throw err;
  }

  const res = await fetch(`${API_URL}/transaction/withdrawals/by-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber: mob }),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Failed to load withdrawals");

  return normalizeTxnList(body);
};

/**
 * POST /transaction/deposits/by-user
 * amount > 0
 */
export const listDepositsByUser = async (mobileNumber) => {
  const mob = String(mobileNumber || "").trim();
  if (!mob) {
    const err = new Error("mobileNumber is required");
    err.status = 400;
    throw err;
  }

  const res = await fetch(`${API_URL}/transaction/deposits/by-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber: mob }),
  });

  const body = await readBody(res);
  if (!res.ok) fail(res, body, "Failed to load deposits");

  return normalizeTxnList(body);
};
