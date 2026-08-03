import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("homepage exposes truthful packs, secure checkout, a new-code action and labelled sample feedback", async () => {
  const html = await fs.readFile(path.join(root, "public", "index.html"), "utf8");
  for (const name of ["Template Generator Only", "Template + Digital Invite", "Full Pack"]) assert.match(html, new RegExp(name.replaceAll("+", "\\+")));
  assert.match(html, /data-buy-pack="invite_only_pack"/);
  assert.match(html, /data-buy-pack="digital_pdf_pack"/);
  assert.match(html, /data-buy-pack="Full_pack"/);
  assert.match(html, /\/api\/public\/stripe\/checkout-session/);
  assert.match(html, /checkoutToken\(packType, eventType\)/);
  assert.match(html, /sessionStorage\.removeItem\(checkoutTokenKey\(packType, eventType\)\)/);
  assert.match(html, /class="occasion-action new-code-link" href="\/wedding\?new=1"/);
  assert.match(html, /feedbackDisclosure/);
  assert.match(html, /Sample feedback/);
});

test("server generates Agenda artwork in parallel and reconstructs the layered envelope for preview and PDF", async () => {
  const source = await fs.readFile(path.join(root, "server.mjs"), "utf8");
  assert.match(source, /Promise\.all\(\[\s*generateInvitationImage[\s\S]+generateAgendaImage/);
  assert.match(source, /DETAILS_TEMPLATE_FILES/);
  assert.match(source, /buildAgendaEditPrompt/);
  assert.match(source, /composeLayeredEnvelope/);
  assert.match(source, /buildLayeredEnvelopeBuffer/);
  assert.match(source, /if \(!job\?\.requestId\) return "\/assets\/envelope-reference\.webp"/);
  assert.doesNotMatch(source, /!job\?\.requestId \|\| !job\?\.envelopeFilename/);
  assert.match(source, /pageCount:\s*pages\.details \? 3 : 2/);
  assert.match(source, /envelopeDownloadUrl:\s*`\$\{envelopePreviewUrl\}/);
  assert.match(source, /sharedChanges":"Alterações:/);
  assert.doesNotMatch(source, /Alterações partilhadas/);
});

test("the Agenda modal has one authoritative input for every schedule field", async () => {
  const html = await fs.readFile(path.join(root, "public", "event-builder.html"), "utf8");
  for (const id of [
    "arrivalTime", "ceremonyTime", "receptionTime", "mealTime", "cakeTime", "partyTime",
    "arrivalDescription", "ceremonyDescription", "receptionDescription",
    "mealDescription", "cakeDescription", "partyDescription",
  ]) {
    assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `${id} must be unique`);
  }
  assert.match(html, /agenda-only \.website-details-summary-fields \{ display: none; \}/);
});

test("Stripe fulfillment trusts the paid Price and unlocks the purchased builder without code entry", async () => {
  const source = await fs.readFile(path.join(root, "server.mjs"), "utf8");
  const builder = await fs.readFile(path.join(root, "public", "event-builder.html"), "utf8");
  assert.match(source, /retrieveCheckoutSession\(sessionId\)/);
  assert.match(source, /session\.line_items\?\.data/);
  assert.match(source, /stripePricePackMap\(\)\.get\(purchasedPriceId\)/);
  assert.match(source, /createForExternalOrder\(\{/);
  assert.match(source, /externalOrderId:\s*`stripe:\$\{session\.id\}`/);
  assert.match(source, /reserveEmailDelivery/);
  assert.match(source, /constructWebhookEvent\(\s*request\.rawBody/);
  assert.match(source, /checkout-complete\?session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.match(source, /setStripeCheckoutHandoffCookie\(request, response/);
  assert.match(source, /readStripeCheckoutHandoff\(request\)/);
  assert.match(source, /client_reference_id \|\| ""\) !== handoff\.checkoutToken/);
  assert.match(source, /tolerateEmailFailure: true/);
  assert.match(source, /setAccessSessionCookie\(request, response, fulfillment\.record\.code\)/);
  assert.match(source, /stripeCustomerBuilderPath\(fulfillment\.record\.eventType\)/);
  assert.match(builder, /Podes começar a preencher os dados sem introduzir nenhum código/);
});
