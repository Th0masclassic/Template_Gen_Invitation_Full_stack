import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const [styles, siteScript, builder, server] = await Promise.all([
  fs.readFile(new URL("../website-template/styles.css", import.meta.url), "utf8"),
  fs.readFile(new URL("../website-template/script.js", import.meta.url), "utf8"),
  fs.readFile(new URL("../public/event-builder.html", import.meta.url), "utf8"),
  fs.readFile(new URL("../server.mjs", import.meta.url), "utf8"),
]);

test("reference envelope gate is mobile-only and hands off to the existing photo intro", () => {
  assert.match(styles, /\.mobile-envelope-gate\{display:none\}/);
  assert.match(styles, /@media\(max-width:600px\)\{/);
  assert.match(styles, /\.js \.mobile-envelope-gate\{/);
  assert.match(styles, /mobile-envelope-layer-top\.webp/);
  assert.match(styles, /mobile-envelope-layer-bottom\.webp/);
  assert.match(styles, /animation:mobileLayerTopOpen/);
  assert.match(styles, /animation:mobileLayerSealOpen/);
  assert.match(styles, /animation:mobileLayerBottomOpen/);
  assert.match(siteScript, /playWeddingMusic\(\{ restart: true \}\);[\s\S]{0,220}envelope\?\.classList\.add\('is-opening'\)/);
  assert.match(siteScript, /completionDelay = reducedMotionQuery\.matches \? 90 : 5800/);
  assert.match(siteScript, /hero\?\.classList\.add\('is-active'\)/);
});

test("website questionnaire uploads an optional MP3 and persists its display metadata", () => {
  assert.match(builder, /id="envelopeColourPalette"/);
  assert.match(builder, /id="envelopeColor"/);
  assert.match(builder, /id="weddingMusic" name="weddingMusic" type="file" accept="\.mp3,audio\/mpeg"/);
  assert.match(builder, /id="musicTitle"/);
  assert.match(builder, /id="musicArtist"/);
  assert.match(builder, /envelopeColor: 'envelopeColor', musicTitle: 'musicTitle', musicArtist: 'musicArtist'/);
  assert.match(builder, /body\.append\('weddingMusic', state\.musicFile, state\.musicFile\.name\)/);
  assert.match(builder, /hasMusic: Boolean\(state\.musicFile \|\| state\.retainedMusic\)/);
  assert.match(server, /envelopeColor: 7/);
  assert.match(server, /field === "envelopeColor"/);
  assert.match(server, /function validateWeddingMusic/);
  assert.match(server, /\{ name: "weddingMusic", maxCount: 1 \}/);
  assert.match(server, /"wedding-music\.mp3":?/);
});

test("floating player exposes an explicit play state and animated equalizer", () => {
  assert.match(styles, /\.music-player\{/);
  assert.match(styles, /\.music-player\.is-playing \.music-toggle-icon::before/);
  assert.match(styles, /@keyframes musicBar/);
  assert.match(siteScript, /playWeddingMusic\(\{ restart: true \}\)/);
  assert.match(siteScript, /weddingAudio\.currentTime = 0/);
  assert.match(siteScript, /document\.addEventListener\('visibilitychange', stopWeddingMusicForHiddenPage\)/);
  assert.doesNotMatch(siteScript, /attemptWeddingMusicAutoplay/);
  assert.match(siteScript, /weddingAudio\?\.addEventListener\('play', syncMusicPlayer\)/);
  assert.match(siteScript, /musicToggle\?\.addEventListener\('click', toggleWeddingMusic\)/);
});
