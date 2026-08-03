import crypto from "node:crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const SESSION_ID_RE = /^cs_(?:test_|live_)?[A-Za-z0-9]{12,200}$/;
const CHECKOUT_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDOFF_PACK_TYPES = new Set(["invite_only_pack", "digital_pdf_pack", "Full_pack"]);

export class StripeCheckoutError extends Error {
  constructor(code, message, { statusCode = 502, providerStatus = null, retryable = false, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "StripeCheckoutError";
    this.code = code;
    this.statusCode = statusCode;
    this.providerStatus = providerStatus;
    this.retryable = retryable;
  }
}

function timeoutSignal(timeoutMs) {
  return typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined;
}

function cleanStripeId(value, pattern, field) {
  const result = String(value || "").trim();
  if (!pattern.test(result)) throw new StripeCheckoutError("INVALID_STRIPE_IDENTIFIER", `${field} is invalid.`, { statusCode: 400 });
  return result;
}

function cleanUrl(value, field) {
  let url;
  try { url = new URL(String(value || "").trim()); }
  catch { throw new StripeCheckoutError("INVALID_CHECKOUT_URL", `${field} is invalid.`, { statusCode: 500 }); }
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new StripeCheckoutError("INVALID_CHECKOUT_URL", `${field} must use HTTPS.`, { statusCode: 500 });
  }
  url.username = "";
  url.password = "";
  return url.toString();
}

function signatureParts(header) {
  const values = new Map();
  for (const part of String(header || "").split(",")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!values.has(key)) values.set(key, []);
    values.get(key).push(value);
  }
  return values;
}

function safeHexEqual(first, second) {
  if (!/^[0-9a-f]{64}$/i.test(first) || !/^[0-9a-f]{64}$/i.test(second)) return false;
  const a = Buffer.from(first, "hex");
  const b = Buffer.from(second, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normalizedHandoffSecret(secret) {
  const value = Buffer.isBuffer(secret) ? secret : Buffer.from(String(secret || ""), "utf8");
  return value.length >= 32 ? value : null;
}

function normalizedHandoffPayload(value) {
  const checkoutToken = String(value?.checkoutToken || "").trim();
  const packType = String(value?.packType || "").trim();
  const eventType = value?.eventType === "baby_shower" ? "baby_shower" : "wedding";
  if (!CHECKOUT_TOKEN_RE.test(checkoutToken) || !HANDOFF_PACK_TYPES.has(packType)) return null;
  return { checkoutToken, packType, eventType };
}

export function createStripeCheckoutHandoffToken(value, secret, {
  now = Date.now(),
  maxAgeSeconds = 2 * 60 * 60,
} = {}) {
  const payloadValue = normalizedHandoffPayload(value);
  const signingSecret = normalizedHandoffSecret(secret);
  if (!payloadValue || !signingSecret) {
    throw new StripeCheckoutError("INVALID_STRIPE_HANDOFF", "Stripe checkout handoff is invalid.", { statusCode: 500 });
  }
  const lifetime = Math.max(300, Math.min(24 * 60 * 60, Number(maxAgeSeconds) || 2 * 60 * 60));
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    ...payloadValue,
    exp: Math.floor(Number(now) / 1000) + lifetime,
  }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", signingSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyStripeCheckoutHandoffToken(token, secret, { now = Date.now() } = {}) {
  const signingSecret = normalizedHandoffSecret(secret);
  if (!signingSecret) return null;
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", signingSecret).update(payload).digest();
  let received;
  try { received = Buffer.from(signature, "base64url"); }
  catch { return null; }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const normalized = normalizedHandoffPayload(parsed);
    const exp = Number(parsed?.exp || 0);
    if (parsed?.v !== 1 || !normalized || !Number.isFinite(exp) || exp <= Math.floor(Number(now) / 1000)) return null;
    return { ...normalized, exp };
  } catch {
    return null;
  }
}

export function verifyStripeWebhookSignature(payload, signatureHeader, secret, {
  toleranceSeconds = 300,
  now = Date.now(),
} = {}) {
  const raw = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || "");
  const safeSecret = String(secret || "").trim();
  if (!safeSecret.startsWith("whsec_") || raw.length === 0) return false;
  const parts = signatureParts(signatureHeader);
  const timestamp = Number.parseInt(parts.get("t")?.[0] || "", 10);
  const signatures = parts.get("v1") || [];
  if (!Number.isInteger(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Math.floor(now / 1000) - timestamp) > Math.max(30, toleranceSeconds)) return false;
  const expected = crypto
    .createHmac("sha256", safeSecret)
    .update(`${timestamp}.`)
    .update(raw)
    .digest("hex");
  return signatures.some((signature) => safeHexEqual(signature, expected));
}

