import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../chatgpt-canva-worker.mjs", import.meta.url), "utf8");

function functionSource(source, name, nextMarker) {
  const start = source.indexOf(`async function ${name}`);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0 && end > start, `${name} source was not found`);
  return source.slice(start, end);
}

test("ChatGPT creates the editable design before Connect API authorization is required", () => {
  const run = functionSource(server, "runChatGptCanvaJob", "\nfunction drainChatGptCanvaQueue");
  const createIndex = run.indexOf("chatGptCanvaWorker.createDesign");
  const finalAuthMessageIndex = run.lastIndexOf("O design editavel ja foi criado");
  assert.ok(createIndex >= 0);
  assert.ok(finalAuthMessageIndex > createIndex);
  assert.doesNotMatch(run, /Autoriza a Canva Connect API antes de criar o design/);
});

test("the browser worker opens a fresh ChatGPT tab for Image To Design", () => {
  assert.match(worker, /async getFreshAutomationPage\(\)/);
  assert.match(worker, /async createDesign\([\s\S]*?const page = await this\.getFreshAutomationPage\(\)/);
});

test("OAuth resume resolves short ChatGPT Canva links instead of recreating a flat design", () => {
  assert.match(server, /handoff === "server_browser_chatgpt_canva_image_to_design"[\s\S]*?resolveChatGptCreatedCanvaDesign/);
  assert.match(server, /operatorDesignTitle \|\| job\.canva\.mcpDesignTitle/);
});


test("jobs stopped by the old pre-design authorization check are requeued", () => {
  assert.match(server, /legacyPreDesignAuthorizationStop[\s\S]*?operator_authorization_required/);
  assert.match(server, /Migration path for jobs produced by the older build[\s\S]*?chatgpt_canva_queued/);
});
