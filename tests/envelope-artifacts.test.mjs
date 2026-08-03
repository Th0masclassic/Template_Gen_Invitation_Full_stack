import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName } from "pdf-lib";
import sharp from "sharp";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TESTS_DIR, "..");
const TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-envelope-tests-"));

Object.assign(process.env, {
  PORT: "0",
  OPENAI_API_KEY: "",
  ACCESS_CODE_REQUIRED: "0",
  ACCESS_CODE_SESSION_SECRET: "envelope-focused-test-secret",
  ACCESS_CODE_STORE_PATH: path.join(TEST_TEMP_DIR, "access-codes.json"),
  CANVA_IMPORT_ENABLED: "0",
  CANVA_CHATGPT_HANDOFF_ENABLED: "0",
  CANVA_CHATGPT_AUTOMATION_ENABLED: "0",
  CANVA_CHATGPT_PUBLISH_TEMPLATE: "0",
  CANVA_PRIVATE_TEMPLATE_LINK_ENABLED: "0",
  CANVA_TEMPLATE_SHORTENING_ENABLED: "0",
  CANVA_MCP_ENABLED: "0",
  CANVA_MCP_PUBLISH_TEMPLATE: "0",
  CANVA_OPERATOR_AUTH_AT_STARTUP: "0",
  R2_ACCOUNT_ID: "",
  R2_ACCESS_KEY_ID: "",
  R2_SECRET_ACCESS_KEY: "",
  R2_PUBLIC_BASE_URL: "",
});

const {
  deriveEnvelopeTheme,
  generateInteractivePdf,
  paletteForEnvelopeTheme,
  prepareWeddingWebsite,
  resolveEnvelopeImage,
  server,
} = await import(`../server.mjs?envelope-focused-tests=${Date.now()}`);

if (!server.listening) await once(server, "listening");

after(async () => {
  if (server.listening) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
  await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
});

const THEME_KEYS = [
  "themeColor",
  "paper",
  "paperSoft",
  "ink",
  "muted",
  "primary",
  "primarySoft",
  "accent",
  "gold",
  "line",
];

