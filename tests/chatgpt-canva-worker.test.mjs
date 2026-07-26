import assert from "node:assert/strict";
import test from "node:test";

import { extractCanvaDesignLink, resolveBrowserExecutable } from "../chatgpt-canva-worker.mjs";

test("extractCanvaDesignLink finds a Canva design URL in mixed widget output", () => {
  const result = extractCanvaDesignLink([
    "Image To Design completed.",
    "Open https://www.canva.com/design/DAH123abc_X/edit?utm_source=chatgpt to continue.",
  ]);

  assert.deepEqual(result, {
    designId: "DAH123abc_X",
    editUrl: "https://www.canva.com/design/DAH123abc_X/edit?utm_source=chatgpt",
  });
});

test("extractCanvaDesignLink ignores non-design Canva URLs", () => {
  assert.equal(extractCanvaDesignLink("https://www.canva.com/templates/invitations/"), null);
});

test("extractCanvaDesignLink accepts Image To Design short links for later API resolution", () => {
  assert.deepEqual(extractCanvaDesignLink("https://www.canva.com/d/s57R9zb8NsOSKKd"), {
    designId: null,
    editUrl: "https://www.canva.com/d/s57R9zb8NsOSKKd",
  });
});

test("resolveBrowserExecutable preserves an explicit executable path", () => {
  assert.equal(resolveBrowserExecutable(process.execPath), process.execPath);
});
