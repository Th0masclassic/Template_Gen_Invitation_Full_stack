import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

test("customer generation accepts images plus one optional wedding MP3", () => {
  assert.match(source, /const MAX_WEBSITE_PHOTOS = 5;/);
  assert.match(source, /files:\s*MAX_WEBSITE_PHOTOS \+ 4,/);
  assert.match(source, /\{ name: "photo", maxCount: 1 \}/);
  assert.match(source, /\{ name: "customTemplate", maxCount: 1 \}/);
  assert.match(source, /\{ name: "weddingMusic", maxCount: 1 \}/);
  for (const field of [
    "websiteHeroImage",
    "websiteStoryImage1",
    "websiteStoryImage2",
    "websiteVenueImage",
    "websiteStayImage",
  ]) {
    assert.match(source, new RegExp(`\\{ name: "${field}", maxCount: 1 \\}`));
  }
  assert.match(source, /const WEBSITE_IMAGE_SLOTS = Object\.freeze/);
});

test("uploaded images are validated against their own form fields", () => {
  assert.match(source, /await validatePhoto\(photoFile, "photo"\)/);
  assert.match(source, /await validatePhoto\(customTemplateFile, "customTemplate"\)/);
  assert.match(source, /validateWeddingMusic\(weddingMusicFile\)/);
  assert.match(source, /await validatePhoto\(file, slot\.field\)/);
  assert.match(source, /await validatePhoto\(file, `websitePhotos\[\$\{index\}\]`\)/);
  assert.match(source, /role: uploadEntry\.role/);
  assert.match(source, /detectedMime !== file\.mimetype/);
  assert.match(source, /limitInputPixels: MAX_OPENAI_EDIT_IMAGE_PIXELS/);
});

test("Multer file-count errors return an actionable message", () => {
  assert.match(source, /LIMIT_FILE_COUNT/);
  assert.match(source, /até 5 fotografias para o website/);
});

test("generated sites receive only managed role-based files with strict public filenames", () => {
  assert.match(source, /managedWebsitePhotoSource\(entry, job\.requestId\)/);
  assert.match(source, /websiteImages/);
  assert.match(source, /SITE_PHOTO_RE\.test\(file\)/);
  assert.match(source, /site-manifest\.json/);
  assert.match(source, /schemaVersion: 4/);
  assert.match(source, /music: musicFileName \? \{ fileName: musicFileName \} : null/);
  assert.match(source, /replacePreparedSiteDirectory\(stagingDir, siteDir\)/);
});

test("multipart uploads have aggregate and concurrency backpressure", () => {
  assert.match(source, /const MAX_UPLOAD_REQUEST_BYTES = 180 \* 1024 \* 1024;/);
  assert.match(source, /const MAX_CONCURRENT_MULTIPART_UPLOADS = 2;/);
  assert.match(source, /guardCustomerUpload,/);
  assert.match(source, /totalUploadBytes > MAX_UPLOAD_REQUEST_BYTES/);
});
