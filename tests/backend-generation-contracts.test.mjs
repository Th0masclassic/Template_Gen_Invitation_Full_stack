import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { createAccessCodeStore } from "../access-code-store.mjs";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TESTS_DIR, "..");
const SERVER_PATH = path.join(PROJECT_ROOT, "server.mjs");
const GENERATED_DIR = path.join(PROJECT_ROOT, "generated");
const JOBS_DIR = path.join(GENERATED_DIR, "jobs");
const TEST_TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "invitelab-backend-generation-tests-"));
const ACCESS_STORE_PATH = path.join(TEST_TEMP_DIR, "access-codes.json");

Object.assign(process.env, {
  PORT: "0",
  OPENAI_API_KEY: "test-key-not-used",
  ACCESS_CODE_REQUIRED: "1",
  ACCESS_CODE_STORE_PATH: ACCESS_STORE_PATH,
  ACCESS_CODE_SESSION_SECRET: `backend-generation-test-${crypto.randomUUID()}`,
  MAX_CONCURRENT_GENERATIONS: "0",
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
  R2_BUCKET_NAME: "",
  R2_PUBLIC_BASE_URL: "",
});

const { server } = await import(`../server.mjs?backend-generation-contracts=${Date.now()}`);
if (!server.listening) await once(server, "listening");
const serverAddress = server.address();
assert.ok(serverAddress && typeof serverAddress === "object");
const BASE_URL = `http://127.0.0.1:${serverAddress.port}`;
const accessStore = createAccessCodeStore({ filePath: ACCESS_STORE_PATH });
await accessStore.initialize();

after(async () => {
  if (server.listening) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
  await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
});

function weddingProject({
  packType = "template_only_pack",
  hasPhoto = false,
  websiteEnabled = false,
  person1 = "Ana",
  person2 = "Luis",
} = {}) {
  return {
    mode: "template",
    eventType: "wedding",
    packType,
    language: "pt",
    templateId: "editorial_photo",
    couple: { person1, person2 },
    invitation: {
      date: "2027-08-20",
      time: "15:00",
      location: "Lisboa",
      message: "Convidam para celebrar o seu casamento.",
    },
    links: { mapsUrl: "" },
    gift: { iban: "", accountHolder: "", paymentReference: "", message: "" },
    attendance: { enabled: false, formUrl: "" },
    website: { enabled: websiteEnabled, details: {} },
    hasPhoto,
    hasCustomTemplate: false,
    submittedAt: new Date().toISOString(),
  };
}

function persistedJob(requestId, overrides = {}) {
  const project = overrides.project || weddingProject();
  const outputFilename = `ana-luis-${requestId}-v1.png`;
  const envelopeFilename = `ana-luis-${requestId}-envelope-v1.png`;
  const now = new Date().toISOString();
  return {
    requestId,
    state: "image_ready",
    progress: 100,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + (60 * 60 * 1000)).toISOString(),
    attemptsUsed: 1,
    invitationAttemptsUsed: 1,
    envelopeAttemptsUsed: 1,
    maxImageAttempts: 5,
    imageRevision: 1,
    envelopeRevision: 1,
    generationTarget: null,
    currentGenerationTarget: null,
    imageConfirmed: false,
    confirmedAt: null,
    project,
    outputFilename,
    envelopeFilename,
    pdfFilename: `ana-luis-${requestId}.pdf`,
    customerFilename: "ana-luis-convite.png",
    customerEnvelopeFilename: "ana-luis-envelope.png",
    customerPdfFilename: "ana-luis-convite-digital.pdf",
    imageUrl: `/generated/${encodeURIComponent(outputFilename)}`,
    downloadUrl: `/api/customer/download/${encodeURIComponent(outputFilename)}`,
    envelopeUrl: `/generated/${encodeURIComponent(envelopeFilename)}`,
    envelopeDownloadUrl: `/api/customer/download/${encodeURIComponent(envelopeFilename)}`,
    envelopeTheme: null,
    pdfUrl: null,
    pdfDownloadUrl: null,
    pptxUrl: null,
    pptxDownloadUrl: null,
    latexUrl: null,
    resultUrl: `/results/${requestId}`,
    canva: { state: "pending_confirmation" },
    site: project.website.enabled
      ? { state: "pending_confirmation", progress: 0, publicUrl: null, error: null }
      : { state: "disabled" },
    rsvp: { submissionCount: 0, lastSubmissionAt: null },
    error: null,
    ...overrides,
    project,
  };
}

