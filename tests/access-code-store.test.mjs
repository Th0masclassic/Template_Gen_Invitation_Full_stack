import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAccessCodeStore, normalizeAccessCode } from "../access-code-store.mjs";

test("access-code store creates unique six-digit codes and claims each code once", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-access-codes-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const store = createAccessCodeStore({ filePath: path.join(tempDir, "access-codes.json") });
  await store.initialize();

  const created = await store.create({ count: 20, label: "Etsy batch" });
  assert.equal(created.length, 20);
  assert.equal(new Set(created.map((record) => record.code)).size, 20);
  assert.ok(created.every((record) => /^\d{6}$/.test(record.code)));
  assert.ok(created.every((record) => record.state === "unused"));

  const code = created[0].code;
  const firstClaim = await store.claim(code, "request-one");
  assert.equal(firstClaim.ok, true);
  assert.equal(firstClaim.record.state, "claimed");
  assert.equal(firstClaim.record.requestId, "request-one");

  const idempotentClaim = await store.claim(code, "request-one");
  assert.equal(idempotentClaim.ok, true);
  assert.equal(idempotentClaim.reason, "already_claimed_by_request");

  const secondClaim = await store.claim(code, "request-two");
  assert.equal(secondClaim.ok, false);
  assert.equal(secondClaim.reason, "already_claimed");
  assert.equal(secondClaim.record.requestId, "request-one");

  const resolved = await store.resolve(code);
  assert.equal(resolved.state, "claimed");
  assert.equal(resolved.requestId, "request-one");
});

test("simultaneous claims allow exactly one request to own a code", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-access-race-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const store = createAccessCodeStore({ filePath: path.join(tempDir, "access-codes.json") });
  await store.initialize();
  const [created] = await store.create();

  const claims = await Promise.all([
    store.claim(created.code, "request-a"),
    store.claim(created.code, "request-b"),
  ]);
  assert.equal(claims.filter((claim) => claim.ok).length, 1);
  const record = await store.resolve(created.code);
  assert.ok(["request-a", "request-b"].includes(record.requestId));
});

test("access-code normalization accepts exactly six numeric digits", () => {
  assert.equal(normalizeAccessCode("123 456"), "123456");
  assert.equal(normalizeAccessCode("12-34-56"), "123456");
  assert.equal(normalizeAccessCode("12345"), "");
  assert.equal(normalizeAccessCode("1234567"), "");
});

test("access codes independently restrict product and creation method", async (context) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-entitlements-"));
  context.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  const store = createAccessCodeStore({ filePath: path.join(tempDir, "access-codes.json") });
  await store.initialize();
  const [record] = await store.create({
    packType: "digital_pdf_pack",
    creationMode: "custom_import",
  });
  assert.equal(record.packType, "digital_pdf_pack");
  assert.equal(record.creationMode, "custom_import");
});
