import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildManualEdgeLaunchArgs,
  isMicrosoftEdgeExecutable,
  parseManualEdgeDebugPortFromCommand,
} from "../chatgpt-canva-worker.mjs";

const worker = fs.readFileSync(new URL("../chatgpt-canva-worker.mjs", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const config = fs.readFileSync(new URL("../server-config.mjs", import.meta.url), "utf8");

test("Microsoft Edge detection covers supported desktop executable names", () => {
  assert.equal(isMicrosoftEdgeExecutable("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"), true);
  assert.equal(isMicrosoftEdgeExecutable("C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"), true);
  assert.equal(isMicrosoftEdgeExecutable("/usr/bin/microsoft-edge"), true);
  assert.equal(isMicrosoftEdgeExecutable("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"), false);
});

test("manual Edge arguments use a dedicated profile and loopback-only CDP", () => {
  const profileDir = path.resolve("/tmp", "atelier-edge-profile");
  const args = buildManualEdgeLaunchArgs({
    profileDir,
    debugPort: 32123,
    initialUrl: "https://www.canva.com/",
  });

  assert.ok(args.includes("--remote-debugging-address=127.0.0.1"));
  assert.ok(args.includes("--remote-debugging-port=32123"));
  assert.ok(args.includes(`--user-data-dir=${profileDir}`));
  assert.equal(args.at(-1), "https://www.canva.com/");
  assert.doesNotMatch(args.join(" "), /enable-automation|remote-debugging-address=0\.0\.0\.0|headless/i);
  assert.throws(() => buildManualEdgeLaunchArgs({
    profileDir,
    debugPort: 80,
    initialUrl: "https://www.canva.com/",
  }), /valid localhost debugging port/);
});

test("an existing manual Edge debug port is recovered only for the exact profile and loopback", () => {
  const profileDir = path.resolve("/tmp", "atelier-edge-profile");
  const command = [
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=53953",
    `--user-data-dir=${profileDir}`,
  ].join(" ");

  assert.equal(parseManualEdgeDebugPortFromCommand(command, profileDir), 53953);
  assert.equal(
    parseManualEdgeDebugPortFromCommand(
      command.replace("127.0.0.1", "0.0.0.0"),
      profileDir,
    ),
    null,
  );
  assert.equal(
    parseManualEdgeDebugPortFromCommand(command, `${profileDir}-other`),
    null,
  );
  assert.equal(
    parseManualEdgeDebugPortFromCommand(
      command.replace("53953", "80"),
      profileDir,
    ),
    null,
  );
});

test("manual setup spawns normal Edge before Playwright attaches over CDP", () => {
  const openStart = worker.indexOf("async openManualEdge(targetUrl)");
  const attachStart = worker.indexOf("\n  async attachManualBrowser()", openStart);
  const ensureStart = worker.indexOf("\n  async ensureBrowser()", attachStart);
  assert.ok(openStart >= 0 && attachStart > openStart && ensureStart > attachStart);

  const open = worker.slice(openStart, attachStart);
  const attach = worker.slice(attachStart, ensureStart);
  assert.match(open, /spawn\(this\.executablePath, buildManualEdgeLaunchArgs/);
  assert.doesNotMatch(open, /chromium\.(?:launch|connect)/);
  assert.match(attach, /chromium\.connectOverCDP\(endpoint/);
  assert.match(attach, /recoverManualEdgeSession/);
  assert.match(worker, /if \(this\.manualEdgeCdp && !this\.context\)[\s\S]*?return this\.manualSetupStatus\("chatgpt"\)/);
  assert.match(worker, /chromium\.launchPersistentContext/);
  assert.doesNotMatch(worker, /cf-turnstile|cloudflare[\s\S]{0,80}(?:click|evaluate)/i);
});

test("operator status polling never attaches before an explicit retry", () => {
  const canvaStatusStart = server.indexOf('app.get(\n  "/api/operator/canva-web/status"');
  const canvaRetryStart = server.indexOf('app.post(\n  "/api/operator/canva-web/retry-template-links"', canvaStatusStart);
  const chatStatusStart = server.indexOf('app.get(\n  "/api/operator/chatgpt-canva/status"', canvaRetryStart);
  const chatRetryStart = server.indexOf('app.post(\n  "/api/operator/chatgpt-canva/retry"', chatStatusStart);
  assert.ok(canvaStatusStart >= 0 && canvaRetryStart > canvaStatusStart);
  assert.ok(chatStatusStart > canvaRetryStart && chatRetryStart > chatStatusStart);
  assert.doesNotMatch(server.slice(canvaStatusStart, canvaRetryStart), /attachManualBrowser/);
  assert.match(server.slice(canvaRetryStart, chatStatusStart), /attachManualBrowser/);
  assert.doesNotMatch(server.slice(chatStatusStart, chatRetryStart), /attachManualBrowser/);
  assert.match(server.slice(chatRetryStart, server.indexOf('app.get("/operator/chatgpt-canva"', chatRetryStart)), /attachManualBrowser/);
});

test("manual CDP mode is opt-out and passed into the worker", () => {
  assert.match(
    config,
    /CANVA_CHATGPT_MANUAL_EDGE_CDP = process\.env\.CANVA_CHATGPT_MANUAL_EDGE_CDP !== "0"/,
  );
  assert.match(server, /manualEdgeCdp: CANVA_CHATGPT_MANUAL_EDGE_CDP/);
});
