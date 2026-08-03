import assert from "node:assert/strict";
import test from "node:test";

import { PDFDocument } from "pdf-lib";

import {
  CustomerEmailError,
  createCustomerEmailService,
  renderDeliveryEmail,
  renderPurchaseAccessEmail,
} from "../customer-email.mjs";

const EMAIL_INPUT = Object.freeze({
  to: "client@example.com",
  customerName: "Ana & <Tiago>",
  accessCode: "246810",
  portalUrl: "https://invitelab.art/wedding",
  supportEmail: "support@invitelab.art",
});

test("all three purchase emails render escaped HTML, bold code, text, and a PDF guide", async () => {
  const normal = await renderPurchaseAccessEmail({
    ...EMAIL_INPUT,
    packType: "invite_only_pack",
  });
  const digital = await renderPurchaseAccessEmail({
    ...EMAIL_INPUT,
    packType: "digital_pdf_pack",
  });
  const full = await renderPurchaseAccessEmail({
    ...EMAIL_INPUT,
    packType: "Full_pack",
  });

  assert.match(normal.subject, /Template Generator Only/);
  assert.match(digital.subject, /Template \+ Digital Invite/);
  assert.match(full.subject, /Full Pack/);
  assert.match(normal.html, /<strong[^>]*>246810<\/strong>/);
  assert.match(full.html, /<strong[^>]*>246810<\/strong>/);
  assert.match(normal.html, /Ana &amp; &lt;Tiago&gt;/);
  assert.doesNotMatch(normal.html, /Ana & <Tiago>/);
  assert.match(normal.html, /https:\/\/invitelab\.art\/wedding/);
  assert.match(normal.text, /Your access code is: 246810/);
  assert.match(full.text, /Published event website/);
  assert.match(full.html, /background:#596b52/);
  assert.doesNotMatch(full.html, /lang="pt"|A tua compra|CÓDIGO DE ACESSO/);
  assert.equal(normal.attachments.length, 1);
  assert.match(normal.attachments[0].filename, /template-generator-guide\.pdf$/);
  assert.match(digital.attachments[0].filename, /template-digital-invite-guide\.pdf$/);
  assert.match(full.attachments[0].filename, /full-pack-guide\.pdf$/);

  for (const rendered of [normal, digital, full]) {
    const bytes = Buffer.from(rendered.attachments[0].content, "base64");
    assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), 1);
    assert.match(pdf.getTitle(), /InviteLab/);
  }
});

test("delivery email contains only finished deliverables and asks for an Etsy review", () => {
  const canvaOnly = renderDeliveryEmail({
    to: "client@example.com",
    canvaUrl: "https://www.canva.com/design/example/edit",
    agendaUrl: "https://invitelab.art/generated/agenda.png",
    packType: "invite_only_pack",
  });
  assert.match(canvaOnly.html, /Open your editable Canva invitation/);
  assert.match(canvaOnly.html, /Download your Agenda artwork/);
  assert.doesNotMatch(canvaOnly.html, /Open your interactive PDF|Visit your wedding website|Open your project/);
  assert.match(canvaOnly.html, /Leave a lovely Etsy review/);

  const full = renderDeliveryEmail({
    to: "client@example.com",
    canvaUrl: "https://www.canva.com/design/example/edit",
    pdfUrl: "https://invitelab.art/generated/final.pdf",
    agendaUrl: "https://invitelab.art/generated/agenda.png",
    websiteUrl: "https://sites.invitelab.art/sites/example/",
    rsvpAdminUrl: "https://sites.invitelab.art/sites/example/RSVP-ADMIN/",
    packType: "Full_pack",
  });
  assert.match(full.html, /Visit your event website/);
  assert.match(full.html, /Open RSVP Admin/);
  assert.match(full.html, /Open your interactive PDF/);
  assert.match(full.html, /Download your Agenda artwork/);
});

