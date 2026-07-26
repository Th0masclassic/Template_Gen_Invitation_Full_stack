import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  appendYouformParams,
  detectLocale,
  extractDeploymentUrl,
  extractYouformFormId,
  renderCalendarIcs,
  renderWeddingWebsite,
  verifyYouformSignature,
} from "../wedding-site.mjs";

const project = {
  language: "pt",
  couple: {
    person1: "Tomás <script>",
    person2: "Rita & Ana",
  },
  invitation: {
    date: "2027-11-18",
    time: "20:00",
    location: "Quinta Tagus, Portugal",
    message: "Celebra connosco.",
  },
  links: {
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Quinta+Tagus",
  },
  gift: {
    enabled: true,
    iban: "PT50 0000 0000 0000 0000 000",
    accountHolder: "Tomás e Rita",
    paymentReference: "Casamento",
  },
  attendance: {
    enabled: true,
    formUrl: "https://app.youform.com/forms/wedding-rsvp",
  },
};

test("detectLocale respects explicit locale, country and browser preference", () => {
  assert.equal(detectLocale({ explicitLocale: "fr-FR", countryCode: "PT", acceptLanguage: "de" }), "fr");
  assert.equal(detectLocale({ countryCode: "PT", acceptLanguage: "en" }), "pt");
  assert.equal(detectLocale({ countryCode: "DE", acceptLanguage: "en" }), "de");
  assert.equal(detectLocale({ acceptLanguage: "es-ES,es;q=0.9,en;q=0.8" }), "es");
  assert.equal(detectLocale({ countryCode: "JP", acceptLanguage: "ja" }), "en");
});

test("Youform URL receives bounded hidden parameters", () => {
  const result = new URL(appendYouformParams(project.attendance.formUrl, {
    request_id: "abc-123",
    language: "pt",
    couple: "Tomás & Rita",
  }));
  assert.equal(result.searchParams.get("request_id"), "abc-123");
  assert.equal(result.searchParams.get("language"), "pt");
  assert.equal(result.searchParams.get("couple"), "Tomás & Rita");
  assert.equal(extractYouformFormId(result.toString()), "wedding-rsvp");
  assert.equal(extractYouformFormId("https://example.com/forms/wedding-rsvp"), "");
});

test("Youform signature verification uses the raw body", () => {
  const body = Buffer.from(JSON.stringify({ event_id: "event-1" }));
  const secret = "test-secret";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyYouformSignature(body, secret, signature), true);
  assert.equal(verifyYouformSignature(body, secret, `sha256=${signature}`), true);
  assert.equal(verifyYouformSignature(Buffer.from("{}"), secret, signature), false);
});

test("wedding website escapes customer data and embeds the configured Youform", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
  });
  assert.match(html, /data-youform-embed/);
  assert.match(html, /data-form="wedding-rsvp"/);
  assert.match(html, /request_id=75f7570d-fefd-4e0e-b551-e9bd7bfc635b/);
  assert.match(html, /<script src="https:\/\/app\.youform\.com\/embed\.js" async><\/script>/);
  assert.doesNotMatch(html, /<\\\/script>/);
  assert.doesNotMatch(html, /Tomás <script>/);
  assert.match(html, /Tomás &lt;script&gt;/);
  assert.match(html, /id="heroDate"/);
  assert.match(html, /id="openInvitation"/);
  assert.match(html, /id="gallery"/);
  assert.match(html, /id="countdown"/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /-webkit-backdrop-filter/);
});

test("wedding website renders up to six validated gallery photos", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
    imageFileName: "invitation.png",
    galleryImages: [
      "site-photo-01.jpg",
      "site-photo-02.jpeg",
      "gallery/site-photo-03.webp",
      "site-photo-04.png",
      "site-photo-05.avif",
      "site-photo-06.jpg",
      "site-photo-07.jpg",
    ],
  });

  for (const fileName of [
    "site-photo-01.jpg",
    "site-photo-02.jpeg",
    "gallery/site-photo-03.webp",
    "site-photo-04.png",
    "site-photo-05.avif",
    "site-photo-06.jpg",
  ]) {
    assert.match(html, new RegExp(`src="${fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  assert.doesNotMatch(html, /site-photo-07\.jpg/);
  assert.equal((html.match(/<figure class="gallery-item/g) || []).length, 6);
  assert.match(html, /<section class="hero" id="top"/);
});

test("wedding website rejects unsafe image paths and external URLs", () => {
  const unsafeProject = structuredClone(project);
  unsafeProject.couple.person1 = `Ana"></h1><script>alert("name")</script>`;
  unsafeProject.invitation.location = `Venue"><img src=x onerror=alert("place")>`;
  unsafeProject.invitation.message = `</p><script>alert("story")</script>`;
  unsafeProject.links.mapsUrl = "javascript:alert('maps')";
  unsafeProject.attendance.formUrl = "https://evil.example/forms/stolen";

  const html = renderWeddingWebsite({
    project: unsafeProject,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
    imageFileName: "../outside.png",
    galleryImages: [
      "site-photo-01.jpg",
      "../secret.jpg",
      "/absolute.jpg",
      "gallery/%2e%2e/secret.jpg",
      "photo.jpg?download=1",
      `bad"><script>alert(1)</script>.jpg`,
      "data:image/png;base64,abc",
    ],
  });

  assert.match(html, /src="invitation\.png"/);
  assert.match(html, /src="site-photo-01\.jpg"/);
  assert.doesNotMatch(html, /\.\.\/secret\.jpg|\/absolute\.jpg|%2e%2e|photo\.jpg\?|data:image\/png/);
  assert.doesNotMatch(html, /javascript:alert|evil\.example|data-youform-embed/);
  assert.doesNotMatch(html, /<script>alert\("(name|story)"\)<\/script>|<img src=x onerror/);
  assert.match(html, /Ana&quot;&gt;&lt;\/h1&gt;&lt;script&gt;alert\(&quot;name&quot;\)&lt;\/script&gt;/);
  assert.match(html, /Venue&quot;&gt;&lt;img src=x onerror=alert\(&quot;place&quot;\)&gt;/);
});

test("website uses invitation artwork as the gallery fallback and a blue baby-shower theme", () => {
  const babyProject = structuredClone(project);
  babyProject.eventType = "baby_shower";
  babyProject.language = "en";
  babyProject.couple = { person1: "Maya", person2: "Noah" };

  const html = renderWeddingWebsite({
    project: babyProject,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
    imageFileName: "invitation.png",
  });

  assert.match(html, /data-event="baby_shower"/);
  assert.match(html, /Baby shower invitation/);
  assert.match(html, /A little bundle of joy is on the way/);
  assert.match(html, /--accent:#4b86a7/);
  assert.match(html, /class="hero fallback-art"/);
  assert.equal((html.match(/<figure class="gallery-item/g) || []).length, 1);
  assert.ok((html.match(/src="invitation\.png"/g) || []).length >= 3);
});

test("calendar advances to the next day when the event crosses midnight", () => {
  const calendar = renderCalendarIcs(project);
  assert.match(calendar, /DTSTART:20271118T200000/);
  assert.match(calendar, /DTEND:20271119T040000/);
  assert.match(calendar, /LOCATION:Quinta Tagus\\, Portugal/);
});

test("EdgeOne deployment URL extraction prefers production URL fields", () => {
  assert.equal(
    extractDeploymentUrl({
      documentation: "https://example.com/docs",
      result: { production_url: "https://wedding.edgeone.app/" },
    }),
    "https://wedding.edgeone.app/",
  );
  assert.equal(extractDeploymentUrl({ url: "http://insecure.example.com" }), "");
});
