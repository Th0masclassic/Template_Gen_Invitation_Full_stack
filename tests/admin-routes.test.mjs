import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import test from "node:test";

import { hashAdminPassword } from "../admin-auth.mjs";

const projectDirectory = path.resolve(import.meta.dirname, "..");

async function unusedPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server exited with ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  throw new Error("Timed out waiting for the test server.");
}

test("admin login, CSRF, link creation and signed buyer route work end to end", { timeout: 60_000 }, async context => {
  const port = await unusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const password = "test-only admin password 2026";
  const passwordHash = await hashAdminPassword(password);
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      PUBLIC_BASE_URL: baseUrl,
      ACCESS_CODE_REQUIRED: "0",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD_HASH: passwordHash,
      ADMIN_SESSION_SECRET: "admin-session-secret-for-route-tests-only-0001",
      TEMPLATE_LINK_SECRET: "template-link-secret-for-route-tests-only-0002",
      CANVA_IMPORT_ENABLED: "0",
      CANVA_CHATGPT_HANDOFF_ENABLED: "0",
      CANVA_CHATGPT_AUTOMATION_ENABLED: "0",
      CANVA_OPERATOR_AUTH_AT_STARTUP: "0",
      CANVA_PRIVATE_TEMPLATE_LINK_ENABLED: "0",
      CANVA_MCP_ENABLED: "0",
      ETSY_INTEGRATION_ENABLED: "0",
      STRIPE_ENABLED: "0",
      AUTO_RECOVER_PERSISTED_JOBS: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  context.after(() => {
    if (child.exitCode === null) child.kill();
  });
  try {
    await waitForServer(baseUrl, child);

    const anonymous = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
    assert.equal(anonymous.status, 303);
    assert.equal(anonymous.headers.get("location"), "/admin/login");

    const crossOrigin = await fetch(`${baseUrl}/admin/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://attacker.invalid" },
      body: JSON.stringify({ username: "admin", password }),
    });
    assert.equal(crossOrigin.status, 403);

    const wrong = await fetch(`${baseUrl}/admin/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong password" }),
    });
    assert.equal(wrong.status, 401);

    const login = await fetch(`${baseUrl}/admin/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password }),
    });
    assert.equal(login.status, 200);
    const adminCookie = login.headers.get("set-cookie").split(";", 1)[0];
    assert.match(login.headers.get("set-cookie"), /HttpOnly/);
    assert.match(login.headers.get("set-cookie"), /SameSite=Strict/);

    const sessionResponse = await fetch(`${baseUrl}/admin/api/session`, { headers: { Cookie: adminCookie } });
    assert.equal(sessionResponse.status, 200);
    const session = (await sessionResponse.json()).data;
    assert.match(session.csrfToken, /^[A-Za-z0-9_-]{32}$/);

    const noCsrf = await fetch(`${baseUrl}/admin/api/template-links`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: "aquarela_paris" }),
    });
    assert.equal(noCsrf.status, 403);

    const linkResponse = await fetch(`${baseUrl}/admin/api/template-links`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json", "X-Admin-CSRF": session.csrfToken },
      body: JSON.stringify({ templateId: "aquarela_paris" }),
    });
    assert.equal(linkResponse.status, 201);
    const link = (await linkResponse.json()).data.url;
    const signedUrl = new URL(link);
    assert.equal(signedUrl.pathname, "/tempOnly/07_aquarela.png/gen");

    const handoff = await fetch(link, { redirect: "manual" });
    assert.equal(handoff.status, 303);
    assert.equal(handoff.headers.get("location"), "/tempOnly/07_aquarela.png/gen");
    assert.equal(handoff.headers.get("location").includes("grant="), false);
    const templateCookie = handoff.headers.get("set-cookie").split(";", 1)[0];

    const buyer = await fetch(`${baseUrl}/tempOnly/07_aquarela.png/gen`, { headers: { Cookie: templateCookie } });
    assert.equal(buyer.status, 200);
    const buyerHtml = await buyer.text();
    assert.match(buyerHtml, /INVITELAB_TEMPLATE_ONLY/);
    assert.match(buyerHtml, /"templateId":"aquarela_paris"/);

    const tampered = await fetch(`${baseUrl}/tempOnly/08_coastal_blue.png/gen`, { headers: { Cookie: templateCookie } });
    assert.equal(tampered.status, 403);

    const normalBuilder = await fetch(`${baseUrl}/wedding`, { headers: { Cookie: templateCookie } });
    assert.equal(normalBuilder.status, 200);
    assert.equal((await normalBuilder.text()).includes("window.INVITELAB_TEMPLATE_ONLY="), false);

    const logout = await fetch(`${baseUrl}/admin/api/logout`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json", "X-Admin-CSRF": session.csrfToken },
      body: "{}",
    });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${baseUrl}/admin/api/session`, { headers: { Cookie: adminCookie } });
    assert.equal(afterLogout.status, 401);
  } catch (error) {
    error.message += `\nServer output:\n${output.slice(-5000)}`;
    throw error;
  }
});
