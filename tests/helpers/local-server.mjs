import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(TESTS_DIR, "..", "..");

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Test server exited before becoming healthy.\n${output.join("")}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`, { redirect: "manual" });
      if (response.ok) return;
    } catch {
      // The listener may not be ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for the test server.\n${output.join("")}`);
}

export async function startLocalServer({ env: envOverrides = {} } = {}) {
  const port = await availablePort();
  const output = [];
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      OPENAI_API_KEY: "",
      ACCESS_CODE_REQUIRED: "0",
      CANVA_IMPORT_ENABLED: "0",
      CANVA_CHATGPT_HANDOFF_ENABLED: "0",
      CANVA_CHATGPT_AUTOMATION_ENABLED: "0",
      CANVA_CHATGPT_PUBLISH_TEMPLATE: "0",
      CANVA_PRIVATE_TEMPLATE_LINK_ENABLED: "0",
      CANVA_TEMPLATE_SHORTENING_ENABLED: "0",
      CANVA_MCP_ENABLED: "0",
      CANVA_MCP_PUBLISH_TEMPLATE: "0",
      CANVA_OPERATOR_AUTH_AT_STARTUP: "0",
      ...envOverrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl, child, output);

  return {
    baseUrl,
    output,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
      if (child.exitCode === null) child.kill("SIGKILL");
    },
  };
}
