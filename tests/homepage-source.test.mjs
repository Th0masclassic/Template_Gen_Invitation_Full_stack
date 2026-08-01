import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homepagePath = path.join(root, "public", "index.html");

test("business homepage keeps both product routes, five languages, four examples, and Etsy reviews", async () => {
  const html = await fs.readFile(homepagePath, "utf8");

  assert.match(html, /data-event-path="\/wedding"/);
  assert.match(html, /data-event-path="\/babyshower"/);
  for (const language of ["pt", "en", "es", "fr", "de"]) {
    assert.match(html, new RegExp(`<option value="${language}">`));
    assert.match(html, new RegExp(`\\b${language}: \\{`));
  }
  for (const example of [
    "showcase-wedding-suite.png",
    "showcase-wedding-journey.png",
    "showcase-baby-suite.png",
    "studio-builder.png",
    "studio-styles.png",
    "studio-progress.png",
    "studio-website.png",
  ]) {
    assert.match(html, new RegExp(`/assets/home/${example.replace(".", "\\.")}`));
  }
  assert.match(html, /\/assets\/home\/invitelab-logo\.png/);
  assert.match(html, /https:\/\/www\.etsy\.com\/your\/purchases/);
  assert.match(html, /id="carouselTrack"/);
  assert.match(html, /pointerdown/);
  assert.match(html, /overflow-x:\s*clip/);
});

test("homepage inline script parses", async () => {
  const html = await fs.readFile(homepagePath, "utf8");
  const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(inlineScripts.length, 1);
  assert.doesNotThrow(() => new Function(inlineScripts[0]));
});
