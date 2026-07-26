import { spawn } from "node:child_process";
import net from "node:net";

import assert from "node:assert/strict";

import { startLocalServer } from "./helpers/local-server.mjs";

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForDriver(url, process, output) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`safaridriver exited.\n${output.join("")}`);
    try {
      const response = await fetch(`${url}/status`);
      if (response.ok) return;
    } catch {
      // Driver is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for safaridriver.\n${output.join("")}`);
}

async function webdriver(baseUrl, pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json;charset=UTF-8" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.value?.error) {
    const message = payload?.value?.message || `WebDriver request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload.value;
}

const server = await startLocalServer();
const driverPort = await availablePort();
const driverOutput = [];
const driver = spawn("/usr/bin/safaridriver", ["-p", String(driverPort)], {
  stdio: ["ignore", "pipe", "pipe"],
});
driver.stdout.on("data", (chunk) => driverOutput.push(chunk.toString()));
driver.stderr.on("data", (chunk) => driverOutput.push(chunk.toString()));
const driverUrl = `http://127.0.0.1:${driverPort}`;
let sessionId = "";

try {
  await waitForDriver(driverUrl, driver, driverOutput);
  const session = await webdriver(driverUrl, "/session", {
    method: "POST",
    body: {
      capabilities: {
        alwaysMatch: {
          browserName: "safari",
          acceptInsecureCerts: false,
        },
      },
    },
  });
  sessionId = session.sessionId;
  assert.ok(sessionId);

  const execute = (script, args = []) => webdriver(driverUrl, `/session/${sessionId}/execute/sync`, {
    method: "POST",
    body: { script, args },
  });
  const navigate = (url) => webdriver(driverUrl, `/session/${sessionId}/url`, {
    method: "POST",
    body: { url },
  });

  for (const expected of [
    { route: "/wedding?lang=en", eventType: "wedding", firstTemplate: "editorial_photo" },
    { route: "/babyshower?lang=en", eventType: "baby_shower", firstTemplate: "baby_clouds" },
  ]) {
    await navigate(`${server.baseUrl}${expected.route}`);
    const state = await execute(`
      const eventInput = document.getElementById("eventType");
      const cards = document.querySelectorAll(".template-card");
      const styles = getComputedStyle(document.body);
      return {
        path: location.pathname,
        eventType: eventInput && eventInput.value,
        eventInputType: eventInput && eventInput.type,
        visibleEventSelector: Boolean(document.querySelector("select#eventType")),
        bodyEventType: document.body.dataset.eventType,
        accent: styles.getPropertyValue("--accent").trim(),
        websitePhotosVisible: !document.getElementById("websitePhotosField").hidden,
        websitePhotosDisabled: document.getElementById("websitePhotos").disabled,
        cardCount: cards.length,
        firstTemplate: cards[0] && cards[0].dataset.templateId,
      };
    `);
    assert.equal(state.path, expected.route.split("?")[0]);
    assert.equal(state.eventType, expected.eventType);
    assert.equal(state.eventInputType, "hidden");
    assert.equal(state.visibleEventSelector, false);
    assert.equal(state.bodyEventType, expected.eventType);
    if (expected.eventType === "baby_shower") assert.equal(state.accent, "#23689f");
    assert.equal(state.websitePhotosVisible, true);
    assert.equal(state.websitePhotosDisabled, false);
    assert.equal(state.cardCount, 10);
    assert.equal(state.firstTemplate, expected.firstTemplate);
  }

  const templateUrl = "https://www.canva.com/design/DAH123abc_X/templateToken123/view?mode=preview";
  const delivery = await execute(`
    const url = arguments[0];
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
      canva: { state: "template_ready", templateCreateUrl: url, templateUrl: url, editUrl: url },
    }, { couple: { person1: "Ana", person2: "Miguel" } });
    const link = document.getElementById("canvaGenerated");
    return { hidden: link.hidden, href: link.href, text: link.textContent };
  `, [templateUrl]);
  assert.equal(delivery.hidden, false);
  assert.equal(delivery.href, templateUrl);
  assert.match(delivery.text, /template/i);

  process.stdout.write("Safari browser compatibility smoke passed.\n");
} catch (error) {
  if (/enable|automation|permission|authorize/i.test(error.message)) {
    throw new Error(
      `Safari Remote Automation is not enabled. Run "/usr/bin/safaridriver --enable" once in Terminal, authorize it with macOS, then rerun "npm run test:browser:safari". Original error: ${error.message}`,
    );
  }
  throw error;
} finally {
  if (sessionId) {
    await webdriver(driverUrl, `/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
  }
  if (driver.exitCode === null) driver.kill("SIGTERM");
  await server.stop();
}
