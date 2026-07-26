import assert from "node:assert/strict";
import test from "node:test";

import { parseDesignLink } from "../canva-link.mjs";

test("accepts a Canva design link and extracts its identifier", () => {
  const result = parseDesignLink("https://www.canva.com/design/DAHExample/edit?designId=DAHQTZvN8Zw");

  assert.equal(result.designId, "DAHQTZvN8Zw");
  assert.equal(new URL(result.editUrl).hostname, "www.canva.com");
});

test("rejects non-Canva and malformed design links", () => {
  assert.equal(parseDesignLink("https://example.com/?designId=DAHQTZvN8Zw"), null);
  assert.equal(parseDesignLink("https://www.canva.com/design/example/edit?designId=%2Fbad"), null);
  assert.equal(parseDesignLink("not-a-url"), null);
});
