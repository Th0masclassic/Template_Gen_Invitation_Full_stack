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
  assert.match(html, /rsvpSubmitUrl":"\/api\/public\/rsvp\/75f7570d-fefd-4e0e-b551-e9bd7bfc635b/);
  assert.match(html, /data-youform-embed/);
  assert.match(html, /data-form="wedding-rsvp"/);
  assert.match(html, /request_id=75f7570d-fefd-4e0e-b551-e9bd7bfc635b/);
  assert.match(html, /app\.youform\.com\/embed\.js/);
  assert.doesNotMatch(html, /id="rsvpForm"/);
  assert.doesNotMatch(html, /<\\\/script>/);
  assert.doesNotMatch(html, /Tomás <script>/);
  assert.match(html, /Tomás &lt;script&gt;/);
  assert.match(html, /id="envelopeScreen"/);
  assert.match(html, /id="sealTrigger"/);
  assert.match(html, /id="hero"/);
  assert.match(html, /id="invitation"/);
  assert.match(html, /id="countdown"/);
  assert.match(html, /id="story"/);
  assert.match(html, /id="rsvp"/);
  assert.match(html, /id="venue"/);
  assert.match(html, /id="timeline"/);
  assert.match(html, /class="timeline-path"/);
  assert.match(html, /data-timeline-item/);
  assert.match(html, /id="dress-code"/);
  assert.match(html, /id="stay"/);
  assert.match(html, /id="travel"/);
  assert.match(html, /id="faq"/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="script\.js" defer/);
  assert.match(html, /assets\/green-envelope\.png/);
  assert.match(html, /background:#fff/);
  assert.match(html, /classList\.contains\("locked"\)/);
  assert.doesNotMatch(html, /function unlock\(\)\{if\(document\.body\)document\.body\.classList\.remove\("locked"\);\}/);
  assert.doesNotMatch(html, /PT50 0000/);
  assert.doesNotMatch(html, /id="gift"/);
});

test("wedding website keeps the native RSVP form as a fallback", () => {
  const html = renderWeddingWebsite({
    project: {
      ...project,
      attendance: { enabled: true, formUrl: "" },
    },
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
  });
  assert.match(html, /id="rsvpForm"/);
  assert.doesNotMatch(html, /data-youform-embed|app\.youform\.com\/embed\.js/);
});

test("mobile opening uses the selected envelope colour and renders uploaded music controls", () => {
  const configuredProject = structuredClone(project);
  configuredProject.website = {
    details: {
      envelopeColor: "#743442",
      musicTitle: "Our <Song>",
      musicArtist: "Artist & Couple",
    },
  };
  const html = renderWeddingWebsite({
    project: configuredProject,
    requestId: "mobile-opening-with-music",
    musicFileName: "wedding-music.mp3",
  });

  assert.match(html, /class="mobile-envelope-gate"/);
  assert.match(html, /style="--mobile-envelope-color:#743442"/);
  assert.match(html, /class="mobile-wax-seal" id="sealTrigger"/);
  assert.match(html, /assets\/mobile-envelope-layer-top\.webp/);
  assert.match(html, /assets\/mobile-envelope-layer-bottom\.webp/);
  assert.match(html, /assets\/mobile-envelope-layer-seal\.webp/);
  assert.match(html, /id="weddingAudio" src="wedding-music\.mp3"/);
  assert.match(html, /preload="auto" playsinline loop/);
  assert.doesNotMatch(html, /<audio[^>]*autoplay/);
  assert.match(html, /id="musicPlayer"/);
  assert.match(html, /Our &lt;Song&gt;/);
  assert.match(html, /Artist &amp; Couple/);
  assert.doesNotMatch(html, /Our <Song>/);
});

test("mobile opening falls back safely when colour or music URL is unsafe", () => {
  const configuredProject = structuredClone(project);
  configuredProject.website = {
    details: {
      envelopeColor: "red;position:fixed",
      musicUrl: "javascript:alert('music')",
    },
  };
  const html = renderWeddingWebsite({
    project: configuredProject,
    requestId: "mobile-opening-safe-fallback",
  });

  assert.match(html, /style="--mobile-envelope-color:#5F694F"/);
  assert.doesNotMatch(html, /id="weddingAudio"|id="musicPlayer"|javascript:/);
});

test("website omits the audio element and music player when no MP3 was uploaded", () => {
  const configuredProject = structuredClone(project);
  configuredProject.website = {
    details: {
      musicTitle: "This title alone must not create a player",
      musicArtist: "No file",
    },
  };
  const html = renderWeddingWebsite({
    project: configuredProject,
    requestId: "mobile-opening-without-music",
  });
  assert.doesNotMatch(html, /id="weddingAudio"|id="musicPlayer"|wedding-music\.mp3/);
});

