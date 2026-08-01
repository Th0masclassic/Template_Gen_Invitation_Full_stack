import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { createAccessCodeStore } from "../access-code-store.mjs";
import { PROJECT_ROOT, startLocalServer } from "./helpers/local-server.mjs";

function customerProject() {
  return {
    mode: "template",
    eventType: "wedding",
    packType: "template_only_pack",
    language: "pt",
    templateId: "editorial_photo",
    couple: { person1: "Token", person2: "Test" },
    invitation: {
      date: "2027-08-20",
      time: "15:00",
      location: "Lisboa",
      message: "Convidam para celebrar o seu casamento.",
    },
    links: { mapsUrl: "" },
    gift: { iban: "", accountHolder: "", paymentReference: "", message: "" },
    attendance: { enabled: false, formUrl: "" },
    website: { enabled: false, details: {} },
    hasPhoto: false,
    hasCustomTemplate: false,
    submittedAt: new Date().toISOString(),
  };
}

test("customer code opens one project and subsequent use redirects to its results", async (context) => {
  const suffix = crypto.randomUUID();
  const relativeStorePath = `generated/access-codes-test-${suffix}.json`;
  const storePath = path.join(PROJECT_ROOT, relativeStorePath);
  const store = createAccessCodeStore({ filePath: storePath });
  await store.initialize();
  const [created, otherCode] = await store.create({ count: 2, label: "Etsy integration test" });
  let requestId = null;

  const server = await startLocalServer({
    env: {
      ACCESS_CODE_REQUIRED: "1",
      ACCESS_CODE_STORE_PATH: relativeStorePath,
      ACCESS_CODE_SESSION_SECRET: `test-secret-${suffix}`,
      OPENAI_API_KEY: "test-key-not-used",
      MAX_CONCURRENT_GENERATIONS: "0",
    },
  });
  context.after(async () => {
    await server.stop();
    await fs.rm(storePath, { force: true });
    await fs.rm(`${storePath}.lock`, { force: true });
    if (requestId) {
      await fs.rm(path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`), { force: true });
    }
  });

  const homepage = await fetch(`${server.baseUrl}/`);
  assert.equal(homepage.status, 200);
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /id="heroTitle"/);
  assert.doesNotMatch(homepageHtml, /id="accessCode"/);

  const gated = await fetch(`${server.baseUrl}/wedding`);
  assert.equal(gated.status, 200);
  const gatedHtml = await gated.text();
  assert.match(gatedHtml, /id="accessCode"/);
  assert.doesNotMatch(gatedHtml, /id="invitationForm"/);

  const invalid = await fetch(`${server.baseUrl}/api/customer/access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "111111", returnTo: "/wedding" }),
  });
  assert.equal(invalid.status, 401);

  const redeem = await fetch(`${server.baseUrl}/api/customer/access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: created.code, returnTo: "/wedding" }),
  });
  assert.equal(redeem.status, 200, server.output.join(""));
  const cookie = redeem.headers.get("set-cookie");
  assert.ok(cookie);
  const sessionCookie = cookie.split(";", 1)[0];

  const editor = await fetch(`${server.baseUrl}/wedding`, { headers: { Cookie: sessionCookie } });
  assert.equal(editor.status, 200);
  assert.match(await editor.text(), /id="invitationForm"/);

  const form = new FormData();
  form.append("project", JSON.stringify(customerProject()));
  const generated = await fetch(`${server.baseUrl}/api/customer/generate`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: form,
  });
  assert.equal(generated.status, 202, server.output.join(""));
  const generatedBody = await generated.json();
  requestId = generatedBody.data.requestId;
  assert.match(requestId, /^[0-9a-f-]{36}$/i);

  const repeatedGeneration = await fetch(`${server.baseUrl}/api/customer/generate`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: (() => { const next = new FormData(); next.append("project", JSON.stringify(customerProject())); return next; })(),
  });
  assert.equal(repeatedGeneration.status, 409);
  const repeatedBody = await repeatedGeneration.json();
  assert.equal(repeatedBody.error.redirectUrl, `/results/${requestId}`);

  const reenter = await fetch(`${server.baseUrl}/api/customer/access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: created.code, returnTo: "/wedding" }),
  });
  assert.equal(reenter.status, 200);
  const reenterBody = await reenter.json();
  assert.equal(reenterBody.data.state, "claimed");
  assert.equal(reenterBody.data.redirectUrl, `/results/${requestId}`);

  const revisit = await fetch(`${server.baseUrl}/wedding`, {
    headers: { Cookie: sessionCookie },
    redirect: "manual",
  });
  assert.equal(revisit.status, 303);
  assert.equal(revisit.headers.get("location"), `/results/${requestId}`);

  const homepageWithClaimedCode = await fetch(`${server.baseUrl}/`, {
    headers: { Cookie: sessionCookie },
    redirect: "manual",
  });
  assert.equal(homepageWithClaimedCode.status, 200);
  assert.equal(homepageWithClaimedCode.headers.get("location"), null);
  assert.match(homepageWithClaimedCode.headers.get("cache-control") || "", /no-store/);
  assert.match(await homepageWithClaimedCode.text(), /id="heroTitle"/);

  const publicResult = await fetch(`${server.baseUrl}/results/${requestId}`, { redirect: "manual" });
  assert.equal(publicResult.status, 200);
  assert.match(await publicResult.text(), /id="resultPage"/);

  const publicStatus = await fetch(`${server.baseUrl}/api/customer/jobs/${requestId}`);
  assert.equal(publicStatus.status, 200);
  const publicStatusBody = await publicStatus.json();
  assert.equal(publicStatusBody.data.requestId, requestId);

  const otherRedeem = await fetch(`${server.baseUrl}/api/customer/access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: otherCode.code, returnTo: "/wedding" }),
  });
  assert.equal(otherRedeem.status, 200);
  const otherCookie = otherRedeem.headers.get("set-cookie").split(";", 1)[0];
  const resultWithDifferentCode = await fetch(`${server.baseUrl}/results/${requestId}`, {
    headers: { Cookie: otherCookie },
    redirect: "manual",
  });
  assert.equal(resultWithDifferentCode.status, 200);
  assert.match(await resultWithDifferentCode.text(), /id="resultPage"/);
});
