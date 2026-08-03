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
  assert.match(styles, /html,[\s\S]+\.js body\{max-width:100%;overflow-x:clip;scrollbar-width:none\}/);
  assert.match(styles, /html::-webkit-scrollbar,[\s\S]+\.js body::-webkit-scrollbar\{display:none\}/);
  assert.match(styles, /html\.mobile-intro-pending,[\s\S]+html\.mobile-intro-pending body\{[\s\S]+overflow:hidden;[\s\S]+overscroll-behavior:none;[\s\S]+touch-action:none/);
  assert.match(styles, /\.js body\.mobile-intro-pending\{[\s\S]+position:fixed;[\s\S]+inset:0;[\s\S]+width:100%;[\s\S]+height:100%/);
  assert.match(styles, /width:100%;[\s\S]+max-width:100%;[\s\S]+overflow:clip;[\s\S]+touch-action:none/);
  assert.match(styles, /\.mobile-envelope-layer\{[\s\S]+width:100%;[\s\S]+max-width:100%;[\s\S]+overflow:clip;[\s\S]+contain:paint/);
  assert.match(styles, /mobile-envelope-layer-top\.png/);
  assert.match(styles, /mobile-envelope-layer-bottom\.png/);
  assert.match(styles, /--mobile-envelope-panel-scale:1\.1/);
  assert.match(styles, /--mobile-envelope-panel-shift-y:clamp\(-72px,-6vh,-40px\)/);
  assert.match(styles, /--mobile-envelope-top-shift-y:clamp\(-210px,-20vh,-150px\)/);
  assert.match(styles, /--mobile-envelope-seal-scale:\.45/);
  assert.match(styles, /--mobile-envelope-seal-shift-y:clamp\(140px,17vh,158px\)/);
  assert.match(styles, /mobile-envelope-layer-bottom img,[\s\S]+transform:translate3d\(0,var\(--mobile-envelope-panel-shift-y\),0\) scale\(var\(--mobile-envelope-panel-scale\)\)/);
  assert.match(styles, /mobile-envelope-layer-top img,[\s\S]+transform:translate3d\(0,var\(--mobile-envelope-top-shift-y\),0\) scale\(var\(--mobile-envelope-panel-scale\)\)/);
  assert.match(styles, /mobile-envelope-layer-seal img\{[\s\S]+transform:translate3d\(0,var\(--mobile-envelope-seal-shift-y\),0\) scale\(var\(--mobile-envelope-seal-scale\)\)/);
  assert.match(styles, /\.mobile-wax-seal\{[\s\S]+top:66\.5%/);
  assert.match(styles, /\.mobile-envelope-instruction\{[\s\S]+top:86%/);
  assert.match(styles, /width:clamp\(104px,22vh,184px\)/);
  assert.match(styles, /animation:mobileLayerTopOpen/);
  assert.match(styles, /animation:mobileLayerSealOpen/);
  assert.match(styles, /animation:mobileLayerBottomOpen/);
  assert.match(siteScript, /playWeddingMusic\(\{ restart: true \}\);[\s\S]{0,220}envelope\?\.classList\.add\('is-opening'\)/);
  assert.match(siteScript, /function setMobileIntroPending\(pending\)[\s\S]+document\.documentElement\.classList\.toggle\('mobile-intro-pending', pending\)/);
  assert.match(siteScript, /setMobileIntroPending\(false\);[\s\S]+body\.classList\.add\('invitation-open'\)/);
  assert.match(siteScript, /setMobileIntroPending\(true\);[\s\S]+openButton\.focus\(\)/);
  assert.match(siteScript, /completionDelay = reducedMotionQuery\.matches \? 90 : 5800/);
  assert.match(siteScript, /hero\?\.classList\.add\('is-active'\)/);
});

test("website questionnaire uploads an optional MP3 and persists its display metadata", () => {
  assert.match(builder, /id="envelopeColourPalette"/);
  assert.match(builder, /id="envelopeColor"/);
  assert.match(builder, /data-envelope-colour=""/);
  assert.match(builder, /data-envelope-colour="#E8B7B7"/);
  assert.match(builder, /const normalized = .*: ''/);
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
