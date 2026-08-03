import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("customer form explains all products and removes gift banking fields", async () => {
  const html = await fs.readFile(path.join(root, "public", "event-builder.html"), "utf8");
  assert.match(html, /Template Generator Only/);
  assert.match(html, /Template \+ Digital Invite/);
  assert.match(html, /Full Pack/);
  assert.match(html, /purchasedCreationAccess/);
  assert.doesNotMatch(html, /id="giftIban"/);
  assert.doesNotMatch(html, /id="giftHolder"/);
  assert.doesNotMatch(html, /id="giftReference"/);
  assert.doesNotMatch(html, /id="giftMessage"/);
});

test("server enforces creation method and automatically includes the digital PDF", async () => {
  const source = await fs.readFile(path.join(root, "server.mjs"), "utf8");
  assert.match(source, /function enforceCreationEntitlement/);
  assert.match(source, /entitlement\?\.creationMode/);
  assert.match(source, /project\.packType !== "Full_pack" && project\.mode !== "template"/);
  assert.match(source, /function enqueueIncludedDigitalPdf/);
  assert.match(source, /packType !== "digital_pdf_pack"/);
  assert.match(source, /packType === "invite_only_pack"/);
});
