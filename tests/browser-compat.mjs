import assert from "node:assert/strict";
import fs from "node:fs";

import { chromium } from "playwright-core";

import { startLocalServer } from "./helpers/local-server.mjs";

const EDGE_EXECUTABLES = [
  process.env.EDGE_EXECUTABLE,
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const edgeExecutable = EDGE_EXECUTABLES.find((candidate) => fs.existsSync(candidate));
if (!edgeExecutable) {
  throw new Error("Microsoft Edge was not found. Install it or set EDGE_EXECUTABLE.");
}

const server = await startLocalServer();
let browser;
try {
  browser = await chromium.launch({
    executablePath: edgeExecutable,
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.url().startsWith(server.baseUrl) && response.status() >= 400) {
      browserErrors.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  const expectedRoutes = [
    { path: "/wedding?lang=en", eventType: "wedding", firstTemplate: "editorial_photo" },
    { path: "/babyshower?lang=en", eventType: "baby_shower", firstTemplate: "baby_clouds" },
  ];
  for (const expected of expectedRoutes) {
    await page.goto(`${server.baseUrl}${expected.path}`, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, expected.path.split("?")[0]);
    assert.equal(await page.locator("#eventType").inputValue(), expected.eventType);
    assert.equal(await page.locator("#eventType").getAttribute("type"), "hidden");
    assert.equal(await page.locator("select#eventType").count(), 0);
    assert.equal(await page.locator(".template-card").count(), 10);
    assert.equal(await page.locator(".template-card").first().getAttribute("data-template-id"), expected.firstTemplate);
    await page.locator("#templateGrid").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll(".template-card img")]
      .every((image) => image.complete && image.naturalWidth > 0));
  }

  await page.selectOption("#languageSelect", "fr");
  assert.equal(await page.locator("#eventType").inputValue(), "baby_shower");
  assert.equal(await page.locator(".template-card").first().getAttribute("data-template-id"), "baby_clouds");
  assert.equal(new URL(page.url()).searchParams.get("lang"), "fr");

  const babyTheme = await page.evaluate(() => ({
    eventType: document.body.dataset.eventType,
    ink: getComputedStyle(document.body).getPropertyValue("--ink").trim(),
    accent: getComputedStyle(document.body).getPropertyValue("--accent").trim(),
    heroImage: getComputedStyle(document.querySelector(".hero-card"), "::before").backgroundImage,
  }));
  assert.equal(babyTheme.eventType, "baby_shower");
  assert.equal(babyTheme.ink, "#102f4c");
  assert.equal(babyTheme.accent, "#23689f");
  assert.match(babyTheme.heroImage, /baby-shower\/01_baby_clouds\.png/);

  await page.goto(`${server.baseUrl}/wedding?lang=fr`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#eventType").inputValue(), "wedding");
  assert.equal(await page.locator(".template-card").first().getAttribute("data-template-id"), "editorial_photo");
  await page.goto(`${server.baseUrl}/babyshower?lang=fr`, { waitUntil: "networkidle" });
  await page.goBack({ waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/wedding");
  assert.equal(await page.locator("#eventType").inputValue(), "wedding");
  await page.goForward({ waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/babyshower");
  assert.equal(await page.locator("#eventType").inputValue(), "baby_shower");
  assert.equal(await page.locator(".template-card").first().getAttribute("data-template-id"), "baby_clouds");

  await page.fill("#person1", "Ana");
  await page.fill("#person2", "Miguel");
  await page.fill("#date", "2027-05-15");
  await page.fill("#location", "Lisboa");
  const routePayloadType = await page.evaluate(() => window.buildPayload().eventType);
  assert.equal(routePayloadType, "baby_shower");

  const normalizedPhoto = await page.evaluate(async () => {
    const binary = atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=");
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const source = new File([bytes], "safari-edge-smoke.png", { type: "image/png" });
    const output = await window.normalizePhoto(source);
    return { type: output.type, name: output.name, size: output.size };
  });
  assert.equal(normalizedPhoto.type, "image/jpeg");
  assert.match(normalizedPhoto.name, /\.jpg$/);
  assert.ok(normalizedPhoto.size > 0);

  assert.equal(await page.locator("#websitePhotosField").isHidden(), true);
  assert.equal(await page.locator("#websitePhotos").isDisabled(), true);
  assert.equal(await page.evaluate(() => window.buildSubmissionBody(window.buildPayload()).getAll("websitePhotos").length), 0);
  await page.selectOption("#packType", "template_only_pack");
  assert.equal(await page.evaluate(() => window.buildPayload().website.enabled), false);
  await page.selectOption("#packType", "Full_pack");
  assert.equal(await page.locator("#websitePhotosField").isHidden(), true);
  assert.equal(await page.locator("#websitePhotos").isDisabled(), true);

  const templateUrl = "https://www.canva.com/design/DAH123abc_X/templateToken123/view?mode=preview";
  await page.evaluate((url) => {
    const ui = window.showLoading();
    window.finishLoading(ui, {
      requestId: "00000000-0000-4000-8000-000000000000",
      state: "approved",
      progress: 100,
      imageConfirmed: true,
      canRegenerate: false,
      canConfirm: false,
      canGeneratePdf: false,
      canPublishSite: false,
      imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=",
      downloadUrl: "#",
      filename: "smoke.png",
      resultUrl: "#",
      site: null,
      canva: {
        state: "template_ready",
        templateCreateUrl: url,
        templateUrl: url,
        editUrl: url,
      },
    }, {
      couple: { person1: "Ana", person2: "Miguel" },
    });
  }, templateUrl);
  const canvaButton = page.locator("#canvaGenerated");
  await canvaButton.waitFor({ state: "visible" });
  assert.equal(await canvaButton.getAttribute("href"), templateUrl);
  assert.match(await canvaButton.textContent(), /template/i);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
  assert.deepEqual(browserErrors, []);

  await context.close();
  process.stdout.write("Microsoft Edge browser compatibility smoke passed.\n");
} finally {
  await browser?.close().catch(() => {});
  await server.stop();
}
