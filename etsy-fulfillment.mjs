import crypto from "node:crypto";

const ETSY_API_ORIGINS = new Set([
  "https://api.etsy.com",
  "https://openapi.etsy.com",
]);
const ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
const PACK_TYPES = new Set(["invite_only_pack", "digital_pdf_pack", "Full_pack"]);
const SUPPORTED_EVENTS = new Set(["order.paid", "order.canceled"]);
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;
const DEFAULT_API_TIMEOUT_MS = 15_000;
const MAX_TRANSACTION_QUANTITY = 25;

export class EtsyFulfillmentError extends Error {
  constructor(code, message, {
    statusCode = 500,
    providerStatus = null,
    retryable = false,
    cause,
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "EtsyFulfillmentError";
    this.code = code;
    this.statusCode = statusCode;
    this.providerStatus = providerStatus;
    this.retryable = retryable;
  }
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function positiveIntegerString(value, field) {
  const normalized = String(value ?? "").trim();
  if (!/^\d{1,20}$/.test(normalized) || normalized === "0") {
    throw new EtsyFulfillmentError(
      "ETSY_INVALID_IDENTIFIER",
      `${field} must be a positive Etsy identifier.`,
      { statusCode: 400 },
    );
  }
  return normalized.replace(/^0+(?=\d)/, "");
}

export function normalizeEtsyReceiptNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!/^\d{1,20}$/.test(normalized) || normalized === "0") return "";
  return normalized.replace(/^0+(?=\d)/, "");
}

export function etsyReceiptNumberFromExternalOrderId(value, expectedShopId = "") {
  const match = String(value || "").match(/^etsy:(\d+):(\d+):(\d+):(\d+)$/);
  if (!match) return "";
  const shopId = normalizeEtsyReceiptNumber(match[1]);
  const receiptId = normalizeEtsyReceiptNumber(match[2]);
  const expected = expectedShopId ? normalizeEtsyReceiptNumber(expectedShopId) : "";
  if (!shopId || !receiptId || (expected && shopId !== expected)) return "";
  return receiptId;
}

function normalizePackType(value) {
  if (value === "template_only_pack") return "invite_only_pack";
  if (PACK_TYPES.has(value)) return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (["normal", "wedding_normal", "template_only", "template-only"].includes(normalized)) {
    return "invite_only_pack";
  }
  if (["digital", "digital_pdf", "digital-pdf", "digital_invite_pdf"].includes(normalized)) {
    return "digital_pdf_pack";
  }
  if (["full", "wedding_full", "full-pack"].includes(normalized)) return "Full_pack";
  throw new EtsyFulfillmentError(
    "ETSY_INVALID_PACK_MAPPING",
    `Unsupported InviteLab pack mapping: ${cleanText(value, 80) || "(empty)"}.`,
    { statusCode: 500 },
  );
}

function normalizeCreationMode(value) {
  const normalized = String(value || "both").trim().toLowerCase();
  if (["both", "template", "custom_import"].includes(normalized)) return normalized;
  throw new EtsyFulfillmentError(
    "ETSY_INVALID_CREATION_MODE_MAPPING",
    `Unsupported InviteLab creation method mapping: ${cleanText(value, 80) || "(empty)"}.`,
    { statusCode: 500 },
  );
}

function normalizeListingProduct(value) {
  const product = (packType, creationMode) => Object.freeze({
    packType,
    creationMode: packType === "Full_pack" ? creationMode : "template",
  });
  if (typeof value === "string") {
    return product(normalizePackType(value), "both");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return product(normalizePackType(value), "both");
  }
  const packType = normalizePackType(value.packType ?? value.pack);
  return product(packType, normalizeCreationMode(value.creationMode ?? value.mode ?? "both"));
}

