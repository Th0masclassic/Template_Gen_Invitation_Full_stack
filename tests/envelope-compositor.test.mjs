import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import {
  composeLayeredEnvelope,
  ENVELOPE_COMPOSITE_HEIGHT,
  ENVELOPE_COMPOSITE_WIDTH,
} from "../envelope-compositor.mjs";

async function solid(width, height, background) {
  return sharp({ create: { width, height, channels: 4, background } }).png().toBuffer();
}

async function sealLayer() {
  const width = ENVELOPE_COMPOSITE_WIDTH;
  const height = ENVELOPE_COMPOSITE_HEIGHT;
  const circle = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><circle cx="${width / 2}" cy="${height / 2}" r="190" fill="#ffffff"/></svg>`);
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: circle }]).png().toBuffer();
}

async function paperPanelWithTransparentHeader() {
  const width = ENVELOPE_COMPOSITE_WIDTH;
  const height = ENVELOPE_COMPOSITE_HEIGHT;
  const panel = await solid(width, height - 300, { r: 72, g: 101, b: 80, alpha: 1 });
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: panel, left: 0, top: 300 }]).png().toBuffer();
}

test("layered envelope keeps the website dimensions, default white paper and gold seal", async () => {
  const paper = await solid(768, 1360, { r: 255, g: 255, b: 255, alpha: 1 });
  const output = await composeLayeredEnvelope({
    topSource: paper,
    bottomSource: paper,
    sealSource: await sealLayer(),
  });
  const { data, info } = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, ENVELOPE_COMPOSITE_WIDTH);
  assert.equal(info.height, ENVELOPE_COMPOSITE_HEIGHT);
  const corner = 0;
  assert.deepEqual([...data.subarray(corner, corner + 3)], [255, 255, 255]);
  const sealOffset = ((838 * info.width) + 384) * info.channels;
  const [r, g, b] = data.subarray(sealOffset, sealOffset + 3);
  assert.ok(r > g && g > b, `expected a warm gold seal pixel, received ${r},${g},${b}`);
});

test("selected envelope colours tint top and bottom while white remains a valid selection", async () => {
  const paper = await solid(768, 1360, { r: 255, g: 255, b: 255, alpha: 1 });
  const seal = await sealLayer();
  const green = await composeLayeredEnvelope({ topSource: paper, bottomSource: paper, sealSource: seal, envelopeColour: "#7A9272" });
  const white = await composeLayeredEnvelope({ topSource: paper, bottomSource: paper, sealSource: seal, envelopeColour: "#FFFFFF" });
  const greenPixel = await sharp(green).extract({ left: 10, top: 10, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  const whitePixel = await sharp(white).extract({ left: 10, top: 10, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  assert.ok(greenPixel[1] > greenPixel[0] && greenPixel[1] > greenPixel[2]);
  assert.ok(whitePixel.every(value => value >= 250));
});

test("PDF full-bleed mode derives the flap padding and covers the top page edge", async () => {
  const transparent = await solid(
    ENVELOPE_COMPOSITE_WIDTH,
    ENVELOPE_COMPOSITE_HEIGHT,
    { r: 0, g: 0, b: 0, alpha: 0 },
  );
  const topSource = await paperPanelWithTransparentHeader();
  const seal = await sealLayer();
  const baseline = await composeLayeredEnvelope({
    topSource,
    bottomSource: transparent,
    sealSource: seal,
    sealGold: "#FFFFFF",
  });
  const fullBleed = await composeLayeredEnvelope({
    topSource,
    bottomSource: transparent,
    sealSource: seal,
    sealGold: "#FFFFFF",
    coverTopEdge: true,
  });
  const baselineTop = await sharp(baseline)
    .extract({ left: ENVELOPE_COMPOSITE_WIDTH / 2, top: 0, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();
  const fullBleedTop = await sharp(fullBleed)
    .extract({ left: ENVELOPE_COMPOSITE_WIDTH / 2, top: 0, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();

  assert.deepEqual([...baselineTop], [255, 255, 255], "the fixture must reproduce the former white strip");
  assert.ok(
    fullBleedTop[1] > fullBleedTop[0] && fullBleedTop[1] > fullBleedTop[2],
    `expected the green flap at the top page edge, received ${[...fullBleedTop].join(",")}`,
  );
});