async function writeJob(job) {
  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(JOBS_DIR, `${job.requestId}.json`),
    `${JSON.stringify(job, null, 2)}\n`,
  );
}

async function readJob(requestId) {
  return JSON.parse(await fs.readFile(path.join(JOBS_DIR, `${requestId}.json`), "utf8"));
}

async function removeJob(requestId) {
  await fs.rm(path.join(JOBS_DIR, `${requestId}.json`), { force: true });
}

async function postJson(url, body, headers = {}) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function redeemAccessCode(baseUrl, code, returnTo) {
  const response = await postJson(`${baseUrl}/api/customer/access-code`, { code, returnTo });
  assert.equal(response.status, 200, await response.text());
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "access-code redemption must create a customer session");
  return setCookie.split(";", 1)[0];
}

async function claimAccessForJob(requestId, { packType = "Full_pack", eventType = "wedding" } = {}) {
  const [created] = await accessStore.create({
    label: `Backend contract ${requestId.slice(0, 8)}`,
    packType,
    eventType,
  });
  const claim = await accessStore.claim(created.code, requestId);
  assert.equal(claim.ok, true);
  return { code: created.code, record: claim.record };
}

function accessCodeSnapshot(owner) {
  return {
    source: owner.record?.source || "manual",
    lastTwo: owner.code.slice(-2),
    claimedAt: owner.record?.claimedAt || new Date().toISOString(),
    packType: owner.record?.packType || null,
    eventType: owner.record?.eventType || null,
  };
}

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing source marker: ${startMarker}`);
  assert.ok(end > start, `missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