export function parseEtsyListingPackMap(value) {
  if (value instanceof Map) {
    return new Map([...value.entries()].map(([listingId, product]) => [
      positiveIntegerString(listingId, "listingId"),
      normalizeListingProduct(product),
    ]));
  }

  let parsed = value;
  if (typeof value === "string") {
    const source = value.trim();
    if (!source) return new Map();
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      throw new EtsyFulfillmentError(
        "ETSY_LISTING_PACK_MAP_INVALID_JSON",
        "ETSY_LISTING_PACK_MAP must be a JSON object keyed by Etsy listing id.",
        { statusCode: 500, cause: error },
      );
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new EtsyFulfillmentError(
      "ETSY_LISTING_PACK_MAP_INVALID",
      "ETSY_LISTING_PACK_MAP must be a JSON object keyed by Etsy listing id.",
      { statusCode: 500 },
    );
  }
  const entries = Object.entries(parsed).map(([listingId, product]) => [
    positiveIntegerString(listingId, "listingId"),
    normalizeListingProduct(product),
  ]);
  return new Map(entries);
}

export function normalizeEtsyEventType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, ".");
  return SUPPORTED_EVENTS.has(normalized) ? normalized : "";
}

export function parseEtsyReceiptResourceUrl(resourceUrl, expectedShopId) {
  const shopId = positiveIntegerString(expectedShopId, "shopId");
  let parsed;
  try {
    parsed = new URL(String(resourceUrl || "").trim());
  } catch (error) {
    throw new EtsyFulfillmentError(
      "ETSY_RESOURCE_URL_INVALID",
      "The Etsy webhook resource URL is invalid.",
      { statusCode: 400, cause: error },
    );
  }
  if (
    !ETSY_API_ORIGINS.has(parsed.origin)
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    throw new EtsyFulfillmentError(
      "ETSY_RESOURCE_URL_REJECTED",
      "The Etsy webhook resource URL is not an allowed Etsy API URL.",
      { statusCode: 400 },
    );
  }
  const match = parsed.pathname.match(
    /^\/v3\/application\/shops\/(\d+)\/receipts\/(\d+)\/?$/,
  );
  if (!match) {
    throw new EtsyFulfillmentError(
      "ETSY_RESOURCE_URL_REJECTED",
      "The Etsy webhook resource URL is not a receipt URL.",
      { statusCode: 400 },
    );
  }
  const resourceShopId = positiveIntegerString(match[1], "resourceShopId");
  if (resourceShopId !== shopId) {
    throw new EtsyFulfillmentError(
      "ETSY_RESOURCE_SHOP_MISMATCH",
      "The Etsy receipt URL does not belong to the configured shop.",
      { statusCode: 403 },
    );
  }
  const receiptId = positiveIntegerString(match[2], "receiptId");
  return {
    shopId,
    receiptId,
    url: `https://api.etsy.com/v3/application/shops/${shopId}/receipts/${receiptId}`,
  };
}

function rawBodyBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return null;
}

function webhookSecretBytes(signingSecret) {
  const secret = String(signingSecret || "").trim();
  if (!secret.startsWith("whsec_")) return null;
  const encoded = secret.slice("whsec_".length);
  if (!encoded || !/^[A-Za-z0-9+/_=-]+$/.test(encoded)) return null;
  try {
    const bytes = Buffer.from(encoded, "base64");
    return bytes.length >= 16 ? bytes : null;
  } catch {
    return null;
  }
}

function signatureCandidates(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map((entry) => {
      const commaIndex = entry.indexOf(",");
      return commaIndex >= 0 ? entry.slice(commaIndex + 1) : entry;
    })
    .filter(Boolean);
}

function constantTimeBase64Equal(expected, received) {
  let decoded;
  try {
    decoded = Buffer.from(received, "base64");
  } catch {
    return false;
  }
  return decoded.length === expected.length && crypto.timingSafeEqual(decoded, expected);
}

function numericNowMs(now) {
  const value = typeof now === "function" ? now() : now;
  if (value instanceof Date) return value.getTime();
  const number = Number(value ?? Date.now());
  return Number.isFinite(number) ? number : Date.now();
}

