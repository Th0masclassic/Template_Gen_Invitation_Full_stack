import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientPath = path.join(projectRoot, "public", "event-builder.html");

async function clientSource() {
  return fs.readFile(clientPath, "utf8");
}

test("Canva retry is exposed only for an explicit link-creation failure", async () => {
  const source = await clientSource();
  const helperStart = source.indexOf("function canShowCanvaTemplateRetry");
  const helperEnd = source.indexOf("function attemptLabel", helperStart);
  const helper = source.slice(helperStart, helperEnd);

  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  assert.match(helper, /!resolveCanvaLink\(result\)\.url/);
  assert.match(helper, /hasExplicitError/);
  assert.match(helper, /canRetryTemplateLink === true/);
  assert.match(source, /if \(canShowCanvaTemplateRetry\(result\)\)/);
  assert.doesNotMatch(source, /if \(result\.canva\?\.canRetryTemplateLink\)/);
});

test("approval UI keeps the invitation suite together and offers targeted retries for all assets", async () => {
  const source = await clientSource();

  assert.match(source, /id="generatedPair"[^>]+hidden/);
  assert.match(source, /id="generatedImage"/);
  assert.match(source, /id="generatedEnvelope"/);
  assert.match(source, /id="generatedDetails"/);
  assert.match(source, /id="attemptSummary"/);
  assert.match(source, /id="assetRevisionOverlay"[^>]+hidden/);
  assert.match(source, /name="revisionTarget" value="invitation"/);
  assert.match(source, /name="revisionTarget" value="envelope"/);
  assert.match(source, /name="revisionTarget" value="agenda"/);
  assert.match(source, /const DEFAULT_MAX_ASSET_ATTEMPTS = 10/);
  assert.match(source, /result\?\.invitationAttemptsUsed/);
  assert.match(source, /result\?\.envelopeAttemptsUsed/);
  assert.match(source, /result\?\.agendaAttemptsUsed/);
  assert.match(source, /generatedAssets\.ready/);
  assert.match(source, /if \(generatedAssets\.hasEnvelopeContract \|\| generatedAssets\.hasDetailsContract\) regenerationPayload\.target = target/);
  assert.match(source, /target === 'agenda' \? generatedAssets\.details/);
  assert.match(source, /Attempt totals are intentionally shown only after the customer opens/);
  assert.match(source, /ui\.attemptSummary\.hidden = true/);
  assert.match(source, /As outras peças ficam guardadas/);
});

test("the first published website is revealed once on mobile", async () => {
  const source = await clientSource();
  const helperStart = source.indexOf("function revealPublishedWebsiteOnMobile");
  const helperEnd = source.indexOf("function isCanvaBusy", helperStart);
  const helper = source.slice(helperStart, helperEnd);

  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  assert.match(helper, /ui\.firstPublishedWebsiteUrl/);
  assert.match(helper, /max-width: 760px/);
  assert.match(helper, /prefers-reduced-motion: reduce/);
  assert.match(helper, /scrollIntoView\(\{ behavior, block: 'start' \}\)/);
  assert.match(source, /revealPublishedWebsiteOnMobile\(ui, websiteUrl\)/);
});

test("overlay final files keep only the open PDF and open website actions", async () => {
  const source = await clientSource();
  const finalStart = source.indexOf('id="finalFiles"');
  const finalEnd = source.indexOf("</section>", finalStart);
  const finalBox = source.slice(finalStart, finalEnd);

  assert.ok(finalStart >= 0 && finalEnd > finalStart);
  assert.match(finalBox, /Ficheiros finais/);
  assert.match(finalBox, />Abrir PDF</);
  assert.match(finalBox, />Abrir Website</);
  assert.doesNotMatch(source, /Descarregar PDF/);
  assert.doesNotMatch(source, /downloadPdf/);
});