test("server syntax and the masked gpt-image-2 envelope request match the installed SDK contract", async () => {
  // Importing server.mjs above parses and evaluates the whole module in this process.
  assert.equal(server.listening, true);
  const source = await fs.readFile(SERVER_PATH, "utf8");
  const runImageJob = sourceSection(source, "async function runImageGenerationJob", "function invitationImageEditParams");
  const envelopeEdit = sourceSection(source, "async function generateEnvelopeImage", "async function createEnvelopeInitialsMask");
  const maskFactory = sourceSection(source, "async function createEnvelopeInitialsMask", "function isImageStreamingCompatibilityError");

  assert.match(source, /const MAX_IMAGE_ATTEMPTS = 7;/);
  assert.match(
    source,
    /const OPENAI_ENVELOPE_IMAGE_MODEL\s*=\s*String\(process\.env\.OPENAI_ENVELOPE_IMAGE_MODEL\s*\|\|\s*"gpt-image-2"\)/,
  );
  assert.match(runImageJob, /await createEnvelopeInitialsMask\(\)/);
  assert.match(runImageJob, /envelopeRevisionNeedsFullVisualEdit/);
  assert.match(runImageJob, /ENVELOPE_REFERENCE_PATH[\s\S]+envelope-480\.webp/);
  assert.match(envelopeEdit, /client\.images\.edit\(\{/);
  assert.match(envelopeEdit, /model:\s*OPENAI_ENVELOPE_IMAGE_MODEL/);
  assert.match(envelopeEdit, /\.\.\.\(mask \? \{ mask \} : \{\}\)/);
  assert.doesNotMatch(
    envelopeEdit,
    /input_fidelity/,
    "gpt-image-2 rejects input_fidelity on envelope edits",
  );
  assert.match(envelopeEdit, /output_format:\s*"png"/);
  assert.match(maskFactory, /sharp\(ENVELOPE_REFERENCE_PATH\)\.metadata\(\)/);
  assert.match(maskFactory, /raw\[\(\(y \* width \+ x\) \* 4\) \+ 3\] = 0/);
  assert.match(maskFactory, /toFile\(maskBuffer,\s*"envelope-initials-mask\.png"/);

  const requestedSize = envelopeEdit.match(/size:\s*"(\d+)x(\d+)"/);
  assert.ok(requestedSize, "the envelope edit must request an explicit portrait output size");
  const width = Number(requestedSize[1]);
  const height = Number(requestedSize[2]);
  assert.equal(width % 16, 0, "gpt-image-2 arbitrary width must be divisible by 16");
  assert.equal(height % 16, 0, "gpt-image-2 arbitrary height must be divisible by 16");
  assert.ok(width / height >= 1 / 3 && width / height <= 3, "gpt-image-2 aspect ratio must be between 1:3 and 3:1");
});

test("envelope regeneration feedback reaches the envelope edit prompt", async () => {
  const source = await fs.readFile(SERVER_PATH, "utf8");
  const runImageJob = sourceSection(source, "async function runImageGenerationJob", "function invitationImageEditParams");
  const promptBuilder = sourceSection(source, "function buildEnvelopeEditPrompt", "async function generateEnvelopeImage");
  const promptReadsFeedback = /revisionContext/.test(promptBuilder);
  const callPassesFeedback = /buildEnvelopeEditPrompt\([\s\S]{0,240}revisionContext/.test(runImageJob);

  assert.ok(
    promptReadsFeedback || callPassesFeedback,
    "target=envelope accepts revisionContext, but the model prompt currently discards that customer feedback",
  );
  assert.match(promptBuilder, /colour or material change/);
  assert.match(promptBuilder, /bounded visual revision request/);
});

test("invitation and envelope share a combined seven-redo budget", async (context) => {
  const invitationExhaustedId = crypto.randomUUID();
  const envelopeExhaustedId = crypto.randomUUID();
  const invitationOwner = await claimAccessForJob(invitationExhaustedId);
  const envelopeOwner = await claimAccessForJob(envelopeExhaustedId);
  const invitationExhausted = persistedJob(invitationExhaustedId, {
    attemptsUsed: 4,
    invitationAttemptsUsed: 4,
    envelopeAttemptsUsed: 3,
    accessCode: accessCodeSnapshot(invitationOwner),
  });
  const envelopeExhausted = persistedJob(envelopeExhaustedId, {
    attemptsUsed: 4,
    invitationAttemptsUsed: 4,
    envelopeAttemptsUsed: 5,
    accessCode: accessCodeSnapshot(envelopeOwner),
  });
  await writeJob(invitationExhausted);
  await writeJob(envelopeExhausted);
  context.after(async () => {
    await Promise.all([removeJob(invitationExhaustedId), removeJob(envelopeExhaustedId)]);
  });

  const invitationCookie = await redeemAccessCode(BASE_URL, invitationOwner.code, `/results/${invitationExhaustedId}`);
  const envelopeCookie = await redeemAccessCode(BASE_URL, envelopeOwner.code, `/results/${envelopeExhaustedId}`);

  const invalidTarget = await postJson(
    `${BASE_URL}/api/customer/jobs/${invitationExhaustedId}/regenerate`,
    { target: "both" },
    { Cookie: invitationCookie },
  );
  assert.equal(invalidTarget.status, 400);

  const blockedInvitation = await postJson(
    `${BASE_URL}/api/customer/jobs/${invitationExhaustedId}/regenerate`,
    { target: "invitation" },
    { Cookie: invitationCookie },
  );
  assert.equal(blockedInvitation.status, 202, await blockedInvitation.clone().text());

  const acceptedEnvelope = await postJson(
    `${BASE_URL}/api/customer/jobs/${invitationExhaustedId}/regenerate`,
    { target: "envelope", revisionContext: "Tornar as iniciais mais legiveis." },
    { Cookie: invitationCookie },
  );
  assert.equal(acceptedEnvelope.status, 202, await acceptedEnvelope.clone().text());
  const acceptedEnvelopeBody = await acceptedEnvelope.json();
  assert.equal(acceptedEnvelopeBody.data.redoAttemptsUsed, 7);
  assert.equal(acceptedEnvelopeBody.data.remainingImageAttempts, 0);
  assert.equal(acceptedEnvelopeBody.data.remainingEnvelopeAttempts, 0);

  const blockedEnvelope = await postJson(
    `${BASE_URL}/api/customer/jobs/${envelopeExhaustedId}/regenerate`,
    { target: "envelope" },
    { Cookie: envelopeCookie },
  );
  assert.equal(blockedEnvelope.status, 429);
  assert.equal((await blockedEnvelope.json()).error.code, "REDO_ATTEMPT_LIMIT_REACHED");

  const acceptedInvitation = await postJson(
    `${BASE_URL}/api/customer/jobs/${envelopeExhaustedId}/regenerate`,
    { target: "invitation", revisionContext: "Aumentar os nomes." },
    { Cookie: envelopeCookie },
  );
  assert.equal(acceptedInvitation.status, 429);
  assert.equal((await acceptedInvitation.json()).error.code, "REDO_ATTEMPT_LIMIT_REACHED");

  const savedEnvelope = await readJob(invitationExhaustedId);
  assert.equal(savedEnvelope.generationTarget, "envelope");
  assert.equal(savedEnvelope.outputFilename, invitationExhausted.outputFilename);
  assert.notEqual(savedEnvelope.envelopeFilename, invitationExhausted.envelopeFilename);
  assert.equal(savedEnvelope.redoAttemptsUsed, 6);

  const savedInvitation = await readJob(envelopeExhaustedId);
  assert.equal(savedInvitation.generationTarget, "invitation");
  assert.notEqual(savedInvitation.outputFilename, envelopeExhausted.outputFilename);
  assert.equal(savedInvitation.envelopeFilename, envelopeExhausted.envelopeFilename);
  assert.equal(savedInvitation.redoAttemptsUsed, 6);
});

test("a claimed code can reopen its own project editor through the redo URL", async (context) => {
  const requestId = crypto.randomUUID();
  const owner = await claimAccessForJob(requestId);
  await writeJob(persistedJob(requestId, {
    project: weddingProject({ packType: "Full_pack", websiteEnabled: true }),
    accessCode: accessCodeSnapshot(owner),
  }));

  context.after(() => removeJob(requestId));

  const redoUrl = `/wedding?redo=${encodeURIComponent(requestId)}`;
  const cookie = await redeemAccessCode(BASE_URL, owner.code, redoUrl);
  const response = await fetch(`${BASE_URL}${redoUrl}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="invitationForm"/);
  assert.doesNotMatch(html, /id="accessCode"/);
});

test("a claimed customer can enter a second purchase code without losing the first project", async (context) => {
  const requestId = crypto.randomUUID();
  const owner = await claimAccessForJob(requestId);
  await writeJob(persistedJob(requestId, { accessCode: accessCodeSnapshot(owner) }));
  context.after(() => removeJob(requestId));

  const cookie = await redeemAccessCode(BASE_URL, owner.code, `/results/${requestId}`);
  const response = await fetch(`${BASE_URL}/wedding?new=1`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="accessCode"/);
  assert.doesNotMatch(html, /id="invitationForm"/);
});

test("whole-project restart keeps the claim but clears stale inputs and artifact state", async (context) => {
  const requestId = crypto.randomUUID();
  const staleEnvelopePath = path.join(GENERATED_DIR, `stale-${requestId}-envelope.png`);
  const stalePhotoPath = path.join(GENERATED_DIR, `stale-${requestId}-photo.png`);
  const owner = await claimAccessForJob(requestId);
  await fs.writeFile(staleEnvelopePath, Buffer.from("old envelope"));
  await fs.writeFile(stalePhotoPath, Buffer.from("old photo"));
  await writeJob(persistedJob(requestId, {
    project: weddingProject({
      packType: "Full_pack",
      websiteEnabled: true,
      hasPhoto: true,
      person1: "Old",
      person2: "Names",
    }),
    imageConfirmed: true,
    confirmedAt: new Date().toISOString(),
    state: "completed",
    attemptsUsed: 5,
    invitationAttemptsUsed: 5,
    envelopeAttemptsUsed: 5,
    photoPath: stalePhotoPath,
    photoMime: "image/png",
    envelopeUploadPath: staleEnvelopePath,
    uploadedEnvelopePath: staleEnvelopePath,
    envelopePath: staleEnvelopePath,
    envelope: { path: staleEnvelopePath, source: "uploaded" },
    envelopeSource: "uploaded",
    finalImageUpdated: true,
    finalEnvelopeUpdated: true,
    pdfUrl: `/generated/pdfs/old-${requestId}.pdf`,
    pdfDownloadUrl: `/api/customer/pdf/old-${requestId}.pdf`,
    pptxUrl: `/generated/pptx/old-${requestId}.pptx`,
    pptxDownloadUrl: `/api/customer/pptx/old-${requestId}.pptx`,
    latexUrl: `/generated/latex/old-${requestId}.tex`,
    canva: {
      state: "template_ready",
      canvaTemplateUrl: "https://www.canva.com/design/restart-contract/view",
    },
    site: {
      state: "published",
      progress: 100,
      publicUrl: `https://example.test/sites/${requestId}/`,
    },
    accessCode: {
      ...accessCodeSnapshot(owner),
      redoCount: 2,
    },
  }));

  context.after(async () => {
    await Promise.all([
      removeJob(requestId),
      fs.rm(staleEnvelopePath, { force: true }),
      fs.rm(stalePhotoPath, { force: true }),
    ]);
  });

  const cookie = await redeemAccessCode(
    BASE_URL,
    owner.code,
    `/wedding?redo=${encodeURIComponent(requestId)}`,
  );
  const unauthorized = await fetch(`${BASE_URL}/api/customer/jobs/${requestId}/restart-data`);
  assert.equal(unauthorized.status, 403);
  const authorized = await fetch(`${BASE_URL}/api/customer/jobs/${requestId}/restart-data`, {
    headers: { Cookie: cookie },
  });
  assert.equal(authorized.status, 200);

  const replacementProject = weddingProject({
    packType: "Full_pack",
    websiteEnabled: true,
    hasPhoto: false,
    person1: "New",
    person2: "Names",
  });
  const form = new FormData();
  form.append("project", JSON.stringify(replacementProject));
  const restarted = await fetch(`${BASE_URL}/api/customer/jobs/${requestId}/restart`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  assert.equal(restarted.status, 202, await restarted.clone().text());
  const restartedBody = await restarted.json();
  assert.equal(restartedBody.data.requestId, requestId);
  assert.equal(restartedBody.data.invitationAttemptsUsed, 1);
  assert.equal(restartedBody.data.envelopeAttemptsUsed, 0);

  const saved = await readJob(requestId);
  assert.equal(saved.requestId, requestId);
  assert.equal(saved.state, "queued");
  assert.equal(saved.generationTarget, "both");
  assert.equal(saved.invitationAttemptsUsed, 1);
  assert.equal(saved.envelopeAttemptsUsed, 0);
  assert.equal(saved.imageConfirmed, false);
  assert.equal(saved.finalImageUpdated, false);
  assert.equal(saved.finalEnvelopeUpdated, false);
  assert.equal(saved.pdfUrl, null);
  assert.equal(saved.pdfDownloadUrl, null);
  assert.equal(saved.pptxUrl, null);
  assert.equal(saved.pptxDownloadUrl, null);
  assert.equal(saved.latexUrl, null);
  assert.ok(
    ["pending_confirmation", "disabled"].includes(saved.canva.state),
    "restart must discard the previous Canva template state",
  );
  assert.equal(saved.site.state, "pending_confirmation");
  assert.equal(saved.accessCode.redoCount, 3);
  assert.equal(saved.project.couple.person1, "New");

  const resolvedRecord = await accessStore.resolve(owner.code);
  assert.equal(resolvedRecord.state, "claimed");
  assert.equal(resolvedRecord.requestId, requestId);

  const staleState = [];
  if (saved.photoPath) staleState.push("photoPath still points at the previous photo although hasPhoto=false");
  if (saved.photoMime) staleState.push("photoMime remains set although hasPhoto=false");
  if (saved.envelopeUploadPath) staleState.push("envelopeUploadPath still outranks the new generated envelope");
  if (saved.uploadedEnvelopePath) staleState.push("uploadedEnvelopePath still outranks the new generated envelope");
  if (saved.envelopePath) staleState.push("envelopePath still outranks the new generated envelope");
  if (saved.envelope?.path) staleState.push("envelope.path still outranks the new generated envelope");
  if (saved.envelopeSource === "uploaded") staleState.push("envelopeSource still marks the restarted envelope as uploaded");
  assert.deepEqual(staleState, [], "restart retained stale model/artifact inputs");
});

test("finalEnvelope upload becomes the authoritative normalized envelope", async (context) => {
  const requestId = crypto.randomUUID();
  const owner = await claimAccessForJob(requestId);
  const staleEnvelopePath = path.join(GENERATED_DIR, `stale-final-${requestId}-envelope.png`);
  const job = persistedJob(requestId, {
    project: weddingProject({ packType: "Full_pack", websiteEnabled: true }),
    state: "approved",
    imageConfirmed: true,
    confirmedAt: new Date().toISOString(),
    envelopeUploadPath: staleEnvelopePath,
    accessCode: accessCodeSnapshot(owner),
    canva: {
      state: "template_ready",
      canvaTemplateUrl: "https://www.canva.com/design/final-envelope-contract/view",
    },
  });
  const staleBuffer = await sharp({
    create: {
      width: 480,
      height: 853,
      channels: 4,
      background: { r: 120, g: 20, b: 25, alpha: 1 },
    },
  }).png().toBuffer();
  await fs.writeFile(staleEnvelopePath, staleBuffer);
  await writeJob(job);

  let uploadedEnvelopePath = "";
  context.after(async () => {
    await Promise.all([
      removeJob(requestId),
      fs.rm(staleEnvelopePath, { force: true }),
      uploadedEnvelopePath ? fs.rm(uploadedEnvelopePath, { force: true }) : Promise.resolve(),
    ]);
  });

  const cookie = await redeemAccessCode(BASE_URL, owner.code, `/results/${requestId}`);

  const uploadBuffer = await sharp({
    create: {
      width: 720,
      height: 1280,
      channels: 4,
      background: { r: 25, g: 70, b: 45, alpha: 1 },
    },
  }).png().toBuffer();
  const form = new FormData();
  form.append("websiteDetails", "{}");
  form.append("finalEnvelope", new Blob([uploadBuffer], { type: "image/png" }), "chosen-envelope.png");
  const response = await fetch(`${BASE_URL}/api/customer/jobs/${requestId}/finalize-full-pack`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  assert.equal(response.status, 202, await response.clone().text());
  const body = await response.json();
  assert.equal(body.data.finalEnvelopeUpdated, true);
  assert.match(body.data.envelopeUrl, /-envelope-final-v2\.png$/);
  assert.ok(body.data.envelopeTheme?.primary);

  const saved = await readJob(requestId);
  assert.match(saved.envelopeFilename, /-envelope-final-v2\.png$/);
  uploadedEnvelopePath = path.join(GENERATED_DIR, saved.envelopeFilename);
  const metadata = await sharp(uploadedEnvelopePath).metadata();
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 480);
  assert.equal(metadata.height, 853);
  assert.equal(saved.state, "artifact_queued");
  assert.equal(saved.finalEnvelopeUpdated, true);

  const authorityProblems = [];
  if (saved.envelopeSource !== "uploaded") {
    authorityProblems.push("envelopeSource does not record that the final envelope was uploaded");
  }
  const overrideValues = [
    saved.envelopeUploadPath,
    saved.uploadedEnvelopePath,
    saved.envelopePath,
    saved.envelope?.path,
  ].filter((value) => typeof value === "string" && value.trim());
  for (const overrideValue of overrideValues) {
    const resolved = path.resolve(path.isAbsolute(overrideValue)
      ? overrideValue
      : path.join(GENERATED_DIR, overrideValue));
    if (resolved !== path.resolve(uploadedEnvelopePath)) {
      authorityProblems.push(`older override still outranks finalEnvelope: ${path.basename(resolved)}`);
    }
  }
  assert.deepEqual(authorityProblems, [], "finalEnvelope was saved but is not authoritative for downstream artifacts");
});
