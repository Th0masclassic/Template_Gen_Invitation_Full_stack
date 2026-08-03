import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverSource = await fs.readFile(path.join(root, "server.mjs"), "utf8");

test("customer PDF generation uses approved GPT artwork and GPT vision without LaTeX", () => {
  assert.doesNotMatch(serverSource, /generateTerraLatex|\/api\/customer\/terra\/latex|terra_latex_output/);
  assert.match(serverSource, /approved_gpt_artwork_with_gpt_vision_hotspots/);
  assert.match(serverSource, /detectInvitationPdfHotspotsWithChatGpt/);
  assert.match(serverSource, /visibleControlsAdded:\s*false/);
  assert.match(serverSource, /attendancePageAdded:\s*false/);
  assert.doesNotMatch(serverSource, /drawAttendancePage|drawChoiceCircle|attendanceTitle:\s*"Will you attend\?"/);
  assert.match(
    serverSource,
    /buildLayeredEnvelopeBuffer\(job,\s*\{\s*coverTopEdge:\s*true\s*\}\)/,
    "the first PDF page must request full-bleed top-flap artwork",
  );
});

test("PDF hotspots target maps, calendar download, and the published website only", () => {
  assert.match(serverSource, /location:\s*String\(project\?\.links\?\.mapsUrl/);
  assert.match(serverSource, /calendar:\s*buildPdfCalendarDownloadUrl\(job\)/);
  assert.match(serverSource, /rsvp:\s*project\?\.attendance\?\.enabled\s*\?\s*buildPdfWebsiteUrl\(job\)/);
  assert.match(serverSource, /\/api\/public\/calendar\/:requestId\.ics/);
  assert.match(serverSource, /Border:\s*\[0,\s*0,\s*0\]/);
  assert.match(serverSource, /confidence 80 or higher/);
  assert.match(serverSource, /PDF_HOTSPOT_TIMEOUT_MS\s*=\s*75\s*\*\s*1000/);
  assert.match(serverSource, /timeout:\s*PDF_HOTSPOT_TIMEOUT_MS,\s*maxRetries:\s*3/);
  assert.match(serverSource, /OPENAI_LAYER_PLANNER_MODEL,\s*OPENAI_WEBSITE_COPY_MODEL,\s*OPENAI_PDF_HOTSPOT_FALLBACK_MODEL/);
  assert.match(serverSource, /hotspotDetectionState:\s*job\.pdfHotspotDetection\?\.state/);
  assert.match(serverSource, /resize\(\{\s*width:\s*768,\s*height:\s*1366/);
  assert.match(serverSource, /data:image\/jpeg;base64/);
});