function signatureVerificationResult({
  rawBody,
  webhookId,
  webhookTimestamp,
  webhookSignature,
  signingSecret,
  now = Date.now(),
  toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
} = {}) {
  const body = rawBodyBuffer(rawBody);
  if (!body) return { ok: false, reason: "raw_body_missing" };
  const id = String(webhookId || "").trim();
  if (!id || id.length > 200) return { ok: false, reason: "webhook_id_invalid" };
  const timestampText = String(webhookTimestamp || "").trim();
  if (!/^\d{10,13}$/.test(timestampText)) {
    return { ok: false, reason: "webhook_timestamp_invalid" };
  }
  let timestampSeconds = Number(timestampText);
  if (timestampText.length === 13) timestampSeconds /= 1000;
  const safeTolerance = Math.max(
    30,
    Math.min(900, Number(toleranceSeconds) || DEFAULT_WEBHOOK_TOLERANCE_SECONDS),
  );
  const currentSeconds = numericNowMs(now) / 1000;
  if (Math.abs(currentSeconds - timestampSeconds) > safeTolerance) {
    return { ok: false, reason: "webhook_timestamp_stale" };
  }
  const secretBytes = webhookSecretBytes(signingSecret);
  if (!secretBytes) return { ok: false, reason: "webhook_secret_invalid" };
  const signedContent = Buffer.concat([
    Buffer.from(`${id}.${timestampText}.`, "utf8"),
    body,
  ]);
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest();
  const matches = signatureCandidates(webhookSignature)
    .some((candidate) => constantTimeBase64Equal(expected, candidate));
  return {
    ok: matches,
    reason: matches ? "verified" : "webhook_signature_invalid",
    timestampSeconds,
  };
}

export function verifyEtsyWebhookSignature(input) {
  return signatureVerificationResult(input).ok;
}

export function assertEtsyWebhookSignature(input) {
  const result = signatureVerificationResult(input);
  if (result.ok) return result;
  const configurationError = result.reason === "webhook_secret_invalid";
  throw new EtsyFulfillmentError(
    configurationError
      ? "ETSY_WEBHOOK_SECRET_NOT_CONFIGURED"
      : `ETSY_${result.reason.toUpperCase()}`,
    configurationError
      ? "The Etsy webhook signing secret is not configured correctly."
      : "The Etsy webhook signature could not be verified.",
    {
      statusCode: configurationError ? 503 : 401,
      retryable: configurationError,
    },
  );
}

export function parseEtsyWebhookPayload(rawBody, { expectedShopId } = {}) {
  const body = rawBodyBuffer(rawBody);
  if (!body) {
    throw new EtsyFulfillmentError(
      "ETSY_WEBHOOK_RAW_BODY_MISSING",
      "The exact Etsy webhook request body is required.",
      { statusCode: 400 },
    );
  }
  let payload;
  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch (error) {
    throw new EtsyFulfillmentError(
      "ETSY_WEBHOOK_INVALID_JSON",
      "The Etsy webhook body is not valid JSON.",
      { statusCode: 400, cause: error },
    );
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new EtsyFulfillmentError(
      "ETSY_WEBHOOK_INVALID_PAYLOAD",
      "The Etsy webhook payload must be an object.",
      { statusCode: 400 },
    );
  }
  const eventType = normalizeEtsyEventType(payload.event_type);
  if (!eventType) {
    throw new EtsyFulfillmentError(
      "ETSY_WEBHOOK_UNSUPPORTED_EVENT",
      "The Etsy webhook event is not supported.",
      { statusCode: 400 },
    );
  }
  const shopId = positiveIntegerString(payload.shop_id, "shopId");
  const configuredShopId = positiveIntegerString(expectedShopId, "expectedShopId");
  if (shopId !== configuredShopId) {
    throw new EtsyFulfillmentError(
      "ETSY_WEBHOOK_SHOP_MISMATCH",
      "The Etsy webhook does not belong to the configured shop.",
      { statusCode: 403 },
    );
  }
  const resource = parseEtsyReceiptResourceUrl(payload.resource_url, configuredShopId);
  return {
    eventType,
    shopId,
    receiptId: resource.receiptId,
    resourceUrl: resource.url,
  };
}

function timeoutSignal(timeoutMs) {
  if (typeof AbortSignal?.timeout === "function") return AbortSignal.timeout(timeoutMs);
  return undefined;
}

