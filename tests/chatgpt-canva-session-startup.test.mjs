import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../chatgpt-canva-worker.mjs", import.meta.url), "utf8");

test("startup verifies the ChatGPT session before recovering the Canva queue", () => {
  const verification = server.indexOf("await verifyChatGptCanvaSession({ openIfMissing: true })");
  const listen = server.indexOf("app.listen", verification);
  const privateRecovery = server.indexOf("await recoverPrivateCanvaTemplateLinks()", listen);
  const recovery = server.indexOf("await recoverChatGptCanvaQueue()", privateRecovery);
  assert.ok(verification >= 0);
  assert.ok(listen > verification);
  assert.ok(privateRecovery > listen);
  assert.ok(recovery > privateRecovery);
});

test("the worker verifies an authenticated session instead of trusting the URL", () => {
  assert.match(worker, /SESSION_ENDPOINTS = \["\/api\/auth\/session", "\/backend-api\/me"\]/);
  assert.match(worker, /async probeAuthenticatedSession\(page\)/);
  assert.match(worker, /const initialized = Boolean\(signedIn && composerVisible\)/);
  assert.doesNotMatch(worker, /return page\.url\(\)\.startsWith\(CHATGPT_URL\)/);
});

test("the Canva queue remains paused until the ChatGPT session is ready", () => {
  assert.match(server, /function drainChatGptCanvaQueue\(\)[\s\S]*?if \(!chatGptCanvaSession\.ready\)/);
  assert.match(server, /scheduleChatGptCanvaSessionMonitor\(\)/);
});

test("login-required jobs resume automatically after authentication", () => {
  assert.match(server, /async function requeueChatGptCanvaSessionJobs\(\)/);
  assert.match(server, /job\.canva\?\.state !== "chatgpt_canva_login_required"/);
  assert.match(server, /if \(!wasReady\) await requeueChatGptCanvaSessionJobs\(\)/);
});