test("instruction PDF and email payload stay deterministic for Resend idempotent retries", async () => {
  const first = await renderPurchaseAccessEmail({
    ...EMAIL_INPUT,
    packType: "Full_pack",
  });
  const second = await renderPurchaseAccessEmail({
    ...EMAIL_INPUT,
    packType: "Full_pack",
  });

  assert.equal(first.subject, second.subject);
  assert.equal(first.html, second.html);
  assert.equal(first.text, second.text);
  assert.equal(first.attachments[0].content, second.attachments[0].content);
});

test("Resend sender uses fetch API, a stable Idempotency-Key, and the generated PDF attachment", async () => {
  let captured = null;
  const emailService = createCustomerEmailService({
    apiKey: "re_test_key",
    from: "InviteLab <orders@invitelab.art>",
    replyTo: "support@invitelab.art",
    portalUrl: "https://invitelab.art/wedding",
    supportEmail: "support@invitelab.art",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const result = await emailService.sendPurchaseAccessEmail({
    to: "client@example.com",
    customerName: "Ana",
    accessCode: "246810",
    packType: "Full_pack",
    idempotencyKey: "etsy-order-paid/etsy:1:2:3:1/purchase-access-v1",
  });

  assert.equal(result.providerMessageId, "email_123");
  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.redirect, "error");
  assert.equal(captured.options.headers.Authorization, "Bearer re_test_key");
  assert.equal(
    captured.options.headers["Idempotency-Key"],
    "etsy-order-paid/etsy:1:2:3:1/purchase-access-v1",
  );
  const payload = JSON.parse(captured.options.body);
  assert.deepEqual(payload.to, ["client@example.com"]);
  assert.equal(payload.reply_to, "support@invitelab.art");
  assert.match(payload.html, /<strong[^>]*>246810<\/strong>/);
  assert.equal(Buffer.from(payload.attachments[0].content, "base64").subarray(0, 5).toString("ascii"), "%PDF-");
});

test("automation failures can be sent to the fixed private alert recipient without secrets", async () => {
  let captured = null;
  const emailService = createCustomerEmailService({
    apiKey: "re_test_key",
    from: "InviteLab <orders@invitelab.art>",
    portalUrl: "https://invitelab.art/wedding",
    supportEmail: "support@invitelab.art",
    alertEmail: "tomascoelhorocha@gmail.com",
    fetchImpl: async (_url, options) => {
      captured = JSON.parse(options.body);
      return new Response(JSON.stringify({ id: "alert_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  await emailService.sendAutomationAlert({
    stage: "Canva design job",
    code: "CANVA_TOKEN_EXPIRED",
    message: "Saved authorization was rejected.",
    requestId: "request-123",
    idempotencyKey: "automation-alert/test/v1",
  });
  assert.deepEqual(captured.to, ["tomascoelhorocha@gmail.com"]);
  assert.match(captured.subject, /Canva design job/);
  assert.match(captured.html, /No access tokens, cookies, passwords/);
  assert.doesNotMatch(captured.html, /Bearer\s+[A-Za-z0-9._-]+/);
});

test("Resend errors expose a safe provider code and retryability without leaking the response body", async () => {
  const emailService = createCustomerEmailService({
    apiKey: "re_test_key",
    from: "InviteLab <orders@invitelab.art>",
    portalUrl: "https://invitelab.art/wedding",
    supportEmail: "support@invitelab.art",
    fetchImpl: async () => new Response(JSON.stringify({
      name: "rate_limit_exceeded",
      message: "secret provider detail",
    }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
  });

  await assert.rejects(
    emailService.sendPurchaseAccessEmail({
      to: "client@example.com",
      accessCode: "246810",
      packType: "template_only_pack",
      idempotencyKey: "etsy-order-paid/test",
    }),
    (error) => {
      assert.ok(error instanceof CustomerEmailError);
      assert.equal(error.code, "RESEND_RATE_LIMIT_EXCEEDED");
      assert.equal(error.providerStatus, 429);
      assert.equal(error.retryable, true);
      assert.doesNotMatch(error.message, /secret provider detail/);
      return true;
    },
  );
});
