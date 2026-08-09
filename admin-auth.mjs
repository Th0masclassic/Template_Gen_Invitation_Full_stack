import crypto from "node:crypto";

const PASSWORD_SCHEME = "scrypt";
const SCRYPT_N = 131_072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;
const SESSION_VERSION = 1;

function secretKey(secret) {
  const value = String(secret || "");
  if (value.length < 32) return null;
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

function safeBase64UrlBuffer(value) {
  try {
    return Buffer.from(String(value || ""), "base64url");
  } catch {
    return Buffer.alloc(0);
  }
}

function safeEqual(left, right) {
  const a = Buffer.isBuffer(left) ? left : Buffer.from(String(left || ""));
  const b = Buffer.isBuffer(right) ? right : Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parsePasswordHash(encoded) {
  const parts = String(encoded || "").split("$");
  if (parts.length !== 7 || parts[0] !== PASSWORD_SCHEME) return null;
  const n = Number.parseInt(parts[1], 10);
  const r = Number.parseInt(parts[2], 10);
  const p = Number.parseInt(parts[3], 10);
  const salt = safeBase64UrlBuffer(parts[4]);
  const expected = safeBase64UrlBuffer(parts[5]);
  const keyLength = Number.parseInt(parts[6], 10);
  if (
    !Number.isInteger(n) || n < 131_072 || n > 262_144 || (n & (n - 1)) !== 0
    || !Number.isInteger(r) || r < 8 || r > 16
    || !Number.isInteger(p) || p < 1 || p > 4
    || salt.length < 16 || salt.length > 64
    || !Number.isInteger(keyLength) || keyLength !== expected.length || keyLength < 32 || keyLength > 128
  ) {
    return null;
  }
  return { n, r, p, salt, expected, keyLength };
}

function scrypt(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashAdminPassword(password, { salt = crypto.randomBytes(24) } = {}) {
  const value = String(password || "");
  if (value.length < 12 || value.length > 256) {
    throw new TypeError("The admin password must contain between 12 and 256 characters.");
  }
  const normalizedSalt = Buffer.isBuffer(salt) ? salt : Buffer.from(salt);
  if (normalizedSalt.length < 16 || normalizedSalt.length > 64) {
    throw new TypeError("The password salt must contain between 16 and 64 bytes.");
  }
  const derived = await scrypt(value, normalizedSalt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  });
  return [
    PASSWORD_SCHEME,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    normalizedSalt.toString("base64url"),
    derived.toString("base64url"),
    SCRYPT_KEY_LENGTH,
  ].join("$");
}

export async function verifyAdminPassword(password, encodedHash) {
  const parsed = parsePasswordHash(encodedHash);
  if (!parsed) return false;
  const value = String(password || "");
  if (value.length > 256) return false;
  try {
    const received = await scrypt(value, parsed.salt, parsed.keyLength, {
      N: parsed.n,
      r: parsed.r,
      p: parsed.p,
      maxmem: SCRYPT_MAX_MEMORY,
    });
    return safeEqual(received, parsed.expected);
  } catch {
    return false;
  }
}

export function createAdminSessionToken({
  username,
  secret,
  now = Date.now(),
  maxAgeSeconds = 8 * 60 * 60,
} = {}) {
  const key = secretKey(secret);
  if (!key) throw new Error("ADMIN_SESSION_SECRET_NOT_CONFIGURED");
  const subject = String(username || "").trim();
  if (!subject || subject.length > 120) throw new TypeError("A valid admin username is required.");
  const issuedAt = Math.floor(Number(now) / 1000);
  const lifetime = Math.max(900, Math.min(24 * 60 * 60, Number(maxAgeSeconds) || 8 * 60 * 60));
  const payload = Buffer.from(JSON.stringify({
    v: SESSION_VERSION,
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + lifetime,
    csrf: crypto.randomBytes(24).toString("base64url"),
    sid: crypto.randomBytes(24).toString("base64url"),
  }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token, {
  username,
  secret,
  now = Date.now(),
} = {}) {
  const key = secretKey(secret);
  if (!key) return null;
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", key).update(payload).digest();
  const received = safeBase64UrlBuffer(signature);
  if (!safeEqual(received, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const nowSeconds = Math.floor(Number(now) / 1000);
    if (
      parsed?.v !== SESSION_VERSION
      || parsed?.sub !== String(username || "").trim()
      || !Number.isFinite(parsed?.iat)
      || !Number.isFinite(parsed?.exp)
      || parsed.iat > nowSeconds + 60
      || parsed.exp <= nowSeconds
      || parsed.exp - parsed.iat > 24 * 60 * 60
      || !/^[A-Za-z0-9_-]{32}$/.test(String(parsed?.csrf || ""))
      || !/^[A-Za-z0-9_-]{32}$/.test(String(parsed?.sid || ""))
    ) {
      return null;
    }
    return {
      username: parsed.sub,
      issuedAt: parsed.iat,
      expiresAt: parsed.exp,
      csrfToken: parsed.csrf,
      sessionId: parsed.sid,
    };
  } catch {
    return null;
  }
}

export function adminSessionCookie({
  name = "invitelab_admin",
  token,
  maxAgeSeconds = 8 * 60 * 60,
  secure = true,
} = {}) {
  const lifetime = Math.max(900, Math.min(24 * 60 * 60, Number(maxAgeSeconds) || 8 * 60 * 60));
  return [
    `${name}=${encodeURIComponent(String(token || ""))}`,
    "Path=/admin",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.floor(lifetime)}`,
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function clearAdminSessionCookie({
  name = "invitelab_admin",
  secure = true,
} = {}) {
  return [
    `${name}=`,
    "Path=/admin",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function adminAuthConfiguration({ username, passwordHash, sessionSecret } = {}) {
  const safeUsername = String(username || "").trim();
  return {
    ready: Boolean(
      safeUsername
      && safeUsername.length <= 120
      && parsePasswordHash(passwordHash)
      && secretKey(sessionSecret)
    ),
    username: safeUsername,
    passwordHashValid: Boolean(parsePasswordHash(passwordHash)),
    sessionSecretValid: Boolean(secretKey(sessionSecret)),
  };
}
