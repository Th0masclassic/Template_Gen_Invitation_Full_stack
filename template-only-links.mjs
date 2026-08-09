import crypto from "node:crypto";

const TOKEN_VERSION = 1;

function signingKey(secret) {
  const value = String(secret || "");
  if (value.length < 32) return null;
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

function safeEqual(left, right) {
  const a = Buffer.isBuffer(left) ? left : Buffer.from(String(left || ""));
  const b = Buffer.isBuffer(right) ? right : Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function safeSignature(value) {
  try {
    return Buffer.from(String(value || ""), "base64url");
  } catch {
    return Buffer.alloc(0);
  }
}

function cleanTemplateClaim({ templateId, filename, eventType } = {}) {
  const id = String(templateId || "").trim();
  const file = String(filename || "").trim();
  const event = eventType === "baby_shower" ? "baby_shower" : eventType === "wedding" ? "wedding" : "";
  if (!/^[a-z0-9_]{1,48}$/.test(id)) throw new TypeError("A valid template id is required.");
  if (!/^[a-zA-Z0-9_-]{1,80}\.(?:png|jpe?g|webp)$/i.test(file)) {
    throw new TypeError("A valid template image filename is required.");
  }
  if (!event) throw new TypeError("A valid template event type is required.");
  return { templateId: id, filename: file, eventType: event };
}

export function createTemplateOnlyGrant(claim, secret) {
  const key = signingKey(secret);
  if (!key) throw new Error("TEMPLATE_LINK_SECRET_NOT_CONFIGURED");
  const normalized = cleanTemplateClaim(claim);
  const payload = Buffer.from(JSON.stringify({ v: TOKEN_VERSION, ...normalized }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyTemplateOnlyGrant(token, secret, expected = {}) {
  const key = signingKey(secret);
  if (!key) return null;
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) return null;
  const calculated = crypto.createHmac("sha256", key).update(payload).digest();
  if (!safeEqual(safeSignature(signature), calculated)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (parsed?.v !== TOKEN_VERSION) return null;
    const normalized = cleanTemplateClaim(parsed);
    if (expected.templateId && normalized.templateId !== expected.templateId) return null;
    if (expected.filename && normalized.filename !== expected.filename) return null;
    if (expected.eventType && normalized.eventType !== expected.eventType) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function buildTemplateOnlyUrl({ baseUrl, claim, secret } = {}) {
  const normalized = cleanTemplateClaim(claim);
  const parsedBase = new URL(String(baseUrl || ""));
  if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password) {
    throw new TypeError("A valid HTTP(S) public base URL is required.");
  }
  const grant = createTemplateOnlyGrant(normalized, secret);
  const target = new URL(`/tempOnly/${encodeURIComponent(normalized.filename)}/gen`, parsedBase.origin);
  target.searchParams.set("grant", grant);
  return target.toString();
}

export function templateOnlyCookie({
  name = "invitelab_template",
  grant,
  secure = true,
  maxAgeSeconds = 365 * 24 * 60 * 60,
} = {}) {
  const lifetime = Math.max(60 * 60, Math.min(2 * 365 * 24 * 60 * 60, Number(maxAgeSeconds) || 365 * 24 * 60 * 60));
  return [
    `${name}=${encodeURIComponent(String(grant || ""))}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(lifetime)}`,
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function templateLinkSecretReady(secret) {
  return Boolean(signingKey(secret));
}
