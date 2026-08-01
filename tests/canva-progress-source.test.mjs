import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Canva conversion reports phase progress instead of a premature 100%", async () => {
  const source = await fs.readFile(path.join(root, "server.mjs"), "utf8");
  const workerSource = await fs.readFile(path.join(root, "chatgpt-canva-worker.mjs"), "utf8");
  assert.match(source, /chatgpt_canva_attachment_confirmed:\s*78/);
  assert.match(source, /chatgpt_canva_processing:\s*84/);
  assert.match(source, /chatgpt_canva_failed:\s*78/);
  assert.match(source, /const displayedProgress = Number\.isFinite\(canvaProgress\)/);
  assert.match(source, /A imagem foi recebida pelo Canva/);
  assert.match(source, /chatgpt_canva_attachment_confirmed/);
  assert.match(source, /const canvaBusy=\[/);
  assert.match(workerSource, /CHATGPT_COMPOSER_NOT_READY/);
  assert.match(workerSource, /Date\.now\(\) \+ 90_000/);
  assert.match(workerSource, /Do not click a ChatGPT\/Canva result button/);
  assert.match(workerSource, /sourceUrl = ""/);
  assert.match(workerSource, /attachmentConfirmationMethod: "hosted_url"/);
});

test("completed websites are imported as a separate Canva HTML template", async () => {
  const source = await fs.readFile(path.join(root, "server.mjs"), "utf8");
  assert.match(source, /function createCanvaWebsiteImportHtml/);
  assert.match(source, /canva-website-import\.html/);
  assert.match(source, /Use @Canva to convert this public wedding website/);
  assert.match(source, /CANVA_WEBSITE_IMPORT_VERSION = 3/);
  assert.match(source, /sourceUrl: publicWebsiteUrl/);
  assert.match(source, /publicBaseUrl/);
  assert.match(source, /CANVA_WEBSITE_IMPORT_TOO_LARGE/);
  assert.match(source, /buildChatGptCanvaWebsiteHandoffPrompt/);
  assert.match(source, /websiteCanvaTemplateLinkService\.createForJob/);
  assert.match(source, /id="websiteCanvaLink"/);
  assert.match(source, />Website Template</);
});
