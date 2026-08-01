import assert from "node:assert/strict";
import test from "node:test";

import worker from "../cloudflare/invitation-router.js";

function environment(objects) {
  return {
    INVITATION_SITES: {
      async get(key) {
        const value = objects.get(key);
        if (!value) return null;
        return {
          body: value,
          size: Buffer.byteLength(value),
          httpEtag: '"test-etag"',
          writeHttpMetadata(headers) {
            headers.set("content-language", "pt");
          },
        };
      },
    },
  };
}

test("R2 invitation router resolves clean site URLs to index.html", async () => {
  const objects = new Map([["sites/request-123/index.html", "<h1>Invitation</h1>"]]);
  const response = await worker.fetch(
    new Request("https://invites.example.com/sites/request-123/"),
    environment(objects),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/html/);
  assert.equal(response.headers.get("content-length"), String(Buffer.byteLength("<h1>Invitation</h1>")));
  assert.equal(await response.text(), "<h1>Invitation</h1>");
});

test("R2 invitation router serves uploaded MP3 files with a bounded response", async () => {
  const audio = "fake-mp3-data";
  const response = await worker.fetch(
    new Request("https://invites.example.com/sites/request-123/wedding-music.mp3"),
    environment(new Map([["sites/request-123/wedding-music.mp3", audio]])),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(response.headers.get("content-length"), String(Buffer.byteLength(audio)));
  assert.equal(await response.text(), audio);
});

test("R2 invitation router rejects paths outside the site namespace", async () => {
  const response = await worker.fetch(
    new Request("https://invites.example.com/private/secret"),
    environment(new Map()),
  );
  assert.equal(response.status, 404);
});
