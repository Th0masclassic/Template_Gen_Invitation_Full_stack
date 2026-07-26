import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { classifyCanvaWebSession } from "../chatgpt-canva-worker.mjs";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../chatgpt-canva-worker.mjs", import.meta.url), "utf8");

test("the Canva web classifier rejects obvious login pages and controls", () => {
  assert.deepEqual(
    classifyCanvaWebSession({ pathname: "/login" }),
    {
      ready: false,
      authenticated: false,
      state: "login_required",
      evidence: "login_path",
    },
  );
  assert.equal(classifyCanvaWebSession({
    pathname: "/",
    loginControlVisible: true,
  }).state, "login_required");
  assert.equal(classifyCanvaWebSession({
    pathname: "/pt_pt/login",
  }).state, "login_required");
  assert.equal(classifyCanvaWebSession({
    pathname: "/",
    passwordInputVisible: true,
  }).evidence, "login_form");
});

test("the Canva web classifier requires positive authenticated UI evidence", () => {
  assert.equal(classifyCanvaWebSession({ pathname: "/" }).state, "unknown");
  assert.equal(classifyCanvaWebSession({
    pathname: "/",
    accountControlVisible: true,
  }).ready, true);
  assert.equal(classifyCanvaWebSession({
    pathname: "/",
    workspaceNavigationVisible: true,
    createDesignControlVisible: true,
  }).authenticated, true);
  assert.equal(classifyCanvaWebSession({
    pathname: "/",
    workspaceNavigationVisible: true,
  }).ready, false);
});

test("the Canva probe is credential-free and reuses the persistent browser context", () => {
  const probeStart = worker.indexOf("async inspectCanvaWebSession(page");
  const probeEnd = worker.indexOf("\n  async isCanvaWebAuthenticated", probeStart);
  assert.ok(probeStart >= 0 && probeEnd > probeStart);
  const probe = worker.slice(probeStart, probeEnd);
  assert.doesNotMatch(probe, /cookies?\s*\(|authorization|auth(?:entication)?\s*headers?/i);
  assert.match(worker, /this\.canvaSetupPage = await this\.context\.newPage\(\)/);
  assert.match(worker, /async newAuthenticatedPage\(\)[\s\S]*?return this\.context\.newPage\(\)/);
});

test("private template work is gated by the Canva web authentication probe", () => {
  assert.match(
    server,
    /isAuthenticatedPage: \(page\) => chatGptCanvaWorker\.isCanvaWebAuthenticated\(page\)/,
  );
  assert.match(server, /app\.post\(\s*"\/api\/operator\/canva-web\/open",\s*requireLocalOperator/);
  assert.match(server, /app\.get\(\s*"\/api\/operator\/canva-web\/status",\s*requireLocalOperator/);
  assert.match(server, /canvaWebSession,/);
  assert.match(server, /id="open-canva-web"/);
});

test("private template recovery is independent from the ChatGPT queue handoff", () => {
  const recoveryStart = server.indexOf("async function recoverPrivateCanvaTemplateLinks(");
  const recoveryEnd = server.indexOf("\nasync function recoverChatGptCanvaQueue()", recoveryStart);
  assert.ok(recoveryStart >= 0 && recoveryEnd > recoveryStart);
  const recovery = server.slice(recoveryStart, recoveryEnd);
  assert.match(recovery, /design_ready_for_template/);
  assert.match(recovery, /template_link_creating/);
  assert.match(recovery, /template_link_failed/);
  assert.match(recovery, /hasRecoverableBrandTemplateFallback/);
  assert.doesNotMatch(recovery, /job\.canva\?\.templateCreateUrl\) continue/);
  assert.match(recovery, /tryCreatePrivateCanvaTemplateLink\(job, \{ canvaEditorUrl \}\)/);
  assert.doesNotMatch(recovery, /CANVA_CHATGPT_AUTOMATION_ENABLED/);

  assert.match(recovery, /const readiness = canvaWebSession \|\| await chatGptCanvaWorker\.canvaWebStatus\(\)/);
  assert.match(recovery, /if \(!readiness\?\.ready\) return 0/);
  assert.match(server, /function canvaTemplateLinkErrorCode\(error\)/);
  assert.match(server, /code: canvaTemplateLinkErrorCode\(error\)/);

  const listen = server.indexOf("app.listen");
  const scheduledRecovery = server.indexOf("await recoverPrivateCanvaTemplateLinks()", listen);
  const scheduledChatGptRecovery = server.indexOf("await recoverChatGptCanvaQueue()", scheduledRecovery);
  assert.ok(listen >= 0 && scheduledRecovery > listen);
  assert.ok(scheduledChatGptRecovery > scheduledRecovery);
  assert.doesNotMatch(
    server.slice(server.indexOf("await prepareStorage()"), listen),
    /recoverPrivateCanvaTemplateLinks/,
  );

  const chatGptRecovery = server.slice(recoveryEnd, server.indexOf("\nexport {", recoveryEnd));
  assert.match(chatGptRecovery, /chatGptDesignReadyForFallback/);
  assert.match(
    chatGptRecovery,
    /job\.canva\?\.handoff === "server_browser_chatgpt_canva_image_to_design"/,
  );
});
