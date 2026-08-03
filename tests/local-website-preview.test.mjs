import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PROJECT_ROOT, startLocalServer } from "./helpers/local-server.mjs";

test("local website preview renders the selected color and protects duplicate RSVP emails", async () => {
  const server = await startLocalServer({
    env: {
      ACCESS_CODE_REQUIRED: "1",
      RSVP_ADMIN_LOCAL_BYPASS: "1",
      PUBLIC_BASE_URL: "",
    },
  });

  try {
    const project = {
      mode: "template",
      eventType: "wedding",
      packType: "Full_pack",
      language: "en",
      templateId: "olive_minimal",
      couple: { person1: "Local", person2: "Preview" },
      invitation: {
        date: "2026-09-19",
        time: "15:00",
        location: "Lisbon, Portugal",
        message: "Local color test.",
      },
      links: { mapsUrl: "" },
      attendance: { enabled: true, formUrl: "" },
      website: { enabled: true, details: { envelopeColor: "#743442" } },
      hasPhoto: false,
      hasCustomTemplate: false,
      hasMusic: false,
    };

    const response = await fetch(`${server.baseUrl}/api/operator/local-test-website`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project: JSON.stringify(project) }),
    });
    const body = await response.json();
    assert.equal(response.status, 201, JSON.stringify(body));
    assert.equal(body.data.envelopeColor, "#743442");

    const siteResponse = await fetch(`${server.baseUrl}${body.data.localUrl}`);
    const siteHtml = await siteResponse.text();
    assert.equal(siteResponse.status, 200);
    assert.match(siteHtml, /--olive:#743442/);
    assert.match(siteHtml, /assets\/mobile-envelope-layer-top\.png/);
    assert.match(siteHtml, /assets\/mobile-envelope-layer-bottom\.png/);
    assert.match(siteHtml, /assets\/green-envelope\.png/);
    assert.match(siteHtml, /id="rsvpForm"/);
    assert.match(siteHtml, /What's your name\?/);
    assert.match(siteHtml, /What's your email\?/);
    assert.match(siteHtml, /Are you going\?/);
    assert.match(siteHtml, /Cellphone number \(optional\)/);
    assert.match(siteHtml, /Message for Couple \(optional\)/);
    assert.match(siteHtml, /rsvpSubmitUrl":"\/api\/public\/rsvp\//);
    assert.doesNotMatch(siteHtml, /data-youform-embed|app\.youform\.com\/embed\.js/);
    const generatedStyles = await fetch(`${server.baseUrl}/site/${body.data.requestId}/styles.css`);
    const generatedStylesText = await generatedStyles.text();
    assert.equal(generatedStyles.status, 200);
    assert.match(generatedStylesText, /\.timeline-path path\{[^}]*stroke:var\(--gold\)/);
    assert.match(generatedStylesText, /#timeline,#invitation,#venue,#dress-code,#stay,#faq\{background:#fff\}/);
    assert.match(generatedStylesText, /\.mobile-envelope-instruction\{[^}]*color:#b89254/);
    const generatedGreenEnvelope = await fetch(`${server.baseUrl}/site/${body.data.requestId}/assets/green-envelope.png`);
    assert.equal(generatedGreenEnvelope.status, 200);
    assert.notDeepEqual(
      Buffer.from(await generatedGreenEnvelope.arrayBuffer()),
      await fs.readFile(path.join(PROJECT_ROOT, "website-template", "assets", "green-envelope.png")),
    );

    const adminResponse = await fetch(`${server.baseUrl}${body.data.rsvpAdminUrl}`);
    const adminHtml = await adminResponse.text();
    assert.equal(adminResponse.status, 200);
    assert.match(adminHtml, /Local preview mode/);
    assert.doesNotMatch(adminHtml, /id="accessCode"/);

    const rsvp = {
      guestName: "Guest One",
      email: "guest@example.com",
      contact: "",
      attendance: "yes",
      message: "",
    };
    const first = await fetch(`${server.baseUrl}/api/public/rsvp/${body.data.requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rsvp),
    });
    const duplicate = await fetch(`${server.baseUrl}/api/public/rsvp/${body.data.requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rsvp),
    });
    const duplicateBody = await duplicate.json();
    assert.equal(first.status, 201);
    assert.equal(duplicate.status, 409);
    assert.equal(duplicateBody.error.code, "RSVP_EMAIL_ALREADY_REGISTERED");
  } finally {
    await server.stop();
  }
});