function normalizeExpiry(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function etsyProviderErrorCode(payload) {
  const value = payload && typeof payload === "object"
    ? payload.error || payload.code
    : "";
  return cleanText(value, 100).replace(/[^A-Za-z0-9_-]/g, "") || "unknown";
}

export function createEtsyOAuthTokenProvider({
  keystring,
  accessToken = "",
  refreshToken = "",
  expiresAt = 0,
  fetchImpl = globalThis.fetch,
  tokenUrl = ETSY_TOKEN_URL,
  timeoutMs = DEFAULT_API_TIMEOUT_MS,
  now = Date.now,
  onToken,
} = {}) {
  const safeKeystring = cleanText(keystring, 200);
  if (!safeKeystring) {
    throw new EtsyFulfillmentError(
      "ETSY_API_KEYSTRING_NOT_CONFIGURED",
      "The Etsy API keystring is not configured.",
      { statusCode: 503 },
    );
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function.");
  const safeTimeoutMs = Math.max(1_000, Math.min(60_000, Number(timeoutMs) || DEFAULT_API_TIMEOUT_MS));
  let state = {
    accessToken: String(accessToken || "").trim(),
    refreshToken: String(refreshToken || "").trim(),
    expiresAt: normalizeExpiry(expiresAt),
  };
  let pendingPersistence = null;
  let refreshPromise = null;

  async function persistPendingToken() {
    if (!pendingPersistence || typeof onToken !== "function") return;
    try {
      await onToken({ ...pendingPersistence });
      pendingPersistence = null;
    } catch (error) {
      throw new EtsyFulfillmentError(
        "ETSY_OAUTH_TOKEN_PERSIST_FAILED",
        "The refreshed Etsy OAuth token could not be persisted.",
        { statusCode: 503, retryable: true, cause: error },
      );
    }
  }

  async function refresh() {
    if (!state.refreshToken) {
      if (state.accessToken) return state.accessToken;
      throw new EtsyFulfillmentError(
        "ETSY_OAUTH_TOKEN_NOT_CONFIGURED",
        "An Etsy OAuth access token or refresh token is required.",
        { statusCode: 503 },
      );
    }
    let response;
    try {
      response = await fetchImpl(tokenUrl, {
        method: "POST",
        redirect: "error",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: safeKeystring,
          refresh_token: state.refreshToken,
        }).toString(),
        signal: timeoutSignal(safeTimeoutMs),
      });
    } catch (error) {
      throw new EtsyFulfillmentError(
        "ETSY_OAUTH_REFRESH_REQUEST_FAILED",
        "The Etsy OAuth token refresh request failed.",
        { statusCode: 502, retryable: true, cause: error },
      );
    }
    const payload = await safeJson(response);
    if (!response.ok) {
      throw new EtsyFulfillmentError(
        `ETSY_OAUTH_${etsyProviderErrorCode(payload).toUpperCase()}`,
        `Etsy rejected the OAuth token refresh (${response.status}).`,
        {
          statusCode: 502,
          providerStatus: response.status,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }
    const nextAccessToken = String(payload?.access_token || "").trim();
    const nextRefreshToken = String(payload?.refresh_token || state.refreshToken).trim();
    const expiresIn = Math.max(60, Number(payload?.expires_in) || 3600);
    if (!nextAccessToken || !nextRefreshToken) {
      throw new EtsyFulfillmentError(
        "ETSY_OAUTH_REFRESH_RESPONSE_INVALID",
        "Etsy returned an incomplete OAuth token response.",
        { statusCode: 502, retryable: true },
      );
    }
    state = {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      expiresAt: numericNowMs(now) + (expiresIn * 1000),
    };
    if (typeof onToken === "function") {
      pendingPersistence = { ...state };
      await persistPendingToken();
    }
    return state.accessToken;
  }

  async function getAccessToken({ forceRefresh = false } = {}) {
    if (pendingPersistence) {
      if (!refreshPromise) {
        refreshPromise = persistPendingToken()
          .then(() => state.accessToken)
          .finally(() => {
            refreshPromise = null;
          });
      }
      return refreshPromise;
    }
    const currentTime = numericNowMs(now);
    const usable = state.accessToken
      && (!state.expiresAt || state.expiresAt > currentTime + 60_000);
    if (usable && !forceRefresh) return state.accessToken;
    if (!refreshPromise) {
      refreshPromise = refresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  return {
    getAccessToken,
    snapshot() {
      return { ...state };
    },
  };
}

export function createEtsyApiClient({
  shopId,
  keystring,
  sharedSecret,
  accessToken = "",
  refreshToken = "",
  expiresAt = 0,
  tokenProvider,
  onToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_API_TIMEOUT_MS,
} = {}) {
  const safeShopId = positiveIntegerString(shopId, "shopId");
  const safeKeystring = cleanText(keystring, 200);
  const safeSharedSecret = String(sharedSecret || "").trim();
  if (!safeKeystring || !safeSharedSecret) {
    throw new EtsyFulfillmentError(
      "ETSY_API_CREDENTIALS_NOT_CONFIGURED",
      "The Etsy API keystring and shared secret are required.",
      { statusCode: 503 },
    );
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function.");
  const safeTimeoutMs = Math.max(1_000, Math.min(60_000, Number(timeoutMs) || DEFAULT_API_TIMEOUT_MS));
  const provider = tokenProvider || createEtsyOAuthTokenProvider({
    keystring: safeKeystring,
    accessToken,
    refreshToken,
    expiresAt,
    fetchImpl,
    timeoutMs: safeTimeoutMs,
    onToken,
  });
  if (typeof provider?.getAccessToken !== "function") {
    throw new TypeError("tokenProvider.getAccessToken must be a function.");
  }

  async function requestJson(url, { retryUnauthorized = true } = {}) {
    const token = await provider.getAccessToken();
    let response;
    try {
      response = await fetchImpl(url, {
        method: "GET",
        redirect: "error",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": `${safeKeystring}:${safeSharedSecret}`,
        },
        signal: timeoutSignal(safeTimeoutMs),
      });
    } catch (error) {
      throw new EtsyFulfillmentError(
        "ETSY_API_REQUEST_FAILED",
        "The Etsy receipt request failed.",
        { statusCode: 502, retryable: true, cause: error },
      );
    }
    if (response.status === 401 && retryUnauthorized) {
      await provider.getAccessToken({ forceRefresh: true });
      return requestJson(url, { retryUnauthorized: false });
    }
    const payload = await safeJson(response);
    if (!response.ok) {
      throw new EtsyFulfillmentError(
        `ETSY_API_${etsyProviderErrorCode(payload).toUpperCase()}`,
        `Etsy rejected the receipt request (${response.status}).`,
        {
          statusCode: 502,
          providerStatus: response.status,
          retryable: response.status === 408
            || response.status === 429
            || response.status >= 500,
        },
      );
    }
    if (!payload || typeof payload !== "object") {
      throw new EtsyFulfillmentError(
        "ETSY_API_INVALID_JSON",
        "Etsy returned an invalid receipt response.",
        { statusCode: 502, retryable: true },
      );
    }
    return payload;
  }

  async function fetchReceipt(resourceUrl) {
    const resource = parseEtsyReceiptResourceUrl(resourceUrl, safeShopId);
    const receipt = await requestJson(resource.url);
    if (!Array.isArray(receipt.transactions)) {
      const transactionPayload = await requestJson(`${resource.url}/transactions`);
      receipt.transactions = Array.isArray(transactionPayload?.results)
        ? transactionPayload.results
        : [];
    }
    return receipt;
  }

  return {
    shopId: safeShopId,
    fetchReceipt,
  };
}

function validateReceiptIdentity(receipt, { shopId, receiptId }) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    throw new EtsyFulfillmentError(
      "ETSY_RECEIPT_INVALID",
      "Etsy returned an invalid receipt.",
      { statusCode: 502, retryable: true },
    );
  }
  const responseReceiptId = positiveIntegerString(receipt.receipt_id, "receipt.receipt_id");
  if (responseReceiptId !== receiptId) {
    throw new EtsyFulfillmentError(
      "ETSY_RECEIPT_ID_MISMATCH",
      "The Etsy receipt response did not match the webhook.",
      { statusCode: 403 },
    );
  }
  if (receipt.shop_id !== undefined && receipt.shop_id !== null) {
    const responseShopId = positiveIntegerString(receipt.shop_id, "receipt.shop_id");
    if (responseShopId !== shopId) {
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_SHOP_MISMATCH",
        "The Etsy receipt response did not match the configured shop.",
        { statusCode: 403 },
      );
    }
  }
}

function receiptIsCanceled(receipt) {
  const status = String(receipt.status || "").trim().toLowerCase();
  return receipt.is_canceled === true || status === "canceled" || status === "cancelled";
}

function receiptIsPaid(receipt) {
  const status = String(receipt.status || "").trim().toLowerCase();
  return receipt.is_paid === true || status === "paid" || status === "completed";
}

function receiptTransactions(receipt) {
  return Array.isArray(receipt.transactions) ? receipt.transactions : [];
}

function transactionQuantity(transaction) {
  const quantity = Number.parseInt(String(transaction?.quantity ?? "1"), 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TRANSACTION_QUANTITY) {
    throw new EtsyFulfillmentError(
      "ETSY_TRANSACTION_QUANTITY_INVALID",
      `An Etsy transaction quantity must be between 1 and ${MAX_TRANSACTION_QUANTITY}.`,
      { statusCode: 502, retryable: false },
    );
  }
  return quantity;
}

function externalOrderId({ shopId, receiptId, transactionId, unitIndex }) {
  return `etsy:${shopId}:${receiptId}:${transactionId}:${unitIndex}`;
}

function assertFulfillmentDependencies(accessCodeStore) {
  const storeMethods = [
    "createForExternalOrder",
    "list",
    "revoke",
  ];
  for (const method of storeMethods) {
    if (typeof accessCodeStore?.[method] !== "function") {
      throw new TypeError(`accessCodeStore.${method} must be a function.`);
    }
  }
}

export function createEtsyFulfillmentService({
  shopId,
  webhookSecret,
  listingPackMap,
  accessCodeStore,
  etsyApiClient,
  webhookToleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  now = Date.now,
} = {}) {
  const safeShopId = positiveIntegerString(shopId, "shopId");
  const safeWebhookSecret = String(webhookSecret || "").trim();
  const safeListingPackMap = parseEtsyListingPackMap(listingPackMap);
  if (!safeListingPackMap.size) {
    throw new EtsyFulfillmentError(
      "ETSY_LISTING_PACK_MAP_EMPTY",
      "At least one Etsy listing id must map to an InviteLab pack.",
      { statusCode: 503 },
    );
  }
  assertFulfillmentDependencies(accessCodeStore);
  if (typeof etsyApiClient?.fetchReceipt !== "function") {
    throw new TypeError("etsyApiClient.fetchReceipt must be a function.");
  }
  const toleranceSeconds = Math.max(
    30,
    Math.min(900, Number(webhookToleranceSeconds) || DEFAULT_WEBHOOK_TOLERANCE_SECONDS),
  );

  async function revokeReceiptEntitlements(receiptId) {
    const prefix = `etsy:${safeShopId}:${receiptId}:`;
    const records = await accessCodeStore.list();
    const matches = records.filter((record) => (
      record.source === "etsy"
      && String(record.externalOrderId || "").startsWith(prefix)
    ));
    let revoked = 0;
    for (const record of matches) {
      if (record.state === "revoked") continue;
      const result = await accessCodeStore.revoke(record.code);
      if (result) revoked += 1;
    }
    return { matched: matches.length, revoked };
  }

  async function ensurePaidReceiptEntitlements(receipt, webhook) {
    if (receiptIsCanceled(receipt)) {
      const revocation = await revokeReceiptEntitlements(webhook.receiptId);
      return {
        result: {
          status: "canceled_before_fulfillment",
          eventType: webhook.eventType,
          receiptId: webhook.receiptId,
          ...revocation,
        },
        records: [],
      };
    }
    if (!receiptIsPaid(receipt)) {
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_NOT_PAID",
        "The Etsy receipt is not marked as paid.",
        { statusCode: 502, retryable: true },
      );
    }
    const transactions = receiptTransactions(receipt);
    if (!transactions.length) {
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_TRANSACTIONS_MISSING",
        "The Etsy receipt did not include any transactions.",
        { statusCode: 502, retryable: true },
      );
    }

    const result = {
      status: "fulfilled",
      eventType: webhook.eventType,
      receiptId: webhook.receiptId,
      matchedUnits: 0,
      codesCreated: 0,
      ignoredTransactions: 0,
    };
    const records = [];

    for (const transaction of transactions) {
      const listingId = positiveIntegerString(transaction?.listing_id, "transaction.listing_id");
      const product = safeListingPackMap.get(listingId);
      if (!product) {
        result.ignoredTransactions += 1;
        continue;
      }
      const transactionId = positiveIntegerString(
        transaction?.transaction_id,
        "transaction.transaction_id",
      );
      const quantity = transactionQuantity(transaction);
      for (let unitIndex = 1; unitIndex <= quantity; unitIndex += 1) {
        result.matchedUnits += 1;
        const orderId = externalOrderId({
          shopId: safeShopId,
          receiptId: webhook.receiptId,
          transactionId,
          unitIndex,
        });
        const created = await accessCodeStore.createForExternalOrder({
          externalOrderId: orderId,
          label: `Etsy receipt ${webhook.receiptId}`,
          source: "etsy",
          packType: product.packType,
          creationMode: product.creationMode,
          eventType: "wedding",
          customerEmail: "",
        });
        if (created.created) result.codesCreated += 1;
        const record = created.record;
        if (
          (record.packType && record.packType !== product.packType)
          || (record.creationMode && record.creationMode !== product.creationMode)
        ) {
          throw new EtsyFulfillmentError(
            "ETSY_EXTERNAL_ORDER_PACK_MISMATCH",
            "The existing access code pack no longer matches the Etsy listing mapping.",
            { statusCode: 409, retryable: false },
          );
        }
        records.push(record);
      }
    }

    if (!result.matchedUnits) result.status = "ignored_no_mapped_listing";
    return { result, records };
  }

  async function fulfillPaidReceipt(receipt, webhook) {
    return (await ensurePaidReceiptEntitlements(receipt, webhook)).result;
  }

  async function resolveReceiptAccess(receiptNumber) {
    const receiptId = positiveIntegerString(receiptNumber, "receiptNumber");
    const resourceUrl = `https://api.etsy.com/v3/application/shops/${safeShopId}/receipts/${receiptId}`;
    const receipt = await etsyApiClient.fetchReceipt(resourceUrl);
    validateReceiptIdentity(receipt, { shopId: safeShopId, receiptId });
    if (receiptIsCanceled(receipt)) {
      await revokeReceiptEntitlements(receiptId);
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_CANCELED",
        "The Etsy receipt is canceled and cannot be used.",
        { statusCode: 409, retryable: false },
      );
    }
    const { result, records } = await ensurePaidReceiptEntitlements(receipt, {
      eventType: "receipt.access",
      receiptId,
    });
    if (!result.matchedUnits || result.status === "ignored_no_mapped_listing") {
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_NOT_ELIGIBLE",
        "The Etsy receipt does not contain an InviteLab listing.",
        { statusCode: 404, retryable: false },
      );
    }
    const activeRecords = records.filter((record) => record.state !== "revoked");
    if (activeRecords.length !== 1) {
      throw new EtsyFulfillmentError(
        "ETSY_RECEIPT_ACCESS_AMBIGUOUS",
        "The Etsy receipt contains more than one InviteLab entitlement.",
        { statusCode: 409, retryable: false },
      );
    }
    return {
      receiptId,
      customerName: cleanText(receipt.name, 100),
      record: activeRecords[0],
      result,
    };
  }

  async function handleWebhook({
    rawBody,
    webhookId,
    webhookTimestamp,
    webhookSignature,
  } = {}) {
    assertEtsyWebhookSignature({
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      signingSecret: safeWebhookSecret,
      now,
      toleranceSeconds,
    });
    const webhook = parseEtsyWebhookPayload(rawBody, {
      expectedShopId: safeShopId,
    });
    const receipt = await etsyApiClient.fetchReceipt(webhook.resourceUrl);
    validateReceiptIdentity(receipt, webhook);

    if (webhook.eventType === "order.canceled") {
      const revocation = await revokeReceiptEntitlements(webhook.receiptId);
      return {
        status: "canceled",
        eventType: webhook.eventType,
        receiptId: webhook.receiptId,
        ...revocation,
      };
    }
    return fulfillPaidReceipt(receipt, webhook);
  }

  return {
    shopId: safeShopId,
    listingPackMap: new Map(safeListingPackMap),
    handleWebhook,
    resolveReceiptAccess,
  };
}

export const ETSY_PACK_TYPES = Object.freeze({
  inviteOnly: "invite_only_pack",
  digitalPdf: "digital_pdf_pack",
  full: "Full_pack",
});
