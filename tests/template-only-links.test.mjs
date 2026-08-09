import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTemplateOnlyUrl,
  createTemplateOnlyGrant,
  templateOnlyCookie,
  verifyTemplateOnlyGrant,
} from "../template-only-links.mjs";

const secret = "template-link-secret-with-more-than-thirty-two-characters";
const claim = {
  templateId: "aquarela_paris",
  filename: "07_aquarela.png",
  eventType: "wedding",
};

test("template-only grants are bound to the selected id, filename and event", () => {
  const grant = createTemplateOnlyGrant(claim, secret);
  assert.deepEqual(verifyTemplateOnlyGrant(grant, secret), claim);
  assert.equal(verifyTemplateOnlyGrant(grant, secret, { templateId: "coastal_blue" }), null);
  assert.equal(verifyTemplateOnlyGrant(grant, secret, { filename: "08_coastal_blue.png" }), null);
  assert.equal(verifyTemplateOnlyGrant(`${grant}x`, secret), null);
});

test("admin-generated URLs use the requested Etsy PDF path and a signed grant", () => {
  const generated = new URL(buildTemplateOnlyUrl({ baseUrl: "https://invitelab.art/wedding", claim, secret }));
  assert.equal(generated.origin, "https://invitelab.art");
  assert.equal(generated.pathname, "/tempOnly/07_aquarela.png/gen");
  assert.ok(generated.searchParams.get("grant"));
  assert.deepEqual(verifyTemplateOnlyGrant(generated.searchParams.get("grant"), secret), claim);
});

test("baby-shower source folders become safe one-segment customer URLs", () => {
  const baby = { templateId: "baby_clouds", filename: "01_baby_clouds.png", eventType: "baby_shower" };
  const generated = new URL(buildTemplateOnlyUrl({ baseUrl: "https://invitelab.art", claim: baby, secret }));
  assert.equal(generated.pathname, "/tempOnly/01_baby_clouds.png/gen");
  assert.deepEqual(verifyTemplateOnlyGrant(generated.searchParams.get("grant"), secret), baby);
});

test("template grant cookies are HttpOnly, Lax and year-long", () => {
  const cookie = templateOnlyCookie({ grant: "signed", secure: true });
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
});
