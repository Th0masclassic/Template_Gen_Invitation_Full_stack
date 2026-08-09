import assert from "node:assert/strict";
import test from "node:test";

import {
  TEMPLATE_ONLY_MAX_VERSIONS,
  generationTargetForTemplateOnly,
  isTemplateOnlyJourney,
  templateOnlyCanCreateAnotherVersion,
} from "../template-only-policy.mjs";

test("only a template-bound invite-only entitlement activates the locked product policy", () => {
  assert.equal(isTemplateOnlyJourney({ entitlement: { packType: "invite_only_pack", templateId: "aquarela_paris" } }), true);
  assert.equal(isTemplateOnlyJourney({ entitlement: { packType: "invite_only_pack", templateId: "" } }), false);
  assert.equal(isTemplateOnlyJourney({ entitlement: { packType: "Full_pack", templateId: "aquarela_paris" } }), false);
  assert.equal(isTemplateOnlyJourney({ job: { templateOnlyJourney: true } }), true);
});

test("template-only generation creates invitations and stops at five saved versions", () => {
  assert.equal(TEMPLATE_ONLY_MAX_VERSIONS, 5);
  assert.equal(generationTargetForTemplateOnly(true), "invitation");
  assert.equal(generationTargetForTemplateOnly(false), "both");
  assert.equal(templateOnlyCanCreateAnotherVersion(4), true);
  assert.equal(templateOnlyCanCreateAnotherVersion(5), false);
});