test("uploaded music path rejects traversal and non-MP3 extensions", () => {
  for (const musicFileName of ["../wedding-music.mp3", "/wedding-music.mp3", "wedding-music.wav"]) {
    const html = renderWeddingWebsite({
      project,
      requestId: "mobile-opening-invalid-music",
      musicFileName,
    });
    assert.doesNotMatch(html, /id="weddingAudio"|id="musicPlayer"/);
  }
});

test("wedding website uses a safe per-job envelope and envelope-derived theme", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
    envelopeFileName: "envelope.png",
    theme: {
      themeColor: "#263425",
      paper: "#FEFEFC",
      paperSoft: "#F3F5F0",
      ink: "#182018",
      muted: "#667064",
      primary: "#344532",
      primarySoft: "#D6DED2",
      accent: "#7A201D",
      gold: "#AA8954",
      line: "#CAD2C6",
    },
  });

  assert.match(html, /<meta name="theme-color" content="#263425">/);
  assert.match(html, /<style id="envelope-theme">:root\{/);
  assert.match(html, /--paper:#FEFEFC/);
  assert.match(html, /--paper-soft:#F3F5F0/);
  assert.match(html, /--ink:#182018/);
  assert.match(html, /--muted:#667064/);
  assert.match(html, /--olive:#344532/);
  assert.match(html, /--olive-soft:#D6DED2/);
  assert.match(html, /--wine:#7A201D/);
  assert.match(html, /--gold:#AA8954/);
  assert.match(html, /--line:#CAD2C6/);
  assert.match(html, /class="envelope-intro__art" src="assets\/green-envelope\.png"/);
  assert.doesNotMatch(html, /srcset="assets\/envelope-480\.webp|class="envelope-art"/);
});

test("mobile envelope intro keeps the couple title below the safe-area edge", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "mobile-envelope-title-test",
    imageFileName: "invitation.png",
    envelopeFileName: "envelope.png",
  });
  assert.match(html, /padding-top:max\(36px,calc\(env\(safe-area-inset-top\) \+ 18px\)\)/);
  assert.match(html, /\.envelope-intro__names\{left:50%;top:-15%/);
  assert.doesNotMatch(html, /\.envelope-intro__names\{left:50%;top:-18%/);
});

test("envelope entrance animation keeps the existing four-second timing", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "slower-envelope-animation-test",
    imageFileName: "invitation.png",
    envelopeFileName: "envelope.png",
  });
  assert.match(html, /animation:inviteEnvelope 4\.0s cubic-bezier/);
  assert.doesNotMatch(html, /animation:inviteEnvelope \.9s cubic-bezier/);
});

test("wedding website rejects unsafe envelope paths and CSS color values", () => {
  const html = renderWeddingWebsite({
    project,
    requestId: "75f7570d-fefd-4e0e-b551-e9bd7bfc635b",
    envelopeFileName: "../envelope.png",
    theme: {
      themeColor: `"><script>alert("theme")</script>`,
      primary: "#334433;background:url(javascript:alert(1))",
      gold: "#AABBCC",
    },
  });

  assert.match(html, /<meta name="theme-color" content="#30382c">/);
  assert.match(html, /src="assets\/green-envelope\.png"/);
  assert.doesNotMatch(html, /srcset="assets\/envelope-480\.webp/);
  assert.match(html, /<style id="envelope-theme">:root\{--gold:#AABBCC\}<\/style>/);
  assert.doesNotMatch(html, /javascript:|<script>alert\("theme"\)<\/script>|--olive:/);
});

test("wedding website maps the five responsive-template image slots", () => {
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
    ],
  });

  assert.match(html, /src="site-photo-01\.jpg"/);
  assert.match(html, /src="site-photo-02\.jpeg"/);
  assert.match(html, /src="gallery\/site-photo-03\.webp"/);
  assert.match(html, /src="site-photo-04\.png" alt="Local do casamento"/);
  assert.match(html, /src="site-photo-05\.avif" alt="Alojamento perto do local"/);
  assert.doesNotMatch(html, /site-photo-06\.jpg/);
  assert.match(html, /src="invitation\.png" alt="Convite de casamento"/);
});

test("wedding website renders the optional website questionnaire details", () => {
  const websiteProject = structuredClone(project);
  websiteProject.website = {
    details: {
      story: "Conhecemo-nos no verão e queremos celebrar convosco.",
      ceremonyTime: "15:30",
      receptionTime: "17:00",
      ceremonyDescription: "Troca de votos junto ao jardim.",
      receptionDescription: "Cocktail ao pôr do sol.",
      arrivalTime: "15:00",
      partyTime: "21:30",
    },
  };
  const html = renderWeddingWebsite({ project: websiteProject, requestId: "details-test" });

  for (const value of [
    "Conhecemo-nos no verão e queremos celebrar convosco.",
    "Troca de votos junto ao jardim.",
    "Cocktail ao pôr do sol.",
    "15:00",
    "15:30",
    "17:00",
    "21:30",
  ]) assert.match(html, new RegExp(value));
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
