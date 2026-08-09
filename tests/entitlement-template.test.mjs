import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAccessCodeStore } from "../access-code-store.mjs";
import { parseEtsyListingPackMap } from "../etsy-fulfillment.mjs";

test("access-code records persist a template lock through create, resolve and claim", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-entitlement-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = createAccessCodeStore({ filePath: path.join(directory, "codes.json") });
  await store.initialize();
  const [created] = await store.create({
    packType: "invite_only_pack",
    creationMode: "template",
    eventType: "wedding",
    templateId: "aquarela_paris",
  });
  assert.equal(created.templateId, "aquarela_paris");
  assert.equal((await store.resolve(created.code)).templateId, "aquarela_paris");
  assert.equal((await store.claim(created.code, "request-1")).record.templateId, "aquarela_paris");
});

test("a signed template journey permanently binds a generic template-only access record", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-template-binding-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = createAccessCodeStore({ filePath: path.join(directory, "codes.json") });
  await store.initialize();
  const [created] = await store.create({
    packType: "invite_only_pack",
    creationMode: "template",
    eventType: "wedding",
  });
  const bound = await store.bindTemplate(created.code, {
    templateId: "aquarela_paris",
    eventType: "wedding",
  });
  assert.equal(bound.ok, true);
  assert.equal(bound.record.templateId, "aquarela_paris");
  assert.equal((await store.resolve(created.code)).templateId, "aquarela_paris");

  const conflicting = await store.bindTemplate(created.code, {
    templateId: "coastal_blue",
    eventType: "wedding",
  });
  assert.equal(conflicting.ok, false);
  assert.equal(conflicting.reason, "conflict");
});

test("Etsy listing mappings carry template and event entitlements", () => {
  const mapping = parseEtsyListingPackMap(JSON.stringify({
    1234567890: {
      packType: "invite_only_pack",
      creationMode: "template",
      eventType: "wedding",
      templateId: "aquarela_paris",
    },
    2345678901: {
      packType: "invite_only_pack",
      templateId: "baby_clouds",
    },
  }));
  assert.deepEqual(mapping.get("1234567890"), {
    packType: "invite_only_pack",
    creationMode: "template",
    eventType: "wedding",
    templateId: "aquarela_paris",
  });
  assert.equal(mapping.get("2345678901").eventType, "baby_shower");
  assert.equal(mapping.get("2345678901").templateId, "baby_clouds");
});
