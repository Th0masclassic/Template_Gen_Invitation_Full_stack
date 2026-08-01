import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(projectRoot, "server.mjs");

async function resultPageSource() {
  const source = await fs.readFile(serverPath, "utf8");
  const start = source.indexOf("function renderResultPage(job)");
  const end = source.indexOf("function renderImagePendingPage", start);
  assert.ok(start >= 0 && end > start, "renderResultPage source was not found");
  return source.slice(start, end);
}

test("customer result page reveals invitation and envelope as one approval pair", async () => {
  const source = await resultPageSource();

  assert.match(source, /id="resultPreview" hidden/);
  assert.match(source, /id="resultImage"/);
  assert.match(source, /id="resultEnvelope"/);
  assert.match(source, /function pairIsReady\(job\)/);
  assert.match(source, /resultPreview\.hidden=!pairReady/);
  assert.match(source, /invitationAttemptsUsed/);
  assert.match(source, /envelopeAttemptsUsed/);
  assert.match(source, /id="revisionOverlay" hidden/);
  assert.match(source, /\[hidden\]\{display:none!important\}/);
  assert.match(source, /name="revisionTarget" value="invitation"/);
  assert.match(source, /name="revisionTarget" value="envelope"/);
  assert.match(source, /JSON\.stringify\(\{target,revisionContext:revisionContext\.value\}\)/);
});

test("result delivery keeps only open PDF and open website actions", async () => {
  const source = await resultPageSource();
  const finalBoxStart = source.indexOf('id="downloadsPanel"');
  const finalBoxEnd = source.indexOf("</div>", source.indexOf("</div>", finalBoxStart) + 6);
  const finalBox = source.slice(finalBoxStart, finalBoxEnd);

  assert.match(finalBox, /id="pdfOpen"/);
  assert.match(finalBox, />Abrir PDF</);
  assert.match(finalBox, /id="siteOpen"/);
  assert.match(finalBox, />Abrir Website</);
  assert.doesNotMatch(source, /id="pdfDownload"/);
  assert.doesNotMatch(source, /Abrir website publicado/);
});

test("result page exposes the private RSVP panel at the RSVP-FORM anchor", async () => {
  const source = await resultPageSource();
  assert.match(source, /id="rsvpAdminPanel" hidden/);
  assert.match(source, /id="RSVP-FORM">RSVP Admin/);
  assert.match(source, /\/api\/customer\/jobs\/'\+encodeURIComponent\(requestId\)\+'\/rsvp/);
});

test("result page supports final envelope upload, restart, and one-shot mobile reveal", async () => {
  const source = await resultPageSource();

  assert.match(source, /name="envelopeSource"/);
  assert.match(source, /id="finalEnvelope"/);
  assert.match(source, /data\.append\('finalEnvelope',finalEnvelope\.files\[0\]\)/);
  assert.match(source, /id="restartProject">Editar dados e criar nova versão</);
  assert.match(source, /id="newPurchase" href="\$\{newProjectPath\}">Usar outro código</);
  assert.match(source, /job\.restartUrl/);
  assert.match(source, /firstPublishedPreview/);
  assert.match(source, /max-width:820px/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /websitePreview\.scrollIntoView\(\{behavior,block:'start'\}\)/);
  assert.match(source, /!cLink&&hasCanvaError&&job\.canva\?\.canRetryTemplateLink===true/);
  assert.match(source, /const resultLocale=/);
  assert.match(source, /localizeResultPage\(\)/);
  assert.match(source, /resultStaticTranslations/);
});

test("a failed image or envelope generation remains retryable from the result page", async () => {
  const source = await resultPageSource();
  assert.match(source, /retryableGenerationFailure=job\.state==='failed'/);
  assert.match(source, /retryableGenerationFailure\?'Tentar novamente':'Não aprovar'/);
});

test("result and local site policies allow the published website preview frame", async () => {
  const serverSource = await fs.readFile(serverPath, "utf8");
  assert.match(serverSource, /function resultPageContentSecurityPolicy\(job\)/);
  assert.match(serverSource, /frame-src \$\{\[\.\.\.frameSources\]\.join\(" "\)\}/);
  assert.match(serverSource, /response\.setHeader\("Content-Security-Policy", resultPageContentSecurityPolicy\(job\)\)/);
  assert.match(serverSource, /response\.removeHeader\("X-Frame-Options"\)/);
  assert.match(serverSource, /"frame-ancestors 'self'"/);
});

test("embedded result-page browser script parses", async () => {
  const source = await resultPageSource();
  const match = source.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "embedded result-page script was not found");
  const browserScript = match[1]
    .replace(/const requestId=.*?;/, 'const requestId="test-request";')
    .replace(/const websiteEnabled=.*?;/, "const websiteEnabled=true;")
    .replace(/const initialDetails=.*?;/, "const initialDetails={};")
    .replace(/const detailFields=.*?;/, "const detailFields=[];")
    .replace(/const resultLocale=.*?;/, 'const resultLocale="en";')
    .replace(/const resultStaticTranslations=.*?;/, "const resultStaticTranslations={};")
    .replace(/const websiteImageFields=.*?;/, "const websiteImageFields=[];");

  assert.doesNotThrow(() => new vm.Script(browserScript, { filename: "renderResultPage.inline.js" }));
});
