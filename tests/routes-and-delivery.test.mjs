import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PROJECT_ROOT, startLocalServer } from "./helpers/local-server.mjs";

test("customer entry routes are canonical and all template assets are reachable", async (context) => {
  const server = await startLocalServer();
  context.after(() => server.stop());

  const root = await fetch(`${server.baseUrl}/?lang=en`, { redirect: "manual" });
  assert.equal(root.status, 308);
  assert.equal(root.headers.get("location"), "/wedding?lang=en");

  for (const route of ["/wedding", "/babyshower"]) {
    const response = await fetch(`${server.baseUrl}${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/html/);
    const html = await response.text();
    assert.match(html, /id="eventType"[^>]+type="hidden"/);
    assert.doesNotMatch(html, /<select[^>]+id="eventType"/);
  }

  for (const route of ["/wedding/?lang=pt", "/babyshower/?lang=fr"]) {
    const response = await fetch(`${server.baseUrl}${route}`, { redirect: "manual" });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), route.replace("/?", "?"));
  }

  const templateRoot = path.join(PROJECT_ROOT, "public", "assets", "templates");
  const entries = await fs.readdir(templateRoot, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(?:png|jpe?g|webp)$/i.test(entry.name))
    .map((entry) => path.relative(templateRoot, path.join(entry.parentPath, entry.name)));
  assert.ok(files.length >= 20, `Expected at least 20 template assets, found ${files.length}.`);
  for (const file of files) {
    const response = await fetch(`${server.baseUrl}/assets/templates/${file.split(path.sep).map(encodeURIComponent).join("/")}`);
    assert.equal(response.status, 200, `Template asset did not load: ${file}`);
  }
});

test("route identity and client template delivery remain explicit in source", async () => {
  const [serverSource, clientSource, i18nSource] = await Promise.all([
    fs.readFile(path.join(PROJECT_ROOT, "server.mjs"), "utf8"),
    fs.readFile(path.join(PROJECT_ROOT, "public", "index.html"), "utf8"),
    fs.readFile(path.join(PROJECT_ROOT, "public", "app-i18n.js"), "utf8"),
  ]);

  assert.match(serverSource, /app\.get\(\["\/wedding", "\/wedding\/", "\/babyshower", "\/babyshower\/"\]/);
  assert.match(serverSource, /BABY_SHOWER_TEMPLATE_IDS/);
  assert.match(serverSource, /WEDDING_TEMPLATE_IDS/);
  assert.match(clientSource, /location\.pathname/);
  assert.match(clientSource, /body\[data-event-type="baby_shower"\]/);
  assert.match(clientSource, /--accent:\s*#23689f/);
  assert.match(clientSource, /name="websitePhotos"[^>]+multiple/);
  assert.match(clientSource, /body\.append\('websitePhotos'/);
  assert.match(clientSource, /MAX_WEBSITE_PHOTOS\s*=\s*6/);
  assert.match(clientSource, /templateCreateUrl|templateUrl/);
  assert.match(clientSource, /template_ready/);
  assert.doesNotMatch(i18nSource, /["']assets\/templates\//);
});

test("a prepared site serves only gallery photos listed in its manifest", async (context) => {
  const requestId = crypto.randomUUID();
  const generatedRoot = path.join(PROJECT_ROOT, "generated");
  const jobPath = path.join(generatedRoot, "jobs", `${requestId}.json`);
  const siteDir = path.join(generatedRoot, "sites", requestId);
  const now = new Date().toISOString();

  await fs.mkdir(path.dirname(jobPath), { recursive: true });
  await fs.mkdir(siteDir, { recursive: true });
  await fs.writeFile(jobPath, JSON.stringify({
    requestId,
    state: "approved",
    progress: 100,
    createdAt: now,
    updatedAt: now,
    imageConfirmed: true,
    project: {
      language: "en",
      eventType: "wedding",
      packType: "Full_pack",
      couple: { person1: "Manifest", person2: "Test" },
      website: { enabled: true },
    },
    site: {
      state: "ready",
      localUrl: `/site/${requestId}/`,
      preparedAt: now,
      galleryImages: ["site-photo-01.jpg"],
    },
  }, null, 2), "utf8");
  await fs.writeFile(
    path.join(siteDir, "site-manifest.json"),
    JSON.stringify({ schemaVersion: 1, galleryImages: ["site-photo-01.jpg"] }),
    "utf8",
  );
  const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  await fs.writeFile(path.join(siteDir, "invitation.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await fs.writeFile(path.join(siteDir, "site-photo-01.jpg"), jpegBytes);
  await fs.writeFile(path.join(siteDir, "site-photo-02.jpg"), jpegBytes);
  context.after(async () => {
    await fs.rm(jobPath, { force: true });
    await fs.rm(siteDir, { recursive: true, force: true });
  });

  const server = await startLocalServer();
  context.after(() => server.stop());

  const jobStatus = await fetch(`${server.baseUrl}/api/customer/jobs/${requestId}`);
  assert.equal(jobStatus.status, 200);
  const jobPayload = await jobStatus.json();
  assert.equal(jobPayload.data.imageConfirmed, true);
  assert.equal(jobPayload.data.site?.state, "ready");

  const invitation = await fetch(`${server.baseUrl}/site/${requestId}/invitation.png`);
  assert.equal(invitation.status, 200, server.output.join(""));

  const listed = await fetch(`${server.baseUrl}/site/${requestId}/site-photo-01.jpg`);
  assert.equal(listed.status, 200);
  assert.match(listed.headers.get("content-type") || "", /image\/jpeg/);

  const stale = await fetch(`${server.baseUrl}/site/${requestId}/site-photo-02.jpg`);
  assert.equal(stale.status, 404);

  const manifest = await fetch(`${server.baseUrl}/site/${requestId}/site-manifest.json`);
  assert.equal(manifest.status, 404);
});

test("a persisted Canva template link is returned to the customer API and result page", async (context) => {
  const requestId = crypto.randomUUID();
  const jobPath = path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`);
  const canvaTemplateUrl = "https://canva.link/customer-delivery-test";
  const canvaTemplateLongUrl =
    "https://www.canva.com/design/DAHDelivery123/TemplateToken123/view"
    + "?utm_content=DAHDelivery123&utm_campaign=designshare"
    + "&utm_medium=link&utm_source=publishsharelink&mode=preview";
  const now = new Date().toISOString();

  await fs.mkdir(path.dirname(jobPath), { recursive: true });
  await fs.writeFile(jobPath, JSON.stringify({
    requestId,
    state: "completed",
    progress: 100,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    imageConfirmed: true,
    imageAttempts: [],
    customerFilename: "delivery-test.png",
    imageUrl: null,
    downloadUrl: null,
    resultUrl: `/result/${requestId}`,
    project: {
      language: "en",
      eventType: "wedding",
      packType: "template_only_pack",
      couple: { person1: "Test", person2: "Customer" },
      website: { enabled: false },
    },
    canva: {
      state: "template_ready",
      canvaEditorUrl:
        "https://www.canva.com/design/DAHDelivery123/DeliveryExtension123/edit",
      canvaDesignId: "DAHDelivery123",
      canvaExtension: "DeliveryExtension123",
      canvaTemplateToken: "TemplateToken123",
      canvaTemplateUrl,
      canvaTemplateLongUrl,
      canvaTemplateUrlType: "short",
      templateCreateUrl: canvaTemplateUrl,
      templateViewUrl: canvaTemplateLongUrl,
      editUrl: canvaTemplateUrl,
      viewUrl: canvaTemplateLongUrl,
    },
  }, null, 2), "utf8");
  context.after(() => fs.rm(jobPath, { force: true }));

  const server = await startLocalServer();
  context.after(() => server.stop());

  const apiResponse = await fetch(`${server.baseUrl}/api/customer/jobs/${requestId}`);
  assert.equal(apiResponse.status, 200);
  const apiPayload = await apiResponse.json();
  assert.equal(apiPayload.success, true);
  assert.equal(apiPayload.data.canva.state, "template_ready");
  assert.equal(apiPayload.data.canva.templateUrl, canvaTemplateUrl);
  assert.equal(apiPayload.data.canva.templateCreateUrl, canvaTemplateUrl);
  assert.equal(apiPayload.data.canva.editUrl, canvaTemplateUrl);
  assert.equal(apiPayload.data.canva.templateLongUrl, canvaTemplateLongUrl);
  assert.equal(apiPayload.data.canva.templateUrlType, "short");

  const resultResponse = await fetch(`${server.baseUrl}/result/${requestId}`);
  assert.equal(resultResponse.status, 200);
  const resultHtml = await resultResponse.text();
  assert.match(resultHtml, /Usar template no Canva/);
  assert.match(resultHtml, /id="canvaEdit"/);
  assert.match(resultHtml, /\/api\/customer\/jobs\//);
});

test("a Brand Template fallback is never exposed as the customer's Template Link", async (context) => {
  const requestId = crypto.randomUUID();
  const jobPath = path.join(PROJECT_ROOT, "generated", "jobs", `${requestId}.json`);
  const brandTemplateUrl = "https://www.canva.com/design/brand-fallback";
  const now = new Date().toISOString();

  await fs.mkdir(path.dirname(jobPath), { recursive: true });
  await fs.writeFile(jobPath, JSON.stringify({
    requestId,
    state: "completed",
    progress: 100,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    imageConfirmed: true,
    imageAttempts: [],
    customerFilename: "brand-fallback-test.png",
    imageUrl: null,
    downloadUrl: null,
    resultUrl: `/result/${requestId}`,
    project: {
      language: "en",
      eventType: "wedding",
      packType: "template_only_pack",
      couple: { person1: "Private", person2: "Template" },
      website: { enabled: false },
    },
    canva: {
      state: "template_ready",
      canvaTemplateUrl: brandTemplateUrl,
      canvaTemplateUrlType: "create",
      templateCreateUrl: brandTemplateUrl,
      editUrl: brandTemplateUrl,
      templateLinkError: {
        phase: "acl",
        code: "CANVA_PAGE_REQUEST_FAILED",
        category: "request",
      },
    },
  }, null, 2), "utf8");
  context.after(() => fs.rm(jobPath, { force: true }));

  const server = await startLocalServer({
    env: { CANVA_PRIVATE_TEMPLATE_LINK_ENABLED: "1" },
  });
  context.after(() => server.stop());

  const apiResponse = await fetch(`${server.baseUrl}/api/customer/jobs/${requestId}`);
  assert.equal(apiResponse.status, 200);
  const apiPayload = await apiResponse.json();
  assert.equal(apiPayload.success, true);
  assert.equal(apiPayload.data.canva.state, "template_link_failed");
  assert.equal(apiPayload.data.canva.templateUrl, null);
  assert.equal(apiPayload.data.canva.templateCreateUrl, null);
  assert.equal(apiPayload.data.canva.editUrl, null);
  assert.equal(apiPayload.data.canva.templateUrlType, null);
  assert.equal(JSON.stringify(apiPayload).includes(brandTemplateUrl), false);
});
