import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

import { startLocalServer } from "./helpers/local-server.mjs";

if (process.platform !== "darwin") {
  process.stdout.write("Safari browser smoke skipped: safaridriver is available only on macOS.\n");
  process.exit(0);
}

const port = await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const address = probe.address();
    probe.close((error) => error ? reject(error) : resolve(address.port));
  });
});
const server = await startLocalServer();
const driver = spawn("/usr/bin/safaridriver", ["-p", String(port)], { stdio: "ignore" });
const driverUrl = `http://127.0.0.1:${port}`;
let sessionId = "";

async function command(pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${driverUrl}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.value?.error) throw new Error(payload?.value?.message || `WebDriver failed (${response.status}).`);
  return payload.value;
}

try {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${driverUrl}/status`)).ok) break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  const session = await command("/session", {
    method: "POST",
    body: { capabilities: { alwaysMatch: { browserName: "safari" } } },
  });
  sessionId = session.sessionId;
  await command(`/session/${sessionId}/url`, { method: "POST", body: { url: `${server.baseUrl}/wedding?lang=en` } });
  const state = await command(`/session/${sessionId}/execute/sync`, {
    method: "POST",
    body: {
      script: "return {eventType:document.getElementById('eventType').value,cards:document.querySelectorAll('.template-card').length};",
      args: [],
    },
  });
  assert.deepEqual(state, { eventType: "wedding", cards: 10 });
  process.stdout.write("Safari browser compatibility smoke passed.\n");
} finally {
  if (sessionId) await command(`/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
  if (driver.exitCode === null) driver.kill("SIGTERM");
  await server.stop();
}
