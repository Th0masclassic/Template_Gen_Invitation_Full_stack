import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const start = source.indexOf("function renderResultPage");
const end = source.indexOf("\nfunction resultMessage", start);
assert.ok(start >= 0 && end > start, "renderResultPage source must be discoverable");

const factory = new Function(
  "normalizeLocale",
  "isTemplateOnlyJourney",
  "escapeHtml",
  "resultMessage",
  "safeJsonForHtml",
  "WEBSITE_DETAIL_LIMITS",
  "WEBSITE_IMAGE_SLOTS",
  `${source.slice(start, end)}; return renderResultPage;`,
);

const renderResultPage = factory(
  (locale) => ["pt", "en", "es", "fr", "de"].includes(locale) ? locale : "en",
  ({ job }) => job?.templateOnlyJourney === true || job?.project?.templateOnlyJourney === true,
  (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  () => "Invitation ready for review.",
  (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"),
  {},
  [],
);

test("template-only result page keeps five selectable invitations and hides extra products", () => {
  const html = renderResultPage({
    requestId: "00000000-0000-4000-8000-000000000001",
    state: "image_ready",
    progress: 100,
    imageConfirmed: false,
    imageRevision: 2,
    templateOnlyJourney: true,
    project: {
      templateOnlyJourney: true,
      language: "en",
      eventType: "wedding",
      website: { enabled: false, details: {} },
    },
  });

  assert.match(html, /Choose the final invitation/);
  assert.match(html, /up to 5 versions visible/);
  assert.match(html, /id="versionGallery"/);
  assert.match(html, /detailsCard\.hidden=true/);
  assert.match(html, /resultEnvelope\.closest\('figure'\)\.hidden=true/);
  assert.match(html, /selectedRevision:selectedInvitationRevision/);

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  assert.ok(scripts.length > 0);
  for (const script of scripts) assert.doesNotThrow(() => new vm.Script(script));
});

test("template-only approval copy renders cleanly in every supported locale", () => {
  const expected = {
    pt: "Mantemos at\u00e9 5 vers\u00f5es vis\u00edveis",
    en: "We keep up to 5 versions visible",
    es: "Elige la invitaci\u00f3n final",
    fr: "Choisissez l\u2019invitation finale",
    de: "Finale Einladung ausw\u00e4hlen",
  };
  for (const [language, phrase] of Object.entries(expected)) {
    const html = renderResultPage({
      requestId: "00000000-0000-4000-8000-000000000001",
      state: "image_ready",
      progress: 100,
      imageConfirmed: false,
      imageRevision: 1,
      templateOnlyJourney: true,
      project: { templateOnlyJourney: true, language, eventType: "wedding", website: { enabled: false, details: {} } },
    });
    assert.ok(html.includes(phrase), `${language} result copy should be correctly encoded`);
  }
});
