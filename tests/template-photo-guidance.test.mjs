import assert from "node:assert/strict";
import test from "node:test";

import { buildTemplatePhotoGuidance } from "../template-photo-guidance.mjs";

test("template-only photo guidance repaints the customer scene and removes sample-only landmarks", () => {
  const guidance = buildTemplatePhotoGuidance({ templateOnly: true, hasCustomerPhoto: true });
  assert.match(guidance, /Image 1 controls.*artistic treatment/i);
  assert.match(guidance, /Image 2 controls the depicted content/i);
  assert.match(guidance, /replace every sample person/i);
  assert.match(guidance, /landmark that exists only in Image 1 must be removed/i);
  assert.match(guidance, /never like a rectangular photograph pasted/i);
  assert.match(guidance, /watercolour\/pencil\/gouache\/ink/i);
});

test("template-only fallback keeps the sample art when no customer photo is uploaded", () => {
  const guidance = buildTemplatePhotoGuidance({ templateOnly: true, hasCustomerPhoto: false });
  assert.match(guidance, /did not upload a replacement photo/i);
  assert.match(guidance, /keep Image 1's existing sample people/i);
  assert.match(guidance, /change only the customer text/i);
});

test("ordinary products retain their existing photo behavior", () => {
  assert.equal(buildTemplatePhotoGuidance({ templateOnly: false, hasCustomerPhoto: true }), "");
});
