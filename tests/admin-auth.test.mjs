import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAuthConfiguration,
  adminSessionCookie,
  createAdminSessionToken,
  hashAdminPassword,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "../admin-auth.mjs";

test("admin passwords use a strong scrypt hash and verify without storing plaintext", async () => {
  const password = "correct horse battery staple";
  const hash = await hashAdminPassword(password, { salt: Buffer.alloc(24, 7) });
  assert.match(hash, /^scrypt\$131072\$8\$1\$/);
  assert.equal(hash.includes(password), false);
  assert.equal(await verifyAdminPassword(password, hash), true);
  assert.equal(await verifyAdminPassword("incorrect password", hash), false);
  assert.equal(await verifyAdminPassword(password, "malformed"), false);
});

test("admin sessions reject expiry and tampering and contain unique CSRF/session ids", () => {
  const secret = "session-secret-that-is-longer-than-thirty-two-characters";
  const first = createAdminSessionToken({ username: "admin", secret, now: 1_700_000_000_000, maxAgeSeconds: 3600 });
  const second = createAdminSessionToken({ username: "admin", secret, now: 1_700_000_000_000, maxAgeSeconds: 3600 });
  const verified = verifyAdminSessionToken(first, { username: "admin", secret, now: 1_700_000_100_000 });
  const another = verifyAdminSessionToken(second, { username: "admin", secret, now: 1_700_000_100_000 });
  assert.equal(verified.username, "admin");
  assert.notEqual(verified.csrfToken, another.csrfToken);
  assert.notEqual(verified.sessionId, another.sessionId);
  assert.equal(verifyAdminSessionToken(`${first}x`, { username: "admin", secret, now: 1_700_000_100_000 }), null);
  assert.equal(verifyAdminSessionToken(first, { username: "other", secret, now: 1_700_000_100_000 }), null);
  assert.equal(verifyAdminSessionToken(first, { username: "admin", secret, now: 1_700_004_000_000 }), null);
});

test("admin session cookies carry the browser security attributes", () => {
  const cookie = adminSessionCookie({ name: "invitelab_admin", token: "token", secure: true, maxAgeSeconds: 3600 });
  assert.match(cookie, /^invitelab_admin=token;/);
  assert.match(cookie, /Path=\/admin/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
});

test("admin auth configuration fails closed on placeholders or malformed hashes", async () => {
  const hash = await hashAdminPassword("a genuinely long admin password", { salt: Buffer.alloc(24, 9) });
  assert.equal(adminAuthConfiguration({ username: "admin", passwordHash: hash, sessionSecret: "x".repeat(48) }).ready, true);
  assert.equal(adminAuthConfiguration({ username: "admin", passwordHash: "bad", sessionSecret: "x".repeat(48) }).ready, false);
  assert.equal(adminAuthConfiguration({ username: "admin", passwordHash: hash, sessionSecret: "short" }).ready, false);
});
