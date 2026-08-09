import assert from "node:assert/strict";
import fs from "node:fs";

import { chromium } from "playwright-core";

import { hashAdminPassword } from "../admin-auth.mjs";
import { createTemplateOnlyGrant } from "../template-only-links.mjs";
import { startLocalServer } from "./helpers/local-server.mjs";

const executablePath = [
  process.env.EDGE_EXECUTABLE,
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean).find((candidate) => fs.existsSync(candidate));

if (!executablePath) throw new Error("Microsoft Edge was not found. Install it or set EDGE_EXECUTABLE.");

const secret = "browser-test-template-link-secret-32-characters";
const adminPassword = "browser-only-admin-password";
const adminPasswordHash = await hashAdminPassword(adminPassword);
const server = await startLocalServer({ env: {
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH: adminPasswordHash,
  ADMIN_SESSION_SECRET: "browser-test-admin-session-secret-32-characters",
  TEMPLATE_LINK_SECRET: secret,
} });
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
      browserErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === server.baseUrl && response.status() >= 400 && url.pathname !== "/favicon.ico") {
      browserErrors.push(`HTTP ${response.status()}: ${url.pathname}`);
    }
  });

  await page.goto(`${server.baseUrl}/admin`, { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  await page.fill("#username", "admin");
  await page.fill("#password", adminPassword);
  await page.click("#submit");
  await page.waitForURL(`${server.baseUrl}/admin`);
  await page.locator(".template-card").first().waitFor();
  assert.equal(await page.locator(".template-card").count(), 10);
  await page.click('[data-event="baby_shower"]');
  assert.equal(await page.locator(".template-card").count(), 10);
  await page.click("#generateLink");
  await page.waitForFunction(() => document.getElementById("generatedLink").value.includes("/tempOnly/"));
  assert.match(await page.locator("#generatedLink").inputValue(), /\/tempOnly\/01_baby_clouds\.png\/gen\?grant=/);

  await page.goto(`${server.baseUrl}/wedding?lang=en`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".template-card").count(), 10);
  assert.equal(await page.locator("#eventType").inputValue(), "wedding");
  assert.equal(await page.locator("#locationField").isVisible(), true);
  assert.equal(await page.locator("#location").isEnabled(), true);
  assert.equal(await page.locator("#location").getAttribute("required"), "");
  assert.equal(await page.locator("#mapsField").isVisible(), true);

  const grant = createTemplateOnlyGrant({
    templateId: "aquarela_paris",
    filename: "07_aquarela.png",
    eventType: "wedding",
  }, secret);
  await page.goto(`${server.baseUrl}/tempOnly/07_aquarela.png/gen?grant=${encodeURIComponent(grant)}`, {
    waitUntil: "networkidle",
  });

  const cleanUrl = new URL(page.url());
  assert.equal(cleanUrl.pathname, "/tempOnly/07_aquarela.png/gen");
  assert.equal(cleanUrl.search, "");
  await page.selectOption("#languageSelect", "en");
  assert.equal(await page.locator(".template-card").count(), 1);
  assert.equal(await page.locator(".template-card").getAttribute("data-template-id"), "aquarela_paris");
  assert.equal(await page.locator(".template-card").isDisabled(), true);
  assert.equal(await page.locator("#packType").inputValue(), "invite_only_pack");
  assert.equal(await page.locator("#websiteEnabled").isChecked(), false);
  assert.equal(await page.locator("#websiteEnabled").isDisabled(), true);
  assert.equal(await page.locator("#locationField").isHidden(), true);
  assert.equal(await page.locator("#location").isDisabled(), true);
  assert.equal(await page.locator("#location").getAttribute("required"), null);
  assert.equal(await page.locator("#mapsField").isHidden(), true);
  assert.equal(await page.locator("#mapsUrl").isDisabled(), true);
  assert.equal(await page.locator("#templateLockNotice").isVisible(), true);
  assert.equal(await page.locator("#photoStyleNote").isVisible(), true);
  assert.match(await page.locator("#photoLabel").innerText(), /replace the sample image/i);
  assert.match(await page.locator("#photoStyleNote").innerText(), /repaint the people and scene/i);
  assert.match(await page.locator("#purchasedProductFeatures").innerText(), /no venue, agenda, envelope, pdf or website/i);
  const lockedPayload = await page.evaluate(() => window.buildPayload());
  assert.equal(lockedPayload.invitation.location, "");
  assert.equal(lockedPayload.links.mapsUrl, "");
  assert.deepEqual(lockedPayload.agenda, {});
  assert.equal(lockedPayload.website.enabled, false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);

  await page.setInputFiles("#photo", {
    name: "customer-couple.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=", "base64"),
  });
  await page.locator("#photoPreview.visible").waitFor();
  assert.match(await page.locator("#photoTitle").innerText(), /customer-couple/i);

  const localizedLockLabels = {
    pt: "template comprado",
    en: "purchased template",
    es: "plantilla comprada",
    fr: "modèle acheté",
    de: "gekaufte vorlage",
  };
  for (const language of Object.keys(localizedLockLabels)) {
    await page.selectOption("#languageSelect", language);
    assert.equal(await page.locator("#templateLockNotice").isVisible(), true);
    assert.match((await page.locator("#templateLockNotice").innerText()), /Aquarela/i);
    const eyebrow = (await page.locator(".hero-copy .eyebrow").innerText()).toLocaleLowerCase(language);
    assert.ok(eyebrow.includes(localizedLockLabels[language]));
  }

  assert.deepEqual(browserErrors, []);
  await context.close();
  process.stdout.write("Microsoft Edge template-only browser smoke passed.\n");
} finally {
  await browser?.close().catch(() => {});
  await server.stop();
}
