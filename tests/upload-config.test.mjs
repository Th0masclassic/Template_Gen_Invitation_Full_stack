import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

test("customer generation accepts the main image fields and six website photos", () => {
  assert.match(source, /const MAX_WEBSITE_PHOTOS = 6;/);
  assert.match(source, /files:\s*MAX_WEBSITE_PHOTOS \+ 2,/);
  assert.match(source, /\{ name: "photo", maxCount: 1 \}/);
  assert.match(source, /\{ name: "customTemplate", maxCount: 1 \}/);
  assert.match(source, /\{ name: "websitePhotos", maxCount: MAX_WEBSITE_PHOTOS \}/);
});

test("uploaded images are validated against their own form fields", () => {
  assert.match(source, /await validatePhoto\(photoFile, "photo"\)/);
  assert.match(source, /await validatePhoto\(customTemplateFile, "customTemplate"\)/);
  assert.match(source, /for \(const \[index, file\] of websitePhotoFiles\.entries\(\)\)[\s\S]*?await validatePhoto\(file, `websitePhotos\[\$\{index\}\]`\)/);
  assert.match(source, /websitePhotos\.push\(\{ path: sourcePath, mime: websitePhotoFile\.mimetype \}\)/);
  assert.match(source, /detectedMime !== file\.mimetype/);
  assert.match(source, /limitInputPixels: MAX_OPENAI_EDIT_IMAGE_PIXELS/);
});

test("Multer file-count errors return an actionable message", () => {
  assert.match(source, /LIMIT_FILE_COUNT/);
  assert.match(source, /até 6 fotografias para o website/);
});

test("generated sites receive only managed gallery files with a strict public filename", () => {
  assert.match(source, /managedWebsitePhotoSource\(entry, job\.requestId\)/);
  assert.match(source, /galleryImages,/);
  assert.match(source, /SITE_PHOTO_RE\.test\(file\)/);
  assert.match(source, /site-manifest\.json/);
  assert.match(source, /replacePreparedSiteDirectory\(stagingDir, siteDir\)/);
});

test("multipart uploads have aggregate and concurrency backpressure", () => {
  assert.match(source, /const MAX_UPLOAD_REQUEST_BYTES = 42 \* 1024 \* 1024;/);
  assert.match(source, /const MAX_CONCURRENT_MULTIPART_UPLOADS = 2;/);
  assert.match(source, /guardCustomerUpload,/);
  assert.match(source, /totalUploadBytes > MAX_UPLOAD_REQUEST_BYTES/);
});