export function createStripeCheckoutService({
  secretKey,
  webhookSecret,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15_000,
  webhookToleranceSeconds = 300,
  apiBase = STRIPE_API_BASE,
} = {}) {
  const key = String(secretKey || "").trim();
  const hookSecret = String(webhookSecret || "").trim();
  if (!/^sk_(?:test|live)_[A-Za-z0-9_]+$/.test(key)) {
    throw new StripeCheckoutError("STRIPE_SECRET_KEY_NOT_CONFIGURED", "Stripe is not configured.", { statusCode: 503 });
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function.");
  const requestTimeoutMs = Math.max(1_000, Math.min(60_000, Number(timeoutMs) || 15_000));

  async function stripeRequest(pathname, { method = "GET", body = null, idempotencyKey = "" } = {}) {
    const headers = { Authorization: `Bearer ${key}` };
    if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (idempotencyKey) headers["Idempotency-Key"] = String(idempotencyKey).slice(0, 255);
    let response;
    try {
      response = await fetchImpl(`${apiBase}${pathname}`, {
        method,
        headers,
        body: body ? body.toString() : undefined,
        signal: timeoutSignal(requestTimeoutMs),
      });
    } catch (error) {
      throw new StripeCheckoutError("STRIPE_API_UNAVAILABLE", "Stripe could not be reached.", { retryable: true, cause: error });
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || typeof payload !== "object") {
      throw new StripeCheckoutError(
        String(payload?.error?.code || "STRIPE_API_ERROR").replace(/[^A-Za-z0-9_-]/g, "_").toUpperCase(),
        String(payload?.error?.message || "Stripe rejected the request.").slice(0, 500),
        { providerStatus: response.status, statusCode: response.status >= 500 ? 502 : 400, retryable: response.status >= 500 || response.status === 429 },
      );
    }
    return payload;
  }

  async function createCheckoutSession({
    priceId,
    successUrl,
    cancelUrl,
    clientReferenceId,
    metadata = {},
    idempotencyKey,
  }) {
    const price = cleanStripeId(priceId, /^price_[A-Za-z0-9]{8,200}$/, "priceId");
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][price]", price);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", cleanUrl(successUrl, "successUrl"));
    form.set("cancel_url", cleanUrl(cancelUrl, "cancelUrl"));
    form.set("customer_creation", "always");
    form.set("allow_promotion_codes", "true");
    form.set("client_reference_id", String(clientReferenceId || "").slice(0, 200));
    for (const [name, value] of Object.entries(metadata)) {
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(name)) continue;
      form.set(`metadata[${name}]`, String(value || "").slice(0, 500));
    }
    const session = await stripeRequest("/checkout/sessions", {
      method: "POST",
      body: form,
      idempotencyKey,
    });
    if (!SESSION_ID_RE.test(String(session.id || "")) || !/^https:\/\/checkout\.stripe\.com\//.test(String(session.url || ""))) {
      throw new StripeCheckoutError("INVALID_STRIPE_SESSION_RESPONSE", "Stripe returned an invalid Checkout Session.");
    }
    return session;
  }

  async function retrieveCheckoutSession(sessionId) {
    const id = cleanStripeId(sessionId, SESSION_ID_RE, "sessionId");
    return stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}?expand%5B%5D=line_items`);
  }

  function constructWebhookEvent(rawBody, signatureHeader) {
    if (!verifyStripeWebhookSignature(rawBody, signatureHeader, hookSecret, {
      toleranceSeconds: webhookToleranceSeconds,
    })) {
      throw new StripeCheckoutError("INVALID_STRIPE_SIGNATURE", "Invalid Stripe webhook signature.", { statusCode: 400 });
    }
    try { return JSON.parse(Buffer.from(rawBody).toString("utf8")); }
    catch { throw new StripeCheckoutError("INVALID_STRIPE_EVENT", "Invalid Stripe webhook payload.", { statusCode: 400 }); }
  }

  return { createCheckoutSession, retrieveCheckoutSession, constructWebhookEvent };
}