function hexRgb(value) {
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

function luminance(value) {
  const channels = Object.values(hexRgb(value)).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function projectFixture() {
  return {
    language: "en",
    eventType: "wedding",
    templateId: "editorial_photo",
    couple: { person1: "Envelope", person2: "Test" },
    invitation: {
      date: "2027-11-18",
      time: "16:00",
      location: "Quinta Teste, Portugal",
      message: "Celebrate with us.",
    },
    links: {
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Quinta+Teste",
    },
    gift: { enabled: false },
    attendance: { enabled: true, formUrl: "https://example.com/legacy-rsvp" },
    website: { enabled: true, details: {} },
  };
}

test("deriveEnvelopeTheme returns a complete safe and readable palette", async () => {
  const referencePath = path.join(PROJECT_ROOT, "website-template", "assets", "envelope-480.webp");
  const theme = await deriveEnvelopeTheme(referencePath);

  assert.deepEqual(Object.keys(theme), THEME_KEYS);
  for (const value of Object.values(theme)) assert.match(value, /^#[0-9A-F]{6}$/);
  assert.equal(theme.themeColor, theme.primary);
  assert.ok(contrast(theme.primary, "#FFFFFF") >= 4.5);
  assert.ok(contrast(theme.ink, theme.paper) >= 7);
  assert.ok(contrast(theme.muted, theme.paper) >= 4.5);
  assert.notEqual(theme.primary, theme.accent);

  const fallback = await deriveEnvelopeTheme(path.join(TEST_TEMP_DIR, "missing-envelope.png"));
  assert.deepEqual(Object.keys(fallback), THEME_KEYS);
  for (const value of Object.values(fallback)) assert.match(value, /^#[0-9A-F]{6}$/);
});

test("resolveEnvelopeImage prefers a generated envelope and otherwise uses the reference", async (context) => {
  const requestId = crypto.randomUUID();
  const generatedDir = path.join(PROJECT_ROOT, "generated");
  const envelopeFilename = `envelope-pipeline-${requestId}.png`;
  const envelopePath = path.join(generatedDir, envelopeFilename);
  await sharp({
    create: {
      width: 480,
      height: 853,
      channels: 3,
      background: "#244532",
    },
  }).png().toFile(envelopePath);
  context.after(() => fs.rm(envelopePath, { force: true }));

  const generated = await resolveEnvelopeImage({ requestId, envelopeFilename });
  assert.equal(generated.source, "generated");
  assert.equal(generated.filePath, envelopePath);
  assert.deepEqual(Object.keys(generated.theme), THEME_KEYS);

  const uploaded = await resolveEnvelopeImage({ requestId, envelopeUploadPath: envelopePath });
  assert.equal(uploaded.source, "uploaded");
  assert.equal(uploaded.filePath, envelopePath);

  const fallback = await resolveEnvelopeImage({
    requestId,
    envelopeFilename: "../outside.png",
  });
  assert.equal(fallback.source, "reference");
  assert.match(fallback.fileName, /^envelope-(?:480|941)\.webp$/);
  assert.ok(fallback.filePath.startsWith(path.join(PROJECT_ROOT, "website-template", "assets")));
});

test("PDF and website use the resolved envelope and its theme", async (context) => {
  const requestId = crypto.randomUUID();
  const generatedDir = path.join(PROJECT_ROOT, "generated");
  const invitationFilename = `envelope-test-${requestId}-v1.png`;
  const detailsFilename = `envelope-test-${requestId}-details-v1.png`;
  const envelopeFilename = `envelope-test-${requestId}-envelope-v1.png`;
  const pdfFilename = `envelope-test-${requestId}.pdf`;
  const invitationPath = path.join(generatedDir, invitationFilename);
  const detailsPath = path.join(generatedDir, detailsFilename);
  const envelopePath = path.join(generatedDir, envelopeFilename);
  const pdfPath = path.join(generatedDir, "pdf", pdfFilename);
  const siteDir = path.join(generatedDir, "sites", requestId);
  const jobPath = path.join(generatedDir, "jobs", `${requestId}.json`);
  context.after(async () => {
    await Promise.all([
      fs.rm(invitationPath, { force: true }),
      fs.rm(detailsPath, { force: true }),
      fs.rm(envelopePath, { force: true }),
      fs.rm(pdfPath, { force: true }),
      fs.rm(jobPath, { force: true }),
      fs.rm(siteDir, { recursive: true, force: true }),
    ]);
  });

  await sharp({
    create: {
      width: 1024,
      height: 1824,
      channels: 3,
      background: "#F8F1E7",
    },
  }).png().toFile(invitationPath);
  await sharp({
    create: {
      width: 1024,
      height: 1824,
      channels: 3,
      background: "#EAF0E4",
    },
  }).png().toFile(detailsPath);
  await sharp(path.join(PROJECT_ROOT, "website-template", "assets", "envelope-941.webp"))
    .png()
    .toFile(envelopePath);

  const job = {
    requestId,
    state: "approved",
    progress: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageConfirmed: true,
    project: projectFixture(),
    outputFilename: invitationFilename,
    detailsFilename,
    envelopeFilename,
    pdfFilename,
    customerPdfFilename: "envelope-test.pdf",
    websitePhotos: [],
    site: { state: "pending", publicUrl: null },
  };

  await generateInteractivePdf(job, invitationPath);
  const pdf = await PDFDocument.load(await fs.readFile(pdfPath));
  assert.equal(pdf.getPageCount(), 3, "the PDF must contain envelope, invitation and Agenda pages");
  assert.equal(job.pdfGeneration.pageCount, 3);
  assert.equal(job.pdfGeneration.architecture, "approved_gpt_artwork_with_gpt_vision_hotspots");
  assert.equal(job.pdfGeneration.visibleControlsAdded, false);
  assert.equal(job.pdfGeneration.attendancePageAdded, false);
  const [envelopePage, invitationPage, detailsPage] = pdf.getPages();
  assert.ok(pdf.context.lookup(detailsPage.node.Resources(), PDFDict), "page 3 should contain the Agenda artwork");
  assert.deepEqual(job.pdfHotspots, [], "without GPT vision, the invitation must not receive guessed hotspots");
  const invitationAnnotsRef = invitationPage.node.get(PDFName.of("Annots"));
  const invitationAnnots = invitationAnnotsRef
    ? pdf.context.lookup(invitationAnnotsRef, PDFArray)
    : null;
  assert.equal(invitationAnnots?.size() || 0, 0, "the invitation must not contain fallback square controls or guessed links");
  const resources = pdf.context.lookup(envelopePage.node.Resources(), PDFDict);
  const xObjects = pdf.context.lookup(resources.get(PDFName.of("XObject")), PDFDict);
  assert.ok(xObjects.keys().length >= 1, "page 1 should contain the envelope image");
  const envelopeImageStream = pdf.context.lookup(xObjects.get(xObjects.keys()[0]));
  const envelopeImageWidth = Number(envelopeImageStream.dict.get(PDFName.of("Width")).toString());
  const envelopeImageBytes = decodePDFRawStream(envelopeImageStream).decode();
  let texturedTopPixels = 0;
  for (let x = 0; x < envelopeImageWidth; x += 1) {
    const offset = x * 3;
    if (
      envelopeImageBytes[offset] < 250
      || envelopeImageBytes[offset + 1] < 250
      || envelopeImageBytes[offset + 2] < 250
    ) texturedTopPixels += 1;
  }
  assert.ok(
    texturedTopPixels >= envelopeImageWidth * 0.9,
    "the envelope flap must cover the full top edge instead of leaving a white strip",
  );

  const annotations = pdf.context.lookup(envelopePage.node.get(PDFName.of("Annots")), PDFArray);
  assert.ok(annotations.size() >= 1);
  const annotation = pdf.context.lookup(annotations.get(0), PDFDict);
  assert.equal(annotation.get(PDFName.of("Subtype")).toString(), "/Link");
  const border = pdf.context.lookup(annotation.get(PDFName.of("Border")), PDFArray);
  assert.deepEqual(
    Array.from({ length: border.size() }, (_, index) => Number(border.get(index).toString())),
    [0, 0, 0],
    "PDF links must remain invisible and must not render square borders",
  );
  const action = pdf.context.lookup(annotation.get(PDFName.of("A")), PDFDict);
  assert.equal(action.get(PDFName.of("S")).toString(), "/GoTo");
  const destination = pdf.context.lookup(action.get(PDFName.of("D")), PDFArray);
  assert.equal(destination.get(0).toString(), invitationPage.ref.toString());

  const palette = paletteForEnvelopeTheme(job.envelopeTheme, job.project.templateId);
  const primary = hexRgb(job.envelopeTheme.primary);
  assert.ok(Math.abs(palette.accent.red - (primary.r / 255)) < 0.0001);
  assert.ok(Math.abs(palette.accent.green - (primary.g / 255)) < 0.0001);
  assert.ok(Math.abs(palette.accent.blue - (primary.b / 255)) < 0.0001);

  await prepareWeddingWebsite(job);
  const html = await fs.readFile(path.join(siteDir, "index.html"), "utf8");
  assert.match(html, /class="envelope-intro__art" src="assets\/green-envelope\.png"/);
  assert.match(html, new RegExp(`<meta name="theme-color" content="${job.envelopeTheme.themeColor}">`));
  assert.match(html, new RegExp(`--olive:${job.envelopeTheme.primary}`));
  const envelopeMetadata = await sharp(path.join(siteDir, "envelope.png")).metadata();
  assert.equal(envelopeMetadata.format, "png");
  const manifest = JSON.parse(await fs.readFile(path.join(siteDir, "site-manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 4);
  assert.equal(manifest.envelope.fileName, "envelope.png");
  assert.equal(manifest.envelope.source, "generated");
  assert.deepEqual(manifest.envelope.theme, job.envelopeTheme);

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/site/${requestId}/envelope.png`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /image\/png/);

  const siteResponse = await fetch(`http://127.0.0.1:${address.port}/site/${requestId}/`);
  assert.equal(siteResponse.status, 200);
  assert.equal(siteResponse.headers.get("x-frame-options"), null);
  assert.match(siteResponse.headers.get("content-security-policy") || "", /frame-ancestors 'self'/);

});

test("website stages the generated GPT seal and keeps the reference fallback", async (context) => {
  const requestId = crypto.randomUUID();
  const fallbackRequestId = crypto.randomUUID();
  const generatedDir = path.join(PROJECT_ROOT, "generated");
  const invitationFilename = `generated-seal-test-${requestId}-v1.png`;
  const envelopeFilename = `generated-seal-test-${requestId}-envelope-v1.png`;
  const fallbackInvitationFilename = `fallback-seal-test-${fallbackRequestId}-v1.png`;
  const invitationPath = path.join(generatedDir, invitationFilename);
  const envelopePath = path.join(generatedDir, envelopeFilename);
  const siteDir = path.join(generatedDir, "sites", requestId);
  const fallbackInvitationPath = path.join(generatedDir, fallbackInvitationFilename);
  const fallbackSiteDir = path.join(generatedDir, "sites", fallbackRequestId);
  const jobPath = path.join(generatedDir, "jobs", `${requestId}.json`);
  const fallbackJobPath = path.join(generatedDir, "jobs", `${fallbackRequestId}.json`);
  context.after(async () => {
    await Promise.all([
      fs.rm(invitationPath, { force: true }),
      fs.rm(envelopePath, { force: true }),
      fs.rm(jobPath, { force: true }),
      fs.rm(siteDir, { recursive: true, force: true }),
      fs.rm(fallbackInvitationPath, { force: true }),
      fs.rm(fallbackJobPath, { force: true }),
      fs.rm(fallbackSiteDir, { recursive: true, force: true }),
    ]);
  });

  await sharp({
    create: {
      width: 1024,
      height: 1824,
      channels: 3,
      background: "#F8F1E7",
    },
  }).png().toFile(invitationPath);
  await sharp({
    create: {
      width: 768,
      height: 1360,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{
      input: Buffer.from('<svg width="360" height="360"><circle cx="180" cy="180" r="160" fill="#761317"/><circle cx="180" cy="180" r="130" fill="none" stroke="#E4A09A" stroke-width="6"/></svg>'),
      left: 204,
      top: 500,
    }])
    .png()
    .toFile(envelopePath);

  const job = {
    requestId,
    state: "approved",
    progress: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageConfirmed: true,
    project: projectFixture(),
    outputFilename: invitationFilename,
    envelopeFilename,
    websitePhotos: [],
    site: { state: "pending", publicUrl: null },
  };

  await prepareWeddingWebsite(job);
  const sealPath = path.join(siteDir, "envelope-seal.png");
  const sealBuffer = await fs.readFile(sealPath);
  const fallbackBuffer = await fs.readFile(
    path.join(PROJECT_ROOT, "website-template", "assets", "mobile-envelope-layer-seal.png"),
  );
  assert.notDeepEqual(sealBuffer, fallbackBuffer);
  const { data, info } = await sharp(sealPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(data[3], 0, "the generated black canvas must be transparent in the website layer");
  const centerOffset = ((680 * info.width) + 384) * info.channels;
  assert.equal(data[centerOffset + 3], 255, "the generated seal must remain opaque in the website layer");
  assert.ok(
    data[centerOffset] > data[centerOffset + 1] && data[centerOffset + 1] > data[centerOffset + 2],
    "the generated seal must be normalized to wedding gold even when the model returns red",
  );

  const manifest = JSON.parse(await fs.readFile(path.join(siteDir, "site-manifest.json"), "utf8"));
  assert.equal(manifest.envelope.sealFileName, "envelope-seal.png");
  assert.equal(manifest.envelope.sealSource, "generated");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/site/${requestId}/envelope-seal.png`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /image\/png/);

  await fs.copyFile(invitationPath, fallbackInvitationPath);
  const fallbackJob = {
    ...job,
    requestId: fallbackRequestId,
    outputFilename: fallbackInvitationFilename,
    envelopeFilename: "missing-envelope.png",
    site: { state: "pending", publicUrl: null },
  };
  await prepareWeddingWebsite(fallbackJob);
  assert.deepEqual(
    await fs.readFile(path.join(fallbackSiteDir, "envelope-seal.png")),
    fallbackBuffer,
    "a missing generated envelope must use the transparent reference seal",
  );
});
